import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#E91E63',
        tabBarInactiveTintColor: '#999',
        headerStyle: { backgroundColor: '#E91E63' },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{'E'}</Text>,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{'C'}</Text>,
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: 'Deals',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{'D'}</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{'P'}</Text>,
        }}
      />
    </Tabs>
  );
}
