import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';

function GuardedTabs({ children }: { children: React.ReactNode }) {
	const { token, loading } = useAuth();
	if (loading) return null;
	if (!token) return <Redirect href="/(auth)/login" />;
	return <>{children}</>;
}

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<GuardedTabs>
			<Tabs
				screenOptions={{
					tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
					headerShown: false,
					tabBarButton: HapticTab,
					tabBarBackground: TabBarBackground,
					tabBarStyle: Platform.select({
						ios: {
							// Use a transparent background on iOS to show the blur effect
							position: 'absolute',
						},
						default: {},
					}),
				}}
			>
				<Tabs.Screen
					name="index"
					options={{
						title: 'Home',
						tabBarIcon: ({ color }) => (
							<IconSymbol size={28} name="house.fill" color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="explore"
					options={{
						title: 'Explore',
						tabBarIcon: ({ color }) => (
							<IconSymbol size={28} name="paperplane.fill" color={color} />
						),
					}}
				/>
			</Tabs>
		</GuardedTabs>
	);
}
