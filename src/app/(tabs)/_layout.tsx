import { Tabs } from 'expo-router';

import { House, ChartColumn, Settings } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ size }) => <House size={size} />,
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ size }) => <ChartColumn size={size} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size }) => <Settings size={size} />,
        }}
      />
    </Tabs>
  );
}
