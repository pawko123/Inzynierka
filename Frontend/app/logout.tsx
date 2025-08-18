import { Redirect } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function Logout() {
	const { signOut } = useAuth();
	useEffect(() => {
		signOut();
	}, [signOut]);
	return <Redirect href="/(auth)/login" />;
}
