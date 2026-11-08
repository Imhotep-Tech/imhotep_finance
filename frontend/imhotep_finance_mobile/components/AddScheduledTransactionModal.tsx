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
    Switch
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/contexts/LanguageContext';
import api from '../constants/api';
import CurrencySelect from './CurrencySelect';
import CategorySelect from './CategorySelect';
import PlaceSelect from './PlaceSelect';
import { updateNetworthWidget } from '../widgets/widget-updater';

interface AddScheduledTransactionModalProps {
    onClose: () => void;
    onSuccess: () => void;
    initialType?: 'deposit' | 'withdraw';
    initialValues?: any;
    editMode?: boolean;
    visible: boolean;
}

const AddScheduledTransactionModal: React.FC<AddScheduledTransactionModalProps> = ({
    onClose,
    onSuccess,
    initialType = 'deposit',
    initialValues = {},
    editMode = false,
    visible,
}) => {
    const { t } = useTranslation();
    const [status, setStatus] = useState<'deposit' | 'withdraw'>(initialType);
    const [amount, setAmount] = useState(initialValues.amount || '');
    const [desc, setDesc] = useState(initialValues.desc || '');
    const [category, setCategory] = useState(initialValues.category || '');
    const [place, setPlace] = useState(initialValues.place || '');
    const [currency, setCurrency] = useState(initialValues.currency || '');
    const [dayOfMonth, setDayOfMonth] = useState(initialValues.day_of_month ? String(initialValues.day_of_month) : '');
    const [isActive, setIsActive] = useState(initialValues.status !== undefined ? initialValues.status : true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            setStatus(initialValues.scheduled_trans_status || initialType);
            setAmount(initialValues.amount ? String(initialValues.amount) : '');
            setDesc(initialValues.scheduled_trans_details || '');
            setCategory(initialValues.category || '');
            setPlace(initialValues.place || '');
            setCurrency(initialValues.currency || '');
            setDayOfMonth(initialValues.day_of_month ? String(initialValues.day_of_month) : '');
            setIsActive(initialValues.status !== undefined ? initialValues.status : true);
        }
    }, [visible, initialValues, initialType]);

    const handleSubmit = async () => {
        setLoading(true);
        if (!amount || !currency || !dayOfMonth) {
            Alert.alert(t('common.status.error'), t('scheduled.modal.requiredFields'));
            setLoading(false);
            return;
        }

        const day = parseInt(dayOfMonth, 10);
        if (isNaN(day) || day < 1 || day > 31) {
            Alert.alert(t('common.status.error'), t('scheduled.modal.dayRangeError'));
            setLoading(false);
            return;
        }

        try {
            const payload = {
                amount,
                currency,
                scheduled_trans_status: status,
                category,
                place,
                scheduled_trans_details: desc,
                day_of_month: day,
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

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const themeStyles = {
        container: {
            backgroundColor: isDark ? '#1e293b' : 'white',
        },
        text: {
            color: isDark ? '#f1f5f9' : '#333',
        },
        subText: {
            color: isDark ? '#94a3b8' : '#666',
        },
        input: {
            backgroundColor: isDark ? '#334155' : '#f9f9f9',
            color: isDark ? '#f1f5f9' : '#000',
            borderColor: isDark ? '#475569' : '#eee',
        },
        typeButton: {
            backgroundColor: isDark ? '#334155' : '#f5f5f5',
        },
        closeIcon: isDark ? '#fff' : '#333',
        disabledType: {
            opacity: 0.5,
        }
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
                style={styles.container}
            >
                <View style={[styles.modalView, themeStyles.container]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, themeStyles.text]}>{editMode ? t('scheduled.modal.editTitle') : t('scheduled.modal.addTitle')}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={themeStyles.closeIcon} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.form}>
                        {/* Type Selector */}
                        <View style={[styles.typeContainer, themeStyles.typeButton]}>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    status === 'deposit' && (isDark ? { backgroundColor: 'rgba(16, 185, 129, 0.2)' } : styles.typeButtonIncome)
                                ]}
                                onPress={() => setStatus('deposit')}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.typeText, themeStyles.subText, status === 'deposit' && (isDark ? { color: '#10b981' } : styles.typeTextActive)]}>{t('scheduled.modal.income')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    status === 'withdraw' && (isDark ? { backgroundColor: 'rgba(239, 68, 68, 0.2)' } : styles.typeButtonExpense)
                                ]}
                                onPress={() => setStatus('withdraw')}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.typeText, themeStyles.subText, status === 'withdraw' && (isDark ? { color: '#ef4444' } : styles.typeTextActive)]}>{t('scheduled.modal.expense')}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Day of Month */}
                        <Text style={[styles.label, themeStyles.subText]}>{t('scheduled.modal.dayOfMonth')} (1-31)</Text>
                        <TextInput
                            style={[styles.input, themeStyles.input]}
                            placeholder={t('scheduled.modal.dayPlaceholder')}
                            placeholderTextColor={isDark ? '#94a3b8' : '#aaa'}
                            keyboardType="numeric"
                            value={dayOfMonth}
                            onChangeText={setDayOfMonth}
                            maxLength={2}
                        />

                        {/* Amount */}
                        <Text style={[styles.label, themeStyles.subText]}>{t('scheduled.modal.amount')}</Text>
                        <TextInput
                            style={[styles.input, themeStyles.input]}
                            placeholder={t('scheduled.modal.amountPlaceholder')}
                            placeholderTextColor={isDark ? '#94a3b8' : '#aaa'}
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />

                        {/* Currency */}
                        <Text style={[styles.label, themeStyles.subText]}>{t('scheduled.modal.currency')}</Text>
                        <CurrencySelect
                            value={currency}
                            onChange={setCurrency}
                            required
                        />

                        {/* Category */}
                        <Text style={[styles.label, themeStyles.subText]}>{t('scheduled.modal.category')}</Text>
                        <CategorySelect
                            value={category}
                            onChange={setCategory}
                            status={status}
                        />

                        {/* Place */}
                        <Text style={[styles.label, themeStyles.subText]}>{t('scheduled.modal.place')}</Text>
                        <PlaceSelect
                            value={place}
                            onChange={setPlace}
                            currency={currency}
                        />

                        {/* Description */}
                        <Text style={[styles.label, themeStyles.subText]}>{t('scheduled.modal.description')}</Text>
                        <TextInput
                            style={[styles.input, themeStyles.input]}
                            placeholder={t('scheduled.modal.descriptionOptional')}
                            placeholderTextColor={isDark ? '#94a3b8' : '#aaa'}
                            value={desc}
                            onChangeText={setDesc}
                        />

                        {/* Status Toggle */}
                        <View style={styles.switchContainer}>
                            <Text style={[styles.label, themeStyles.subText, { marginTop: 0, marginBottom: 0 }]}>{t('scheduled.modal.active')}</Text>
                            <Switch
                                value={isActive}
                                onValueChange={setIsActive}
                                trackColor={{ false: '#767577', true: isDark ? '#047857' : '#34d399' }}
                                thumbColor={isActive ? (isDark ? '#34d399' : '#047857') : '#f4f3f4'}
                            />
                        </View>

                        {/* Submit Button */}
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
                                <Text style={styles.submitButtonText}>{editMode ? t('scheduled.modal.save') : t('scheduled.modal.add')}</Text>
                            )}
                        </TouchableOpacity>

                        {/* Delete Button */}
                        {editMode && (
                            <TouchableOpacity
                                style={[styles.deleteButton]}
                                onPress={handleDelete}
                                disabled={loading}
                            >
                                <Text style={styles.deleteButtonText}>{t('scheduled.modal.deleteTitle')}</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        height: '90%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    form: {
        paddingBottom: 40,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#444',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    typeContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 4,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    typeButtonIncome: {
        backgroundColor: '#d1fae5',
    },
    typeButtonExpense: {
        backgroundColor: '#fee2e2',
    },
    typeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    typeTextActive: {
        color: '#000',
    },
    submitButton: {
        marginTop: 32,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    deleteButton: {
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    deleteButtonText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '600',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    }
});

export default AddScheduledTransactionModal;
