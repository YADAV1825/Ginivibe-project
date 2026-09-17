import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../features/auth/providers/AuthProvider';
import { GlobalSocketProvider } from '../features/matching/providers/GlobalSocketProvider';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#090d16' }}>
      <AuthProvider>
        <GlobalSocketProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: '#090d16' },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="video-call" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="rooms/index" />
            <Stack.Screen name="rooms/[id]" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </GlobalSocketProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
