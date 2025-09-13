import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
	Modal,
	Clipboard,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { getStrings } from '@/i18n';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface ServerActionButtonsProps {
	serverId: string;
	canManageRoles: boolean;
	canCreateInvite: boolean;
	onManageRoles?: () => void;
}

export default function ServerActionButtons({
	serverId,
	canManageRoles,
	canCreateInvite,
	onManageRoles,
}: ServerActionButtonsProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const Resources = getStrings();
	const { currentUser } = useAuth();
	const [inviteModalVisible, setInviteModalVisible] = useState(false);
	const [generatedInvite, setGeneratedInvite] = useState<string>('');
	const [isCreatingInvite, setIsCreatingInvite] = useState(false);

	const handleCreateInvite = async () => {
		if (!currentUser) {
			Alert.alert(Resources.CreateChannel.Error, Resources.Auth.Errors.Not_authenticated);
			return;
		}

		setIsCreatingInvite(true);
		try {
			const { data } = await api.post('/invite/create', {
				serverId: serverId,
			});
			
			setGeneratedInvite(data.inviteCode);
			setInviteModalVisible(true);
		} catch (error: any) {
			console.error('Error creating invite:', error);
			const errorMessage = error.response?.data?.error || Resources.ServerManagement.Errors.Create_Invite_Failed;
			Alert.alert(Resources.CreateChannel.Error, errorMessage);
		} finally {
			setIsCreatingInvite(false);
		}
	};

	const handleCopyInvite = () => {
		Clipboard.setString(generatedInvite);
		Alert.alert(Resources.ServerManagement.Success, Resources.ServerManagement.Invite_Copied);
		setInviteModalVisible(false);
	};

	if (!canManageRoles && !canCreateInvite) {
		return null;
	}

	return (
		<>
			<View style={styles.container}>
				{canCreateInvite && (
					<TouchableOpacity
						style={[styles.actionButton, { backgroundColor: colors.tint }]}
						onPress={handleCreateInvite}
						disabled={isCreatingInvite}
					>
						<Text style={[styles.buttonIcon, { color: colors.background }]}>
							🔗
						</Text>
					</TouchableOpacity>
				)}

				{canManageRoles && (
					<TouchableOpacity
						style={[styles.actionButton, { backgroundColor: colors.tint }]}
						onPress={onManageRoles}
					>
						<Text style={[styles.buttonIcon, { color: colors.background }]}>
							👥
						</Text>
					</TouchableOpacity>
				)}
			</View>

			{/* Invite Code Modal */}
			<Modal
				visible={inviteModalVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setInviteModalVisible(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
						<Text style={[styles.modalTitle, { color: colors.text }]}>
							{Resources.ServerManagement.Invite_Created}
						</Text>
						
						<View style={[styles.inviteCodeContainer, { backgroundColor: colors.tabIconDefault + '20', borderColor: colors.border }]}>
							<Text style={[styles.inviteCode, { color: colors.text }]}>
								{generatedInvite}
							</Text>
						</View>
						
						<Text style={[styles.inviteInfo, { color: colors.tabIconDefault }]}>
							{Resources.ServerManagement.Invite_Info}
						</Text>
						
						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={[styles.modalButton, { backgroundColor: colors.tint }]}
								onPress={handleCopyInvite}
							>
								<Text style={[styles.modalButtonText, { color: colors.background }]}>
									{Resources.ServerManagement.Copy_Invite}
								</Text>
							</TouchableOpacity>
							
							<TouchableOpacity
								style={[styles.modalButton, { backgroundColor: colors.tabIconDefault }]}
								onPress={() => setInviteModalVisible(false)}
							>
								<Text style={[styles.modalButtonText, { color: colors.background }]}>
									{Resources.CreateChannel.Cancel}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		gap: 8,
	},
	actionButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonIcon: {
		fontSize: 14,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	modalContainer: {
		width: '100%',
		maxWidth: 400,
		padding: 24,
		borderRadius: 12,
		gap: 16,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '600',
		textAlign: 'center',
	},
	inviteCodeContainer: {
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
	},
	inviteCode: {
		fontSize: 16,
		fontFamily: 'monospace',
		textAlign: 'center',
	},
	inviteInfo: {
		fontSize: 12,
		textAlign: 'center',
		lineHeight: 16,
	},
	modalButtons: {
		flexDirection: 'row',
		gap: 12,
	},
	modalButton: {
		flex: 1,
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	modalButtonText: {
		fontSize: 14,
		fontWeight: '500',
	},
});
