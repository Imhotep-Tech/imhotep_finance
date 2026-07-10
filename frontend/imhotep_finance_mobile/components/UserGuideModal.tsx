import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

interface UserGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function UserGuideModal({ visible, onClose }: UserGuideModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#1F2937' : '#FFFFFF',
    surface: isDark ? '#374151' : '#F9FAFB',
    text: isDark ? '#F9FAFB' : '#1F2937',
    textSecondary: isDark ? '#9CA3AF' : '#6B7280',
    primary: isDark ? '#51adac' : '#366c6b',
    primaryLight: isDark ? '#244746' : '#eaf6f6',
    border: isDark ? '#4B5563' : '#E5E7EB',
  };

  const steps = [
    {
      title: 'Welcome to Imhotep! 📈',
      description: 'Your premium wealth manager. Keep track of your balances across different places and currencies, and achieve your financial targets.',
      icon: 'wallet-outline',
      iconColor: '#366c6b',
    },
    {
      title: 'Dashboard Overview ⚡',
      description: 'See your net worth in your favorite currency, check your savings score, and use the floating plus button to log transactions quickly.',
      icon: 'stats-chart-outline',
      iconColor: '#2563EB',
    },
    {
      title: 'Toggles & Grouping 💼',
      description: 'Deep-dive into details. View your holdings grouped by place or by currency with percentage share and progress bars. You can even move money or convert currencies.',
      icon: 'swap-horizontal-outline',
      iconColor: '#D97706',
    },
    {
      title: 'Home Widgets & Targets 📊',
      description: 'Setup native home screen widgets for fast balance checks and shortcuts. Define monthly savings targets in your Profile to track your performance.',
      icon: 'pie-chart-outline',
      iconColor: '#4F46E5',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('has_seen_guide', 'true');
    } catch (err) {
      console.warn('AsyncStorage error:', err);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleComplete}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              Step {currentStep + 1} of {steps.length}
            </Text>
            <TouchableOpacity onPress={handleComplete}>
              <Text style={[styles.skipText, { color: colors.primary }]}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name={steps[currentStep].icon as any} size={48} color={steps[currentStep].iconColor} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {steps[currentStep].title}
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {steps[currentStep].description}
            </Text>
          </ScrollView>

          {/* Indicators */}
          <View style={styles.indicatorsRow}>
            {steps.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  { backgroundColor: idx === currentStep ? colors.primary : colors.border },
                  idx === currentStep && { width: 18 }
                ]}
              />
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={handlePrev}
              disabled={currentStep === 0}
              style={[
                styles.navButton,
                { borderColor: colors.border, borderWidth: 1 },
                currentStep === 0 && { opacity: 0.3 }
              ]}
            >
              <Text style={[styles.navButtonText, { color: colors.text }]}>Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.nextButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === steps.length - 1 ? 'Start' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    maxHeight: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  indicatorsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 20,
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
