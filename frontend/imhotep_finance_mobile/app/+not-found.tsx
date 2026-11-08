import React from 'react';
import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTranslation } from '@/contexts/LanguageContext';

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t('common.notFound.title') }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>{t('common.notFound.message')}</ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">{t('common.notFound.backHome')}</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
