import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('ginivibe_auth_token')
      .then(token => setIsAuthenticated(!!token))
      .catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' }}>
        <ActivityIndicator size="large" color="#818cf8" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/feed" />;
  }

  return <Redirect href="/register" />;
}
