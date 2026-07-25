import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import ImhotepTheme from '@/constants/imhotepTheme';
import api from '@/constants/api';
import CurrencySelect from './CurrencySelect';
import CategorySelect from './CategorySelect';
import PlaceSelect from './PlaceSelect';
import PressableScale from './ui/PressableScale';
import { updateNetworthWidget } from '@/widgets/widget-updater';

interface AddTransactionModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialType?: 'deposit' | 'withdraw';
  initialValues?: any;
  editMode?: boolean;
  visible: boolean;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  onClose,
  onSuccess,
  initialType = 'deposit',
  initialValues = {},
  editMode = false,
  visible,
}) => {
  const [status, setStatus] = useState<'deposit' | 'withdraw'>(initialType);
  const [amount, setAmount] = useState<string>(initialValues.amount ? String(initialValues.amount) : '');
  const [desc, setDesc] = useState<string>(initialValues.trans_details || initialValues.desc || '');
  const [category, setCategory] = useState<string>(initialValues.category || '');
  const [place, setPlace] = useState<string>(initialValues.place || '');
  const [currency, setCurrency] = useState<string>(initialValues.currency || '');
  const [date, setDate] = useState<Date>(
    initialValues.date ? new Date(initialValues.date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      setStatus(initialValues.trans_status || initialType);
      setAmount(initialValues.amount ? String(initialValues.amount) : '');
      setDesc(initialValues.trans_details || initialValues.desc || '');
      setCategory(initialValues.category || '');
      setPlace(initialValues.place || '');
      setCurrency(initialValues.currency || '');
      setDate(initialValues.date ? new Date(initialValues.date) : new Date());
    }
  }, [visible, initialValues, initialType]);

  const handleSubmit = async () => {
    setLoading(true);
    if (!amount || !currency) {
      Alert.alert('Error', 'Amount and currency are required.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        amount,
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
        Alert.alert('Success', 'Transaction updated successfully!');
      } else {
        await api.post('/api/finance-management/transaction/add-transactions/', payload);
        Alert.alert('Success', 'Transaction added successfully!');
      }
      updateNetworthWidget();
      onSuccess();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        (editMode ? 'Failed to update transaction.' : 'Failed to add transaction.');
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              if (initialValues.id) {
                await api.delete(
                  `/api/finance-management/transaction/delete-transactions/${initialValues.id}/`
                );
                Alert.alert('Success', 'Transaction deleted successfully!');
                updateNetworthWidget();
                onSuccess();
              }
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to delete transaction.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
        style={styles.overlay}
      >
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {editMode ? 'Edit Transaction' : 'Add Transaction'}
            </Text>
            <PressableScale onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={ImhotepTheme.colors.textPrimary} />
            </PressableScale>
          </View>

          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            {/* Income / Expense Toggle */}
            <View style={[styles.typeContainer, editMode && styles.disabledType]}>
              <PressableScale
                style={[
                  styles.typeButton,
                  status === 'deposit' && styles.typeButtonIncome,
                ]}
                onPress={() => !editMode && setStatus('deposit')}
                disabled={editMode}
              >
                <Text
                  style={[
                    styles.typeText,
                    status === 'deposit' && styles.typeTextIncome,
                  ]}
                >
                  Income
                </Text>
              </PressableScale>

              <PressableScale
                style={[
                  styles.typeButton,
                  status === 'withdraw' && styles.typeButtonExpense,
                ]}
                onPress={() => !editMode && setStatus('withdraw')}
                disabled={editMode}
              >
                <Text
                  style={[
                    styles.typeText,
                    status === 'withdraw' && styles.typeTextExpense,
                  ]}
                >
                  Expense
                </Text>
              </PressableScale>
            </View>

            {/* Amount */}
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={ImhotepTheme.colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Currency */}
            <Text style={styles.label}>Currency</Text>
            <CurrencySelect
              value={currency}
              onChange={setCurrency}
              required
              disabled={editMode}
            />

            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <CategorySelect
              value={category}
              onChange={setCategory}
              status={status}
            />

            {/* Place */}
            <Text style={styles.label}>Place</Text>
            <PlaceSelect
              value={place}
              onChange={setPlace}
              currency={currency}
            />

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Transaction description (optional)"
              placeholderTextColor={ImhotepTheme.colors.textMuted}
              value={desc}
              onChangeText={setDesc}
            />

            {/* Date */}
            <Text style={styles.label}>Date</Text>
            <PressableScale
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{date.toISOString().split('T')[0]}</Text>
              <Ionicons name="calendar-outline" size={20} color={ImhotepTheme.colors.textSecondary} />
            </PressableScale>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}

            {/* Submit Action */}
            <PressableScale
              style={[
                styles.submitButton,
                {
                  backgroundColor:
                    status === 'deposit'
                      ? ImhotepTheme.colors.depositGreen
                      : ImhotepTheme.colors.withdrawRed,
                },
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editMode ? 'Save Changes' : 'Confirm Transaction'}
                </Text>
              )}
            </PressableScale>

            {/* Delete Option if Editing */}
            {editMode && (
              <PressableScale
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={loading}
              >
                <Text style={styles.deleteButtonText}>Delete Transaction</Text>
              </PressableScale>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.80)',
    justifyContent: 'flex-end',
  },
  modalView: {
    backgroundColor: ImhotepTheme.colors.backgroundSurface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: ImhotepTheme.colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ImhotepTheme.colors.glassCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: ImhotepTheme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: ImhotepTheme.colors.inputBackground,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.inputBorder,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: ImhotepTheme.colors.textPrimary,
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
  },
  disabledType: {
    opacity: 0.6,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  typeButtonIncome: {
    backgroundColor: ImhotepTheme.colors.depositGreenLight,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  typeButtonExpense: {
    backgroundColor: ImhotepTheme.colors.withdrawRedLight,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  typeText: {
    fontSize: 15,
    fontWeight: '600',
    color: ImhotepTheme.colors.textSecondary,
  },
  typeTextIncome: {
    color: ImhotepTheme.colors.depositGreen,
  },
  typeTextExpense: {
    color: ImhotepTheme.colors.withdrawRed,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ImhotepTheme.colors.inputBackground,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.inputBorder,
    borderRadius: 14,
    padding: 14,
  },
  dateText: {
    fontSize: 15,
    color: ImhotepTheme.colors.textPrimary,
  },
  submitButton: {
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.withdrawRed,
  },
  deleteButtonText: {
    color: ImhotepTheme.colors.withdrawRed,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default AddTransactionModal;
