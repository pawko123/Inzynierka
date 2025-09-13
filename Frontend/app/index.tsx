import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
	const { token, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!loading) {
			if (!token) {
				router.replace('/(auth)/login');
			} else {
				router.replace('/(tabs)' as any);
			}
		}
	}, [token, loading, router]);

	return (
		<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
			<ActivityIndicator />
		</View>
	);
}
