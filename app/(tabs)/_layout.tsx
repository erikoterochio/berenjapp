import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Home, TrendingUp, Users, User } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useFriendsStore } from '@/store/friends-store';
import { useMatchesStore } from '@/store/matches-store';

export default function TabLayout() {
  const { fetchFriends, fetchRequests, incomingRequests } = useFriendsStore();
  const { fetchMatches } = useMatchesStore();
  
  useEffect(() => {
    // Load initial data
    fetchFriends();
    fetchRequests();
    fetchMatches();
  }, []);
  
  // Check if there are pending friend requests
  const hasPendingRequests = incomingRequests.length > 0;
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: '#222222',
        tabBarStyle: {
          borderTopColor: colors.border,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '600',
        },
        tabBarActiveBackgroundColor: colors.primary,
        tabBarIconStyle: {
          width: 40,
          height: 40,
          borderRadius: 20, // Changed to circle
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: "Estadísticas",
          tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Amigos",
          tabBarIcon: ({ color, size }) => (
            <View>
              <Users size={size} color={color} />
              {hasPendingRequests && <View style={styles.notificationBadge} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Cuenta",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: 'white',
  },
});