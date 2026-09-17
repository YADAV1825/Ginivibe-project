import { Stack } from 'expo-router';

export default function GiniAiLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="creator" />
      <Stack.Screen name="chat" />
    </Stack>
  );
}
