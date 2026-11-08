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
    Switch,
    Animated
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
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

interface AddScheduledTransactionModalProps {
    onClose: () => void;
    onSuccess: () => void;
    initialType?: 'deposit' | 'withdraw';
    initialValues?: any;
    editMode?: boolean;
    visible: boolean;
}

const ScheduledFormContent: React.FC<AddScheduledTransactionModalProps> = ({
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
        initialValues.scheduled_trans_status || initialType
    );
    const [amount, setAmount] = useState(
        initialValues.amount ? String(initialValues.amount) : ''
    );
    const [desc, setDesc] = useState(
        initialValues.scheduled_trans_details || initialValues.desc || ''
    );
    const [category, setCategory] = useState(initialValues.category || '');
    const [place, setPlace] = useState(initialValues.place || '');
    const [currency, setCurrency] = useState(initialValues.currency || '');
    const [dayOfMonth, setDayOfMonth] = useState(
        initialValues.day_of_month ? String(initialValues.day_of_month) : '1'
    );
    const [isActive, setIsActive] = useState(
        initialValues.status !== undefined ? initialValues.status : true
    );
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [fadeAnim] = useState(() => new Animated.Value(1));
    const [slideAnim] = useState(() => new Animated.Value(0));

    const placeName = place && place.trim() ? place.trim() : 'General';
    const availableInPlace = getBalanceForPlace(networthDetails, currency, placeName);
    const totalInAllPlaces = getTotalBalanceForCurrency(networthDetails, currency);
    const numericAmount = parseFloat(amount) || 0;
    const isExpense = status === 'withdraw';
    const isBelowBalance = isExpense && !!currency && numericAmount > 0 && availableInPlace < numericAmount;

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
            errors.amount = t('scheduled.modal.amount') + ' is required.';
        } else if (isNaN(numericAmount) || numericAmount <= 0) {
            errors.amount = t('scheduled.modal.amountPositive') || 'Amount must be greater than 0.';
        } else if (String(amount).includes('.') && String(amount).split('.')[1].length > 2) {
            errors.amount = t('scheduled.modal.amountDecimals') || 'Max 2 decimal places allowed.';
        }

        if (!currency || currency.trim() === '') {
            errors.currency = t('scheduled.modal.currencyRequired') || 'Currency is required.';
        }

        const day = parseInt(dayOfMonth, 10);
        if (isNaN(day) || day < 1 || day > 31) {
            errors.dayOfMonth = t('scheduled.modal.dayRangeError') || 'Day of month must be between 1 and 31.';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep2 = (): boolean => {
        return true;
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
                scheduled_trans_status: status,
                category,
                place,
                scheduled_trans_details: desc,
                day_of_month: parseInt(dayOfMonth, 10),
                status: isActive
            };

            if (editMode && initialValues.id) {
                await api.post(
                    `/api/finance-management/scheduled-trans/update-scheduled-trans/${initialValues.id}/`,
                    payload
                );
                Alert.alert(t('common.status.success'), t('scheduled.modal.updateSuccess'));
            } else {
                await api.post('/api/finance-management/scheduled-trans/add-scheduled-trans/', payload);
                Alert.alert(t('common.status.success'), t('scheduled.modal.addSuccess'));
            }
            updateNetworthWidget();
            onSuccess();
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || (editMode ? t('scheduled.modal.updateFailed') : t('scheduled.modal.addFailed'));
            Alert.alert(t('common.status.error'), errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            t('scheduled.modal.deleteTitle'),
            t('scheduled.modal.deleteConfirm'),
            [
                { text: t('common.actions.cancel'), style: 'cancel' },
                {
                    text: t('common.actions.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            if (initialValues.id) {
                                await api.delete(`/api/finance-management/scheduled-trans/delete-scheduled-trans/${initialValues.id}/`);
                                Alert.alert(t('common.status.success'), t('scheduled.modal.deleteSuccess'));
                                updateNetworthWidget();
                                onSuccess();
                            }
                        } catch (err: any) {
                            Alert.alert(t('common.status.error'), err.response?.data?.error || t('scheduled.modal.deleteFailed'));
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

                <View style={styles.header}>
                    <View>
                        <View style={styles.stepBadge}>
                            <Text style={styles.stepBadgeText}>
                                {t('scheduled.modal.step', { current: step, total: 3 }) || `Step ${step} of 3`}
                            </Text>
                        </View>
                        <Text style={[styles.title, themeStyles.text]}>
                            {editMode ? t('scheduled.modal.editTitle') : t('scheduled.modal.addTitle')}
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

                {/* Progress Pills */}
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
                                {s === 1 ? '1. Schedule' : s === 2 ? '2. Account' : '3. Review'}
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
                        {/* Step 1: Type, Currency, Amount, Day of Month */}
                        {step === 1 && (
                            <View style={styles.stepContent}>
                                <View style={styles.typeGrid}>
                                    <TouchableOpacity
                                        style={[
                                            styles.typeCard,
                                            status === 'deposit'
                                                ? styles.typeCardIncomeActive
                                                : (isDark ? styles.typeCardInactiveDark : styles.typeCardInactiveLight),
                                        ]}
                                        onPress={() => setStatus('deposit')}
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
                                            {t('scheduled.modal.income')}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.typeCard,
                                            status === 'withdraw'
                                                ? styles.typeCardExpenseActive
                                                : (isDark ? styles.typeCardInactiveDark : styles.typeCardInactiveLight),
                                        ]}
                                        onPress={() => setStatus('withdraw')}
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
                                            {t('scheduled.modal.expense')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={[styles.label, themeStyles.subText]}>
                                    {t('scheduled.modal.currency')} *
                                </Text>
                                <CurrencySelect
                                    value={currency}
                                    onChange={(val) => {
                                        setCurrency(val);
                                        setFieldErrors(prev => ({ ...prev, currency: '' }));
                                    }}
                                    required
                                />
                                {!!fieldErrors.currency && (
                                    <Text style={styles.errorText}>⚠️ {fieldErrors.currency}</Text>
                                )}

                                <Text style={[styles.label, themeStyles.subText, { marginTop: 16 }]}>
                                    {t('scheduled.modal.amount')} *
                                </Text>
                                <View style={[styles.amountInputWrapper, themeStyles.input, !!fieldErrors.amount && styles.inputError]}>
                                    <TextInput
                                        style={[styles.amountInput, themeStyles.text]}
                                        placeholder={t('scheduled.modal.amountPlaceholder')}
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

                                {/* Quick chips */}
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

                                {/* Day of Month */}
                                <Text style={[styles.label, themeStyles.subText, { marginTop: 12 }]}>
                                    {t('scheduled.modal.dayOfMonth')} (1-31) *
                                </Text>
                                <TextInput
                                    style={[styles.input, themeStyles.input, !!fieldErrors.dayOfMonth && styles.inputError]}
                                    placeholder="1 - 31"
                                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                    keyboardType="number-pad"
                                    value={dayOfMonth}
                                    onChangeText={(text) => {
                                        setDayOfMonth(text);
                                        setFieldErrors(prev => ({ ...prev, dayOfMonth: '' }));
                                    }}
                                    maxLength={2}
                                />
                                {!!fieldErrors.dayOfMonth && (
                                    <Text style={styles.errorText}>⚠️ {fieldErrors.dayOfMonth}</Text>
                                )}
                                {parseInt(dayOfMonth, 10) >= 29 && (
                                    <View style={styles.monthNoticeBox}>
                                        <Text style={styles.monthNoticeText}>
                                            💡 {t('scheduled.modal.monthEndNotice') || 'For shorter months (e.g. February), transaction runs on the month\'s final day.'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Step 2: Account, Category, Description & Switch */}
                        {step === 2 && (
                            <View style={styles.stepContent}>
                                <Text style={[styles.label, themeStyles.subText]}>
                                    {t('scheduled.modal.place')}
                                </Text>
                                <PlaceSelect
                                    value={place}
                                    onChange={setPlace}
                                    currency={currency}
                                />

                                {/* Balance Advisory Card */}
                                {!!currency && (
                                    <View
                                        style={[
                                            styles.balanceCard,
                                            isExpense
                                                ? (isBelowBalance ? styles.balanceCardWarning : styles.balanceCardSuccess)
                                                : styles.balanceCardIncome
                                        ]}
                                    >
                                        <View style={styles.balanceCardHeader}>
                                            <Ionicons
                                                name={isExpense ? (isBelowBalance ? 'alert-circle' : 'checkmark-circle') : 'calendar'}
                                                size={22}
                                                color={isExpense ? (isBelowBalance ? '#f59e0b' : '#10b981') : '#3b82f6'}
                                            />
                                            <Text
                                                style={[
                                                    styles.balanceCardTitle,
                                                    { color: isExpense ? (isBelowBalance ? '#d97706' : '#10b981') : '#3b82f6' }
                                                ]}
                                            >
                                                {isExpense
                                                    ? (isBelowBalance ? '⚠️ Balance Alert for Recurring Payment' : '✓ Account Ready')
                                                    : '📅 Monthly Recurring Income'}
                                            </Text>
                                        </View>

                                        <View style={styles.balanceCardRow}>
                                            <Text style={styles.balanceCardLabel}>Current in {placeName}:</Text>
                                            <Text style={styles.balanceCardValue}>{availableInPlace.toFixed(2)} {currency}</Text>
                                        </View>
                                        <View style={styles.balanceCardRow}>
                                            <Text style={styles.balanceCardLabel}>Total across all accounts:</Text>
                                            <Text style={styles.balanceCardValue}>{totalInAllPlaces.toFixed(2)} {currency}</Text>
                                        </View>
                                        <View style={styles.balanceCardRow}>
                                            <Text style={styles.balanceCardLabel}>Monthly Execution:</Text>
                                            <Text style={styles.balanceCardValue}>{numericAmount.toFixed(2)} {currency}</Text>
                                        </View>

                                        {isExpense && isBelowBalance && (
                                            <Text style={[styles.shortfallTipText, { color: '#d97706', marginTop: 6 }]}>
                                                Current balance is below the recurring amount. Make sure {placeName} has funds before day {dayOfMonth}.
                                            </Text>
                                        )}
                                    </View>
                                )}

                                <Text style={[styles.label, themeStyles.subText, { marginTop: 16 }]}>
                                    {t('scheduled.modal.category')}
                                </Text>
                                <CategorySelect
                                    value={category}
                                    onChange={setCategory}
                                    status={status}
                                />

                                <Text style={[styles.label, themeStyles.subText, { marginTop: 16 }]}>
                                    {t('scheduled.modal.description')}
                                </Text>
                                <TextInput
                                    style={[styles.input, themeStyles.input]}
                                    placeholder={t('scheduled.modal.descriptionOptional')}
                                    placeholderTextColor={isDark ? '#64748b' : '#aaa'}
                                    value={desc}
                                    onChangeText={setDesc}
                                />

                                {/* Active Status Switch */}
                                <View style={[styles.switchCard, themeStyles.cardBg]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.switchTitle, themeStyles.text]}>
                                            {t('scheduled.modal.active')}
                                        </Text>
                                        <Text style={[styles.switchSub, themeStyles.subText]}>
                                            {isActive ? 'Executes monthly on scheduled day' : 'Paused (inactive)'}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={isActive}
                                        onValueChange={setIsActive}
                                        trackColor={{ false: '#767577', true: '#3b82f6' }}
                                        thumbColor="#f4f3f4"
                                    />
                                </View>
                            </View>
                        )}

                        {/* Step 3: Review */}
                        {step === 3 && (
                            <View style={styles.stepContent}>
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
                                                {status === 'deposit' ? 'Recurring Income' : 'Recurring Expense'}
                                            </Text>
                                        </View>
                                        <Text
                                            style={[
                                                styles.reviewAmount,
                                                { color: status === 'deposit' ? '#10b981' : '#ef4444' }
                                            ]}
                                        >
                                            {numericAmount.toFixed(2)} {currency} / mo
                                        </Text>
                                    </View>

                                    <View style={styles.reviewGrid}>
                                        <View style={styles.reviewItem}>
                                            <Text style={styles.reviewItemLabel}>DAY OF MONTH</Text>
                                            <Text style={[styles.reviewItemVal, themeStyles.text]}>Day {dayOfMonth}</Text>
                                        </View>
                                        <View style={styles.reviewItem}>
                                            <Text style={styles.reviewItemLabel}>ACCOUNT</Text>
                                            <Text style={[styles.reviewItemVal, themeStyles.text]}>{placeName}</Text>
                                        </View>
                                        <View style={styles.reviewItem}>
                                            <Text style={styles.reviewItemLabel}>CATEGORY</Text>
                                            <Text style={[styles.reviewItemVal, themeStyles.text]}>{category || 'General'}</Text>
                                        </View>
                                        <View style={styles.reviewItem}>
                                            <Text style={styles.reviewItemLabel}>STATUS</Text>
                                            <Text style={[styles.reviewItemVal, { color: isActive ? '#10b981' : '#94a3b8' }]}>
                                                {isActive ? 'Active' : 'Paused'}
                                            </Text>
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
                            style={[styles.nextButton, { backgroundColor: '#3b82f6' }]}
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
                                    {editMode ? t('scheduled.modal.save') : t('scheduled.modal.add')}
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
                        <Text style={styles.deleteButtonText}>{t('scheduled.modal.deleteTitle')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

const AddScheduledTransactionModal: React.FC<AddScheduledTransactionModalProps> = (props) => {
    return (
        <Modal
            visible={props.visible}
            animationType="slide"
            transparent={true}
            onRequestClose={props.onClose}
        >
            {props.visible && (
                <ScheduledFormContent
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
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginBottom: 4,
    },
    stepBadgeText: {
        color: '#3b82f6',
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
        backgroundColor: '#3b82f6',
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
        marginTop: 4,
        fontWeight: '600',
    },
    quickChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
        marginBottom: 4,
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
    monthNoticeBox: {
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        padding: 8,
        borderRadius: 10,
        marginTop: 6,
    },
    monthNoticeText: {
        fontSize: 11,
        color: '#d97706',
        lineHeight: 15,
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
    balanceCardWarning: {
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderColor: 'rgba(245, 158, 11, 0.4)',
    },
    balanceCardIncome: {
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderColor: 'rgba(59, 130, 246, 0.4)',
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
    shortfallTipText: {
        fontSize: 11,
        lineHeight: 15,
    },
    switchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginTop: 14,
    },
    switchTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    switchSub: {
        fontSize: 11,
        marginTop: 2,
    },
    reviewCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        marginTop: 10,
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
        fontSize: 18,
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
        marginTop: 12,
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

export default AddScheduledTransactionModal;
