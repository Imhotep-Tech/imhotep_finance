import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Animated
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/contexts/LanguageContext';
import api from '../constants/api';

interface ConvertCurrencyModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    details: Record<string, { currency: string; amount: number }[]>;
    allCurrencies: string[];
    exchangeRates: Record<string, number> | null;
}

const ConvertCurrencyContent: React.FC<ConvertCurrencyModalProps> = ({
    onClose,
    onSuccess,
    details,
    allCurrencies,
    exchangeRates,
}) => {
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [step, setStep] = useState(1);
    const places = Object.keys(details);

    const [place, setPlace] = useState(places[0] || '');
    const [sourceCurrency, setSourceCurrency] = useState('');
    const [targetCurrency, setTargetCurrency] = useState('');
    const [convertAmount, setConvertAmount] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [exchangeRate, setExchangeRate] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [fadeAnim] = useState(() => new Animated.Value(1));
    const [slideAnim] = useState(() => new Animated.Value(0));

    // Currencies in selected place
    const placeCurrencies = (details[place] || []).map(item => item.currency);
    const activeSourceCurrency = sourceCurrency || (placeCurrencies[0] || '');
    const currentAvailable = Number((details[place] || []).find(item => item.currency === activeSourceCurrency)?.amount || 0);

    const numericAmount = parseFloat(convertAmount) || 0;
    const isInsufficient = numericAmount > currentAvailable;

    const animateTransition = (direction: 'next' | 'back', callback: () => void) => {
        const toValue = direction === 'next' ? -25 : 25;
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue, duration: 120, useNativeDriver: true }),
        ]).start(() => {
            callback();
            slideAnim.setValue(direction === 'next' ? 25 : -25);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            ]).start();
        });
    };

    const updateDefaultRate = (src: string, tgt: string, currentAmt = convertAmount) => {
        if (src && tgt && exchangeRates) {
            const srcRate = exchangeRates[src];
            const tgtRate = exchangeRates[tgt];
            if (srcRate && tgtRate) {
                const rate = (tgtRate / srcRate).toFixed(6);
                setExchangeRate(rate);
                const parsed = parseFloat(currentAmt);
                if (!isNaN(parsed) && parsed > 0) {
                    setTargetAmount((parsed * parseFloat(rate)).toFixed(2));
                }
                return;
            }
        }
    };

    const handleAmountChange = (val: string) => {
        setConvertAmount(val);
        setFieldErrors(prev => ({ ...prev, amount: '' }));
        const parsed = parseFloat(val);
        const rate = parseFloat(exchangeRate);
        if (!isNaN(parsed) && !isNaN(rate) && rate > 0) {
            setTargetAmount((parsed * rate).toFixed(2));
        }
    };

    const handleRateChange = (val: string) => {
        setExchangeRate(val);
        setFieldErrors(prev => ({ ...prev, rate: '' }));
        const parsedAmt = parseFloat(convertAmount);
        const parsedRate = parseFloat(val);
        if (!isNaN(parsedAmt) && !isNaN(parsedRate) && parsedRate > 0) {
            setTargetAmount((parsedAmt * parsedRate).toFixed(2));
        }
    };

    const handleTargetAmountChange = (val: string) => {
        setTargetAmount(val);
        const parsedTarget = parseFloat(val);
        const parsedAmt = parseFloat(convertAmount);
        if (!isNaN(parsedTarget) && !isNaN(parsedAmt) && parsedAmt > 0) {
            setExchangeRate((parsedTarget / parsedAmt).toFixed(6));
        }
    };

    const handleQuickAdd = (value: number) => {
        const current = parseFloat(convertAmount) || 0;
        const nextVal = Math.min(currentAvailable, current + value);
        handleAmountChange(nextVal.toFixed(2));
    };

    const handleMaxAmount = () => {
        handleAmountChange(currentAvailable.toFixed(2));
    };

    const validateStep1 = () => {
        const errs: Record<string, string> = {};
        if (!place) errs.place = 'Please select a place';
        if (!activeSourceCurrency) errs.currency = 'Please select a source currency';
        if (!convertAmount || numericAmount <= 0) {
            errs.amount = 'Please enter a valid amount greater than 0';
        } else if (isInsufficient) {
            errs.amount = `Insufficient balance. Available: ${currentAvailable.toFixed(2)} ${activeSourceCurrency}`;
        }
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep2 = () => {
        const errs: Record<string, string> = {};
        if (!targetCurrency) {
            errs.targetCurrency = 'Please select a target currency';
        } else if (targetCurrency === activeSourceCurrency) {
            errs.targetCurrency = 'Target currency must be different from source currency';
        }
        const parsedRate = parseFloat(exchangeRate);
        if (!exchangeRate || isNaN(parsedRate) || parsedRate <= 0) {
            errs.rate = 'Please enter a valid exchange rate';
        }
        const parsedTarget = parseFloat(targetAmount);
        if (!targetAmount || isNaN(parsedTarget) || parsedTarget <= 0) {
            errs.targetAmount = 'Please enter a valid target amount';
        }
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (step === 1) {
            if (validateStep1()) {
                if (!targetCurrency) {
                    const fallbackTarget = allCurrencies.find(c => c !== activeSourceCurrency) || '';
                    if (fallbackTarget) {
                        setTargetCurrency(fallbackTarget);
                        updateDefaultRate(activeSourceCurrency, fallbackTarget);
                    }
                }
                animateTransition('next', () => setStep(2));
            }
        } else if (step === 2) {
            if (validateStep2()) animateTransition('next', () => setStep(3));
        }
    };

    const handleBack = () => {
        if (step > 1) {
            animateTransition('back', () => setStep(step - 1));
        }
    };

    const handleSubmit = async () => {
        if (!validateStep1() || !validateStep2()) return;
        setSubmitting(true);
        try {
            await api.post('/api/finance-management/convert-currency/', {
                place,
                source_currency: activeSourceCurrency,
                target_currency: targetCurrency,
                amount: numericAmount,
                target_amount: parseFloat(targetAmount),
            });
            Alert.alert(t('common.status.success'), t('dashboard.netWorthDetails.convertSuccess'));
            onSuccess();
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'An error occurred during conversion.';
            Alert.alert(t('common.status.error'), errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const themeStyles = {
        container: { backgroundColor: isDark ? '#0f172a' : '#ffffff' },
        cardBg: { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' },
        text: { color: isDark ? '#f8fafc' : '#0f172a' },
        subText: { color: isDark ? '#94a3b8' : '#64748b' },
        input: {
            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
            color: isDark ? '#f8fafc' : '#0f172a',
            borderColor: isDark ? '#334155' : '#e2e8f0',
        },
        closeIcon: isDark ? '#fff' : '#333',
    };

    return (
        <KeyboardAvoidingView behavior="padding" style={styles.keyboardAvoidingView}>
            <View style={styles.container}>
                <View style={[styles.modalView, themeStyles.container]}>
                    <View style={styles.dragHandle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <View style={styles.stepBadge}>
                                <Text style={styles.stepBadgeText}>Step {step} of 3</Text>
                            </View>
                            <Text style={[styles.title, themeStyles.text]}>
                                {t('dashboard.netWorthDetails.convertCurrencies')}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.closeButton, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={20} color={themeStyles.closeIcon} />
                        </TouchableOpacity>
                    </View>

                    {/* Step Progress Pills */}
                    <View style={styles.progressContainer}>
                        {[1, 2, 3].map((s) => (
                            <TouchableOpacity
                                key={s}
                                activeOpacity={0.7}
                                onPress={() => {
                                    if (s < step) {
                                        animateTransition('back', () => setStep(s));
                                    } else if (s === 2 && validateStep1()) {
                                        animateTransition('next', () => setStep(2));
                                    } else if (s === 3 && validateStep1() && validateStep2()) {
                                        animateTransition('next', () => setStep(3));
                                    }
                                }}
                                style={[
                                    styles.progressPill,
                                    s === step && styles.progressPillActive,
                                    s < step && styles.progressPillDone,
                                    s > step && (isDark ? styles.progressPillInactiveDark : styles.progressPillInactiveLight),
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.progressPillText,
                                        s === step && styles.progressPillTextActive,
                                        s < step && styles.progressPillTextDone,
                                    ]}
                                >
                                    {s === 1 ? '1. Account & Amount' : s === 2 ? '2. Target & Rate' : '3. Review'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <ScrollView
                        style={{ flexShrink: 1 }}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
                            {/* STEP 1: Account, Source Currency & Amount */}
                            {step === 1 && (
                                <View style={styles.stepContent}>
                                    <Text style={[styles.label, themeStyles.subText]}>
                                        {t('dashboard.netWorthDetails.place')} *
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                                        {places.map((p) => {
                                            const isSelected = place === p;
                                            return (
                                                <TouchableOpacity
                                                    key={p}
                                                    style={[
                                                        styles.chip,
                                                        isSelected ? styles.chipActive : (isDark ? styles.chipInactiveDark : styles.chipInactiveLight),
                                                    ]}
                                                    onPress={() => {
                                                        setPlace(p);
                                                        setSourceCurrency('');
                                                        setFieldErrors(prev => ({ ...prev, place: '' }));
                                                    }}
                                                >
                                                    <Ionicons
                                                        name="business-outline"
                                                        size={15}
                                                        color={isSelected ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')}
                                                    />
                                                    <Text style={[styles.chipText, isSelected ? styles.chipTextActive : themeStyles.text]}>
                                                        {p}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>

                                    {/* Source Currency */}
                                    <Text style={[styles.label, themeStyles.subText, { marginTop: 14 }]}>
                                        {t('dashboard.netWorthDetails.currentCurrency')} *
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                                        {placeCurrencies.map((c) => {
                                            const isSelected = activeSourceCurrency === c;
                                            const bal = (details[place] || []).find(item => item.currency === c)?.amount || 0;
                                            return (
                                                <TouchableOpacity
                                                    key={c}
                                                    style={[
                                                        styles.chip,
                                                        isSelected ? styles.chipActive : (isDark ? styles.chipInactiveDark : styles.chipInactiveLight),
                                                    ]}
                                                    onPress={() => {
                                                        setSourceCurrency(c);
                                                        updateDefaultRate(c, targetCurrency);
                                                        setFieldErrors(prev => ({ ...prev, currency: '' }));
                                                    }}
                                                >
                                                    <Text style={[styles.chipText, isSelected ? styles.chipTextActive : themeStyles.text]}>
                                                        {c} ({bal.toFixed(2)})
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>

                                    {/* Amount */}
                                    <View style={styles.amountHeader}>
                                        <Text style={[styles.label, themeStyles.subText]}>
                                            {t('dashboard.netWorthDetails.amount')} *
                                        </Text>
                                        <Text style={[styles.availableBalanceTag, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                                            Available: {currentAvailable.toFixed(2)} {activeSourceCurrency}
                                        </Text>
                                    </View>
                                    <View style={[styles.amountInputWrapper, themeStyles.input, !!fieldErrors.amount && styles.inputError]}>
                                        <TextInput
                                            style={[styles.amountInput, themeStyles.text]}
                                            placeholder="0.00"
                                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                            keyboardType="decimal-pad"
                                            value={convertAmount}
                                            onChangeText={handleAmountChange}
                                        />
                                        <Text style={[styles.currencySuffix, themeStyles.subText]}>
                                            {activeSourceCurrency || 'CUR'}
                                        </Text>
                                    </View>
                                    {!!fieldErrors.amount && (
                                        <Text style={styles.errorText}>⚠️ {fieldErrors.amount}</Text>
                                    )}

                                    {/* Quick chips */}
                                    <View style={styles.quickChipsRow}>
                                        {[50, 100, 500].map((val) => (
                                            <TouchableOpacity
                                                key={val}
                                                style={[styles.quickChip, isDark ? styles.quickChipDark : styles.quickChipLight]}
                                                onPress={() => handleQuickAdd(val)}
                                            >
                                                <Text style={[styles.quickChipText, themeStyles.text]}>+{val}</Text>
                                            </TouchableOpacity>
                                        ))}
                                        <TouchableOpacity
                                            style={[styles.quickChip, styles.maxChip]}
                                            onPress={handleMaxAmount}
                                        >
                                            <Text style={styles.maxChipText}>MAX</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Insufficient balance alert */}
                                    {isInsufficient && (
                                        <View style={styles.alertBox}>
                                            <Ionicons name="warning-outline" size={16} color="#ef4444" />
                                            <Text style={styles.alertText}>
                                                Amount exceeds available balance by {(numericAmount - currentAvailable).toFixed(2)} {activeSourceCurrency}.
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* STEP 2: Target Currency & Exchange Rate */}
                            {step === 2 && (
                                <View style={styles.stepContent}>
                                    <Text style={[styles.label, themeStyles.subText]}>
                                        {t('dashboard.netWorthDetails.targetCurrency')} *
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                                        {allCurrencies
                                            .filter(c => c !== activeSourceCurrency)
                                            .map((c) => {
                                                const isSelected = targetCurrency === c;
                                                return (
                                                    <TouchableOpacity
                                                        key={c}
                                                        style={[
                                                            styles.chip,
                                                            isSelected ? styles.chipActive : (isDark ? styles.chipInactiveDark : styles.chipInactiveLight),
                                                        ]}
                                                        onPress={() => {
                                                            setTargetCurrency(c);
                                                            updateDefaultRate(activeSourceCurrency, c);
                                                            setFieldErrors(prev => ({ ...prev, targetCurrency: '' }));
                                                        }}
                                                    >
                                                        <Text style={[styles.chipText, isSelected ? styles.chipTextActive : themeStyles.text]}>
                                                            {c}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                    </ScrollView>
                                    {!!fieldErrors.targetCurrency && (
                                        <Text style={styles.errorText}>⚠️ {fieldErrors.targetCurrency}</Text>
                                    )}

                                    {/* Exchange Rate Input */}
                                    <Text style={[styles.label, themeStyles.subText, { marginTop: 14 }]}>
                                        {t('dashboard.netWorthDetails.rate')} (1 {activeSourceCurrency} = ? {targetCurrency}) *
                                    </Text>
                                    <View style={[styles.inputWrapper, themeStyles.input, !!fieldErrors.rate && styles.inputError]}>
                                        <TextInput
                                            style={[styles.textInput, themeStyles.text]}
                                            placeholder="1.000000"
                                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                            keyboardType="decimal-pad"
                                            value={exchangeRate}
                                            onChangeText={handleRateChange}
                                        />
                                    </View>
                                    {!!fieldErrors.rate && (
                                        <Text style={styles.errorText}>⚠️ {fieldErrors.rate}</Text>
                                    )}

                                    {/* Converted Target Amount */}
                                    <Text style={[styles.label, themeStyles.subText, { marginTop: 14 }]}>
                                        {t('dashboard.netWorthDetails.target')} Amount ({targetCurrency}) *
                                    </Text>
                                    <View style={[styles.amountInputWrapper, themeStyles.input, !!fieldErrors.targetAmount && styles.inputError]}>
                                        <TextInput
                                            style={[styles.amountInput, themeStyles.text]}
                                            placeholder="0.00"
                                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                            keyboardType="decimal-pad"
                                            value={targetAmount}
                                            onChangeText={handleTargetAmountChange}
                                        />
                                        <Text style={[styles.currencySuffix, themeStyles.subText]}>
                                            {targetCurrency || 'CUR'}
                                        </Text>
                                    </View>
                                    {!!fieldErrors.targetAmount && (
                                        <Text style={styles.errorText}>⚠️ {fieldErrors.targetAmount}</Text>
                                    )}

                                    {/* Live Conversion Preview Box */}
                                    <View style={[styles.calculatorCard, themeStyles.cardBg]}>
                                        <View style={styles.calcHeader}>
                                            <Ionicons name="calculator-outline" size={16} color="#2563EB" />
                                            <Text style={styles.calcTitle}>Live Conversion Calculator</Text>
                                        </View>
                                        <Text style={[styles.calcEquation, themeStyles.text]}>
                                            {numericAmount.toFixed(2)} {activeSourceCurrency} × {parseFloat(exchangeRate || '0').toFixed(4)} ={' '}
                                            <Text style={{ color: '#2563EB', fontWeight: 'bold' }}>
                                                {parseFloat(targetAmount || '0').toFixed(2)} {targetCurrency}
                                            </Text>
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* STEP 3: Review & Confirm */}
                            {step === 3 && (
                                <View style={styles.stepContent}>
                                    <View style={[styles.summaryCard, themeStyles.cardBg]}>
                                        <View style={styles.summaryPlaceHeader}>
                                            <Ionicons name="business" size={18} color="#2563EB" />
                                            <Text style={[styles.summaryPlaceText, themeStyles.text]}>{place}</Text>
                                        </View>

                                        <View style={styles.exchangeVisual}>
                                            <View style={styles.exchangeBox}>
                                                <Text style={styles.exchangeBoxLabel}>CONVERTING</Text>
                                                <Text style={[styles.exchangeBoxAmount, { color: '#ef4444' }]}>
                                                    -{numericAmount.toFixed(2)} {activeSourceCurrency}
                                                </Text>
                                            </View>
                                            <Ionicons name="swap-horizontal" size={26} color={isDark ? '#64748b' : '#94a3b8'} />
                                            <View style={styles.exchangeBox}>
                                                <Text style={styles.exchangeBoxLabel}>RECEIVING</Text>
                                                <Text style={[styles.exchangeBoxAmount, { color: '#10b981' }]}>
                                                    +{parseFloat(targetAmount).toFixed(2)} {targetCurrency}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.summaryGrid}>
                                            <View style={styles.summaryGridItem}>
                                                <Text style={styles.summaryGridLabel}>EXCHANGE RATE</Text>
                                                <Text style={[styles.summaryGridVal, themeStyles.text]}>
                                                    1 {activeSourceCurrency} = {parseFloat(exchangeRate).toFixed(4)} {targetCurrency}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </Animated.View>
                    </ScrollView>

                    {/* Bottom Navigation */}
                    <View style={styles.bottomBar}>
                        {step > 1 && (
                            <TouchableOpacity
                                style={[styles.backButton, themeStyles.cardBg]}
                                onPress={handleBack}
                                disabled={submitting}
                            >
                                <Ionicons name="arrow-back" size={18} color={isDark ? '#f8fafc' : '#333'} />
                                <Text style={[styles.backButtonText, themeStyles.text]}>{t('common.actions.back')}</Text>
                            </TouchableOpacity>
                        )}
                        {step < 3 ? (
                            <TouchableOpacity style={[styles.nextButton, { backgroundColor: '#2563EB' }]} onPress={handleNext}>
                                <Text style={styles.nextButtonText}>{t('common.actions.next')}</Text>
                                <Ionicons name="arrow-forward" size={18} color="white" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: '#2563EB' }]}
                                onPress={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.submitButtonText}>
                                        {t('dashboard.netWorthDetails.convert')}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const ConvertCurrencyModal: React.FC<ConvertCurrencyModalProps> = (props) => {
    return (
        <Modal
            visible={props.visible}
            animationType="slide"
            transparent={true}
            onRequestClose={props.onClose}
        >
            {props.visible && (
                <ConvertCurrencyContent
                    key={`convert-currency-${props.visible ? 'open' : 'closed'}`}
                    {...props}
                />
            )}
        </Modal>
    );
};

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    modalView: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#cbd5e1',
        alignSelf: 'center',
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    stepBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginBottom: 4,
    },
    stepBadgeText: {
        color: '#2563EB',
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    closeButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    progressPill: {
        flex: 1,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressPillActive: {
        backgroundColor: '#2563EB',
    },
    progressPillDone: {
        backgroundColor: '#10b981',
    },
    progressPillInactiveLight: {
        backgroundColor: '#e2e8f0',
    },
    progressPillInactiveDark: {
        backgroundColor: '#334155',
    },
    progressPillText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748b',
    },
    progressPillTextActive: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    progressPillTextDone: {
        color: '#ffffff',
    },
    scrollContent: {
        paddingBottom: 16,
    },
    stepContent: {
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    chipsRow: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 4,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    chipActive: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    chipInactiveLight: {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
    },
    chipInactiveDark: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    amountHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
        marginBottom: 4,
    },
    availableBalanceTag: {
        fontSize: 12,
        fontWeight: '600',
    },
    amountInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 16,
        height: 56,
    },
    amountInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        paddingVertical: 0,
    },
    currencySuffix: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    inputWrapper: {
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 14,
        height: 50,
        justifyContent: 'center',
    },
    textInput: {
        fontSize: 16,
        fontWeight: '600',
    },
    inputError: {
        borderColor: '#ef4444',
        borderWidth: 1.5,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 11,
        marginTop: 2,
        fontWeight: '600',
    },
    quickChipsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    quickChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    quickChipLight: {
        backgroundColor: '#f1f5f9',
    },
    quickChipDark: {
        backgroundColor: '#334155',
    },
    quickChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    maxChip: {
        backgroundColor: '#2563EB',
    },
    maxChipText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    alertBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 10,
        borderRadius: 10,
        marginTop: 8,
    },
    alertText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
    },
    calculatorCard: {
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        marginTop: 12,
    },
    calcHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    calcTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#2563EB',
    },
    calcEquation: {
        fontSize: 14,
        fontWeight: '600',
    },
    summaryCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    summaryPlaceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
        justifyContent: 'center',
    },
    summaryPlaceText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    exchangeVisual: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 12,
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
        borderRadius: 14,
        marginBottom: 14,
    },
    exchangeBox: {
        alignItems: 'center',
        gap: 2,
    },
    exchangeBoxLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#94a3b8',
    },
    exchangeBoxAmount: {
        fontSize: 16,
        fontWeight: '900',
    },
    summaryGrid: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
        paddingTop: 10,
        alignItems: 'center',
    },
    summaryGridItem: {
        alignItems: 'center',
    },
    summaryGridLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#94a3b8',
    },
    summaryGridVal: {
        fontSize: 13,
        fontWeight: 'bold',
        marginTop: 2,
    },
    bottomBar: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    backButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
    },
    backButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    nextButton: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        borderRadius: 14,
    },
    nextButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },
    submitButton: {
        flex: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ConvertCurrencyModal;
