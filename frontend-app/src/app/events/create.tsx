import React from 'react';
import { useRouter } from 'expo-router';
import CreateEventScreen from '../../features/events/screens/CreateEventScreen';

export default function CreateEventRoute() {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/events');
    }
  };

  return (
    <CreateEventScreen
      onBack={handleBack}
      onSuccess={handleBack}
    />
  );
}
