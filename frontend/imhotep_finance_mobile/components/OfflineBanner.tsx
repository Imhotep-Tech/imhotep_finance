import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Alert, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OfflineBanner() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  
  // This hooks into the device's hardware safely to dodge the notch/island
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  if (isConnected === true) {
    return null; // Hide completely when connected
  }

  const showOfflineMessage = () => {
    Alert.alert(
      'No Internet Connection',
      'You are currently offline. The app is showing cached data, and changes may not be saved until you reconnect.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  return (
    <TouchableOpacity
      // Dynamically calculate the top position to sit right below the status bar
      style={[styles.iconContainer, { top: Math.max(insets.top, 16) + 10 }]}
      onPress={showOfflineMessage}
      activeOpacity={0.8}
    >
      <Ionicons name="cloud-offline" size={22} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'absolute',
    right: 20, // Placed cleanly on the top-right of the screen
    backgroundColor: '#FF3B30', // Warning red
    width: 44,
    height: 44,
    borderRadius: 22, // Perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Ensure it stays on top of all screens
    elevation: 10, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});