import React from 'react';
import { View, StyleSheet } from 'react-native';
import ImhotepTheme from '@/constants/imhotepTheme';
import SkeletonShimmer from './SkeletonShimmer';

export const TransactionListSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((key) => (
        <View key={key} style={styles.row}>
          <SkeletonShimmer width={48} height={48} borderRadius={24} style={styles.icon} />
          <View style={styles.content}>
            <View style={styles.topRow}>
              <SkeletonShimmer width="45%" height={16} borderRadius={6} />
              <SkeletonShimmer width="25%" height={16} borderRadius={6} />
            </View>
            <View style={styles.bottomRow}>
              <SkeletonShimmer width="60%" height={13} borderRadius={4} />
              <SkeletonShimmer width="20%" height={13} borderRadius={4} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 10,
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
  },
  icon: {
    marginRight: 14,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default TransactionListSkeleton;
