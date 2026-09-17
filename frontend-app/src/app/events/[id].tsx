import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import EventDetailScreen from '../../features/events/screens/EventDetailScreen';

export default function EventDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/events');
    }
  };

  return <EventDetailScreen eventId={id} onBack={handleBack} />;
}
