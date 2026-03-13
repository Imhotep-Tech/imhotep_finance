import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import AddTransactionModal from '@/components/AddTransactionModal';

export default function AddTransactionDeepLinkScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const initialType = params.type === 'withdraw' ? 'withdraw' : 'deposit';

  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
    // Go back to dashboard tabs when launched from a widget / deep link
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Add Transaction',
          headerShown: false,
        }}
      />
      <AddTransactionModal
        visible={visible}
        initialType={initialType as 'deposit' | 'withdraw'}
        onClose={handleClose}
        onSuccess={handleClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
});

