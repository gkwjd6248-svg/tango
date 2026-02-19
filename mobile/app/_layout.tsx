import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../src/i18n';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#8B0000' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        {/* Tab navigator — no header at root level */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Auth screens */}
        <Stack.Screen
          name="(auth)/login"
          options={{ title: 'Log In', presentation: 'modal' }}
        />
        <Stack.Screen
          name="(auth)/register"
          options={{ title: 'Register', presentation: 'modal' }}
        />

        {/* Event detail — full screen push */}
        <Stack.Screen
          name="event/[id]"
          options={{ title: 'Event Details' }}
        />

        {/* Post creation — modal */}
        <Stack.Screen
          name="create-post"
          options={{ title: 'New Post', presentation: 'modal' }}
        />

        {/* Bookmarks — full screen push */}
        <Stack.Screen
          name="bookmarks"
          options={{ title: 'Bookmarked Events' }}
        />

        {/* My posts — full screen push */}
        <Stack.Screen
          name="my-posts"
          options={{ title: 'My Posts' }}
        />
      </Stack>
    </>
  );
}
