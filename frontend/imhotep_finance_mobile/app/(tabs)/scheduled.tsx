import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    Modal,
    TextInput,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/constants/api';
import ScheduledTransactionItem from '@/components/ScheduledTransactionItem';
import AddScheduledTransactionModal from '@/components/AddScheduledTransactionModal';
import CategorySelect from '@/components/CategorySelect';
import { updateNetworthWidget } from '@/widgets/widget-updater';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ScheduledTransactionsScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});

    // Filters
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState(''); // 'deposit', 'withdraw'
    const [categoryFilter, setCategoryFilter] = useState('');
    const [detailsSearch, setDetailsSearch] = useState('');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [editTransaction, setEditTransaction] = useState<any>(null);

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
        filterButton: {
            backgroundColor: isDark ? '#334155' : '#f1f5f9',
        },
        modalContent: {
            backgroundColor: isDark ? '#1e293b' : 'white',
        },
        input: {
            backgroundColor: isDark ? '#334155' : '#f9f9f9',
            color: isDark ? '#f1f5f9' : '#000',
            borderColor: isDark ? '#475569' : '#eee',
        },
        actionButton: {
            backgroundColor: isDark ? '#334155' : 'white',
            borderColor: isDark ? '#475569' : '#e2e8f0',
        }
    };

    const fetchTransactions = async (pageNum: number, refresh: boolean = false) => {
        if (loading) return;
        setLoading(true);
        setError('');

        try {
            const params: any = { page: pageNum };
            // Note: Check backend if these filters are supported on this endpoint. 
            // Based on ShowScheduledTransactions.jsx, it seems to strictly use page.
            // But let's check if we can add client side filtering or if backend supports it.
            // For now, I'll pass them, but if backend ignores them, it's fine.
            // Update: ShowScheduledTransactions.jsx ONLY sends 'page'. 
            // So for now, I will NOT send filters to backend to avoid errors, 
            // unless I verified backend supports them.
            // However, the user asked to make it "work with the same way as the web react app".
            // The web app DOES NOT have filters on Scheduled Transactions page (only pagination).
            // So I should arguably REMOVE filters from this screen to match web app.
            // But having filters is nice. I will keep the UI but maybe filter client side? 
            // No, client side filtering with server side pagination is broken.
            // I will disable filters for now to match web app and avoid confusion.

            const res = await api.get('/api/finance-management/scheduled-trans/get-scheduled-trans/', { params });

            const newTransactions = res.data.scheduled_transactions || [];

            if (refresh) {
                setTransactions(newTransactions);
            } else {
                setTransactions(prev => [...prev, ...newTransactions]);
            }

            if (newTransactions.length < 10) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to load scheduled transactions');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTransactions(1, true);
    }, []);

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchTransactions(nextPage);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchTransactions(1, true);
    };

    const handleEdit = (transaction: any) => {
        setEditTransaction(transaction);
        setShowAddModal(true);
    };

    const handleToggleStatus = async (transaction: any) => {
        if (actionLoading[transaction.id]) return;

        // 1. Optimistic Update Immediately
        const originalStatus = transaction.status;
        const newStatus = !originalStatus;

        setTransactions(prev => prev.map(t =>
            t.id === transaction.id ? { ...t, status: newStatus } : t
        ));

        setActionLoading(prev => ({ ...prev, [transaction.id]: true }));

        try {
            const res = await api.post(`/api/finance-management/scheduled-trans/update-scheduled-trans-status/${transaction.id}/`);
            updateNetworthWidget();

            // 3. Confirm with server data (optional, but good for consistency)
            if (res.data.status !== undefined && res.data.status !== newStatus) {
                setTransactions(prev => prev.map(t =>
                    t.id === transaction.id ? { ...t, status: res.data.status } : t
                ));
            }
        } catch (err: any) {
            console.error("Status toggle error:", err);
            Alert.alert("Error", err.response?.data?.error || "Failed to update status");
            // Revert on error
            setTransactions(prev => prev.map(t =>
                t.id === transaction.id ? { ...t, status: originalStatus } : t
            ));
        } finally {
            setActionLoading(prev => ({ ...prev, [transaction.id]: false }));
        }
    };

    return (
        <View style={[styles.container, themeStyles.container]}>
            {/* Header */}
            <View style={[styles.header, themeStyles.header, { paddingTop: insets.top + 12 }]}>
                <Text style={[styles.headerTitle, themeStyles.text]}>Scheduled</Text>
                {/* 
                <TouchableOpacity
                    style={[styles.filterButton, themeStyles.filterButton]}
                    onPress={() => setShowFilterModal(true)}
                >
                    <Ionicons name="options" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
                </TouchableOpacity>
                */}
            </View>

            {/* List */}
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <ScheduledTransactionItem
                        transaction={item}
                        onPress={() => handleEdit(item)}
                        onToggleStatus={() => handleToggleStatus(item)}
                        loading={actionLoading[item.id]}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#366c6b"} />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loading && !refreshing ? <ActivityIndicator size="small" color="#366c6b" style={{ margin: 20 }} /> : null}
                ListEmptyComponent={!loading ? <Text style={[styles.emptyText, themeStyles.subText]}>No scheduled transactions found.</Text> : null}
                contentContainerStyle={{ paddingBottom: 100 }}
            />

            {/* Add Button (Floating) */}
            <TouchableOpacity
                style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 80 }]}
                onPress={() => {
                    setEditTransaction(null);
                    setShowAddModal(true);
                }}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

            {/* Add/Edit Modal */}
            <AddScheduledTransactionModal
                visible={showAddModal}
                editMode={!!editTransaction}
                initialValues={editTransaction || {}}
                initialType={editTransaction?.scheduled_trans_status?.toLowerCase() || 'deposit'}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    setShowAddModal(false);
                    onRefresh();
                }}
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
        paddingBottom: 20,
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
    filterButton: {
        padding: 10,
        borderRadius: 12,
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
