import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '@/constants/api';
import { currencies as allCurrencies } from '@/constants/currencies';

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

    const [details, setDetails] = useState<Record<string, NetWorthDetail[]>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Move Money states
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [sourcePlace, setSourcePlace] = useState('');
    const [targetPlace, setTargetPlace] = useState('');
    const [targetPlaceInput, setTargetPlaceInput] = useState('');
    const [isCustomTarget, setIsCustomTarget] = useState(false);
    const [currency, setCurrency] = useState('');
    const [amount, setAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Convert Currency states
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [convertPlace, setConvertPlace] = useState('');
    const [sourceCurrency, setSourceCurrency] = useState('');
    const [targetCurrency, setTargetCurrency] = useState('');
    const [convertAmount, setConvertAmount] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [exchangeRate, setExchangeRate] = useState('');
    const [convertSubmitting, setConvertSubmitting] = useState(false);
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
        fetchDetails();
        api.get('/api/finance-management/get-exchange-rates/')
            .then(res => setExchangeRates(res.data))
            .catch(() => console.error("Failed to load exchange rates"));
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDetails();
    };

    const handleMoveSubmit = async () => {
        const finalTarget = isCustomTarget ? targetPlaceInput.trim() : targetPlace;
        if (!sourcePlace || !currency || !finalTarget || !amount) {
            Alert.alert('Error', 'All fields are required.');
            return;
        }

        if (sourcePlace.toLowerCase().trim() === finalTarget.toLowerCase().trim()) {
            Alert.alert('Error', 'Source and target places must be different.');
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            Alert.alert('Error', 'Amount must be greater than zero.');
            return;
        }

        const maxAvailable = (details[sourcePlace] || []).find(item => item.currency === currency)?.amount || 0;
        if (parsedAmount > maxAvailable) {
            Alert.alert('Error', `Insufficient funds in ${sourcePlace}. Maximum available is ${maxAvailable} ${currency}.`);
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/api/finance-management/move-money/', {
                source_place: sourcePlace,
                target_place: finalTarget,
                amount: parsedAmount,
                currency
            });
            setShowMoveModal(false);
            Alert.alert('Success', 'Money moved successfully!');
            fetchDetails();
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'An error occurred during transfer.';
            Alert.alert('Error', errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const updateDefaultRate = (src: string, tgt: string) => {
        if (src && tgt && exchangeRates) {
            const srcRate = exchangeRates[src];
            const tgtRate = exchangeRates[tgt];
            if (srcRate && tgtRate) {
                const rate = (tgtRate / srcRate).toFixed(6);
                setExchangeRate(rate);
                const parsedAmount = parseFloat(convertAmount);
                if (!isNaN(parsedAmount)) {
                    setTargetAmount((parsedAmount * parseFloat(rate)).toFixed(2));
                }
                return;
            }
        }
        setExchangeRate('');
        setTargetAmount('');
    };

    const handleConvertAmountChange = (val: string) => {
        setConvertAmount(val);
        const parsedVal = parseFloat(val);
        const parsedRate = parseFloat(exchangeRate);
        if (!isNaN(parsedVal) && !isNaN(parsedRate) && parsedRate > 0) {
            setTargetAmount((parsedVal * parsedRate).toFixed(2));
        } else {
            setTargetAmount('');
        }
    };

    const handleExchangeRateChange = (val: string) => {
        setExchangeRate(val);
        const parsedAmount = parseFloat(convertAmount);
        const parsedRate = parseFloat(val);
        if (!isNaN(parsedAmount) && !isNaN(parsedRate) && parsedRate > 0) {
            setTargetAmount((parsedAmount * parsedRate).toFixed(2));
        }
    };

    const handleTargetAmountChange = (val: string) => {
        setTargetAmount(val);
        const parsedTarget = parseFloat(val);
        const parsedAmount = parseFloat(convertAmount);
        if (!isNaN(parsedTarget) && !isNaN(parsedAmount) && parsedAmount > 0) {
            setExchangeRate((parsedTarget / parsedAmount).toFixed(6));
        }
    };

    const handleConvertSubmit = async () => {
        if (!convertPlace || !sourceCurrency || !targetCurrency || !convertAmount || !targetAmount) {
            Alert.alert('Error', 'All fields are required.');
            return;
        }

        if (sourceCurrency === targetCurrency) {
            Alert.alert('Error', 'Source and target currencies must be different.');
            return;
        }

        const parsedAmount = parseFloat(convertAmount);
        const parsedTargetAmount = parseFloat(targetAmount);
        if (isNaN(parsedAmount) || parsedAmount <= 0 || isNaN(parsedTargetAmount) || parsedTargetAmount <= 0) {
            Alert.alert('Error', 'Amounts must be greater than zero.');
            return;
        }

        const maxAvailable = (details[convertPlace] || []).find(item => item.currency === sourceCurrency)?.amount || 0;
        if (parsedAmount > maxAvailable) {
            Alert.alert('Error', `Insufficient funds. Maximum available is ${maxAvailable} ${sourceCurrency}.`);
            return;
        }

        setConvertSubmitting(true);
        try {
            await api.post('/api/finance-management/convert-currency/', {
                place: convertPlace,
                source_currency: sourceCurrency,
                target_currency: targetCurrency,
                amount: parsedAmount,
                target_amount: parsedTargetAmount
            });
            setShowConvertModal(false);
            Alert.alert('Success', 'Currency converted successfully!');
            fetchDetails();
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'An error occurred during conversion.';
            Alert.alert('Error', errorMessage);
        } finally {
            setConvertSubmitting(false);
        }
    };

    const handleDeleteNetWorth = (place: string, currency: string) => {
        Alert.alert(
            'Confirm Delete',
            `Are you sure you want to delete the ${currency} net worth record at ${place}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete('/api/finance-management/delete-networth/', {
                                data: { place, currency }
                            });
                            Alert.alert('Success', 'Net worth record deleted successfully!');
                            fetchDetails();
                        } catch (err: any) {
                            const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'An error occurred while deleting the net worth record.';
                            Alert.alert('Error', errorMessage);
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
                                                        <Text style={styles.currencySubtext}>Total Amount</Text>
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
                    )}

                    {/* Action Buttons */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.moveButton, { backgroundColor: '#2563EB' }]}
                            onPress={() => {
                                setConvertPlace('');
                                setSourceCurrency('');
                                setTargetCurrency('');
                                setConvertAmount('');
                                setTargetAmount('');
                                setExchangeRate('');
                                setShowConvertModal(true);
                            }}
                        >
                            <Ionicons name="cash-outline" size={20} color="#fff" />
                            <Text style={styles.backButtonText}>Convert Currencies</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.moveButton, { backgroundColor: colors.primary }]}
                            onPress={() => {
                                setSourcePlace('');
                                setTargetPlace('');
                                setTargetPlaceInput('');
                                setIsCustomTarget(false);
                                setCurrency('');
                                setAmount('');
                                setShowMoveModal(true);
                            }}
                        >
                            <Ionicons name="swap-horizontal-outline" size={20} color="#fff" />
                            <Text style={styles.backButtonText}>Move Money</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.backButtonOutline, { borderColor: colors.primary, borderWidth: 1 }]}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="home-outline" size={20} color={colors.primary} />
                            <Text style={[styles.backButtonText, { color: colors.primary }]}>Dashboard</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>

            {/* Move Money Native Overlay Modal */}
            <Modal
                visible={showMoveModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowMoveModal(false)}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior="padding"
                >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Move Money</Text>
                            <TouchableOpacity onPress={() => setShowMoveModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ gap: 20 }} keyboardShouldPersistTaps="handled">
                            {/* Source Place */}
                            <View>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Source Place</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                                    {Object.keys(details).map(place => (
                                        <TouchableOpacity
                                            key={place}
                                            style={[
                                                styles.chip,
                                                { borderColor: colors.border },
                                                sourcePlace === place && { backgroundColor: colors.primary, borderColor: colors.primary }
                                            ]}
                                            onPress={() => {
                                                setSourcePlace(place);
                                                setCurrency('');
                                                setAmount('');
                                            }}
                                        >
                                            <Text style={[styles.chipText, { color: colors.text }, sourcePlace === place && { color: '#fff', fontWeight: 'bold' }]}>
                                                {place}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Currency */}
                            {sourcePlace ? (
                                <View>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Currency</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                                        {(details[sourcePlace] || []).map(item => (
                                            <TouchableOpacity
                                                key={item.currency}
                                                style={[
                                                    styles.chip,
                                                    { borderColor: colors.border },
                                                    currency === item.currency && { backgroundColor: colors.primary, borderColor: colors.primary }
                                                ]}
                                                onPress={() => {
                                                    setCurrency(item.currency);
                                                    setAmount('');
                                                }}
                                            >
                                                <Text style={[styles.chipText, { color: colors.text }, currency === item.currency && { color: '#fff', fontWeight: 'bold' }]}>
                                                    {item.currency}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                    {currency ? (
                                        <Text style={[styles.balanceText, { color: colors.textSecondary }]}>
                                            Available: {Number((details[sourcePlace] || []).find(item => item.currency === currency)?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                                        </Text>
                                    ) : null}
                                </View>
                            ) : null}

                            {/* Target Place */}
                            <View>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Target Place</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                                    {Object.keys(details)
                                        .filter(place => place !== sourcePlace)
                                        .map(place => (
                                            <TouchableOpacity
                                                key={place}
                                                style={[
                                                    styles.chip,
                                                    { borderColor: colors.border },
                                                    !isCustomTarget && targetPlace === place && { backgroundColor: colors.primary, borderColor: colors.primary }
                                                ]}
                                                onPress={() => {
                                                    setIsCustomTarget(false);
                                                    setTargetPlace(place);
                                                }}
                                            >
                                                <Text style={[styles.chipText, { color: colors.text }, !isCustomTarget && targetPlace === place && { color: '#fff', fontWeight: 'bold' }]}>
                                                    {place}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    <TouchableOpacity
                                        style={[
                                            styles.chip,
                                            { borderColor: colors.border },
                                            isCustomTarget && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                        onPress={() => {
                                            setIsCustomTarget(true);
                                            setTargetPlace('');
                                        }}
                                    >
                                        <Text style={[styles.chipText, { color: colors.text }, isCustomTarget && { color: '#fff', fontWeight: 'bold' }]}>
                                            + New Place
                                        </Text>
                                    </TouchableOpacity>
                                </ScrollView>

                                {isCustomTarget ? (
                                    <TextInput
                                        style={[styles.textInput, { borderColor: colors.border, color: colors.text, backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}
                                        placeholder="Enter new place name..."
                                        placeholderTextColor={colors.textSecondary}
                                        value={targetPlaceInput}
                                        onChangeText={setTargetPlaceInput}
                                        autoCapitalize="words"
                                    />
                                ) : null}
                            </View>

                            {/* Amount */}
                            <View>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount</Text>
                                <TextInput
                                    style={[styles.textInput, { borderColor: colors.border, color: colors.text, backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}
                                    placeholder="0.00"
                                    placeholderTextColor={colors.textSecondary}
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Actions */}
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalButton, { borderColor: colors.border, borderWidth: 1 }]}
                                    onPress={() => setShowMoveModal(false)}
                                >
                                    <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: colors.primary }]}
                                    onPress={handleMoveSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={{ color: '#fff', fontWeight: '600' }}>Move</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Convert Currency Native Overlay Modal */}
            <Modal
                visible={showConvertModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowConvertModal(false)}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior="padding"
                >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Convert Currency</Text>
                            <TouchableOpacity onPress={() => setShowConvertModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ gap: 20 }} keyboardShouldPersistTaps="handled">
                            {/* Place */}
                            <View>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Place</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                                    {Object.keys(details).map(place => (
                                        <TouchableOpacity
                                            key={place}
                                            style={[
                                                styles.chip,
                                                { borderColor: colors.border },
                                                convertPlace === place && { backgroundColor: colors.primary, borderColor: colors.primary }
                                            ]}
                                            onPress={() => {
                                                setConvertPlace(place);
                                                setSourceCurrency('');
                                                setTargetCurrency('');
                                                setExchangeRate('');
                                                setTargetAmount('');
                                            }}
                                        >
                                            <Text style={[styles.chipText, { color: colors.text }, convertPlace === place && { color: '#fff', fontWeight: 'bold' }]}>
                                                {place}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {convertPlace ? (
                                <>
                                    {/* Source Currency */}
                                    <View>
                                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Current Currency</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                                            {(details[convertPlace] || []).map(item => (
                                                <TouchableOpacity
                                                    key={item.currency}
                                                    style={[
                                                        styles.chip,
                                                        { borderColor: colors.border },
                                                        sourceCurrency === item.currency && { backgroundColor: colors.primary, borderColor: colors.primary }
                                                    ]}
                                                    onPress={() => {
                                                        setSourceCurrency(item.currency);
                                                        updateDefaultRate(item.currency, targetCurrency);
                                                    }}
                                                >
                                                    <Text style={[styles.chipText, { color: colors.text }, sourceCurrency === item.currency && { color: '#fff', fontWeight: 'bold' }]}>
                                                        {item.currency}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                        {sourceCurrency ? (
                                            <Text style={[styles.balanceText, { color: colors.textSecondary }]}>
                                                Available: {Number((details[convertPlace] || []).find(item => item.currency === sourceCurrency)?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sourceCurrency}
                                            </Text>
                                        ) : null}
                                    </View>

                                    {/* Target Currency */}
                                    <View>
                                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Target Currency</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                                            {allCurrencies.map(c => (
                                                <TouchableOpacity
                                                    key={c}
                                                    style={[
                                                        styles.chip,
                                                        { borderColor: colors.border },
                                                        targetCurrency === c && { backgroundColor: colors.primary, borderColor: colors.primary }
                                                    ]}
                                                    onPress={() => {
                                                        setTargetCurrency(c);
                                                        updateDefaultRate(sourceCurrency, c);
                                                    }}
                                                >
                                                    <Text style={[styles.chipText, { color: colors.text }, targetCurrency === c && { color: '#fff', fontWeight: 'bold' }]}>
                                                        {c}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </>
                            ) : null}

                            {/* Rate */}
                            <View>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Rate</Text>
                                <TextInput
                                    style={[styles.textInput, { borderColor: colors.border, color: colors.text, backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}
                                    placeholder="0.00"
                                    placeholderTextColor={colors.textSecondary}
                                    value={exchangeRate}
                                    onChangeText={handleExchangeRateChange}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                {/* Amount */}
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount ({sourceCurrency || '...'})</Text>
                                    <TextInput
                                        style={[styles.textInput, { borderColor: colors.border, color: colors.text, backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}
                                        placeholder="0.00"
                                        placeholderTextColor={colors.textSecondary}
                                        value={convertAmount}
                                        onChangeText={handleConvertAmountChange}
                                        keyboardType="numeric"
                                    />
                                </View>
                                
                                {/* Target Amount */}
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Target ({targetCurrency || '...'})</Text>
                                    <TextInput
                                        style={[styles.textInput, { borderColor: colors.border, color: colors.text, backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}
                                        placeholder="0.00"
                                        placeholderTextColor={colors.textSecondary}
                                        value={targetAmount}
                                        onChangeText={handleTargetAmountChange}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            {/* Actions */}
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalButton, { borderColor: colors.border, borderWidth: 1 }]}
                                    onPress={() => setShowConvertModal(false)}
                                >
                                    <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: '#2563EB' }]}
                                    onPress={handleConvertSubmit}
                                    disabled={convertSubmitting}
                                >
                                    {convertSubmitting ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={{ color: '#fff', fontWeight: '600' }}>Convert</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
                </KeyboardAvoidingView>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    chipsContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingBottom: 4,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    chipText: {
        fontSize: 14,
    },
    balanceText: {
        fontSize: 12,
        marginTop: 4,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        marginTop: 8,
    },
    modalActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 16,
    },
    modalButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
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
});
