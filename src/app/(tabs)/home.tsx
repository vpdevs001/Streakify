import { SafeAreaView, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export default function HomeScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: 20,
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 28,
          fontWeight: '700',
        }}
      >
        Good Evening ☕
      </Text>

      <Text
        style={{
          color: colors.muted,
          marginTop: 4,
        }}
      >
        Build habits one cup at a time.
      </Text>
    </SafeAreaView>
  );
}
