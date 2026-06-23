import { useEffect } from 'react';
import { Redirect } from 'expo-router';

import { hasOnboarded } from '@/db/preferences';

import { useState } from 'react';

export default function Index() {
  const [loading, setLoading] = useState(true);

  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function load() {
      setCompleted(await hasOnboarded());
      setLoading(false);
    }

    load();
  }, []);

  if (loading) return null;

  if (!completed) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
