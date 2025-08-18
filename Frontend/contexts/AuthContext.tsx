import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { storage } from '@/utils/storage';
import { api, setAuthToken } from '@/services/api';
import type { AuthContextType, SignInParams, SignUpParams, CurrentUser } from '@/types/auth';

const TOKEN_KEY = process.env.EXPO_PUBLIC_TOKEN_KEY || 'auth_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

	const refreshCurrentUser = React.useCallback(async () => {
		if (!token) {
			setCurrentUser(null);
			return;
		}
		try {
			const { data } = await api.get<CurrentUser>('/auth/current-user');
			setCurrentUser(data);
		} catch (e) {
			await signOut();
			console.error('Failed to refresh current user:', e);
		}
	}, [token]);

	useEffect(() => {
		(async () => {
			const stored = await storage.getItem(TOKEN_KEY);
			setToken(stored);
			setAuthToken(stored || undefined);
			setLoading(false);
		})();
	}, []);

	useEffect(() => {
		if (token) {
			refreshCurrentUser();
		} else {
			setCurrentUser(null);
		}
	}, [token, refreshCurrentUser]);

	const signIn = React.useCallback(
		async ({ email, password }: SignInParams) => {
			const { data } = await api.post('/auth/login', { email, password });
			await storage.setItem(TOKEN_KEY, data.token);
			setToken(data.token);
			setAuthToken(data.token);
		},
		[]
	);

	const register = React.useCallback(
		async ({ username, email, password, repeatPassword }: SignUpParams) => {
			await api.post('/auth/register', { username, email, password, repeatPassword });
			await signIn({ email, password });
		},
		[signIn]
	);

	const signOut = async () => {
		await storage.deleteItem(TOKEN_KEY);
		setToken(null);
		setAuthToken(null);
		setCurrentUser(null);
	};

	const value = useMemo(
		() => ({ token, loading, currentUser, signIn, register, signOut, refreshCurrentUser }),
		[token, loading, currentUser, refreshCurrentUser, register, signIn],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
};
