import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import type { SignInParams } from '@/types/auth';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { getStrings } from '@/i18n';

export default function LoginScreen() {
	const router = useRouter();
	const { signIn } = useAuth();
	const [email, setEmail] = useState<SignInParams['email']>('');
	const [password, setPassword] = useState<SignInParams['password']>('');
	const [loading, setLoading] = useState(false);
	const scheme = useColorScheme() ?? 'light';
	const Resources = getStrings();

	const onSubmit = async () => {
		if (!email || !password) return Alert.alert(Resources.Auth.Errors.Login_failed);
		try {
			setLoading(true);
			await signIn({ email, password });
			router.replace('/(tabs)' as any);
		} catch (e: any) {
			Alert.alert(
				Resources.Auth.Errors.Login_failed,
				e?.message || Resources.Auth.Errors.Login_failed,
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={[styles.page, { backgroundColor: Colors[scheme].background }]}>
			<View
				style={[
					styles.card,
					{ backgroundColor: Colors[scheme].card, borderColor: Colors[scheme].border },
				]}
			>
				<Text style={[styles.title, { color: Colors[scheme].text }]}>
					{Resources.Auth.Sign_in}
				</Text>
				<TextInput
					value={email}
					onChangeText={setEmail}
					placeholder={Resources.Auth.Email}
					placeholderTextColor={Colors[scheme].placeholder}
					autoCapitalize="none"
					keyboardType="email-address"
					style={[
						styles.input,
						{
							backgroundColor: Colors[scheme].inputBackground,
							color: Colors[scheme].text,
							borderColor: Colors[scheme].border,
						},
					]}
				/>
				<TextInput
					value={password}
					onChangeText={setPassword}
					placeholder={Resources.Auth.Password}
					placeholderTextColor={Colors[scheme].placeholder}
					secureTextEntry
					style={[
						styles.input,
						{
							backgroundColor: Colors[scheme].inputBackground,
							color: Colors[scheme].text,
							borderColor: Colors[scheme].border,
						},
					]}
				/>
				<Button
					title={loading ? Resources.Auth.Signing_in : Resources.Auth.Sign_in}
					onPress={onSubmit}
					disabled={loading}
				/>
				<View style={{ height: 12 }} />
				<Link href="/(auth)/register" style={{ color: Colors[scheme].link }}>
					{Resources.Auth.No_account}
				</Link>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	page: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 16,
	},
	card: {
		width: '100%',
		maxWidth: 420,
		borderWidth: 1,
		borderRadius: 12,
		padding: 20,
		...Platform.select({
			web: { boxShadow: '0 6px 20px rgba(0,0,0,0.08)' } as any,
			default: {},
		}),
	},
	title: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
	input: {
		borderWidth: 1,
		padding: 12,
		borderRadius: 8,
		marginBottom: 12,
	},
});
