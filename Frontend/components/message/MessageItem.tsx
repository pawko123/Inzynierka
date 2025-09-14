import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { getStrings } from '@/i18n';
import { MessageItemProps } from '@/types/message';
import MessageAttachment from './attachment/MessageAttachment';
import { MessageService } from '@/services/MessageService';

export default function MessageItem({
	message,
	serverId,
	colors,
	onDeleteMessage,
	onEditMessage,
	canEdit = false,
	canDelete = false,
}: MessageItemProps) {
	const Resources = getStrings();
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(message.content || '');
	const [showDropdown, setShowDropdown] = useState(false);
	const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
	const dropdownRef = useRef<View>(null);

	const formatTime = (date: Date) => {
		try {
			const messageDate = new Date(date);
			if (isNaN(messageDate.getTime())) {
				return 'Invalid Date';
			}

			const now = new Date();
			const diffTime = now.getTime() - messageDate.getTime();
			const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

			if (diffDays === 0) {
				// Today - show time only
				return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
			} else if (diffDays === 1) {
				// Yesterday
				return `Yesterday ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
			} else if (diffDays < 7) {
				// This week - show day and time
				return messageDate.toLocaleDateString([], {
					weekday: 'short',
					hour: '2-digit',
					minute: '2-digit',
				});
			} else {
				// Older - show date and time
				return messageDate.toLocaleDateString([], {
					month: 'short',
					day: 'numeric',
					year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
					hour: '2-digit',
					minute: '2-digit',
				});
			}
		} catch (error) {
			console.error('Error formatting time:', error);
			return 'Invalid Date';
		}
	};

	const handleEdit = () => {
		setEditContent(message.content || '');
		setIsEditing(true);
	};

	const handleCancelEdit = () => {
		setIsEditing(false);
		setEditContent(message.content || '');
	};

	const handleSaveEdit = async () => {
		if (!editContent.trim()) {
			// Just return without showing alert - user can see empty input
			return;
		}

		try {
			await MessageService.updateMessage(message.messageId, editContent.trim());
			setIsEditing(false);
			onEditMessage?.(message.messageId, editContent.trim());
		} catch (error: any) {
			console.error('Error updating message:', error);
			// Could implement a toast notification here instead of alert
		}
	};

	const handleDelete = async () => {
		try {
			await MessageService.deleteMessage(message.messageId);
			onDeleteMessage?.(message.messageId);
			setShowDropdown(false);
		} catch (error: any) {
			console.error('Error deleting message:', error);
			// Could implement a toast notification here instead of alert
		}
	};

	const handleDropdownToggle = () => {
		if (!showDropdown) {
			// Calculate position when opening dropdown
			dropdownRef.current?.measureInWindow((x, y, width, height) => {
				const screenHeight = Dimensions.get('window').height;
				const dropdownHeight = 120; // Approximate dropdown height
				const spaceBelow = screenHeight - (y + height);

				if (spaceBelow < dropdownHeight && y > dropdownHeight) {
					setDropdownPosition('above');
				} else {
					setDropdownPosition('below');
				}
			});
		}
		setShowDropdown(!showDropdown);
	};

	return (
		<View style={[styles.messageContainer, { borderBottomColor: colors.border }]}>
			<View style={styles.messageHeader}>
				<Text style={[styles.senderName, { color: colors.text }]}>
					{(message.sender?.memberName || Resources.Chat.Unknown_User).toString()}
				</Text>
				<Text style={[styles.timestamp, { color: colors.tabIconDefault }]}>
					{formatTime(message.createdAt)}
				</Text>
				{/* Dropdown menu button */}
				{(canEdit || canDelete) && (
					<View style={styles.dropdownContainer} ref={dropdownRef}>
						<TouchableOpacity
							onPress={handleDropdownToggle}
							style={[styles.menuButton, { backgroundColor: colors.card }]}
						>
							<Text style={[styles.menuButtonText, { color: colors.text }]}>⋯</Text>
						</TouchableOpacity>
						{showDropdown && (
							<>
								<TouchableOpacity
									style={styles.dropdownOverlay}
									onPress={() => setShowDropdown(false)}
									activeOpacity={1}
								/>
								<View
									style={[
										styles.dropdown,
										dropdownPosition === 'above'
											? styles.dropdownAbove
											: styles.dropdownBelow,
										{
											backgroundColor: colors.card,
											borderColor: colors.border,
										},
									]}
								>
									{canEdit && (
										<TouchableOpacity
											onPress={() => {
												handleEdit();
												setShowDropdown(false);
											}}
											style={styles.dropdownItem}
										>
											<Text
												style={[
													styles.dropdownItemText,
													{ color: colors.text },
												]}
											>
												{Resources.Chat.Edit_Message}
											</Text>
										</TouchableOpacity>
									)}
									{canEdit && canDelete && (
										<View
											style={[
												styles.dropdownSeparator,
												{ borderColor: colors.border },
											]}
										/>
									)}
									{canDelete && (
										<TouchableOpacity
											onPress={handleDelete}
											style={styles.dropdownItem}
										>
											<Text
												style={[
													styles.dropdownItemText,
													{ color: colors.destructive },
												]}
											>
												{Resources.Chat.Delete_Message}
											</Text>
										</TouchableOpacity>
									)}
								</View>
							</>
						)}
					</View>
				)}
			</View>

			{isEditing ? (
				<View style={styles.editContainer}>
					<TextInput
						style={[
							styles.editInput,
							{ color: colors.text, borderColor: colors.border },
						]}
						value={editContent}
						onChangeText={setEditContent}
						multiline
						placeholder="Enter message..."
						placeholderTextColor={colors.tabIconDefault}
					/>
					<View style={styles.editButtons}>
						<TouchableOpacity
							onPress={handleCancelEdit}
							style={[styles.editButton, { backgroundColor: colors.tabIconDefault }]}
						>
							<Text style={styles.editButtonText}>{Resources.Chat.Cancel}</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={handleSaveEdit}
							style={[styles.editButton, { backgroundColor: colors.tint }]}
						>
							<Text style={styles.editButtonText}>{Resources.Chat.Save}</Text>
						</TouchableOpacity>
					</View>
				</View>
			) : (
				message.content &&
				typeof message.content === 'string' &&
				message.content.trim() && (
					<Text style={[styles.messageContent, { color: colors.text }]}>
						{message.content.toString().trim()}
					</Text>
				)
			)}

			{message.attachments && message.attachments.length > 0 && (
				<View style={styles.attachmentsContainer}>
					{message.attachments.map((attachment) => (
						<MessageAttachment
							key={attachment.id}
							attachment={attachment}
							serverId={serverId}
							channelId={message.channelId}
							colors={colors}
						/>
					))}
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	messageContainer: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderBottomWidth: 0.5,
		marginBottom: 2,
	},
	messageHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 4,
	},
	senderName: {
		fontSize: 14,
		fontWeight: '600',
		marginRight: 8,
	},
	timestamp: {
		fontSize: 12,
	},
	messageContent: {
		fontSize: 16,
		lineHeight: 20,
		marginBottom: 4,
	},
	attachmentsContainer: {
		marginTop: 8,
		gap: 8,
	},
	dropdownContainer: {
		position: 'relative',
		marginLeft: 'auto',
	},
	menuButton: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
		minWidth: 30,
		alignItems: 'center',
	},
	menuButtonText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	dropdownOverlay: {
		position: 'absolute',
		top: -1000,
		left: -1000,
		right: -1000,
		bottom: -1000,
		zIndex: 1,
	},
	dropdown: {
		position: 'absolute',
		right: 0,
		borderWidth: 1,
		borderRadius: 8,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
		minWidth: 120,
		zIndex: 2,
	},
	dropdownBelow: {
		top: 35,
	},
	dropdownAbove: {
		bottom: 35,
	},
	dropdownItem: {
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	dropdownSeparator: {
		borderBottomWidth: 0.5,
		marginHorizontal: 16,
	},
	dropdownItemText: {
		fontSize: 16,
	},
	editContainer: {
		marginTop: 8,
	},
	editInput: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		maxHeight: 120,
		textAlignVertical: 'top',
	},
	editButtons: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 8,
		marginTop: 8,
	},
	editButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 6,
		minWidth: 60,
		alignItems: 'center',
	},
	editButtonText: {
		fontSize: 14,
		fontWeight: '500',
		color: '#fff',
	},
});
