import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '@/constants/api';

interface NetWorthDetail {
    currency: string;
    amount: number;
}

// Match Profile page theme colors
const themes = {
    light: {
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#1F2937',
        textSecondary: '#6B7280',
        border: '#D1D5DB',
        primary: '#366c6b',
        primaryLight: '#eaf6f6',
    },
    dark: {
        background: '#1F2937',
        surface: '#374151',
        text: '#F9FAFB',
        textSecondary: '#9CA3AF',
        border: '#4B5563',
        primary: '#51adac',
        primaryLight: '#244746',
    },
};

export default function NetWorthDetailsScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = themes[isDark ? 'dark' : 'light'];

    const [details, setDetails] = useState<NetWorthDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDetails = async () => {
        try {
            const res = await api.get('/api/finance-management/get-networth-details/');
            let data = res.data.networth_details;

            if (data && typeof data === 'object' && !Array.isArray(data)) {
                // data is a dict of { "PlaceName": [{ currency: "USD", amount: 100 }] }
                setDetails(data as any);
            } else {
                setDetails([] as any);
            }
        } catch (err) {
            console.error('Failed to fetch net worth details:', err);
            setDetails([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDetails();
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Net Worth Details',
                    headerStyle: {
                        backgroundColor: colors.background,
                    },
                    headerTintColor: colors.text,
                    headerShadowVisible: false,
                }}
            />
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScrollView
                    contentContainerStyle={styles.content}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                >
                    <View style={[styles.headerCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.title, { color: colors.text }]}>Net Worth Details</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Breakdown by currency</Text>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
                        </View>
                    ) : Object.keys(details).length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="wallet-outline" size={64} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No net worth details found.</Text>
                            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                                Add some transactions to see your net worth breakdown.
                            </Text>
                        </View>
                    ) : (
                        <View style={{ gap: 24, marginBottom: 24 }}>
                            {Object.entries(details).map(([place, currencies], idx) => (
                                <View key={idx} style={[styles.placeGroupCard, { backgroundColor: colors.surface }]}>
                                    <View style={styles.placeHeader}>
                                        <Ionicons name="location-outline" size={24} color={colors.primary} />
                                        <Text style={[styles.placeTitle, { color: colors.text }]}>{place}</Text>
                                    </View>
                                    <View style={styles.grid}>
                                        {(currencies as any[]).map((item, cIdx) => (
                                            <LinearGradient
                                                key={cIdx}
                                                colors={['#51adac', '#428a89']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.currencyCard}
                                            >
                                                <Text style={styles.currencyLabel}>{item.currency}</Text>
                                                <Text style={styles.currencyAmount}>
                                                    {Number(item.amount || 0).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}
                                                </Text>
                                                <Text style={styles.currencySubtext}>Total Amount</Text>
                                            </LinearGradient>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Back to Dashboard Button */}
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="home-outline" size={20} color="#fff" />
                        <Text style={styles.backButtonText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    headerCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
    },
    currencyCard: {
        width: '47%',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 140,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    currencyLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
        marginBottom: 8,
    },
    currencyAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    currencySubtext: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginTop: 8,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    placeGroupCard: {
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    placeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        paddingBottom: 8,
        gap: 8,
    },
    placeTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
