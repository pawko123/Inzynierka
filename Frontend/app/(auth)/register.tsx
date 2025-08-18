import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import type { SignUpParams } from '@/types/auth';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { getStrings } from '@/i18n';

export default function RegisterScreen() {
	const router = useRouter();
	const { register } = useAuth();
	const [username, setUsername] = useState<SignUpParams['username']>('');
	const [email, setEmail] = useState<SignUpParams['email']>('');
	const [password, setPassword] = useState<SignUpParams['password']>('');
	const [repeatPassword, setRepeatPassword] = useState<SignUpParams['repeatPassword']>('');
	const [loading, setLoading] = useState(false);
	const scheme = useColorScheme() ?? 'light';
	const Resources = getStrings();

	const onSubmit = async () => {
		if (!username || !email || !password || !repeatPassword) {
			return Alert.alert(Resources.Auth.Errors.Required);
		}
		if (password !== repeatPassword) {
			return Alert.alert(Resources.Auth.Errors.Password_mismatch);
		}

		try {
			setLoading(true);
			await register({ username, email, password, repeatPassword });
			router.replace('/(tabs)');
		} catch (e: any) {
			Alert.alert(
				Resources.Auth.Errors.Register_failed,
				e?.message || Resources.Auth.Errors.Register_failed,
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
					{Resources.Auth.Create_account}
				</Text>
				<TextInput
					value={username}
					onChangeText={setUsername}
					placeholder={Resources.Auth.Username}
					placeholderTextColor={Colors[scheme].placeholder}
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
					value={email}
					onChangeText={setEmail}
					placeholder={Resources.Auth.Email}
					autoCapitalize="none"
					keyboardType="email-address"
					placeholderTextColor={Colors[scheme].placeholder}
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
					secureTextEntry
					placeholderTextColor={Colors[scheme].placeholder}
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
					value={repeatPassword}
					onChangeText={setRepeatPassword}
					placeholder={Resources.Auth.Repeat_password}
					secureTextEntry
					placeholderTextColor={Colors[scheme].placeholder}
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
					title={loading ? Resources.Auth.Creating : Resources.Auth.Create_account}
					onPress={onSubmit}
					disabled={loading}
				/>
				<View style={{ height: 12 }} />
				<Link href="/(auth)/login" style={{ color: Colors[scheme].link }}>
					{Resources.Auth.Have_account}
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
