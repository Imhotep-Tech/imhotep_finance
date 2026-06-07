import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface WishlistItemProps {
    wish: {
        id: number;
        price: string | number;
        currency: string;
        year: number;
        place?: string;
        wish_details: string;
        link?: string;
        status: boolean; // true = completed
        transaction_date?: string; // if completed
    };
    onPress: () => void; // Edit
    onToggleStatus: () => void; // Mark as completed / incomplete
    onDelete: () => void;
    loading?: boolean;
    deleteLoading?: boolean;
}

const WishlistItem: React.FC<WishlistItemProps> = ({
    wish,
    onPress,
    onToggleStatus,
    onDelete,
    loading = false,
    deleteLoading = false
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const isCompleted = wish.status;

    const themeStyles = {
        container: {
            backgroundColor: isDark ? '#1e293b' : 'white',
            borderBottomColor: isDark ? '#334155' : '#f0f0f0',
            borderLeftColor: isCompleted ? (isDark ? '#059669' : '#34d399') : (isDark ? '#3b82f6' : '#60a5fa'),
        },
        text: {
            color: isDark ? '#f1f5f9' : '#1e293b',
        },
        subText: {
            color: isDark ? '#94a3b8' : '#64748b',
        },
        price: {
            color: isDark ? '#60a5fa' : '#2563eb', // Blue for wishes
        },
        link: {
            color: isDark ? '#60a5fa' : '#2563eb',
            textDecorationLine: 'underline' as 'underline',
        },
        completedText: {
            color: isDark ? '#34d399' : '#059669',
        }
    };

    const handleOpenLink = async () => {
        if (wish.link) {
            try {
                let url = wish.link.trim();
                if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) {
                    url = 'https://' + url;
                }
                await Linking.openURL(url);
            } catch (err) {
                console.error("An error occurred", err);
                Alert.alert("Error", "Cannot open this link: " + wish.link);
            }
        }
    };

    return (
        <View style={[styles.container, themeStyles.container, { borderLeftWidth: 4 }]}>
            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <Text style={[styles.details, themeStyles.text]} numberOfLines={1}>
                        {wish.wish_details || 'No Details'}
                    </Text>
                    <Text style={[styles.price, themeStyles.price]}>
                        {Number(wish.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {wish.currency}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={[styles.year, themeStyles.subText]}>Year: {wish.year}{wish.place && wish.place !== 'General' ? ` • ${wish.place}` : ''}</Text>
                    {wish.link ? (
                        <TouchableOpacity onPress={handleOpenLink}>
                            <Text style={[styles.link, themeStyles.link]} numberOfLines={1}>
                                View Link
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>

                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[
                            styles.statusButton,
                            isCompleted ? styles.completedButton : styles.incompleteButton,
                            { backgroundColor: isCompleted ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5') : (isDark ? 'rgba(241, 245, 249, 0.1)' : '#f1f5f9') }
                        ]}
                        onPress={onToggleStatus}
                        disabled={loading}
                    >
                        {loading ? (
                            <Text style={[styles.actionText, themeStyles.subText]}>Processing...</Text>
                        ) : isCompleted ? (
                            <View style={styles.completedContainer}>
                                <Ionicons name="checkmark-circle" size={16} color={isDark ? '#34d399' : '#059669'} />
                                <Text style={[styles.actionText, themeStyles.completedText]}>Completed</Text>
                            </View>
                        ) : (
                            <Text style={[styles.actionText, { color: isDark ? '#94a3b8' : '#64748b' }]}>Mark Completed</Text>
                        )}
                    </TouchableOpacity>

                    {!isCompleted && (
                        <View style={styles.editActions}>
                            <TouchableOpacity onPress={onPress} style={styles.iconButton}>
                                <Ionicons name="pencil" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onDelete} style={styles.iconButton} disabled={deleteLoading}>
                                {deleteLoading ? (
                                    <Text style={{ fontSize: 10 }}>...</Text>
                                ) : (
                                    <Ionicons name="trash" size={18} color="#ef4444" />
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {isCompleted && wish.transaction_date && (
                    <Text style={[styles.completedDate, themeStyles.subText]}>
                        Completed on: {wish.transaction_date}
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderBottomWidth: 1,
        marginBottom: 8,
        borderRadius: 8, // Optional: slightly rounded cards
        marginHorizontal: 16, // Add some side margin if we want card look, or 0 if flat list
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    contentContainer: {
        gap: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    details: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    year: {
        fontSize: 14,
    },
    link: {
        fontSize: 14,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    statusButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    completedButton: {
        // styles handled inline for dynamic colors or add specific here
    },
    incompleteButton: {
        borderWidth: 1,
        borderColor: '#e2e8f0', // default light border
    },
    completedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
    },
    editActions: {
        flexDirection: 'row',
        gap: 12,
    },
    iconButton: {
        padding: 4,
    },
    completedDate: {
        fontSize: 10,
        textAlign: 'right',
        marginTop: -4,
    }
});

export default WishlistItem;
