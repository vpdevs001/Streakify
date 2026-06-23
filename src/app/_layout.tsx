import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';

import { migrateDatabase } from '@/db/schema';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="chaistreaks.db" onInit={migrateDatabase}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      />
    </SQLiteProvider>
  );
}
