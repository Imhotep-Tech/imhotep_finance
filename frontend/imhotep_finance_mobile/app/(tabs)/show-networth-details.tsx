import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/contexts/LanguageContext';
import api from '@/constants/api';
import { currencies as allCurrencies } from '@/constants/currencies';
import MoveMoneyModal from '@/components/MoveMoneyModal';
import ConvertCurrencyModal from '@/components/ConvertCurrencyModal';

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
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = themes[isDark ? 'dark' : 'light'];
    const insets = useSafeAreaInsets();

    const [viewType, setViewType] = useState<'place' | 'currency'>('place');
    const [details, setDetails] = useState<Record<string, NetWorthDetail[]>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const getCurrencyGroupedDetails = () => {
        const currencyGroups: Record<string, { total: number; places: { place: string; amount: number; percentage: number }[] }> = {};
        
        Object.entries(details).forEach(([place, currencies]) => {
            currencies.forEach((item) => {
                const cur = item.currency;
                const amt = Number(item.amount || 0);
                if (!currencyGroups[cur]) {
                    currencyGroups[cur] = {
                        total: 0,
                        places: []
                    };
                }
                currencyGroups[cur].total += amt;
                currencyGroups[cur].places.push({
                    place,
                    amount: amt,
                    percentage: 0
                });
            });
        });

        Object.keys(currencyGroups).forEach((cur) => {
            const group = currencyGroups[cur];
            group.places = group.places.map((p) => {
                const pct = group.total > 0 ? (p.amount / group.total) * 100 : 0;
                return {
                    ...p,
                    percentage: pct
                };
            });
            group.places.sort((a, b) => b.amount - a.amount);
        });

        return Object.entries(currencyGroups);
    };

    // Modal states
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);

    const fetchDetails = async () => {
        try {
            const res = await api.get('/api/finance-management/get-networth-details/');
            let data = res.data.networth_details;

            if (data && typeof data === 'object' && !Array.isArray(data)) {
                // data is a dict of { "PlaceName": [{ currency: "USD", amount: 100 }] }
                setDetails(data as any);
            } else {
                setDetails({});
            }
        } catch (err) {
            console.error('Failed to fetch net worth details:', err);
            setDetails({});
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        api.get('/api/finance-management/get-networth-details/')
            .then(res => {
                if (!isMounted) return;
                const data = res.data.networth_details;
                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    setDetails(data as any);
                } else {
                    setDetails({});
                }
            })
            .catch(err => {
                if (!isMounted) return;
                console.error('Failed to fetch net worth details:', err);
                setDetails({});
            })
            .finally(() => {
                if (!isMounted) return;
                setLoading(false);
                setRefreshing(false);
            });

        api.get('/api/finance-management/get-exchange-rates/')
            .then(res => {
                if (isMounted) setExchangeRates(res.data);
            })
            .catch(() => console.error('Failed to load exchange rates'));

        return () => {
            isMounted = false;
        };
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDetails();
    };

    const handleDeleteNetWorth = (place: string, currency: string) => {
        Alert.alert(
            t('dashboard.netWorthDetails.deleteConfirmTitle'),
            t('dashboard.netWorthDetails.deleteConfirmMessage', { currency, place }),
            [
                { text: t('common.actions.cancel'), style: 'cancel' },
                {
                    text: t('common.actions.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete('/api/finance-management/delete-networth/', {
                                data: { place, currency }
                            });
                            Alert.alert(t('common.status.success'), t('dashboard.netWorthDetails.deleteNetWorthSuccess'));
                            fetchDetails();
                        } catch (err: any) {
                            const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'An error occurred while deleting the net worth record.';
                            Alert.alert(t('common.status.error'), errorMessage);
                        }
                    }
                }
            ]
        );
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: t('dashboard.netWorthDetails.title'),
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
                        <Text style={[styles.title, { color: colors.text }]}>{t('dashboard.netWorthDetails.title')}</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('dashboard.netWorthDetails.subtitle')}</Text>
                    </View>

                    {/* View Type Toggle Selector */}
                    <View style={[styles.toggleContainer, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6', borderColor: colors.border, borderWidth: 1 }]}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setViewType('place')}
                            style={[
                                styles.toggleButton,
                                viewType === 'place' && { backgroundColor: colors.surface }
                            ]}
                        >
                            <Text style={[
                                styles.toggleButtonText,
                                { color: colors.textSecondary },
                                viewType === 'place' && { color: colors.text, fontWeight: '700' }
                            ]}>
                                {t('dashboard.netWorthDetails.groupByPlace')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setViewType('currency')}
                            style={[
                                styles.toggleButton,
                                viewType === 'currency' && { backgroundColor: colors.surface }
                            ]}
                        >
                            <Text style={[
                                styles.toggleButtonText,
                                { color: colors.textSecondary },
                                viewType === 'currency' && { color: colors.text, fontWeight: '700' }
                            ]}>
                                {t('dashboard.netWorthDetails.groupByCurrency')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common.actions.loading')}</Text>
                        </View>
                    ) : Object.keys(details).length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="wallet-outline" size={64} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('dashboard.netWorthDetails.empty')}</Text>
                            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                                {t('dashboard.netWorthDetails.emptySubtext')}
                            </Text>
                        </View>
                    ) : viewType === 'place' ? (
                        <View style={{ gap: 24, marginBottom: 24 }}>
                            {Object.entries(details).map(([place, currencies], idx) => (
                                <View key={idx} style={[styles.placeGroupCard, { backgroundColor: colors.surface }]}>
                                    <View style={styles.placeHeader}>
                                        <Ionicons name="location-outline" size={24} color={colors.primary} />
                                        <Text style={[styles.placeTitle, { color: colors.text }]}>{place}</Text>
                                    </View>
                                    <View style={styles.grid}>
                                        {(currencies as any[]).map((item, cIdx) => (
                                            <View key={cIdx} style={{ width: '47%', position: 'relative' }}>
                                                <TouchableOpacity
                                                    activeOpacity={0.8}
                                                    onPress={() => router.push({
                                                        pathname: '/(tabs)/transactions',
                                                        params: { place }
                                                    })}
                                                    style={{ width: '100%' }}
                                                >
                                                    <LinearGradient
                                                        colors={['#51adac', '#428a89']}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 1 }}
                                                        style={[styles.currencyCard, { width: '100%' }]}
                                                    >
                                                        <Text style={styles.currencyLabel}>{item.currency}</Text>
                                                        <Text style={styles.currencyAmount}>
                                                             {Number(item.amount || 0).toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2
                                                            })}
                                                        </Text>
                                                        <Text style={styles.currencySubtext}>{t('dashboard.netWorthDetails.totalAmount')}</Text>
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                                {Number(item.amount || 0) === 0 && (
                                                    <TouchableOpacity
                                                        style={styles.deleteButton}
                                                        onPress={() => handleDeleteNetWorth(place, item.currency)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Ionicons name="trash-outline" size={15} color="#FFF" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={{ gap: 24, marginBottom: 24 }}>
                            {getCurrencyGroupedDetails().map(([currency, data], idx) => (
                                <View key={idx} style={[styles.placeGroupCard, { backgroundColor: colors.surface }]}>
                                    <View style={styles.currencyHeaderRow}>
                                        <View style={[styles.currencyIconTag, { backgroundColor: colors.primaryLight }]}>
                                            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>{currency}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end', flex: 1 }}>
                                            <Text style={[styles.currencyTotalLabel, { color: colors.textSecondary }]}>{t('dashboard.netWorthDetails.totalAllocation')}</Text>
                                            <Text style={[styles.currencyTotalAmount, { color: colors.text }]}>
                                                {data.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    <View style={{ gap: 16, marginTop: 12 }}>
                                        {data.places.map((p, pIdx) => (
                                            <TouchableOpacity
                                                key={pIdx}
                                                activeOpacity={0.7}
                                                onPress={() => router.push({
                                                    pathname: '/(tabs)/transactions',
                                                    params: { place: p.place }
                                                })}
                                                style={{ width: '100%' }}
                                            >
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                                                        <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>{p.place}</Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>
                                                            {p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </Text>
                                                        <Text style={{ fontSize: 11, fontWeight: 'bold', backgroundColor: isDark ? '#1e293b' : '#eaf6f6', color: colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                                            {p.percentage.toFixed(1)}%
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={{ width: '100%', height: 8, backgroundColor: isDark ? '#1F2937' : '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                                                    <View style={{ width: `${p.percentage}%`, height: '100%', backgroundColor: colors.primary, borderRadius: 4 }} />
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.moveButton, { backgroundColor: '#2563EB' }]}
                            onPress={() => setShowConvertModal(true)}
                        >
                            <Ionicons name="cash-outline" size={20} color="#fff" />
                            <Text style={styles.backButtonText}>{t('dashboard.netWorthDetails.convertCurrencies')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.moveButton, { backgroundColor: colors.primary }]}
                            onPress={() => setShowMoveModal(true)}
                        >
                            <Ionicons name="swap-horizontal-outline" size={20} color="#fff" />
                            <Text style={styles.backButtonText}>{t('dashboard.netWorthDetails.moveMoney')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.backButtonOutline, { borderColor: colors.primary, borderWidth: 1 }]}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="home-outline" size={20} color={colors.primary} />
                            <Text style={[styles.backButtonText, { color: colors.primary }]}>{t('common.navigation.dashboard')}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: insets.bottom + 100 }} />
                </ScrollView>
            </View>

            {/* Move Money Interactive Modal */}
            <MoveMoneyModal
                visible={showMoveModal}
                onClose={() => setShowMoveModal(false)}
                onSuccess={() => {
                    setShowMoveModal(false);
                    fetchDetails();
                }}
                details={details}
            />

            {/* Convert Currency Interactive Modal */}
            <ConvertCurrencyModal
                visible={showConvertModal}
                onClose={() => setShowConvertModal(false)}
                onSuccess={() => {
                    setShowConvertModal(false);
                    fetchDetails();
                }}
                details={details}
                allCurrencies={allCurrencies}
                exchangeRates={exchangeRates}
            />
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
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    moveButton: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    backButtonOutline: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
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
    deleteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        padding: 6,
        borderRadius: 20,
        zIndex: 10,
    },
    toggleContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 14,
        alignSelf: 'center',
        width: '100%',
        maxWidth: 320,
        marginBottom: 20,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    currencyHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        paddingBottom: 12,
        marginBottom: 12,
    },
    currencyIconTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    currencyTotalLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    currencyTotalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 2,
    },
});
