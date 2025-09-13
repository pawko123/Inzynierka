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
import { translateError } from '@/utils/errorTranslator';

export type ChannelType = 'text' | 'voice';

interface CreateChannelModalProps {
	visible: boolean;
	onClose: () => void;
	serverId: string;
	onChannelCreated?: (channel: any) => void;
}

export default function CreateChannelModal({ visible, onClose, serverId, onChannelCreated }: CreateChannelModalProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const Resources = getStrings();
	const { currentUser } = useAuth();

	const [channelName, setChannelName] = useState('');
	const [channelType, setChannelType] = useState<ChannelType>('text');
	const [isLoading, setIsLoading] = useState(false);

	const handleCreate = async () => {
		if (!currentUser) {
			Alert.alert(Resources.CreateChannel.Error, Resources.Auth.Errors.Not_authenticated);
			return;
		}

		if (!channelName.trim()) {
			Alert.alert(Resources.CreateChannel.Error, Resources.CreateChannel.Channel_Name_Required);
			return;
		}

		setIsLoading(true);

		try {
			const { data } = await api.post('/channel/create', {
				name: channelName.trim(),
				type: channelType,
				serverId: serverId,
			});

			Alert.alert(Resources.CreateChannel.Success, Resources.CreateChannel.Channel_Created);
			onChannelCreated?.(data);
			onClose();
			setChannelName(''); // Clear the input
		} catch (error: any) {
			console.error('Error creating channel:', error);
			const backendErrorMessage = error.response?.data?.error || Resources.CreateChannel.Errors.Generic;
			const localizedErrorMessage = translateError(backendErrorMessage);
			Alert.alert(Resources.CreateChannel.Error, localizedErrorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setChannelName('');
		setChannelType('text');
		onClose();
	};

	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.overlay}>
				<View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
					{/* Header */}
					<View style={styles.header}>
						<Text style={[styles.title, { color: colors.text }]}>
							{Resources.CreateChannel.Title}
						</Text>
						<TouchableOpacity onPress={handleClose} style={styles.closeButton}>
							<Text style={[styles.closeButtonText, { color: colors.text }]}>×</Text>
						</TouchableOpacity>
					</View>

					{/* Channel Type Selection */}
					<View style={styles.typeSelection}>
						<Button
							title={Resources.CreateChannel.Text_Channel}
							onPress={() => setChannelType('text')}
							variant={channelType === 'text' ? 'primary' : 'outline'}
							size="medium"
							style={styles.typeButton}
						/>
						<Button
							title={Resources.CreateChannel.Voice_Channel}
							onPress={() => setChannelType('voice')}
							variant={channelType === 'voice' ? 'primary' : 'outline'}
							size="medium"
							style={styles.typeButton}
						/>
					</View>

					{/* Form */}
					<View style={styles.formContainer}>
						<View style={styles.inputGroup}>
							<Text style={[styles.label, { color: colors.text }]}>
								{Resources.CreateChannel.Channel_Name} *
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
								value={channelName}
								onChangeText={setChannelName}
								placeholder={Resources.CreateChannel.Channel_Name_Placeholder}
								placeholderTextColor={colors.tabIconDefault}
								autoCapitalize="none"
								autoCorrect={false}
							/>
						</View>
					</View>

					{/* Action Buttons */}
					<View style={styles.actionButtons}>
						<Button
							title={Resources.CreateChannel.Cancel}
							onPress={handleClose}
							variant="outline"
							size="medium"
							style={styles.actionButton}
						/>
						<Button
							title={
								isLoading 
									? Resources.CreateChannel.Creating
									: Resources.CreateChannel.Create_Channel
							}
							onPress={handleCreate}
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
		marginBottom: 20,
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
	typeSelection: {
		flexDirection: 'row',
		gap: 12,
		marginBottom: 24,
	},
	typeButton: {
		flex: 1,
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
