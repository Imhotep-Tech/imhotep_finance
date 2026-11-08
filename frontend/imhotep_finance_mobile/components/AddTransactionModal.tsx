import React, { useState, useEffect } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from '@/contexts/LanguageContext';
import api from '../constants/api';
import CurrencySelect from './CurrencySelect';
import CategorySelect from './CategorySelect';
import PlaceSelect from './PlaceSelect';
import { updateNetworthWidget } from '../widgets/widget-updater';
import {
    useNetworthBalances,
    getBalanceForPlace,
    getTotalBalanceForCurrency
} from '../hooks/useNetworthBalances';

interface AddTransactionModalProps {
    onClose: () => void;
    onSuccess: () => void;
    initialType?: 'deposit' | 'withdraw';
    initialValues?: any;
    editMode?: boolean;
    visible: boolean;
}

const TransactionFormContent: React.FC<AddTransactionModalProps> = ({
    onClose,
    onSuccess,
    initialType = 'deposit',
    initialValues = {},
    editMode = false,
}) => {
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { details: networthDetails } = useNetworthBalances();

    const [step, setStep] = useState(1);
    const [status, setStatus] = useState<'deposit' | 'withdraw'>(
        initialValues.trans_status || initialType
    );
    const [amount, setAmount] = useState(
        initialValues.amount ? String(initialValues.amount) : ''
    );
    const [desc, setDesc] = useState(
        initialValues.trans_details || initialValues.desc || ''
    );
    const [category, setCategory] = useState(initialValues.category || '');
    const [place, setPlace] = useState(initialValues.place || '');
    const [currency, setCurrency] = useState(initialValues.currency || '');
    const [date, setDate] = useState(
        initialValues.date ? new Date(initialValues.date) : new Date()
    );
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [fadeAnim] = useState(() => new Animated.Value(1));
    const [slideAnim] = useState(() => new Animated.Value(0));

    useEffect(() => {
        if (!currency) {
            let isMounted = true;
            api.get('/api/get-fav-currency/')
                .then(res => {
                    if (isMounted && res.data?.favorite_currency) {
                        setCurrency(res.data.favorite_currency);
                    }
                })
                .catch(() => {});
            return () => {
                isMounted = false;
            };
        }
    }, [currency]);

    // Balance calculations
    const placeName = place && place.trim() ? place.trim() : 'General';
    const availableInPlace = getBalanceForPlace(networthDetails, currency, placeName);
    const totalInAllPlaces = getTotalBalanceForCurrency(networthDetails, currency);
    const numericAmount = parseFloat(amount) || 0;
    const isExpense = status === 'withdraw';
    const isInsufficient = isExpense && !!currency && numericAmount > 0 && numericAmount > availableInPlace;
    const shortfall = isInsufficient ? numericAmount - availableInPlace : 0;
    const remainingAfter = Math.max(0, availableInPlace - numericAmount);
    const projectedIncome = availableInPlace + numericAmount;

    const animateTransition = (direction: 'next' | 'back', callback: () => void) => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: direction === 'next' ? -20 : 20,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start(() => {
            callback();
            slideAnim.setValue(direction === 'next' ? 20 : -20);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 140,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 140,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    const validateStep1 = (): boolean => {
        const errors: Record<string, string> = {};
        if (!amount || String(amount).trim() === '') {
            errors.amount = t('transactions.modal.amount') + ' is required.';
        } else if (isNaN(numericAmount) || numericAmount <= 0) {
            errors.amount = t('transactions.modal.amountPositive') || 'Amount must be greater than 0.';
        } else if (String(amount).includes('.') && String(amount).split('.')[1].length > 2) {
            errors.amount = t('transactions.modal.amountDecimals') || 'Max 2 decimal places allowed.';
        }

        if (!currency || currency.trim() === '') {
            errors.currency = t('transactions.modal.currencyRequired') || 'Currency is required.';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const errors: Record<string, string> = {};
        if (isExpense && isInsufficient) {
            errors.balance = `Insufficient funds in ${placeName}! Available: ${availableInPlace.toFixed(2)} ${currency}`;
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (step === 1) {
            if (!validateStep1()) return;
            animateTransition('next', () => setStep(2));
        } else if (step === 2) {
            if (!validateStep2()) return;
            animateTransition('next', () => setStep(3));
        }
    };

    const handleBack = () => {
        setFieldErrors({});
        if (step > 1) {
            animateTransition('back', () => setStep(step - 1));
        }
    };

    const handleQuickAdd = (addVal: number) => {
        const current = parseFloat(amount) || 0;
        const nextVal = (current + addVal).toFixed(2);
        setAmount(String(parseFloat(nextVal)));
        setFieldErrors(prev => ({ ...prev, amount: '' }));
    };

    const handleSubmit = async () => {
        if (!validateStep1() || !validateStep2()) {
            return;
        }

        setLoading(true);
        try {
            const payload = {
                amount: numericAmount,
                currency,
                trans_status: status,
                category,
                place,
                trans_details: desc,
                date: date.toISOString().split('T')[0],
            };

            if (editMode && initialValues.id) {
                await api.post(
                    `/api/finance-management/transaction/update-transactions/${initialValues.id}/`,
                    payload
                );
                Alert.alert(t('common.status.success'), t('transactions.modal.updateSuccess'));
            } else {
                await api.post('/api/finance-management/transaction/add-transactions/', payload);
                Alert.alert(t('common.status.success'), t('transactions.modal.addSuccess'));
            }
            updateNetworthWidget();
            onSuccess();
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || (editMode ? t('transactions.modal.updateFailed') : t('transactions.modal.addFailed'));
            Alert.alert(t('common.status.error'), errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (_event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
        }
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            t('transactions.modal.deleteTitle'),
            t('transactions.modal.deleteConfirm'),
            [
                { text: t('common.actions.cancel'), style: 'cancel' },
                {
                    text: t('common.actions.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            if (initialValues.id) {
                                await api.delete(`/api/finance-management/transaction/delete-transactions/${initialValues.id}/`);
                                Alert.alert(t('common.status.success'), t('transactions.modal.deleteSuccess'));
                                updateNetworthWidget();
                                onSuccess();
                            }
                        } catch (err: any) {
                            Alert.alert(t('common.status.error'), err.response?.data?.error || t('transactions.modal.deleteFailed'));
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const themeStyles = {
        container: {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
        },
        cardBg: {
            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
            borderColor: isDark ? '#334155' : '#e2e8f0',
        },
        text: {
            color: isDark ? '#f8fafc' : '#0f172a',
        },
        subText: {
            color: isDark ? '#94a3b8' : '#64748b',
        },
        input: {
            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
            color: isDark ? '#f8fafc' : '#0f172a',
            borderColor: isDark ? '#334155' : '#e2e8f0',
        },
        closeIcon: isDark ? '#fff' : '#333',
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <View style={[styles.modalView, themeStyles.container]}>
                <View style={styles.dragHandle} />

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <View style={styles.stepBadge}>
                            <Text style={styles.stepBadgeText}>
                                {t('transactions.modal.step', { current: step, total: 3 }) || `Step ${step} of 3`}
                            </Text>
                        </View>
                        <Text style={[styles.title, themeStyles.text]}>
                            {editMode ? t('transactions.modal.editTitle') : t('transactions.modal.addTitle')}
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
                                {s === 1 ? '1. Amount' : s === 2 ? '2. Account' : '3. Review'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateX: slideAnim }],
                        }}
                    >
                        {/* Step 1: Type, Amount & Currency */}
                        {step === 1 && (
                            <View style={styles.stepContent}>
                                <View style={styles.typeGrid}>
                                    <TouchableOpacity
                                        style={[
                                            styles.typeCard,
                                            status === 'deposit'
                                                ? styles.typeCardIncomeActive
                                                : (isDark ? styles.typeCardInactiveDark : styles.typeCardInactiveLight),
                                            editMode && { opacity: 0.6 }
                                        ]}
                                        onPress={() => !editMode && setStatus('deposit')}
                                        disabled={editMode}
                                    >
                                        <Ionicons
                                            name="arrow-down-circle"
                                            size={22}
                                            color={status === 'deposit' ? '#10b981' : (isDark ? '#94a3b8' : '#64748b')}
                                        />
                                        <Text
                                            style={[
                                                styles.typeCardText,
                                                status === 'deposit' && { color: '#10b981', fontWeight: 'bold' },
                                                status !== 'deposit' && themeStyles.subText
                                            ]}
                                        >
                                            {t('transactions.modal.income')}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.typeCard,
                                            status === 'withdraw'
                                                ? styles.typeCardExpenseActive
                                                : (isDark ? styles.typeCardInactiveDark : styles.typeCardInactiveLight),
                                            editMode && { opacity: 0.6 }
                                        ]}
                                        onPress={() => !editMode && setStatus('withdraw')}
                                        disabled={editMode}
                                    >
                                        <Ionicons
                                            name="arrow-up-circle"
                                            size={22}
                                            color={status === 'withdraw' ? '#ef4444' : (isDark ? '#94a3b8' : '#64748b')}
                                        />
                                        <Text
                                            style={[
                                                styles.typeCardText,
                                                status === 'withdraw' && { color: '#ef4444', fontWeight: 'bold' },
                                                status !== 'withdraw' && themeStyles.subText
                                            ]}
                                        >
                                            {t('transactions.modal.expense')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={[styles.label, themeStyles.subText]}>
                                    {t('transactions.modal.currency')} *
                                </Text>
                                <CurrencySelect
                                    value={currency}
                                    onChange={(val) => {
                                        setCurrency(val);
                                        setFieldErrors(prev => ({ ...prev, currency: '' }));
                                    }}
                                    required
                                    disabled={editMode}
                                />
                                {!!fieldErrors.currency && (
                                    <Text style={styles.errorText}>⚠️ {fieldErrors.currency}</Text>
                                )}

                                <Text style={[styles.label, themeStyles.subText, { marginTop: 16 }]}>
                                    {t('transactions.modal.amount')} *
                                </Text>
                                <View style={[styles.amountInputWrapper, themeStyles.input, !!fieldErrors.amount && styles.inputError]}>
                                    <TextInput
                                        style={[styles.amountInput, themeStyles.text]}
                                        placeholder={t('transactions.modal.amountPlaceholder')}
                                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                        keyboardType="decimal-pad"
                                        value={amount}
                                        onChangeText={(text) => {
                                            setAmount(text);
                                            setFieldErrors(prev => ({ ...prev, amount: '' }));
                                        }}
                                        autoFocus={!editMode}
                                    />
                                    <Text style={[styles.currencySuffix, themeStyles.subText]}>
                                        {currency || 'CUR'}
                                    </Text>
                                </View>
                                {!!fieldErrors.amount && (
                                    <Text style={styles.errorText}>⚠️ {fieldErrors.amount}</Text>
                                )}

                                <View style={styles.quickChipsRow}>
                                    {[10, 50, 100, 500, 1000].map((val) => (
                                        <TouchableOpacity
                                            key={val}
                                            style={[styles.quickChip, isDark ? styles.quickChipDark : styles.quickChipLight]}
                                            onPress={() => handleQuickAdd(val)}
                                        >
                                            <Text style={[styles.quickChipText, themeStyles.text]}>+{val}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {!!currency && (
                                    <View style={[styles.summaryPill, themeStyles.cardBg]}>
                                        <Ionicons name="wallet-outline" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                                        <Text style={[styles.summaryPillText, themeStyles.subText]}>
                                            Total across accounts: <Text style={{ fontWeight: 'bold' }}>{totalInAllPlaces.toFixed(2)} {currency}</Text>
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Step 2: Account (Place) & Category */}
                        {step === 2 && (
                            <View style={styles.stepContent}>
                                <Text style={[styles.label, themeStyles.subText]}>
                                    {t('transactions.modal.place')}
                                </Text>
                                <PlaceSelect
                                    value={place}
                                    onChange={(val) => {
                                        setPlace(val);
                                        setFieldErrors(prev => ({ ...prev, balance: '' }));
                                    }}
                                    currency={currency}
                                />

                                {!!currency && (
                                    <View
                                        style={[
                                            styles.balanceCard,
                                            isExpense
                                                ? (isInsufficient ? styles.balanceCardError : styles.balanceCardSuccess)
                                                : styles.balanceCardIncome
                                        ]}
                                    >
                                        <View style={styles.balanceCardHeader}>
                                            <Ionicons
                                                name={isExpense ? (isInsufficient ? 'alert-circle' : 'checkmark-circle') : 'trending-up'}
                                                size={22}
                                                color={isExpense ? (isInsufficient ? '#ef4444' : '#10b981') : '#0ea5e9'}
                                            />
                                            <Text
                                                style={[
                                                    styles.balanceCardTitle,
                                                    { color: isExpense ? (isInsufficient ? '#ef4444' : '#10b981') : '#0ea5e9' }
                                                ]}
                                            >
                                                {isExpense
                                                    ? (isInsufficient ? 'Insufficient Funds Alert' : 'Sufficient Funds Available')
                                                    : 'Expected Account Growth'}
                                            </Text>
                                        </View>

                                        <View style={styles.balanceCardRow}>
                                            <Text style={styles.balanceCardLabel}>Available in {placeName}:</Text>
                                            <Text style={styles.balanceCardValue}>{availableInPlace.toFixed(2)} {currency}</Text>
                                        </View>
                                        <View style={styles.balanceCardRow}>
                                            <Text style={styles.balanceCardLabel}>Transaction Amount:</Text>
                                            <Text style={styles.balanceCardValue}>{numericAmount.toFixed(2)} {currency}</Text>
                                        </View>

                                        <View style={styles.balanceDivider} />

                                        <View style={styles.balanceCardRow}>
                                            <Text style={[styles.balanceCardLabel, { fontWeight: 'bold' }]}>
                                                {isExpense ? (isInsufficient ? 'Shortfall Deficit:' : 'Remaining Balance:') : 'New Balance:'}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.balanceCardValue,
                                                    {
                                                        fontWeight: 'bold',
                                                        color: isExpense && isInsufficient ? '#ef4444' : (isExpense ? '#10b981' : '#0ea5e9')
                                                    }
                                                ]}
                                            >
                                                {isExpense
                                                    ? (isInsufficient ? `-${shortfall.toFixed(2)} ${currency}` : `${remainingAfter.toFixed(2)} ${currency}`)
                                                    : `${projectedIncome.toFixed(2)} ${currency}`}
                                            </Text>
                                        </View>

                                        {isExpense && isInsufficient && (
                                            <View style={styles.shortfallTipBox}>
                                                <Text style={styles.shortfallTipText}>
                                                    {totalInAllPlaces >= numericAmount
                                                        ? `💡 You have ${totalInAllPlaces.toFixed(2)} ${currency} across all accounts. Select a different account or transfer funds before withdrawing.`
                                                        : `⚠️ Total balance across all accounts (${totalInAllPlaces.toFixed(2)} ${currency}) is below this expense.`}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                <Text style={[styles.label, themeStyles.subText, { marginTop: 16 }]}>
                                    {t('transactions.modal.category')}
                                </Text>
                                <CategorySelect
                                    value={category}
                                    onChange={setCategory}
                                    status={status}
                                />
                            </View>
                        )}

                        {/* Step 3: Date, Note & Review */}
                        {step === 3 && (
                            <View style={styles.stepContent}>
                                <Text style={[styles.label, themeStyles.subText]}>
                                    {t('transactions.modal.date')}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.dateButton, themeStyles.input]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={[styles.dateText, themeStyles.text]}>
                                        {date.toISOString().split('T')[0]}
                                    </Text>
                                    <Ionicons name="calendar-outline" size={20} color={isDark ? '#94a3b8' : '#666'} />
                                </TouchableOpacity>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display="default"
                                        onChange={onDateChange}
                                        themeVariant={isDark ? 'dark' : 'light'}
                                    />
                                )}

                                <Text style={[styles.label, themeStyles.subText, { marginTop: 16 }]}>
                                    {t('transactions.modal.description')}
                                </Text>
                                <TextInput
                                    style={[styles.input, themeStyles.input]}
                                    placeholder={t('transactions.modal.descriptionOptional')}
                                    placeholderTextColor={isDark ? '#64748b' : '#aaa'}
                                    value={desc}
                                    onChangeText={setDesc}
                                />

                                <View style={[styles.reviewCard, themeStyles.cardBg]}>
                                    <View style={styles.reviewHeader}>
                                        <View
                                            style={[
                                                styles.reviewTypeBadge,
                                                { backgroundColor: status === 'deposit' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.reviewTypeBadgeText,
                                                    { color: status === 'deposit' ? '#10b981' : '#ef4444' }
                                                ]}
                                            >
                                                {status === 'deposit' ? 'Income' : 'Expense'}
                                            </Text>
                                        </View>
                                        <Text
                                            style={[
                                                styles.reviewAmount,
                                                { color: status === 'deposit' ? '#10b981' : '#ef4444' }
                                            ]}
                                        >
                                            {status === 'deposit' ? '+' : '-'} {numericAmount.toFixed(2)} {currency}
                                        </Text>
                                    </View>

                                    <View style={styles.reviewGrid}>
                                        <View style={styles.reviewItem}>
                                            <Text style={styles.reviewItemLabel}>ACCOUNT</Text>
                                            <Text style={[styles.reviewItemVal, themeStyles.text]}>{placeName}</Text>
                                        </View>
                                        <View style={styles.reviewItem}>
                                            <Text style={styles.reviewItemLabel}>CATEGORY</Text>
                                            <Text style={[styles.reviewItemVal, themeStyles.text]}>{category || 'General'}</Text>
                                        </View>
                                        <View style={styles.reviewItem}>
                                            <Text style={styles.reviewItemLabel}>DATE</Text>
                                            <Text style={[styles.reviewItemVal, themeStyles.text]}>{date.toISOString().split('T')[0]}</Text>
                                        </View>
                                        <View style={styles.reviewItem}>
                                            <Text style={styles.reviewItemLabel}>NOTE</Text>
                                            <Text style={[styles.reviewItemVal, themeStyles.text]} numberOfLines={1}>{desc || 'None'}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>

                {/* Bottom Bar */}
                <View style={styles.bottomBar}>
                    {step > 1 ? (
                        <TouchableOpacity
                            style={[styles.backButton, themeStyles.cardBg]}
                            onPress={handleBack}
                            disabled={loading}
                        >
                            <Ionicons name="arrow-back" size={18} color={isDark ? '#f8fafc' : '#333'} />
                            <Text style={[styles.backButtonText, themeStyles.text]}>
                                {t('common.actions.back') || 'Back'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.backButton, themeStyles.cardBg]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={[styles.backButtonText, themeStyles.text]}>
                                {t('common.actions.cancel') || 'Cancel'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {step < 3 ? (
                        <TouchableOpacity
                            style={styles.nextButton}
                            onPress={handleNext}
                        >
                            <Text style={styles.nextButtonText}>{t('common.actions.next') || 'Next'}</Text>
                            <Ionicons name="arrow-forward" size={18} color="white" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                { backgroundColor: status === 'deposit' ? '#10b981' : '#ef4444' }
                            ]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {editMode ? t('transactions.modal.save') : t('transactions.modal.add')}
                                </Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {editMode && (
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDelete}
                        disabled={loading}
                    >
                        <Text style={styles.deleteButtonText}>{t('transactions.modal.deleteTitle')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

const AddTransactionModal: React.FC<AddTransactionModalProps> = (props) => {
    return (
        <Modal
            visible={props.visible}
            animationType="slide"
            transparent={true}
            onRequestClose={props.onClose}
        >
            {props.visible && (
                <TransactionFormContent
                    key={`${props.editMode ? 'edit' : 'add'}-${props.initialValues?.id || 'new'}`}
                    {...props}
                />
            )}
        </Modal>
    );
};

const styles = StyleSheet.create({
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
        minHeight: 460,
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
        marginBottom: 16,
    },
    stepBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(237, 113, 67, 0.12)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginBottom: 4,
    },
    stepBadgeText: {
        color: '#ed7143',
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
        marginBottom: 18,
    },
    progressPill: {
        flex: 1,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressPillActive: {
        backgroundColor: '#ed7143',
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
        gap: 4,
    },
    typeGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    typeCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1.5,
    },
    typeCardIncomeActive: {
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
    },
    typeCardExpenseActive: {
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
    },
    typeCardInactiveLight: {
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
    },
    typeCardInactiveDark: {
        borderColor: '#334155',
        backgroundColor: '#1e293b',
    },
    typeCardText: {
        fontSize: 15,
        fontWeight: '600',
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    amountInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 16,
        height: 60,
    },
    amountInput: {
        flex: 1,
        fontSize: 26,
        fontWeight: 'bold',
        paddingVertical: 0,
    },
    currencySuffix: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    inputError: {
        borderColor: '#ef4444',
        borderWidth: 1.5,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 11,
        marginTop: 4,
        fontWeight: '600',
    },
    quickChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
        marginBottom: 8,
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
    summaryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 6,
    },
    summaryPillText: {
        fontSize: 12,
    },
    balanceCard: {
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        marginVertical: 10,
    },
    balanceCardSuccess: {
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    balanceCardError: {
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    balanceCardIncome: {
        backgroundColor: 'rgba(14, 165, 233, 0.08)',
        borderColor: 'rgba(14, 165, 233, 0.4)',
    },
    balanceCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    balanceCardTitle: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    balanceCardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 2,
    },
    balanceCardLabel: {
        fontSize: 12,
        color: '#64748b',
    },
    balanceCardValue: {
        fontSize: 12,
        color: '#0f172a',
    },
    balanceDivider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.06)',
        marginVertical: 6,
    },
    shortfallTipBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        padding: 8,
        borderRadius: 8,
        marginTop: 6,
    },
    shortfallTipText: {
        fontSize: 11,
        color: '#ef4444',
        lineHeight: 15,
    },
    input: {
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        borderWidth: 1,
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
    },
    dateText: {
        fontSize: 15,
    },
    reviewCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        marginTop: 8,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    reviewTypeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    reviewTypeBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    reviewAmount: {
        fontSize: 20,
        fontWeight: '900',
    },
    reviewGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
        paddingTop: 10,
    },
    reviewItem: {
        width: '48%',
    },
    reviewItemLabel: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '700',
    },
    reviewItemVal: {
        fontSize: 13,
        fontWeight: '600',
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
        backgroundColor: '#ed7143',
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
    deleteButton: {
        marginTop: 10,
        paddingVertical: 10,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default AddTransactionModal;
