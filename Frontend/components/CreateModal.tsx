import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	Modal,
	StyleSheet,
	Alert,
	Image,
	TouchableOpacity,
	Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui';
import { getStrings } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

export type CreateType = 'server' | 'direct-channel';

interface CreateModalProps {
	visible: boolean;
	onClose: () => void;
	defaultType?: CreateType;
	onCreateServer?: (data: { name: string; logo?: string }) => void;
	onCreateDirectChannel?: (data: { channelName: string; userId: string }) => void;
}

export default function CreateModal({
	visible,
	onClose,
	defaultType = 'server',
	onCreateServer,
	onCreateDirectChannel,
}: CreateModalProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const Resources = getStrings();
	const { currentUser } = useAuth();

	const [selectedType, setSelectedType] = useState<CreateType>(defaultType);
	const [serverName, setServerName] = useState('');
	const [serverLogo, setServerLogo] = useState('');
	const [channelName, setChannelName] = useState('');
	const [userId, setUserId] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	// Reset form when modal opens/closes or type changes
	useEffect(() => {
		if (visible) {
			setSelectedType(defaultType);
		} else {
			// Reset form when modal closes
			setServerName('');
			setServerLogo('');
			setChannelName('');
			setUserId('');
		}
	}, [visible, defaultType]);

	const handleCreate = async () => {
		if (!currentUser) {
			Alert.alert(Resources.CreateModal.Error, Resources.Auth.Errors.Not_authenticated);
			return;
		}

		setIsLoading(true);
		
		try {
			if (selectedType === 'server') {
				if (!serverName.trim()) {
					Alert.alert(Resources.CreateModal.Error, Resources.CreateModal.Server_Name_Required);
					return;
				}

				// Prepare FormData for server creation (supports file upload)
				const formData = new FormData();
				formData.append('name', serverName.trim());
				formData.append('userId', currentUser.id);

				if (serverLogo) {
					// Convert base64 to blob for file upload
					const response = await fetch(serverLogo);
					const blob = await response.blob();
					formData.append('logo', blob as any, 'logo.jpg');
				}

				const { data } = await api.post('/server/create', formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				});

				Alert.alert(Resources.CreateModal.Create_Server, Resources.CreateModal.Server_Created);
				onCreateServer?.(data);
			} else {
				if (!channelName.trim() || !userId.trim()) {
					Alert.alert(Resources.CreateModal.Error, Resources.CreateModal.Required_Fields);
					return;
				}

				const { data } = await api.post('/channel/direct/create', {
					userId: currentUser.id,
					invitedUserId: userId.trim(),
					name: channelName.trim(),
				});

				Alert.alert(Resources.CreateModal.Create_Channel, Resources.CreateModal.Channel_Created);
				onCreateDirectChannel?.(data);
			}

			onClose();
		} catch (error: any) {
			console.error('Error creating:', error);
			const errorMessage = error.response?.data?.error || error.response?.data?.message || 'An error occurred';
			Alert.alert(Resources.CreateModal.Error, errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSelectType = (type: CreateType) => {
		setSelectedType(type);
		// Clear form when switching types
		setServerName('');
		setServerLogo('');
		setChannelName('');
		setUserId('');
	};

	const handleChooseImage = async () => {
		try {
			// On web, directly launch image library as camera is not typically available
			if (Platform.OS === 'web') {
				await launchImageLibrary();
				return;
			}

			// Request permission for mobile platforms
			const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
			
			if (permissionResult.granted === false) {
				Alert.alert(
					Resources.CreateModal.Permission_Required,
					Resources.CreateModal.Permission_Message
				);
				return;
			}

			// Show action sheet to choose between camera and library
			Alert.alert(
				Resources.CreateModal.Choose_Image,
				Resources.CreateModal.Select_Image_Source,
				[
					{
						text: Resources.CreateModal.Camera,
						onPress: () => launchCamera(),
					},
					{
						text: Resources.CreateModal.Photo_Library,
						onPress: () => launchImageLibrary(),
					},
					{
						text: Resources.CreateModal.Cancel,
						style: 'cancel',
					},
				]
			);
		} catch (error) {
			console.error('Error requesting permission:', error);
			Alert.alert(Resources.CreateModal.Error, Resources.CreateModal.Permission_Error);
		}
	};

	const launchCamera = async () => {
		try {
			const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
			
			if (cameraPermission.granted === false) {
				Alert.alert(
					Resources.CreateModal.Permission_Required,
					Resources.CreateModal.Camera_Permission_Message
				);
				return;
			}

			const result = await ImagePicker.launchCameraAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.8,
				base64: true,
			});

			if (!result.canceled && result.assets && result.assets[0]) {
				const asset = result.assets[0];
				if (asset.base64) {
					const base64Image = `data:image/jpeg;base64,${asset.base64}`;
					setServerLogo(base64Image);
				}
			}
		} catch (error) {
			console.error('Error launching camera:', error);
			Alert.alert(Resources.CreateModal.Error, Resources.CreateModal.Camera_Error);
		}
	};

	const launchImageLibrary = async () => {
		try {
			// For web, permissions are handled automatically by the browser
			if (Platform.OS !== 'web') {
				const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
				if (permissionResult.granted === false) {
					Alert.alert(
						Resources.CreateModal.Permission_Required,
						Resources.CreateModal.Permission_Message
					);
					return;
				}
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.8,
				base64: true,
			});

			if (!result.canceled && result.assets && result.assets[0]) {
				const asset = result.assets[0];
				if (asset.base64) {
					const mimeType = asset.type === 'image' ? 'image/jpeg' : 'image/jpeg';
					const base64Image = `data:${mimeType};base64,${asset.base64}`;
					setServerLogo(base64Image);
				}
			}
		} catch (error) {
			console.error('Error launching image library:', error);
			Alert.alert(Resources.CreateModal.Error, Resources.CreateModal.Library_Error);
		}
	};

	return (
		<Modal
			visible={visible}
			transparent={true}
			animationType="fade"
			onRequestClose={onClose}
		>
			<View style={styles.overlay}>
				<View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
					{/* Header */}
					<View style={styles.header}>
						<Text style={[styles.title, { color: colors.text }]}>
							{Resources.CreateModal.Title}
						</Text>
						<TouchableOpacity onPress={onClose} style={styles.closeButton}>
							<Text style={[styles.closeButtonText, { color: colors.tabIconDefault }]}>
								✕
							</Text>
						</TouchableOpacity>
					</View>

					{/* Type Selection */}
					<View style={styles.typeSelection}>
						<Button
							title={Resources.CreateModal.Server}
							onPress={() => handleSelectType('server')}
							variant={selectedType === 'server' ? 'primary' : 'outline'}
							size="medium"
							style={styles.typeButton}
						/>
						<Button
							title={Resources.CreateModal.Direct_Channel}
							onPress={() => handleSelectType('direct-channel')}
							variant={selectedType === 'direct-channel' ? 'primary' : 'outline'}
							size="medium"
							style={styles.typeButton}
						/>
					</View>

					{/* Form Content */}
					<View style={styles.formContainer}>
						{selectedType === 'server' ? (
							<>
								{/* Server Form */}
								<View style={styles.inputGroup}>
									<Text style={[styles.label, { color: colors.text }]}>
										{Resources.CreateModal.Server_Name} *
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
										value={serverName}
										onChangeText={setServerName}
										placeholder={Resources.CreateModal.Server_Name}
										placeholderTextColor={colors.tabIconDefault}
									/>
								</View>

								<View style={styles.inputGroup}>
									<Text style={[styles.label, { color: colors.text }]}>
										{Resources.CreateModal.Server_Logo}
									</Text>
									<Button
										title={Resources.CreateModal.Choose_Image}
										onPress={handleChooseImage}
										variant="outline"
										size="medium"
									/>
									{serverLogo && (
										<View style={styles.logoPreviewContainer}>
											<Text style={[styles.logoPreviewLabel, { color: colors.text }]}>
												{Resources.CreateModal.Logo_Preview}
											</Text>
											<Image
												source={{ uri: serverLogo }}
												style={styles.logoImage}
												resizeMode="cover"
											/>
										</View>
									)}
								</View>
							</>
						) : (
							<>
								{/* Direct Channel Form */}
								<View style={styles.inputGroup}>
									<Text style={[styles.label, { color: colors.text }]}>
										{Resources.CreateModal.Channel_Name} *
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
										placeholder={Resources.CreateModal.Channel_Name}
										placeholderTextColor={colors.tabIconDefault}
									/>
								</View>

								<View style={styles.inputGroup}>
									<Text style={[styles.label, { color: colors.text }]}>
										{Resources.CreateModal.User_ID} *
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
										value={userId}
										onChangeText={setUserId}
										placeholder={Resources.CreateModal.User_ID_Placeholder}
										placeholderTextColor={colors.tabIconDefault}
									/>
								</View>
							</>
						)}
					</View>

					{/* Action Buttons */}
					<View style={styles.actionButtons}>
						<Button
							title={Resources.CreateModal.Cancel}
							onPress={onClose}
							variant="outline"
							size="medium"
							style={styles.actionButton}
						/>
						<Button
							title={
								isLoading 
									? (selectedType === 'server' ? Resources.CreateModal.Creating_Server : Resources.CreateModal.Creating_Channel) 
									: (selectedType === 'server' ? Resources.CreateModal.Create_Server : Resources.CreateModal.Create_Channel)
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
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
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
		fontSize: 18,
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
	textArea: {
		height: 80,
		textAlignVertical: 'top',
	},
	imageButton: {
		marginBottom: 8,
	},
	logoPreview: {
		marginTop: 8,
		alignItems: 'center',
	},
	logoPreviewContainer: {
		marginTop: 8,
		alignItems: 'center',
	},
	logoPreviewLabel: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 8,
	},
	logoImage: {
		width: 60,
		height: 60,
		borderRadius: 8,
		marginTop: 8,
	},
	actionButtons: {
		flexDirection: 'row',
		gap: 12,
	},
	actionButton: {
		flex: 1,
	},
});
