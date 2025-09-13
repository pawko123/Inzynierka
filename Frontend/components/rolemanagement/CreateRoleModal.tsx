import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Modal,
	TextInput,
	TouchableOpacity,
	Alert,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { getStrings } from '@/i18n';
import { CreateRoleModalProps } from '@/types/roles';

const predefinedColors = [
	'#FF5733', '#33FF57', '#3357FF', '#FF33F1', '#F1FF33',
	'#33FFF1', '#FF8C33', '#8C33FF', '#33FF8C', '#FF3333',
	'#9333FF', '#33FF93', '#FF3393', '#93FF33', '#3393FF',
];

export default function CreateRoleModal({
	visible,
	onClose,
	onCreateRole,
}: CreateRoleModalProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const Resources = getStrings();

	const [roleName, setRoleName] = useState('');
	const [selectedColor, setSelectedColor] = useState(predefinedColors[0]);
	const [isCreating, setIsCreating] = useState(false);

	const handleCreate = async () => {
		if (!roleName.trim()) {
			Alert.alert('Error', 'Role name is required');
			return;
		}

		try {
			setIsCreating(true);
			await onCreateRole(roleName.trim(), selectedColor);
			
			// Reset form
			setRoleName('');
			setSelectedColor(predefinedColors[0]);
		} catch {
			// Error is handled in parent component
		} finally {
			setIsCreating(false);
		}
	};

	const handleClose = () => {
		if (!isCreating) {
			setRoleName('');
			setSelectedColor(predefinedColors[0]);
			onClose();
		}
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={handleClose}
		>
			<View style={styles.overlay}>
				<View style={[styles.modal, { backgroundColor: colors.card }]}>
					<View style={[styles.header, { borderBottomColor: colors.border }]}>
						<Text style={[styles.title, { color: colors.text }]}>
							{Resources.ServerManagement.Create_Role}
						</Text>
						<TouchableOpacity onPress={handleClose} style={styles.closeButton}>
							<Text style={[styles.closeButtonText, { color: colors.text }]}>×</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.content}>
						{/* Role Name Input */}
						<View style={styles.section}>
							<Text style={[styles.label, { color: colors.text }]}>
								{Resources.ServerManagement.Role_Name}
							</Text>
							<TextInput
								style={[
									styles.input,
									{
										backgroundColor: colors.inputBackground,
										borderColor: colors.border,
										color: colors.text,
									},
								]}
								value={roleName}
								onChangeText={setRoleName}
								placeholder="Enter role name..."
								placeholderTextColor={colors.placeholder}
								maxLength={50}
								editable={!isCreating}
							/>
						</View>

						{/* Color Selection */}
						<View style={styles.section}>
							<Text style={[styles.label, { color: colors.text }]}>
								{Resources.ServerManagement.Role_Color}
							</Text>
							<View style={styles.colorGrid}>
								{predefinedColors.map((color) => (
									<TouchableOpacity
										key={color}
										style={[
											styles.colorOption,
											{ backgroundColor: color },
											selectedColor === color && styles.selectedColor,
										]}
										onPress={() => setSelectedColor(color)}
										disabled={isCreating}
									>
										{selectedColor === color && (
											<Text style={styles.checkmark}>✓</Text>
										)}
									</TouchableOpacity>
								))}
							</View>
						</View>

						{/* Preview */}
						<View style={styles.section}>
							<Text style={[styles.label, { color: colors.text }]}>Preview</Text>
							<View style={[styles.preview, { backgroundColor: colors.background, borderColor: colors.border }]}>
								<View style={[styles.rolePreview, { borderColor: colors.border }]}>
									<View style={[styles.colorIndicator, { backgroundColor: selectedColor }]} />
									<Text style={[styles.previewText, { color: colors.text }]}>
										{roleName || 'Role Name'}
									</Text>
								</View>
							</View>
						</View>
					</View>

					<View style={[styles.footer, { borderTopColor: colors.border }]}>
						<TouchableOpacity
							style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
							onPress={handleClose}
							disabled={isCreating}
						>
							<Text style={[styles.buttonText, { color: colors.text }]}>
								{Resources.ServerManagement.Cancel}
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[
								styles.button,
								styles.createButton,
								{ backgroundColor: colors.tint },
								isCreating && styles.disabledButton,
							]}
							onPress={handleCreate}
							disabled={isCreating || !roleName.trim()}
						>
							<Text style={[styles.buttonText, { color: colors.background }]}>
								{isCreating ? Resources.ServerManagement.Creating : Resources.ServerManagement.Create}
							</Text>
						</TouchableOpacity>
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
	modal: {
		width: '100%',
		maxWidth: 400,
		borderRadius: 12,
		maxHeight: '80%',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
	},
	title: {
		fontSize: 18,
		fontWeight: '600',
		flex: 1,
	},
	closeButton: {
		padding: 4,
	},
	closeButtonText: {
		fontSize: 24,
		fontWeight: 'bold',
	},
	content: {
		padding: 16,
	},
	section: {
		marginBottom: 20,
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
		fontSize: 14,
	},
	colorGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	colorOption: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	selectedColor: {
		borderWidth: 3,
		borderColor: 'white',
	},
	checkmark: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
	preview: {
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
	},
	rolePreview: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 8,
		borderRadius: 6,
		borderWidth: 1,
	},
	colorIndicator: {
		width: 12,
		height: 12,
		borderRadius: 6,
		marginRight: 8,
	},
	previewText: {
		fontSize: 14,
		fontWeight: '500',
	},
	footer: {
		flexDirection: 'row',
		padding: 16,
		gap: 12,
		borderTopWidth: 1,
	},
	button: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	cancelButton: {
		borderWidth: 1,
	},
	createButton: {
		// backgroundColor set dynamically
	},
	disabledButton: {
		opacity: 0.6,
	},
	buttonText: {
		fontSize: 14,
		fontWeight: '600',
	},
});
