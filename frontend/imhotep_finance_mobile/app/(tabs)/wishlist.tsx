import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/constants/api';
import WishlistItem from '@/components/WishlistItem';
import AddWishlistModal from '@/components/AddWishlistModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WishlistScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [wishlist, setWishlist] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [year, setYear] = useState<number>(new Date().getFullYear());

    // Action states
    const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});
    const [deleteLoading, setDeleteLoading] = useState<{ [key: number]: boolean }>({});

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [editWish, setEditWish] = useState<any>(null);

    const themeStyles = {
        container: {
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        },
        header: {
            backgroundColor: isDark ? '#1e293b' : 'white',
            borderBottomColor: isDark ? '#334155' : '#e2e8f0',
        },
        text: {
            color: isDark ? '#f1f5f9' : '#1e293b',
        },
        subText: {
            color: isDark ? '#94a3b8' : '#64748b',
        },
        yearBadge: {
            backgroundColor: isDark ? '#334155' : '#e2e8f0',
            color: isDark ? '#f1f5f9' : '#1e293b'
        }
    };

    const fetchWishlist = async (pageNum: number, refresh: boolean = false, currentYear: number) => {
        if (loading) return;
        setLoading(true);

        try {
            const params = { page: pageNum, year: currentYear };
            const res = await api.get('/api/finance-management/wishlist/get-wishlist/', { params });
            const newWishlist = res.data.wishlist || [];

            if (refresh) {
                setWishlist(newWishlist);
            } else {
                setWishlist(prev => [...prev, ...newWishlist]);
            }

            if (newWishlist.length < 10) { // Assuming 10 items per page default or checked from pagination payload
                // The backend uses 20 items per page usually in this project, 
                // but checking length < per_page is safe. 
                // We can also check res.data.pagination.num_pages
                const totalPages = res.data.pagination?.num_pages || 1;
                setHasMore(pageNum < totalPages);
            } else {
                setHasMore(true);
            }

        } catch (err) {
            console.error('Fetch wishlist error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchWishlist(1, true, year);
    }, [year]);

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchWishlist(1, true, year);
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchWishlist(nextPage, false, year);
        }
    };

    const handleEdit = (wish: any) => {
        setEditWish(wish);
        setShowAddModal(true);
    };

    const handleDelete = async (wish: any) => {
        Alert.alert(
            "Delete Wish",
            "Are you sure you want to delete this wish?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setDeleteLoading(prev => ({ ...prev, [wish.id]: true }));
                        try {
                            await api.delete(`/api/finance-management/wishlist/delete-wish/${wish.id}/`);
                            setWishlist(prev => prev.filter(w => w.id !== wish.id));
                        } catch (err: any) {
                            Alert.alert("Error", err.response?.data?.error || "Failed to delete wish");
                        } finally {
                            setDeleteLoading(prev => ({ ...prev, [wish.id]: false }));
                        }
                    }
                }
            ]
        );
    };

    const handleToggleStatus = (wish: any) => {
        const isCompleting = !wish.status;

        const proceedToggle = async () => {
            setActionLoading(prev => ({ ...prev, [wish.id]: true }));
            try {
                const res = await api.post(`/api/finance-management/wishlist/update-wish-status/${wish.id}/`);

                // Refresh list on success to get updated fields like transaction_date
                onRefresh();
            } catch (err: any) {
                console.error("Status toggle error:", err);
                Alert.alert("Error", err.response?.data?.error || "Failed to update status");
            } finally {
                setActionLoading(prev => ({ ...prev, [wish.id]: false }));
            }
        };

        if (!isCompleting) {
            // Marking as NOT completed (WARNING)
            Alert.alert(
                "Warning",
                "Are you sure you want to mark this wish as not completed?\n\nThis will:\n• Delete the associated transaction\n• Remove the transaction date\n• Update your networth",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Continue", onPress: proceedToggle }
                ]
            );
        } else {
            // Marking as Completed
            Alert.alert(
                "Mark as Completed",
                "This will create a transaction for this wish expense.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Confirm", onPress: proceedToggle }
                ]
            );
        }
    };

    const handleYearChange = (increment: number) => {
        setYear(prev => prev + increment);
        setPage(1);
    };

    return (
        <View style={[styles.container, themeStyles.container]}>
            {/* Header */}
            <View style={[styles.header, themeStyles.header, { paddingTop: insets.top + 12 }]}>
                <Text style={[styles.headerTitle, themeStyles.text]}>Wishlist</Text>

                {/* Year Filter */}
                <View style={styles.yearFilterContainer}>
                    <TouchableOpacity onPress={() => handleYearChange(-1)} style={styles.arrowButton}>
                        <Ionicons name="chevron-back" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
                    </TouchableOpacity>
                    <Text style={[styles.yearText, themeStyles.text]}>{year}</Text>
                    <TouchableOpacity onPress={() => handleYearChange(1)} style={styles.arrowButton}>
                        <Ionicons name="chevron-forward" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* List */}
            <FlatList
                data={wishlist}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <WishlistItem
                        wish={item}
                        onPress={() => handleEdit(item)}
                        onToggleStatus={() => handleToggleStatus(item)}
                        onDelete={() => handleDelete(item)}
                        loading={actionLoading[item.id]}
                        deleteLoading={deleteLoading[item.id]}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#366c6b"} />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loading && !refreshing ? <ActivityIndicator size="small" color="#366c6b" style={{ margin: 20 }} /> : null}
                ListEmptyComponent={!loading ? <Text style={[styles.emptyText, themeStyles.subText]}>No wishes found for {year}.</Text> : null}
                contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
            />

            {/* Add Button (Floating) */}
            <TouchableOpacity
                style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 80 }]}
                onPress={() => {
                    setEditWish(null);
                    setShowAddModal(true);
                }}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

            {/* Add/Edit Modal */}
            <AddWishlistModal
                visible={showAddModal}
                editMode={!!editWish}
                initialValues={editWish || {}}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    setShowAddModal(false);
                    onRefresh();
                }}
                currentYear={year}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 0,
        paddingBottom: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    yearFilterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    arrowButton: {
        padding: 8,
    },
    yearText: {
        fontSize: 16,
        fontWeight: '600',
        marginHorizontal: 8,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 16,
        right: 30,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#366c6b',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
});
