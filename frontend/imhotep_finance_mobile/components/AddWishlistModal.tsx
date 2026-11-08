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
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/contexts/LanguageContext';
import api from '@/constants/api';
import CurrencySelect from './CurrencySelect';
import PlaceSelect from './PlaceSelect';

interface AddWishlistModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editMode?: boolean;
    initialValues?: any;
    currentYear?: number;
}

const AddWishlistModal: React.FC<AddWishlistModalProps> = ({
    visible,
    onClose,
    onSuccess,
    editMode = false,
    initialValues = {},
    currentYear = new Date().getFullYear()
}) => {
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState(initialValues.currency || '');
    const [year, setYear] = useState(currentYear.toString());
    const [place, setPlace] = useState(initialValues.place || '');
    const [details, setDetails] = useState('');
    const [link, setLink] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            if (editMode && initialValues) {
                setPrice(initialValues.price ? initialValues.price.toString() : '');
                setCurrency(initialValues.currency || '');
                setYear(initialValues.year ? initialValues.year.toString() : currentYear.toString());
                setDetails(initialValues.wish_details || '');
                setPlace(initialValues.place || '');
                setLink(initialValues.link || '');
            } else {
                // Reset for add mode
                setPrice('');
                setCurrency('');
                setYear(currentYear.toString());
                setDetails('');
                setPlace('');
                setLink('');

                // Call the API to fetch user's default favorite currency like on web and transactions
                api.get('/api/get-fav-currency/')
                    .then(res => {
                        if (res.data?.favorite_currency) {
                            setCurrency(res.data.favorite_currency);
                        }
                    })
                    .catch(err => {
                        console.warn('Failed to fetch favorite currency for new wish:', err);
                    });
            }
        }
    }, [visible, editMode, initialValues]);

    const handleSubmit = async () => {
        if (!price || !currency || !year) {
            Alert.alert(t('common.status.error'), t('wishlist.modal.requiredFieldsMobile'));
            return;
        }

        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            Alert.alert(t('common.status.error'), t('wishlist.modal.pricePositive'));
            return;
        }

        const yearNum = parseInt(year);
        if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
            Alert.alert(t('common.status.error'), t('wishlist.modal.validYear'));
            return;
        }

        setLoading(true);

        try {
            const payload = {
                price: priceNum,
                currency,
                year: yearNum,
                wish_details: details,
                place,
                link: link
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
            console.error('Wish save error:', err);
            Alert.alert(t('common.status.error'), err.response?.data?.error || t('wishlist.modal.saveFailed'));
        } finally {
            setLoading(false);
        }
    };

    const themeStyles = {
        modalContent: {
            backgroundColor: isDark ? '#1e293b' : 'white',
        },
        title: {
            color: isDark ? '#f1f5f9' : '#1e293b',
        },
        label: {
            color: isDark ? '#cbd5e1' : '#475569',
        },
        input: {
            backgroundColor: isDark ? '#334155' : '#f8fafc',
            color: isDark ? '#f1f5f9' : '#0f172a',
            borderColor: isDark ? '#475569' : '#e2e8f0',
        },
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior="padding"
                style={styles.modalOverlay}
            >
                <View style={[styles.modalContent, themeStyles.modalContent]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, themeStyles.title]}>
                            {editMode ? t('wishlist.modal.editTitle') : t('wishlist.modal.addNewWish')}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={isDark ? '#cbd5e1' : '#64748b'} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.form}>
                        {/* Details */}
                        <Text style={[styles.label, themeStyles.label]}>{t('wishlist.modal.detailsDescription')}</Text>
                        <TextInput
                            style={[styles.input, themeStyles.input]}
                            placeholder={t('wishlist.modal.detailsMobilePlaceholder')}
                            placeholderTextColor={isDark ? '#94a3b8' : '#cbd5e1'}
                            value={details}
                            onChangeText={setDetails}
                        />

                        {/* Price and Currency Row */}
                        <View style={styles.row}>
                            <View style={{ flex: 1.5, marginRight: 10 }}>
                                <Text style={[styles.label, themeStyles.label]}>{t('wishlist.modal.price')}</Text>
                                <TextInput
                                    style={[styles.input, themeStyles.input]}
                                    placeholder="0.00"
                                    placeholderTextColor={isDark ? '#94a3b8' : '#cbd5e1'}
                                    keyboardType="numeric"
                                    value={price}
                                    onChangeText={setPrice}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, themeStyles.label]}>{t('wishlist.modal.currency')}</Text>
                                <CurrencySelect
                                    value={currency}
                                    onChange={setCurrency}
                                />
                            </View>
                        </View>


                        {/* Year */}
                        <Text style={[styles.label, themeStyles.label]}>{t('wishlist.modal.year')}</Text>
                        <TextInput
                            style={[styles.input, themeStyles.input]}
                            placeholder="YYYY"
                            placeholderTextColor={isDark ? '#94a3b8' : '#cbd5e1'}
                            keyboardType="number-pad"
                            value={year}
                            onChangeText={setYear}
                            maxLength={4}
                        />

                        {/* Place */}
                        <Text style={[styles.label, themeStyles.label]}>{t('wishlist.modal.place')}</Text>
                        <PlaceSelect
                            value={place}
                            onChange={setPlace}
                            currency={currency}
                        />

                        {/* Link */}
                        <Text style={[styles.label, themeStyles.label]}>{t('wishlist.modal.linkOptional')}</Text>
                        <TextInput
                            style={[styles.input, themeStyles.input]}
                            placeholder={t('wishlist.modal.linkUrlPlaceholder')}
                            placeholderTextColor={isDark ? '#94a3b8' : '#cbd5e1'}
                            value={link}
                            onChangeText={setLink}
                            autoCapitalize="none"
                            keyboardType="url"
                        />

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <Text style={styles.submitButtonText}>{t('wishlist.modal.saving')}</Text>
                            ) : (
                                <Text style={styles.submitButtonText}>{editMode ? t('wishlist.modal.updateWish') : t('wishlist.modal.addWish')}</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    form: {
        gap: 16,
        paddingBottom: 40,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        height: 50,
    },
    row: {
        flexDirection: 'row',
    },
    submitButton: {
        backgroundColor: '#366c6b',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AddWishlistModal;
