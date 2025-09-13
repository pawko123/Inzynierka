import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Alert,
	Platform,
} from 'react-native';

interface MessageInputProps {
	onSendMessage: (content: string, attachments: any[]) => void;
	disabled: boolean;
	colors: any;
	placeholder: string;
}

export default function MessageInput({
	onSendMessage,
	disabled,
	colors,
	placeholder,
}: MessageInputProps) {
	const [message, setMessage] = useState('');
	const [attachments, setAttachments] = useState<any[]>([]);

	const handleSend = () => {
		if ((!message.trim() && attachments.length === 0) || disabled) return;
		
		onSendMessage(message, attachments);
		setMessage('');
		setAttachments([]);
	};

	const pickDocument = async () => {
		if (Platform.OS === 'web') {
			// For web, create a hidden file input and trigger it
			const input = document.createElement('input');
			input.type = 'file';
			input.multiple = true;
			input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
			
			input.onchange = (e: any) => {
				const files = Array.from(e.target.files || []);
				if (files.length > 0) {
					const newAttachments = files.map((file: any) => ({
						file,
						name: file.name,
						size: file.size,
						type: file.type,
					}));
					setAttachments(prev => [...prev, ...newAttachments]);
				}
			};
			
			input.click();
		} else {
			// For mobile, show placeholder message
			Alert.alert(
				'File Attachment',
				'File attachment feature will be implemented soon for mobile',
				[{ text: 'OK' }]
			);
		}
	};

	const removeAttachment = (index: number) => {
		setAttachments(prev => prev.filter((_, i) => i !== index));
	};

	const formatFileSize = (bytes: number) => {
		if (!bytes) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
			{/* Attachments Preview */}
			{attachments.length > 0 && (
				<ScrollView 
					horizontal 
					style={styles.attachmentsPreview}
					showsHorizontalScrollIndicator={false}
				>
					{attachments.map((attachment, index) => (
						<View key={index} style={[styles.attachmentItem, { backgroundColor: colors.card }]}>
							<Text style={[styles.attachmentName, { color: colors.text }]} numberOfLines={1}>
								{attachment.name}
							</Text>
							<Text style={[styles.attachmentSize, { color: colors.tabIconDefault }]}>
								{formatFileSize(attachment.size)}
							</Text>
							<TouchableOpacity 
								style={[styles.removeButton, { backgroundColor: colors.destructive }]}
								onPress={() => removeAttachment(index)}
							>
								<Text style={styles.removeButtonText}>×</Text>
							</TouchableOpacity>
						</View>
					))}
				</ScrollView>
			)}

			{/* Input Row */}
			<View style={styles.inputRow}>
				<TouchableOpacity
					style={[styles.attachButton, { backgroundColor: colors.card }]}
					onPress={pickDocument}
					disabled={disabled}
				>
					<Text style={[styles.attachButtonText, { color: colors.tint }]}>
						{'+'}
					</Text>
				</TouchableOpacity>

				<TextInput
					style={[
						styles.textInput,
						{ 
							backgroundColor: colors.inputBackground || colors.card,
							color: colors.text,
							borderColor: colors.border,
						}
					]}
					value={message}
					onChangeText={setMessage}
					placeholder={placeholder}
					placeholderTextColor={colors.placeholder || colors.tabIconDefault}
					multiline={true}
					maxLength={2000}
					editable={!disabled}
				/>

				<TouchableOpacity
					style={[
						styles.sendButton,
						{
							backgroundColor: (message.trim() || attachments.length > 0) && !disabled
								? colors.tint
								: colors.tabIconDefault,
						}
					]}
					onPress={handleSend}
					disabled={(!message.trim() && attachments.length === 0) || disabled}
				>
					<Text style={[
						styles.sendButtonText,
						{
							color: (message.trim() || attachments.length > 0) && !disabled
								? colors.background
								: colors.text
						}
					]}>Send</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		borderTopWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	attachmentsPreview: {
		marginBottom: 8,
		maxHeight: 60,
	},
	attachmentItem: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		marginRight: 8,
		borderRadius: 8,
		minWidth: 120,
		maxWidth: 200,
		position: 'relative',
	},
	attachmentName: {
		fontSize: 12,
		fontWeight: '500',
		marginBottom: 2,
	},
	attachmentSize: {
		fontSize: 10,
	},
	removeButton: {
		position: 'absolute',
		top: -4,
		right: -4,
		borderRadius: 10,
		width: 20,
		height: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	removeButtonText: {
		color: 'white',
		fontSize: 14,
		fontWeight: 'bold',
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: 8,
	},
	attachButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	attachButtonText: {
		fontSize: 20,
		fontWeight: 'bold',
		lineHeight: 20,
		textAlign: 'center',
	},
	textInput: {
		flex: 1,
		minHeight: 40,
		maxHeight: 120,
		borderWidth: 1,
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 11,
		fontSize: 16,
		textAlignVertical: 'center',
	},
	sendButton: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	sendButtonText: {
		fontSize: 14,
		fontWeight: '600',
	},
});
