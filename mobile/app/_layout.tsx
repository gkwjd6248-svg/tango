import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../src/i18n';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#E91E63' },
          headerTintColor: '#fff',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ title: 'Login', presentation: 'modal' }} />
        <Stack.Screen name="(auth)/register" options={{ title: 'Register', presentation: 'modal' }} />
      </Stack>
    </>
  );
}
