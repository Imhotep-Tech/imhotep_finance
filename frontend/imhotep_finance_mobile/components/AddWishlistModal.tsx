import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/contexts/LanguageContext';
import api from '@/constants/api';
import CurrencySelect from './CurrencySelect';
import PlaceSelect from './PlaceSelect';
import {
    useNetworthBalances,
    getTotalBalanceForCurrency
} from '../hooks/useNetworthBalances';

interface AddWishlistModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editMode?: boolean;
    initialValues?: any;
    currentYear?: number;
}

const WishlistFormContent: React.FC<AddWishlistModalProps> = ({
    onClose,
    onSuccess,
    editMode = false,
    initialValues = {},
    currentYear = new Date().getFullYear()
}) => {
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { details: networthDetails } = useNetworthBalances();

    const [step, setStep] = useState(1);
    const [price, setPrice] = useState(
        initialValues?.price ? String(initialValues.price) : ''
    );
    const [currency, setCurrency] = useState(initialValues?.currency || '');
    const [year, setYear] = useState(
        initialValues?.year ? String(initialValues.year) : String(currentYear)
    );
    const [place, setPlace] = useState(initialValues?.place || '');
    const [details, setDetails] = useState(initialValues?.wish_details || '');
    const [link, setLink] = useState(initialValues?.link || '');
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [fadeAnim] = useState(() => new Animated.Value(1));
    const [slideAnim] = useState(() => new Animated.Value(0));

    useEffect(() => {
        if (!currency && !editMode) {
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
    }, [currency, editMode]);

    const numericPrice = parseFloat(price) || 0;
    const totalSaved = getTotalBalanceForCurrency(networthDetails, currency);
    const isAffordable = !!currency && numericPrice > 0 && totalSaved >= numericPrice;
    const deficit = Math.max(0, numericPrice - totalSaved);
    const progressPercent = numericPrice > 0 ? Math.min(100, Math.round((totalSaved / numericPrice) * 100)) : 0;

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
        if (!price || String(price).trim() === '') {
            errors.price = t('wishlist.modal.price') + ' is required.';
        } else if (isNaN(numericPrice) || numericPrice <= 0) {
            errors.price = t('wishlist.modal.pricePositive') || 'Price must be greater than 0.';
        } else if (String(price).includes('.') && String(price).split('.')[1].length > 2) {
            errors.price = t('wishlist.modal.priceDecimals') || 'Max 2 decimal places allowed.';
        }

        if (!currency || currency.trim() === '') {
            errors.currency = t('wishlist.modal.currencyRequired') || 'Currency is required.';
        }

        const y = parseInt(year, 10);
        if (isNaN(y) || y < 2000 || y > 2100) {
            errors.year = t('wishlist.modal.validYear') || 'Valid year between 2000 and 2100 is required.';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const errors: Record<string, string> = {};
        if (!details || String(details).trim() === '') {
            errors.details = t('wishlist.modal.details') + ' is required.';
        }
        if (link && link.trim() !== '') {
            const urlPattern = /^(https?:\/\/)/i;
            if (!urlPattern.test(link.trim())) {
                errors.link = t('wishlist.modal.invalidUrl') || 'Link must start with http:// or https://';
            }
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (step === 1) {
            if (!validateStep1()) return;
            animateTransition('next', () => setStep(2));
        }
    };

    const handleBack = () => {
        setFieldErrors({});
        if (step > 1) {
            animateTransition('back', () => setStep(step - 1));
        }
    };

    const handleQuickAdd = (addVal: number) => {
        const current = parseFloat(price) || 0;
        const nextVal = (current + addVal).toFixed(2);
        setPrice(String(parseFloat(nextVal)));
        setFieldErrors(prev => ({ ...prev, price: '' }));
    };

    const handleSubmit = async () => {
        if (!validateStep1() || !validateStep2()) {
            return;
        }

        setLoading(true);
        try {
            const payload = {
                price: numericPrice,
                currency,
                year: parseInt(year, 10),
                wish_details: details,
                place: place || '',
                link: link || ''
            };

            if (editMode && initialValues?.id) {
                await api.post(`/api/finance-management/wishlist/update-wish/${initialValues.id}/`, payload);
                Alert.alert(t('common.status.success'), t('wishlist.modal.updateSuccess'));
            } else {
                await api.post('/api/finance-management/wishlist/add-wish/', payload);
                Alert.alert(t('common.status.success'), t('wishlist.modal.addSuccess'));
            }
            onSuccess();
        } catch (err: any) {
            Alert.alert(t('common.status.error'), err.response?.data?.error || t('wishlist.modal.saveFailed'));
        } finally {
            setLoading(false);
        }
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
                                {t('wishlist.modal.step', { current: step, total: 2 }) || `Step ${step} of 2`}
                            </Text>
                        </View>
                        <Text style={[styles.title, themeStyles.text]}>
                            {editMode ? t('wishlist.modal.editTitle') : t('wishlist.modal.addNewWish')}
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

                {/* Step Indicator */}
                <View style={styles.progressContainer}>
                    {[1, 2].map((s) => (
                        <TouchableOpacity
                            key={s}
                            activeOpacity={0.7}
                            onPress={() => {
                                if (s < step) {
                                    animateTransition('back', () => setStep(s));
                                } else if (s === 2 && validateStep1()) {
                                    animateTransition('next', () => setStep(2));
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
                                {s === 1 ? '1. Target Cost' : '2. Details & Review'}
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
                        {/* Step 1: Target Cost, Currency & Year */}
                        {step === 1 && (
                            <View style={styles.stepContent}>
                                <Text style={[styles.label, themeStyles.subText]}>
                                    {t('wishlist.modal.currency')} *
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
                                    {t('wishlist.modal.price')} *
                                </Text>
                                <View style={[styles.amountInputWrapper, themeStyles.input, !!fieldErrors.price && styles.inputError]}>
                                    <TextInput
                                        style={[styles.amountInput, themeStyles.text]}
                                        placeholder="0.00"
                                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                        keyboardType="decimal-pad"
                                        value={price}
                                        onChangeText={(text) => {
                                            setPrice(text);
                                            setFieldErrors(prev => ({ ...prev, price: '' }));
                                        }}
                                        autoFocus={!editMode}
                                    />
                                    <Text style={[styles.currencySuffix, themeStyles.subText]}>
                                        {currency || 'CUR'}
                                    </Text>
                                </View>
                                {!!fieldErrors.price && (
                                    <Text style={styles.errorText}>⚠️ {fieldErrors.price}</Text>
                                )}

                                {/* Quick chips */}
                                <View style={styles.quickChipsRow}>
                                    {[50, 100, 500, 1000, 2500].map((val) => (
                                        <TouchableOpacity
                                            key={val}
                                            style={[styles.quickChip, isDark ? styles.quickChipDark : styles.quickChipLight]}
                                            onPress={() => handleQuickAdd(val)}
                                        >
                                            <Text style={[styles.quickChipText, themeStyles.text]}>+{val}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Year */}
                                <Text style={[styles.label, themeStyles.subText, { marginTop: 12 }]}>
                                    {t('wishlist.modal.year')} *
                                </Text>
                                <TextInput
                                    style={[styles.input, themeStyles.input, !!fieldErrors.year && styles.inputError]}
                                    placeholder="YYYY"
                                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                    keyboardType="number-pad"
                                    value={year}
                                    onChangeText={(text) => {
                                        setYear(text);
                                        setFieldErrors(prev => ({ ...prev, year: '' }));
                                    }}
                                    maxLength={4}
                                />
                                {!!fieldErrors.year && (
                                    <Text style={styles.errorText}>⚠️ {fieldErrors.year}</Text>
                                )}

                                {/* Savings Progress Meter */}
                                {!!currency && (
                                    <View
                                        style={[
                                            styles.balanceCard,
                                            isAffordable ? styles.balanceCardSuccess : styles.balanceCardWarning
                                        ]}
                                    >
                                        <View style={styles.balanceCardHeader}>
                                            <Ionicons
                                                name={isAffordable ? 'checkmark-circle' : 'flag'}
                                                size={22}
                                                color={isAffordable ? '#10b981' : '#f59e0b'}
                                            />
                                            <Text
                                                style={[
                                                    styles.balanceCardTitle,
                                                    { color: isAffordable ? '#10b981' : '#f59e0b' }
                                                ]}
                                            >
                                                {isAffordable ? 'Goal Reachable!' : 'Savings Progress'}
                                            </Text>
                                        </View>

                                        <View style={styles.balanceCardRow}>
                                            <Text style={styles.balanceCardLabel}>Available Savings:</Text>
                                            <Text style={styles.balanceCardValue}>{totalSaved.toFixed(2)} {currency}</Text>
                                        </View>
                                        <View style={styles.balanceCardRow}>
                                            <Text style={styles.balanceCardLabel}>Target Goal:</Text>
                                            <Text style={styles.balanceCardValue}>{numericPrice.toFixed(2)} {currency}</Text>
                                        </View>

                                        {/* Progress line */}
                                        <View style={styles.progressBarBg}>
                                            <View
                                                style={[
                                                    styles.progressBarFill,
                                                    {
                                                        width: `${progressPercent}%`,
                                                        backgroundColor: isAffordable ? '#10b981' : '#f59e0b'
                                                    }
                                                ]}
                                            />
                                        </View>

                                        <Text
                                            style={[
                                                styles.progressHintText,
                                                { color: isAffordable ? '#10b981' : '#d97706' }
                                            ]}
                                        >
                                            {isAffordable
                                                ? '✓ You have enough saved to afford this item!'
                                                : `${progressPercent}% funded • Need ${deficit.toFixed(2)} ${currency} more.`}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Step 2: Details, Link & Place */}
                        {step === 2 && (
                            <View style={styles.stepContent}>
                                <Text style={[styles.label, themeStyles.subText]}>
                                    {t('wishlist.modal.detailsDescription')} *
                                </Text>
                                <TextInput
                                    style={[styles.input, themeStyles.input, !!fieldErrors.details && styles.inputError]}
                                    placeholder={t('wishlist.modal.detailsMobilePlaceholder')}
                                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                    value={details}
                                    onChangeText={(text) => {
                                        setDetails(text);
                                        setFieldErrors(prev => ({ ...prev, details: '' }));
                                    }}
                                    autoFocus
                                />
                                {!!fieldErrors.details && (
                                    <Text style={styles.errorText}>⚠️ {fieldErrors.details}</Text>
                                )}

                                <Text style={[styles.label, themeStyles.subText, { marginTop: 16 }]}>
                                    {t('wishlist.modal.linkOptional')}
                                </Text>
                                <TextInput
                                    style={[styles.input, themeStyles.input, !!fieldErrors.link && styles.inputError]}
                                    placeholder={t('wishlist.modal.linkUrlPlaceholder')}
                                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                    value={link}
                                    onChangeText={(text) => {
                                        setLink(text);
                                        setFieldErrors(prev => ({ ...prev, link: '' }));
                                    }}
                                    autoCapitalize="none"
                                    keyboardType="url"
                                />
                                {!!fieldErrors.link && (
                                    <Text style={styles.errorText}>⚠️ {fieldErrors.link}</Text>
                                )}

                                <Text style={[styles.label, themeStyles.subText, { marginTop: 16 }]}>
                                    {t('wishlist.modal.place')}
                                </Text>
                                <PlaceSelect
                                    value={place}
                                    onChange={setPlace}
                                    currency={currency}
                                />

                                {/* Review Card */}
                                <View style={[styles.reviewCard, themeStyles.cardBg]}>
                                    <View style={styles.reviewHeader}>
                                        <Text style={[styles.reviewWishTitle, themeStyles.text]}>
                                            {details || 'Wish Item'}
                                        </Text>
                                        <Text style={styles.reviewAmount}>
                                            {numericPrice.toFixed(2)} {currency}
                                        </Text>
                                    </View>
                                    <View style={styles.reviewGrid}>
                                        <View style={styles.reviewItem}>
                                            <Text style={styles.reviewItemLabel}>TARGET YEAR</Text>
                                            <Text style={[styles.reviewItemVal, themeStyles.text]}>{year}</Text>
                                        </View>
                                        <View style={styles.reviewItem}>
                                            <Text style={styles.reviewItemLabel}>ACCOUNT</Text>
                                            <Text style={[styles.reviewItemVal, themeStyles.text]}>{place || 'General'}</Text>
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

                    {step < 2 ? (
                        <TouchableOpacity
                            style={styles.nextButton}
                            onPress={handleNext}
                        >
                            <Text style={styles.nextButtonText}>{t('common.actions.next') || 'Next'}</Text>
                            <Ionicons name="arrow-forward" size={18} color="white" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {editMode ? t('wishlist.modal.updateWish') : t('wishlist.modal.addWish')}
                                </Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const AddWishlistModal: React.FC<AddWishlistModalProps> = (props) => {
    return (
        <Modal
            visible={props.visible}
            animationType="slide"
            transparent={true}
            onRequestClose={props.onClose}
        >
            {props.visible && (
                <WishlistFormContent
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
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginBottom: 4,
    },
    stepBadgeText: {
        color: '#f59e0b',
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
        backgroundColor: '#f59e0b',
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
    balanceCard: {
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        marginVertical: 12,
    },
    balanceCardSuccess: {
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    balanceCardWarning: {
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderColor: 'rgba(245, 158, 11, 0.4)',
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
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.08)',
        borderRadius: 3,
        overflow: 'hidden',
        marginVertical: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressHintText: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    reviewCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        marginTop: 14,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    reviewWishTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    reviewAmount: {
        fontSize: 18,
        fontWeight: '900',
        color: '#f59e0b',
    },
    reviewGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
        backgroundColor: '#f59e0b',
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
        backgroundColor: '#f59e0b',
        paddingVertical: 14,
        borderRadius: 14,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AddWishlistModal;
