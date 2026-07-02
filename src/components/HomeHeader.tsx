import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import { router } from 'expo-router';
import type { ThemeColors } from '../theme';
import { getGreeting, formatDate } from '../utils/dateHelpers';

interface Props {
  colors: ThemeColors;
}

export default function HomeHeader({ colors }: Props) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.greeting, { color: colors.text }]}>{getGreeting()}</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(new Date())}</Text>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.avatarBtn,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1
          }
        ]}
        onPress={() => router.push('/settings')}
      >
        <Text style={{ fontSize: 24 }}>👤</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg
  },

  greeting: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.heavy,
    lineHeight: 28
  },

  date: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: 2
  },

  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: RADII.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
