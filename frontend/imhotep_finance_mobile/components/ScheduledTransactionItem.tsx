import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ScheduledTransactionItemProps {
    transaction: {
        id: number;
        amount: string | number;
        currency: string;
        category: string;
        place?: string;
        scheduled_trans_status: string;
        scheduled_trans_details: string;
        day_of_month: number;
        status: boolean; // Active/Inactive
    };
    onPress: () => void;
    onToggleStatus: () => void;
    loading?: boolean;
}

const ScheduledTransactionItem: React.FC<ScheduledTransactionItemProps> = ({
    transaction,
    onPress,
    onToggleStatus,
    loading = false
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const isDeposit = transaction.scheduled_trans_status.toLowerCase() === 'deposit';

    const themeStyles = {
        container: {
            backgroundColor: isDark ? '#1e293b' : 'white',
            borderBottomColor: isDark ? '#334155' : '#f0f0f0',
        },
        text: {
            color: isDark ? '#f1f5f9' : '#1e293b',
        },
        subText: {
            color: isDark ? '#94a3b8' : '#64748b',
        },
        amount: {
            color: isDeposit ? (isDark ? '#34d399' : '#059669') : (isDark ? '#f87171' : '#dc2626'),
        },
        iconBg: {
            backgroundColor: isDeposit
                ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5')
                : (isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2'),
        },
        iconColor: isDeposit ? '#059669' : '#dc2626'
    };

    return (
        <TouchableOpacity
            style={[styles.container, themeStyles.container]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, themeStyles.iconBg]}>
                <Ionicons
                    name={isDeposit ? "arrow-up" : "arrow-down"}
                    size={20}
                    color={themeStyles.iconColor}
                />
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.topRow}>
                    <Text style={[styles.category, themeStyles.text]} numberOfLines={1}>
                        {transaction.category || 'No Category'}{transaction.place && transaction.place !== 'General' ? ` • ${transaction.place}` : ''}
                    </Text>
                    <Text style={[styles.amount, themeStyles.amount]}>
                        {isDeposit ? '+' : '-'} {Number(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {transaction.currency}
                    </Text>
                </View>

                <View style={styles.bottomRow}>
                    <Text style={[styles.details, themeStyles.subText]} numberOfLines={1}>
                        {transaction.scheduled_trans_details || 'No Description'}
                    </Text>
                    <View style={styles.statusContainer}>
                        <Text style={[styles.date, themeStyles.subText]}>
                            Day {transaction.day_of_month}
                        </Text>
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                onToggleStatus();
                            }}
                            disabled={loading}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={[
                                styles.statusBadge,
                                {
                                    backgroundColor: transaction.status
                                        ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5')
                                        : (isDark ? 'rgba(148, 163, 184, 0.2)' : '#f1f5f9')
                                }
                            ]}
                        >
                            <Text style={[
                                styles.statusText,
                                {
                                    color: transaction.status
                                        ? (isDark ? '#34d399' : '#059669')
                                        : (isDark ? '#94a3b8' : '#64748b')
                                }
                            ]}>
                                {loading ? '...' : (transaction.status ? 'Active' : 'Inactive')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
        gap: 4,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    category: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    details: {
        fontSize: 14,
        flex: 1,
        marginRight: 8,
    },
    date: {
        fontSize: 12,
        marginRight: 8,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
        minWidth: 60,
        alignItems: 'center',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    }
});

export default ScheduledTransactionItem;
