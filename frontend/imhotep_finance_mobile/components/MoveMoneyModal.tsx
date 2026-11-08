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

interface MoveMoneyModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    details: Record<string, { currency: string; amount: number }[]>;
}

const MoveMoneyContent: React.FC<MoveMoneyModalProps> = ({
    onClose,
    onSuccess,
    details,
}) => {
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [step, setStep] = useState(1);
    const places = Object.keys(details);

    const [sourcePlace, setSourcePlace] = useState(places[0] || '');
    const [currency, setCurrency] = useState('');
    const [amount, setAmount] = useState('');
    const [targetPlace, setTargetPlace] = useState('');
    const [targetPlaceInput, setTargetPlaceInput] = useState('');
    const [isCustomTarget, setIsCustomTarget] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [fadeAnim] = useState(() => new Animated.Value(1));
    const [slideAnim] = useState(() => new Animated.Value(0));

    // Currencies available in selected source place
    const availableCurrencies = (details[sourcePlace] || []).map(item => item.currency);
    const activeCurrency = currency || (availableCurrencies[0] || '');

    const currentSourceBalance = Number((details[sourcePlace] || []).find(item => item.currency === activeCurrency)?.amount || 0);
    const effectiveTargetPlace = isCustomTarget ? targetPlaceInput.trim() : targetPlace;
    const currentTargetBalance = Number((details[effectiveTargetPlace] || []).find(item => item.currency === activeCurrency)?.amount || 0);

    const numericAmount = parseFloat(amount) || 0;
    const remainingSourceBalance = Math.max(0, currentSourceBalance - numericAmount);
    const projectedTargetBalance = currentTargetBalance + numericAmount;
    const isInsufficient = numericAmount > currentSourceBalance;

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

    const validateStep1 = () => {
        const errs: Record<string, string> = {};
        if (!sourcePlace) errs.sourcePlace = 'Please select a source account';
        if (!activeCurrency) errs.currency = 'Please select a currency';
        if (!amount || numericAmount <= 0) {
            errs.amount = 'Please enter a valid amount greater than 0';
        } else if (isInsufficient) {
            errs.amount = `Insufficient balance. Available: ${currentSourceBalance.toFixed(2)} ${activeCurrency}`;
        }
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep2 = () => {
        const errs: Record<string, string> = {};
        if (!effectiveTargetPlace) {
            errs.targetPlace = 'Please select or enter a destination account';
        } else if (effectiveTargetPlace.toLowerCase() === sourcePlace.toLowerCase()) {
            errs.targetPlace = 'Destination account must be different from source account';
        }
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (step === 1) {
            if (validateStep1()) animateTransition('next', () => setStep(2));
        } else if (step === 2) {
            if (validateStep2()) animateTransition('next', () => setStep(3));
        }
    };

    const handleBack = () => {
        if (step > 1) {
            animateTransition('back', () => setStep(step - 1));
        }
    };

    const handleQuickAdd = (value: number) => {
        const current = parseFloat(amount) || 0;
        const nextVal = Math.min(currentSourceBalance, current + value);
        setAmount(nextVal.toFixed(2));
        setFieldErrors(prev => ({ ...prev, amount: '' }));
    };

    const handleMaxAmount = () => {
        setAmount(currentSourceBalance.toFixed(2));
        setFieldErrors(prev => ({ ...prev, amount: '' }));
    };

    const handleSubmit = async () => {
        if (!validateStep1() || !validateStep2()) return;
        setSubmitting(true);
        try {
            await api.post('/api/finance-management/move-money/', {
                source_place: sourcePlace,
                target_place: effectiveTargetPlace,
                amount: numericAmount,
                currency: activeCurrency,
            });
            Alert.alert(t('common.status.success'), t('dashboard.netWorthDetails.moveSuccess'));
            onSuccess();
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'An error occurred during transfer.';
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
                                {t('dashboard.netWorthDetails.moveMoney')}
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
                                    {s === 1 ? '1. Source & Amount' : s === 2 ? '2. Destination' : '3. Review'}
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
                            {/* STEP 1: Source Place, Currency & Amount */}
                            {step === 1 && (
                                <View style={styles.stepContent}>
                                    <Text style={[styles.label, themeStyles.subText]}>
                                        {t('dashboard.netWorthDetails.sourcePlace')} *
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                                        {places.map((p) => {
                                            const isSelected = sourcePlace === p;
                                            return (
                                                <TouchableOpacity
                                                    key={p}
                                                    style={[
                                                        styles.chip,
                                                        isSelected ? styles.chipActive : (isDark ? styles.chipInactiveDark : styles.chipInactiveLight),
                                                    ]}
                                                    onPress={() => {
                                                        setSourcePlace(p);
                                                        setCurrency('');
                                                        setFieldErrors(prev => ({ ...prev, sourcePlace: '' }));
                                                    }}
                                                >
                                                    <Ionicons
                                                        name="wallet-outline"
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
                                    {!!fieldErrors.sourcePlace && (
                                        <Text style={styles.errorText}>⚠️ {fieldErrors.sourcePlace}</Text>
                                    )}

                                    {/* Currency */}
                                    <Text style={[styles.label, themeStyles.subText, { marginTop: 14 }]}>
                                        {t('dashboard.netWorthDetails.currency')} *
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                                        {availableCurrencies.map((c) => {
                                            const isSelected = activeCurrency === c;
                                            const bal = (details[sourcePlace] || []).find(item => item.currency === c)?.amount || 0;
                                            return (
                                                <TouchableOpacity
                                                    key={c}
                                                    style={[
                                                        styles.chip,
                                                        isSelected ? styles.chipActive : (isDark ? styles.chipInactiveDark : styles.chipInactiveLight),
                                                    ]}
                                                    onPress={() => {
                                                        setCurrency(c);
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
                                            Available: {currentSourceBalance.toFixed(2)} {activeCurrency}
                                        </Text>
                                    </View>
                                    <View style={[styles.amountInputWrapper, themeStyles.input, !!fieldErrors.amount && styles.inputError]}>
                                        <TextInput
                                            style={[styles.amountInput, themeStyles.text]}
                                            placeholder="0.00"
                                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                            keyboardType="decimal-pad"
                                            value={amount}
                                            onChangeText={(text) => {
                                                setAmount(text);
                                                setFieldErrors(prev => ({ ...prev, amount: '' }));
                                            }}
                                        />
                                        <Text style={[styles.currencySuffix, themeStyles.subText]}>
                                            {activeCurrency || 'CUR'}
                                        </Text>
                                    </View>
                                    {!!fieldErrors.amount && (
                                        <Text style={styles.errorText}>⚠️ {fieldErrors.amount}</Text>
                                    )}

                                    {/* Quick Increment Chips */}
                                    <View style={styles.quickChipsRow}>
                                        {[50, 100, 500, 1000].map((val) => (
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
                                                Amount exceeds balance by {(numericAmount - currentSourceBalance).toFixed(2)} {activeCurrency}.
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* STEP 2: Destination Account */}
                            {step === 2 && (
                                <View style={styles.stepContent}>
                                    <Text style={[styles.label, themeStyles.subText]}>
                                        {t('dashboard.netWorthDetails.targetPlace')} *
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                                        {places
                                            .filter(p => p !== sourcePlace)
                                            .map((p) => {
                                                const isSelected = !isCustomTarget && targetPlace === p;
                                                return (
                                                    <TouchableOpacity
                                                        key={p}
                                                        style={[
                                                            styles.chip,
                                                            isSelected ? styles.chipActive : (isDark ? styles.chipInactiveDark : styles.chipInactiveLight),
                                                        ]}
                                                        onPress={() => {
                                                            setIsCustomTarget(false);
                                                            setTargetPlace(p);
                                                            setFieldErrors(prev => ({ ...prev, targetPlace: '' }));
                                                        }}
                                                    >
                                                        <Ionicons
                                                            name="checkmark-circle-outline"
                                                            size={15}
                                                            color={isSelected ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')}
                                                        />
                                                        <Text style={[styles.chipText, isSelected ? styles.chipTextActive : themeStyles.text]}>
                                                            {p}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        <TouchableOpacity
                                            style={[
                                                styles.chip,
                                                isCustomTarget ? styles.chipActive : (isDark ? styles.chipInactiveDark : styles.chipInactiveLight),
                                            ]}
                                            onPress={() => {
                                                setIsCustomTarget(true);
                                                setTargetPlace('');
                                                setFieldErrors(prev => ({ ...prev, targetPlace: '' }));
                                            }}
                                        >
                                            <Ionicons
                                                name="add-outline"
                                                size={16}
                                                color={isCustomTarget ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')}
                                            />
                                            <Text style={[styles.chipText, isCustomTarget ? styles.chipTextActive : themeStyles.text]}>
                                                {t('dashboard.netWorthDetails.newPlace')}
                                            </Text>
                                        </TouchableOpacity>
                                    </ScrollView>

                                    {isCustomTarget && (
                                        <View style={{ marginTop: 10 }}>
                                            <TextInput
                                                style={[styles.input, themeStyles.input, !!fieldErrors.targetPlace && styles.inputError]}
                                                placeholder={t('dashboard.netWorthDetails.newPlacePlaceholder')}
                                                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                                value={targetPlaceInput}
                                                onChangeText={(text) => {
                                                    setTargetPlaceInput(text);
                                                    setFieldErrors(prev => ({ ...prev, targetPlace: '' }));
                                                }}
                                                autoCapitalize="words"
                                            />
                                        </View>
                                    )}
                                    {!!fieldErrors.targetPlace && (
                                        <Text style={styles.errorText}>⚠️ {fieldErrors.targetPlace}</Text>
                                    )}

                                    {/* Projected Balance Diff */}
                                    {!!effectiveTargetPlace && (
                                        <View style={[styles.previewCard, themeStyles.cardBg]}>
                                            <Text style={[styles.previewCardTitle, themeStyles.text]}>
                                                Projected Account Balances
                                            </Text>
                                            <View style={styles.previewRow}>
                                                <Text style={styles.previewLabel}>{sourcePlace} (Source):</Text>
                                                <Text style={[styles.previewVal, { color: '#ef4444' }]}>
                                                    {currentSourceBalance.toFixed(2)} → {remainingSourceBalance.toFixed(2)} {activeCurrency}
                                                </Text>
                                            </View>
                                            <View style={styles.divider} />
                                            <View style={styles.previewRow}>
                                                <Text style={styles.previewLabel}>{effectiveTargetPlace} (Target):</Text>
                                                <Text style={[styles.previewVal, { color: '#10b981' }]}>
                                                    {currentTargetBalance.toFixed(2)} → {projectedTargetBalance.toFixed(2)} {activeCurrency}
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* STEP 3: Review & Confirm */}
                            {step === 3 && (
                                <View style={styles.stepContent}>
                                    <View style={[styles.summaryCard, themeStyles.cardBg]}>
                                        <View style={styles.summaryTransferVisual}>
                                            <View style={styles.summaryEndpoint}>
                                                <Ionicons name="arrow-up-circle" size={24} color="#ef4444" />
                                                <Text style={styles.summaryEndpointLabel}>FROM</Text>
                                                <Text style={[styles.summaryEndpointName, themeStyles.text]}>{sourcePlace}</Text>
                                            </View>
                                            <Ionicons name="arrow-forward" size={24} color={isDark ? '#64748b' : '#94a3b8'} />
                                            <View style={styles.summaryEndpoint}>
                                                <Ionicons name="arrow-down-circle" size={24} color="#10b981" />
                                                <Text style={styles.summaryEndpointLabel}>TO</Text>
                                                <Text style={[styles.summaryEndpointName, themeStyles.text]}>{effectiveTargetPlace}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.summaryAmountBox}>
                                            <Text style={styles.summaryAmountLabel}>TRANSFER AMOUNT</Text>
                                            <Text style={styles.summaryAmountValue}>
                                                {numericAmount.toFixed(2)} {activeCurrency}
                                            </Text>
                                        </View>

                                        <View style={styles.summaryGrid}>
                                            <View style={styles.summaryGridItem}>
                                                <Text style={styles.summaryGridLabel}>{sourcePlace} AFTER</Text>
                                                <Text style={[styles.summaryGridVal, themeStyles.text]}>
                                                    {remainingSourceBalance.toFixed(2)} {activeCurrency}
                                                </Text>
                                            </View>
                                            <View style={styles.summaryGridItem}>
                                                <Text style={styles.summaryGridLabel}>{effectiveTargetPlace} AFTER</Text>
                                                <Text style={[styles.summaryGridVal, themeStyles.text]}>
                                                    {projectedTargetBalance.toFixed(2)} {activeCurrency}
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
                            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                                <Text style={styles.nextButtonText}>{t('common.actions.next')}</Text>
                                <Ionicons name="arrow-forward" size={18} color="white" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: '#366c6b' }]}
                                onPress={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.submitButtonText}>
                                        {t('dashboard.netWorthDetails.move')}
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

const MoveMoneyModal: React.FC<MoveMoneyModalProps> = (props) => {
    return (
        <Modal
            visible={props.visible}
            animationType="slide"
            transparent={true}
            onRequestClose={props.onClose}
        >
            {props.visible && (
                <MoveMoneyContent
                    key={`move-money-${props.visible ? 'open' : 'closed'}`}
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
        backgroundColor: 'rgba(54, 108, 107, 0.12)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginBottom: 4,
    },
    stepBadgeText: {
        color: '#366c6b',
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
        backgroundColor: '#366c6b',
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
        backgroundColor: '#366c6b',
        borderColor: '#366c6b',
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
    input: {
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        borderWidth: 1,
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
        backgroundColor: '#366c6b',
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
    previewCard: {
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        marginTop: 12,
    },
    previewCardTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    previewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    previewLabel: {
        fontSize: 12,
        color: '#64748b',
    },
    previewVal: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.06)',
        marginVertical: 4,
    },
    summaryCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    summaryTransferVisual: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 8,
    },
    summaryEndpoint: {
        alignItems: 'center',
        gap: 4,
    },
    summaryEndpointLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#94a3b8',
    },
    summaryEndpointName: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    summaryAmountBox: {
        alignItems: 'center',
        backgroundColor: 'rgba(54, 108, 107, 0.08)',
        padding: 12,
        borderRadius: 12,
        marginVertical: 12,
    },
    summaryAmountLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#366c6b',
        letterSpacing: 0.5,
    },
    summaryAmountValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#366c6b',
        marginTop: 2,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
        paddingTop: 10,
    },
    summaryGridItem: {
        flex: 1,
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
        backgroundColor: '#366c6b',
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

export default MoveMoneyModal;
