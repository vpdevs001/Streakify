import { View, StyleSheet } from 'react-native';

import { ReactNode } from 'react';

import { useTheme } from '@/hooks/useTheme';

interface Props {
  children: ReactNode;
}

export function Card({ children }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
});
