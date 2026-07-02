import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import type { AppTheme } from '../db/preferences';

const OPTIONS: { label: string; value: AppTheme; emoji: string }[] = [
  { label: 'System', value: 'system', emoji: '⚙️' },
  { label: 'Light', value: 'light', emoji: '☀️' },
  { label: 'Dark', value: 'dark', emoji: '🌙' }
];

export default function ThemePicker() {
  const { colors, preference, setPreference } = useTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {OPTIONS.map((opt) => {
        const active = preference === opt.value;
        return (
          <Pressable
            key={opt.value}
            style={({ pressed }) => [
              styles.opt,
              active && { backgroundColor: colors.primary },
              { opacity: pressed ? 0.8 : 1 }
            ]}
            onPress={() => setPreference(opt.value)}
          >
            <Text style={styles.optEmoji}>{opt.emoji}</Text>
            <Text style={[styles.optLabel, { color: active ? '#fff' : colors.textSecondary }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: RADII.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    gap: 4
  },

  opt: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    gap: 3
  },

  optEmoji: {
    fontSize: 18
  },

  optLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold
  }
});
