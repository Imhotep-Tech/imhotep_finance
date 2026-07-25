import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface NetWorthCardProps {
    networth: string | number;
    favoriteCurrency: string;
    loading: boolean;
    mode?: 'dashboard' | 'navbar';
    onPress?: () => void;
}

const getFontSize = (networth: string | number, mode: string) => {
    const length = String(networth).replace(/[^0-9]/g, '').length;
    if (mode === 'navbar') return 24;
    if (length > 15) return 24;
    if (length > 12) return 28;
    if (length > 9) return 32;
    if (length > 6) return 36;
    return 48;
};

const NetWorthCard: React.FC<NetWorthCardProps> = ({
    networth,
    favoriteCurrency,
    loading,
    mode = 'dashboard',
    onPress
}) => {
    const formattedNetworth = loading
        ? '...'
        : Number(networth || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const fontSize = getFontSize(formattedNetworth, mode);

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
            <LinearGradient
                colors={['#51adac', '#428a89']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
            >
                <View style={styles.content}>
                    <Text style={styles.label}>Total Net Worth</Text>
                    {loading ? (
                        <ActivityIndicator color="white" size="large" />
                    ) : (
                        <View style={styles.amountContainer}>
                            <Text style={[styles.amount, { fontSize }]}>{formattedNetworth}</Text>
                            <Text style={styles.currency}>{favoriteCurrency}</Text>
                        </View>
                    )}
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        padding: 24,
        minHeight: 160,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
        marginVertical: 10,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 8,
        fontWeight: '500',
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    amount: {
        color: 'white',
        fontWeight: 'bold',
    },
    currency: {
        fontSize: 20,
        color: 'white',
        marginLeft: 4,
        fontWeight: '500',
    },
});

export default NetWorthCard;
