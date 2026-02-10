import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TransactionItemProps {
    transaction: {
        id: number;
        amount: string | number;
        currency: string;
        category: string;
        trans_status: string;
        trans_details: string;
        date: string;
    };
    onPress: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const isDeposit = transaction.trans_status.toLowerCase() === 'deposit';

    const themeStyles = {
        container: {
            backgroundColor: isDark ? '#1e293b' : 'white',
            borderBottomColor: isDark ? '#334155' : '#f1f5f9',
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
                ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5')
                : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2'),
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
                    name={isDeposit ? "arrow-down" : "arrow-up"}
                    size={24}
                    color={themeStyles.iconColor}
                />
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.topRow}>
                    <Text style={[styles.category, themeStyles.text]} numberOfLines={1}>
                        {transaction.category || 'No Category'}
                    </Text>
                    <Text style={[styles.amount, themeStyles.amount]}>
                        {isDeposit ? '+' : '-'} {Number(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {transaction.currency}
                    </Text>
                </View>

                <View style={styles.bottomRow}>
                    <Text style={[styles.details, themeStyles.subText]} numberOfLines={1}>
                        {transaction.trans_details || 'No Description'}
                    </Text>
                    <Text style={[styles.date, themeStyles.subText]}>
                        {transaction.date}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 18,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    contentContainer: {
        flex: 1,
        gap: 6,
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
    },
    category: {
        fontSize: 17,
        fontWeight: '600',
        flex: 1,
        marginRight: 12,
    },
    amount: {
        fontSize: 17,
        fontWeight: 'bold',
    },
    details: {
        fontSize: 14,
        flex: 1,
        marginRight: 12,
    },
    date: {
        fontSize: 13,
    },
});

export default TransactionItem;
