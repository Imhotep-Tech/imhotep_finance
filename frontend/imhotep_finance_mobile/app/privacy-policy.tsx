import React from 'react';
import { StyleSheet, ScrollView, View, useColorScheme, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function PrivacyPolicyScreen() {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#0f172a' : '#f8fafc';
  const surfaceColor = colorScheme === 'dark' ? '#1e293b' : '#ffffff';
  const textColor = colorScheme === 'dark' ? '#F9FAFB' : '#111827';
  const textSecondaryColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';
  const borderColor = colorScheme === 'dark' ? '#334155' : '#E5E7EB';
  const primaryColor = colorScheme === 'dark' ? '#51adac' : '#366c6b';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={textColor}
          onPress={() => router.back()}
          style={styles.backIcon}
        />
        <ThemedText type="title" style={styles.headerTitle}>
          Privacy Policy
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: surfaceColor, borderColor }]}>
          <ThemedText style={[styles.lastUpdated, { color: textSecondaryColor }]}>
            Last Updated: May 27, 2026
          </ThemedText>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              1. Introduction
            </ThemedText>
            <ThemedText style={[styles.paragraph, { color: textSecondaryColor }]}>
              Welcome to Imhotep Financial Manager. We respect your privacy and are committed to protecting your personal data. This Privacy Policy will inform you as to how we look after your personal data when you use our mobile application and tell you about your privacy rights and how the law protects you.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              2. Data We Collect
            </ThemedText>
            <ThemedText style={[styles.paragraph, { color: textSecondaryColor }]}>
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
            </ThemedText>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={[styles.bullet, { backgroundColor: primaryColor }]} />
                <ThemedText style={[styles.bulletText, { color: textSecondaryColor }]}>
                  <ThemedText style={{ fontWeight: 'bold', color: textColor }}>Identity Data:</ThemedText> Includes first name, last name, and username.
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={[styles.bullet, { backgroundColor: primaryColor }]} />
                <ThemedText style={[styles.bulletText, { color: textSecondaryColor }]}>
                  <ThemedText style={{ fontWeight: 'bold', color: textColor }}>Contact Data:</ThemedText> Includes email address.
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={[styles.bullet, { backgroundColor: primaryColor }]} />
                <ThemedText style={[styles.bulletText, { color: textSecondaryColor }]}>
                  <ThemedText style={{ fontWeight: 'bold', color: textColor }}>Financial Data:</ThemedText> Includes transaction details, income, expenses, budgets, financial targets, and preferred currency that you input into the app.
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={[styles.bullet, { backgroundColor: primaryColor }]} />
                <ThemedText style={[styles.bulletText, { color: textSecondaryColor }]}>
                  <ThemedText style={{ fontWeight: 'bold', color: textColor }}>Technical Data:</ThemedText> Includes internet protocol (IP) address, your login data, app version, time zone setting and location, and operating system and platform.
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              3. How We Use Your Data
            </ThemedText>
            <ThemedText style={[styles.paragraph, { color: textSecondaryColor }]}>
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </ThemedText>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={[styles.bullet, { backgroundColor: primaryColor }]} />
                <ThemedText style={[styles.bulletText, { color: textSecondaryColor }]}>To register you as a new user and manage your account.</ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={[styles.bullet, { backgroundColor: primaryColor }]} />
                <ThemedText style={[styles.bulletText, { color: textSecondaryColor }]}>To provide the financial tracking and management services within the app.</ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={[styles.bullet, { backgroundColor: primaryColor }]} />
                <ThemedText style={[styles.bulletText, { color: textSecondaryColor }]}>To manage our relationship with you, including notifying you about changes to our terms or privacy policy.</ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={[styles.bullet, { backgroundColor: primaryColor }]} />
                <ThemedText style={[styles.bulletText, { color: textSecondaryColor }]}>To improve our app, products/services, marketing, customer relationships, and experiences.</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              4. Data Security
            </ThemedText>
            <ThemedText style={[styles.paragraph, { color: textSecondaryColor }]}>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know. They will only process your personal data on our instructions and they are subject to a duty of confidentiality.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              5. Data Retention & Deletion
            </ThemedText>
            <ThemedText style={[styles.paragraph, { color: textSecondaryColor }]}>
              We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we collected it for. If you wish to delete your account or request that we delete your personal data, you can do so by contacting us. Upon request, all your financial and personal data will be permanently removed from our active systems.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              6. Your Legal Rights
            </ThemedText>
            <ThemedText style={[styles.paragraph, { color: textSecondaryColor }]}>
              Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, or to object to processing.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              7. Contact Us
            </ThemedText>
            <ThemedText style={[styles.paragraph, { color: textSecondaryColor }]}>
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
            </ThemedText>
            <ThemedText style={[styles.contactEmail, { color: primaryColor }]}>
              imhoteptech@outlook.com
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backIcon: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  lastUpdated: {
    fontSize: 14,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
  },
  bulletList: {
    marginTop: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 10,
  },
  bulletText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  contactEmail: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
});
