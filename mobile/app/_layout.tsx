import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useAuthStore } from '../src/store/useAuthStore';
import { useThemeStore } from '../src/store/useThemeStore';
import { useTheme } from '../src/theme/useTheme';
import '../src/i18n';

export default function RootLayout() {
  const { loadToken } = useAuthStore();
  const { loadTheme } = useThemeStore();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    loadToken();
    loadTheme();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'light'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.headerBg },
          headerTintColor: colors.headerText,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ title: 'Log In', presentation: 'modal' }} />
        <Stack.Screen name="(auth)/register" options={{ title: 'Register', presentation: 'modal' }} />
        <Stack.Screen name="(auth)/forgot-password" options={{ title: 'Forgot Password', presentation: 'modal' }} />
        <Stack.Screen name="event/[id]" options={{ title: 'Event Details' }} />
        <Stack.Screen name="events/create" options={{ title: 'Create Event', presentation: 'modal' }} />
        <Stack.Screen name="events/[id]/chat" options={{ title: 'Event Chat' }} />
        <Stack.Screen name="events/[id]/registrations" options={{ title: 'Registrations' }} />
        <Stack.Screen name="chat/index" options={{ title: 'Chat Rooms' }} />
        <Stack.Screen name="create-post" options={{ title: 'New Post', presentation: 'modal' }} />
        <Stack.Screen name="bookmarks" options={{ title: 'Bookmarked Events' }} />
        <Stack.Screen name="my-posts" options={{ title: 'My Posts' }} />
        <Stack.Screen name="profile/events" options={{ title: 'My Events' }} />
        <Stack.Screen name="profile/registrations" options={{ title: 'My Registrations' }} />
        <Stack.Screen name="profile/edit" options={{ title: 'Edit Profile' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </>
  );
}
