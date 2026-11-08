import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from '@/contexts/LanguageContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

interface LanguageDropdownProps {
  align?: 'left' | 'right';
}

export default function LanguageDropdown({ align = 'right' }: LanguageDropdownProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { language, setLanguage, supportedLanguages, currentLanguage } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const current = currentLanguage || supportedLanguages[language] || supportedLanguages.en;

  const handleSelect = async (langCode: string) => {
    await setLanguage(langCode);
    setModalVisible(false);
  };

  const colors = {
    bg: isDark ? '#1f2937' : '#ffffff',
    card: isDark ? '#111827' : '#ffffff',
    text: isDark ? '#f9fafb' : '#111827',
    subtext: isDark ? '#9ca3af' : '#6b7280',
    primary: '#366c6b',
    primaryLight: isDark ? 'rgba(54, 108, 107, 0.25)' : '#eaf6f6',
    border: isDark ? '#374151' : '#e5e7eb',
    overlay: 'rgba(0, 0, 0, 0.5)',
  };

  return (
    <View style={{ alignItems: align === 'left' ? 'flex-start' : 'flex-end' }}>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[
          styles.triggerButton,
          {
            backgroundColor: colors.primaryLight,
            borderColor: colors.border,
          },
        ]}
        activeOpacity={0.7}
      >
        <Text style={styles.flagText}>{current.flag || '🌐'}</Text>
        <Text style={[styles.triggerText, { color: colors.primary }]}>
          {current.nativeName}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.primary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Language / اختر اللغة
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={colors.subtext} />
              </TouchableOpacity>
            </View>

            <View style={styles.languageList}>
              {Object.values(supportedLanguages).map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => handleSelect(lang.code)}
                    style={[
                      styles.languageItem,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : 'transparent',
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.languageInfo}>
                      <Text style={styles.modalFlag}>{lang.flag}</Text>
                      <View>
                        <Text style={[styles.nativeName, { color: colors.text, fontWeight: isSelected ? '700' : '500' }]}>
                          {lang.nativeName}
                        </Text>
                        <Text style={[styles.englishName, { color: colors.subtext }]}>
                          {lang.name} ({lang.code.toUpperCase()})
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  flagText: {
    fontSize: 14,
  },
  triggerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  languageList: {
    gap: 10,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalFlag: {
    fontSize: 24,
  },
  nativeName: {
    fontSize: 15,
  },
  englishName: {
    fontSize: 12,
    marginTop: 2,
  },
});
