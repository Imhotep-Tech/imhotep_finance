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
            Alert.alert('Error', 'Amount, currency, and day of month are required.');
            setLoading(false);
            return;
        }

        const day = parseInt(dayOfMonth, 10);
        if (isNaN(day) || day < 1 || day > 31) {
            Alert.alert('Error', 'Day of month must be between 1 and 31.');
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
                Alert.alert('Success', 'Scheduled transaction updated successfully!');
            } else {
                await api.post('/api/finance-management/scheduled-trans/add-scheduled-trans/', payload);
                Alert.alert('Success', 'Scheduled transaction added successfully!');
            }
            updateNetworthWidget();
            onSuccess();
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || (editMode ? 'Failed to update scheduled transaction.' : 'Failed to add scheduled transaction.');
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Delete Scheduled Transaction',
            'Are you sure you want to delete this scheduled transaction?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            if (initialValues.id) {
                                await api.delete(`/api/finance-management/scheduled-trans/delete-scheduled-trans/${initialValues.id}/`);
                                Alert.alert('Success', 'Scheduled transaction deleted successfully!');
                                updateNetworthWidget();
                                onSuccess();
                            }
                        } catch (err: any) {
                            Alert.alert('Error', err.response?.data?.error || 'Failed to delete scheduled transaction.');
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
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <View style={[styles.modalView, themeStyles.container]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, themeStyles.text]}>{editMode ? 'Edit Scheduled' : 'Add Scheduled'}</Text>
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
                                <Text style={[styles.typeText, themeStyles.subText, status === 'deposit' && (isDark ? { color: '#10b981' } : styles.typeTextActive)]}>Income</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    status === 'withdraw' && (isDark ? { backgroundColor: 'rgba(239, 68, 68, 0.2)' } : styles.typeButtonExpense)
                                ]}
                                onPress={() => setStatus('withdraw')}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.typeText, themeStyles.subText, status === 'withdraw' && (isDark ? { color: '#ef4444' } : styles.typeTextActive)]}>Expense</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Day of Month */}
                        <Text style={[styles.label, themeStyles.subText]}>Day of Month (1-31)</Text>
                        <TextInput
                            style={[styles.input, themeStyles.input]}
                            placeholder="e.g. 1, 15, 31"
                            placeholderTextColor={isDark ? '#94a3b8' : '#aaa'}
                            keyboardType="numeric"
                            value={dayOfMonth}
                            onChangeText={setDayOfMonth}
                            maxLength={2}
                        />

                        {/* Amount */}
                        <Text style={[styles.label, themeStyles.subText]}>Amount</Text>
                        <TextInput
                            style={[styles.input, themeStyles.input]}
                            placeholder="0.00"
                            placeholderTextColor={isDark ? '#94a3b8' : '#aaa'}
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />

                        {/* Currency */}
                        <Text style={[styles.label, themeStyles.subText]}>Currency</Text>
                        <CurrencySelect
                            value={currency}
                            onChange={setCurrency}
                            required
                        />

                        {/* Category */}
                        <Text style={[styles.label, themeStyles.subText]}>Category</Text>
                        <CategorySelect
                            value={category}
                            onChange={setCategory}
                            status={status}
                        />

                        {/* Place */}
                        <Text style={[styles.label, themeStyles.subText]}>Place</Text>
                        <PlaceSelect
                            value={place}
                            onChange={setPlace}
                            currency={currency}
                        />

                        {/* Description */}
                        <Text style={[styles.label, themeStyles.subText]}>Description</Text>
                        <TextInput
                            style={[styles.input, themeStyles.input]}
                            placeholder="Description (optional)"
                            placeholderTextColor={isDark ? '#94a3b8' : '#aaa'}
                            value={desc}
                            onChangeText={setDesc}
                        />

                        {/* Status Toggle */}
                        <View style={styles.switchContainer}>
                            <Text style={[styles.label, themeStyles.subText, { marginTop: 0, marginBottom: 0 }]}>Active Status</Text>
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
                                <Text style={styles.submitButtonText}>{editMode ? 'Save' : 'Add'}</Text>
                            )}
                        </TouchableOpacity>

                        {/* Delete Button */}
                        {editMode && (
                            <TouchableOpacity
                                style={[styles.deleteButton]}
                                onPress={handleDelete}
                                disabled={loading}
                            >
                                <Text style={styles.deleteButtonText}>Delete Scheduled Transaction</Text>
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
