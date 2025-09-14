import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	Alert,
	TouchableOpacity,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { api } from '@/services/api';
import { MessageService } from '@/services/MessageService';
import { translateError } from '@/utils/errorTranslator';
import { webSocketService } from '@/services/WebSocketService';
import { getStrings } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import type {
	MessageData,
	MessageDeletedData,
	MessageUpdatedData,
} from '@/services/WebSocketService';
import { ChannelChatProps } from '@/types/server';
import { Message } from '@/types/message';
import MessageItem from '../message/MessageItem';
import MessageInput from '../message/MessageInput';

export default function ChannelChat({ channel, serverId }: ChannelChatProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const flatListRef = useRef<FlatList>(null);
	const { currentUser } = useAuth();

	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [sending, setSending] = useState(false);
	const [channelPermissions, setChannelPermissions] = useState<{ [key: string]: boolean }>({});

	const fetchMessages = useCallback(
		async (isInitial = true) => {
			try {
				if (isInitial) {
					setLoading(true);
				}

				const params: any = {
					channelId: channel.id,
				};

				// Only add serverId for server channels, not for direct channels
				if (serverId && serverId.trim() !== '') {
					params.serverId = serverId;
				}

				const response = await api.get('/message/channelMessages', {
					params,
				});

				const fetchedMessages = response.data || [];
				// Messages come in DESC order (newest first) - keep this order for inverted FlatList
				// Also normalize content field to handle empty strings and nulls
				const normalizedMessages = fetchedMessages.map((msg: any) => ({
					...msg,
					content: msg.content && msg.content.trim() ? msg.content : null,
				}));
				setMessages(normalizedMessages);
				setHasMore(fetchedMessages.length === 10);
			} catch (err: any) {
				console.error('Error fetching messages:', err);
				const errorMessage = translateError(
					err.response?.data?.error || getStrings().Chat.Failed_To_Load,
				);
				Alert.alert(getStrings().Chat.Error, errorMessage);
			} finally {
				setLoading(false);
			}
		},
		[channel.id, serverId],
	);

	const loadMoreMessages = useCallback(async () => {
		if (loadingMore || !hasMore || messages.length === 0) return;

		try {
			setLoadingMore(true);
			const oldestMessage = messages[messages.length - 1]; // Last message in inverted list is oldest

			const params: any = {
				channelId: channel.id,
				lastMessageId: oldestMessage.messageId,
				limit: 20,
			};

			// Only add serverId for server channels, not for direct channels
			if (serverId && serverId.trim() !== '') {
				params.serverId = serverId;
			}

			const response = await api.get('/message/nextMessages', {
				params,
			});

			const olderMessages = response.data || [];
			if (olderMessages.length > 0) {
				// Messages come in DESC order, keep this order and normalize content
				const normalizedOlderMessages = olderMessages.map((msg: any) => ({
					...msg,
					content: msg.content && msg.content.trim() ? msg.content : null,
				}));
				setMessages((prev) => [...prev, ...normalizedOlderMessages]); // Append to end for inverted list
				setHasMore(olderMessages.length === 20);
			} else {
				setHasMore(false);
			}
		} catch (err: any) {
			console.error('Error loading more messages:', err);
			const errorMessage = translateError(
				err.response?.data?.error || getStrings().Chat.Failed_To_Load,
			);
			Alert.alert(getStrings().Chat.Error, errorMessage);
		} finally {
			setLoadingMore(false);
		}
	}, [channel.id, serverId, messages, loadingMore, hasMore]);

	const sendMessage = useCallback(
		async (content: string, attachments: any[] = []) => {
			if ((!content?.trim() && attachments.length === 0) || sending) return;

			try {
				setSending(true);

				const formData = new FormData();
				formData.append('content', content);
				formData.append('channelId', channel.id);

				// Only add serverId for server channels, not for direct channels
				if (serverId && serverId.trim() !== '') {
					formData.append('serverId', serverId);
				}

				// Add attachments to form data
				attachments.forEach((attachment, index) => {
					if (attachment.file) {
						// Web File object
						formData.append(
							'attachments',
							attachment.file,
							attachment.name || `attachment_${index}`,
						);
					} else {
						// Mobile/React Native format (uri, type, name)
						formData.append('attachments', {
							uri: attachment.uri,
							type: attachment.type,
							name: attachment.name || `attachment_${index}`,
						} as any);
					}
				});

				console.log('Sending message:', {
					content,
					channelId: channel.id,
					serverId,
					attachmentsCount: attachments.length,
					attachments: attachments.map((a) => ({
						name: a.name,
						size: a.size,
						type: a.type,
						hasFile: !!a.file,
					})),
				});

				const response = await api.post('/message/create', formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				});

				console.log('Message sent successfully:', response.data);

				// Note: We don't add the message locally here because it will be added
				// via WebSocket when the server broadcasts it to all connected clients
			} catch (err: any) {
				console.error('Error sending message:', err);
				const errorMessage = translateError(
					err.response?.data?.error || getStrings().Chat.Failed_To_Send,
				);
				Alert.alert(getStrings().Chat.Error, errorMessage);
			} finally {
				setSending(false);
			}
		},
		[channel.id, serverId, sending],
	);

	// Check permissions once when entering the channel
	useEffect(() => {
		const checkChannelPermissions = async () => {
			if (!currentUser) {
				setChannelPermissions({});
				return;
			}

			try {
				const isDirect = !serverId || serverId.trim() === '';
				if (isDirect) {
					// In direct channels, users can manage their own messages
					setChannelPermissions({ MANAGE_MESSAGES: true });
				} else {
					// Fetch all channel permissions
					const allChannelPermissions = [
						'VIEW_CHANNEL',
						'SEND_MESSAGES',
						'MANAGE_MESSAGES',
						'CONNECT',
						'SPEAK',
						'MUTE_MEMBERS',
						'DEAFEN_MEMBERS',
					];

					const permissions = await MessageService.getUserPermissionsOnChannel(
						channel.id,
						serverId,
						allChannelPermissions,
					);
					setChannelPermissions(permissions);
				}
			} catch (error) {
				console.error('Error checking channel permissions:', error);
				setChannelPermissions({});
			}
		};

		checkChannelPermissions();
	}, [channel.id, serverId, currentUser]);

	useEffect(() => {
		fetchMessages();

		// Join the channel room for real-time updates
		webSocketService.joinChannel(channel.id, serverId);

		// Set up WebSocket event listeners
		const handleNewMessage = (messageData: MessageData) => {
			if (messageData.channelId === channel.id) {
				console.log('Received new message via WebSocket:', messageData);
				setMessages((prev) => {
					// Check if message already exists (to avoid duplicates)
					const exists = prev.some((msg) => msg.messageId === messageData.messageId);
					if (!exists) {
						return [
							{
								messageId: messageData.messageId,
								content:
									messageData.content && messageData.content.trim()
										? messageData.content
										: null,
								channelId: messageData.channelId,
								sender: messageData.sender,
								attachments: messageData.attachments || [],
								createdAt: new Date(messageData.createdAt),
							},
							...prev,
						]; // Prepend to beginning for inverted list
					}
					return prev;
				});
			}
		};

		const handleMessageDeleted = (data: MessageDeletedData) => {
			if (data.channelId === channel.id) {
				console.log('Message deleted via WebSocket:', data);
				setMessages((prev) => prev.filter((msg) => msg.messageId !== data.messageId));
			}
		};

		const handleMessageUpdated = (data: MessageUpdatedData) => {
			if (data.channelId === channel.id) {
				console.log('Message updated via WebSocket:', data);
				setMessages((prev) =>
					prev.map((msg) =>
						msg.messageId === data.messageId ? { ...msg, content: data.content } : msg,
					),
				);
			}
		};

		// Register event listeners
		webSocketService.on('message-created', handleNewMessage);
		webSocketService.on('message-deleted', handleMessageDeleted);
		webSocketService.on('message-updated', handleMessageUpdated);

		// Cleanup function
		return () => {
			webSocketService.leaveChannel(channel.id, serverId);
			webSocketService.off('message-created', handleNewMessage);
			webSocketService.off('message-deleted', handleMessageDeleted);
			webSocketService.off('message-updated', handleMessageUpdated);
		};
	}, [channel.id, serverId, fetchMessages]);

	// Reset state when channel changes for immediate UI feedback
	useEffect(() => {
		setMessages([]);
		setHasMore(true);
		setLoading(true);
	}, [channel.id, serverId]);

	const handleDeleteMessage = useCallback((messageId: string) => {
		setMessages((prev) => prev.filter((msg) => msg.messageId !== messageId));
	}, []);

	const handleEditMessage = useCallback((messageId: string, newContent: string) => {
		setMessages((prev) =>
			prev.map((msg) =>
				msg.messageId === messageId ? { ...msg, content: newContent } : msg,
			),
		);
	}, []);

	const renderMessage = ({ item }: { item: Message }) => {
		// Determine if the current user can edit/delete this specific message
		const canEditMessage = Boolean(
			currentUser &&
				// User can edit their own messages
				(item.sender?.userId === currentUser.id ||
					// Or if they have MANAGE_MESSAGES permission
					channelPermissions.MANAGE_MESSAGES),
		);

		const canDeleteMessage = Boolean(
			currentUser &&
				// User can delete their own messages
				(item.sender?.userId === currentUser.id ||
					// Or if they have MANAGE_MESSAGES permission
					channelPermissions.MANAGE_MESSAGES),
		);

		return (
			<MessageItem
				message={item}
				serverId={serverId}
				colors={colors}
				onDeleteMessage={handleDeleteMessage}
				onEditMessage={handleEditMessage}
				canEdit={canEditMessage}
				canDelete={canDeleteMessage}
			/>
		);
	};

	const renderHeader = () => {
		if (!hasMore) return null;

		return (
			<View style={styles.loadMoreContainer}>
				{loadingMore ? (
					<View style={styles.loadingMore}>
						<ActivityIndicator size="small" color={colors.tint} />
						<Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
							{getStrings().Chat.Loading_More_Messages}
						</Text>
					</View>
				) : (
					<TouchableOpacity
						style={[
							styles.loadMoreButton,
							{ borderColor: colors.border, backgroundColor: colors.card },
						]}
						onPress={loadMoreMessages}
						disabled={loadingMore}
					>
						<Text style={[styles.loadMoreButtonText, { color: colors.tint }]}>
							{getStrings().Chat.Load_More_Messages}
						</Text>
					</TouchableOpacity>
				)}
			</View>
		);
	};

	if (loading) {
		return (
			<View
				style={[
					styles.container,
					styles.loadingContainer,
					{ backgroundColor: colors.background },
				]}
			>
				<ActivityIndicator size="large" color={colors.tint} />
				<Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
					{getStrings().Chat.Loading_Messages}
				</Text>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: colors.background }]}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
		>
			{/* Channel Header */}
			<View style={[styles.header, { borderBottomColor: colors.border }]}>
				<Text style={[styles.channelName, { color: colors.text }]}>
					{channel.type === 'voice' ? '🔊' : '#'} {channel.name}
				</Text>
			</View>

			{/* Messages List */}
			<FlatList
				ref={flatListRef}
				data={messages}
				renderItem={renderMessage}
				keyExtractor={(item) => item.messageId}
				style={styles.messagesList}
				contentContainerStyle={styles.messagesContainer}
				ListFooterComponent={renderHeader}
				inverted={true}
				showsVerticalScrollIndicator={false}
				initialNumToRender={10}
				maxToRenderPerBatch={10}
				windowSize={10}
			/>

			{/* Message Input */}
			<MessageInput
				onSendMessage={sendMessage}
				disabled={sending}
				colors={colors}
				placeholder={`${getStrings().Chat.Message_Placeholder} #${channel.name}`}
				channelId={channel.id}
			/>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		gap: 12,
	},
	header: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	channelName: {
		fontSize: 18,
		fontWeight: '600',
	},
	messagesList: {
		flex: 1,
	},
	messagesContainer: {
		paddingVertical: 8,
	},
	loadingMore: {
		padding: 16,
		alignItems: 'center',
		gap: 8,
	},
	loadMoreContainer: {
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	loadMoreButton: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		borderWidth: 1,
		alignItems: 'center',
	},
	loadMoreButtonText: {
		fontSize: 14,
		fontWeight: '500',
	},
	loadingText: {
		fontSize: 14,
	},
});
