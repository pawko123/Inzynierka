import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	Modal,
	StyleSheet,
	Alert,
	TouchableOpacity,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui';
import { getStrings } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { JoinServerModalProps } from '@/types/ui';

export default function JoinServerModal({ visible, onClose, onJoinServer }: JoinServerModalProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const Resources = getStrings();
	const { currentUser } = useAuth();

	const [inviteLink, setInviteLink] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const extractInviteCode = (link: string): string | null => {
		// Handle different invite link formats
		// e.g., "https://yourapp.com/invite/abc-123-def" or just "abc-123-def"
		const trimmed = link.trim();
		
		// If it's just the code
		if (!trimmed.includes('/')) {
			return trimmed;
		}
		
		// Extract code from URL
		const parts = trimmed.split('/');
		const lastPart = parts[parts.length - 1];
		return lastPart || null;
	};

	const handleJoinServer = async () => {
		if (!currentUser) {
			Alert.alert(Resources.JoinServer.Error, Resources.Auth.Errors.Not_authenticated);
			return;
		}

		if (!inviteLink.trim()) {
			Alert.alert(Resources.JoinServer.Error, Resources.JoinServer.Invite_Required);
			return;
		}

		const inviteCode = extractInviteCode(inviteLink);
		if (!inviteCode) {
			Alert.alert(Resources.JoinServer.Error, Resources.JoinServer.Invalid_Invite);
			return;
		}

		setIsLoading(true);

		try {
			const { data } = await api.post(`/invite/accept/${inviteCode}`, {
				userId: currentUser.id,
			});

			Alert.alert(Resources.JoinServer.Success, Resources.JoinServer.Joined_Successfully);
			onJoinServer?.(data);
			onClose();
			setInviteLink(''); // Clear the input
		} catch (error: any) {
			console.error('Error joining server:', error);
			let errorMessage = 'An error occurred';
			
			if (error.response?.data?.error) {
				const backendError = error.response.data.error;
				switch (backendError) {
					case 'Invite not found.':
						errorMessage = Resources.JoinServer.Invite_Not_Found;
						break;
					case 'Invite expired.':
						errorMessage = Resources.JoinServer.Invite_Expired;
						break;
					case 'User is already a member of this server.':
						errorMessage = Resources.JoinServer.Already_Member;
						break;
					default:
						errorMessage = backendError;
				}
			}
			
			Alert.alert(Resources.JoinServer.Error, errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setInviteLink('');
		onClose();
	};

	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.overlay}>
				<View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
					{/* Header */}
					<View style={styles.header}>
						<Text style={[styles.title, { color: colors.text }]}>
							{Resources.JoinServer.Title}
						</Text>
						<TouchableOpacity onPress={handleClose} style={styles.closeButton}>
							<Text style={[styles.closeButtonText, { color: colors.text }]}>×</Text>
						</TouchableOpacity>
					</View>

					{/* Description */}
					<Text style={[styles.description, { color: colors.tabIconDefault }]}>
						{Resources.JoinServer.Description}
					</Text>

					{/* Form */}
					<View style={styles.formContainer}>
						<View style={styles.inputGroup}>
							<Text style={[styles.label, { color: colors.text }]}>
								{Resources.JoinServer.Invite_Link} *
							</Text>
							<TextInput
								style={[
									styles.input,
									{
										backgroundColor: colors.background,
										borderColor: colors.border,
										color: colors.text,
									},
								]}
								value={inviteLink}
								onChangeText={setInviteLink}
								placeholder={Resources.JoinServer.Invite_Placeholder}
								placeholderTextColor={colors.tabIconDefault}
								autoCapitalize="none"
								autoCorrect={false}
							/>
						</View>
					</View>

					{/* Action Buttons */}
					<View style={styles.actionButtons}>
						<Button
							title={Resources.JoinServer.Cancel}
							onPress={handleClose}
							variant="outline"
							size="medium"
							style={styles.actionButton}
						/>
						<Button
							title={
								isLoading 
									? Resources.JoinServer.Joining
									: Resources.JoinServer.Join_Server
							}
							onPress={handleJoinServer}
							variant="primary"
							size="medium"
							style={styles.actionButton}
							disabled={isLoading}
						/>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	modalContainer: {
		width: '100%',
		maxWidth: 400,
		borderRadius: 12,
		padding: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	closeButton: {
		padding: 4,
	},
	closeButtonText: {
		fontSize: 24,
		fontWeight: 'bold',
	},
	description: {
		fontSize: 14,
		marginBottom: 24,
		lineHeight: 20,
	},
	formContainer: {
		marginBottom: 24,
	},
	inputGroup: {
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 8,
	},
	input: {
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 16,
	},
	actionButtons: {
		flexDirection: 'row',
		gap: 12,
	},
	actionButton: {
		flex: 1,
	},
});
