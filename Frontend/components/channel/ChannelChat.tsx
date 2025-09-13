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
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { api } from '@/services/api';
import { translateError } from '@/utils/errorTranslator';
import MessageItem from '../message/MessageItem';
import MessageInput from '../message/MessageInput';

interface Channel {
	id: string;
	name: string;
	type: string;
	createdAt: string;
}

interface MessageAttachment {
	id: string;
	fileName: string;
	url: string;
	fileType: string;
	size: number;
}

interface MessageSender {
	id?: string;
	userId: string;
	memberName: string;
}

interface Message {
	messageId: string;
	content: string;
	channelId: string;
	sender: MessageSender;
	attachments: MessageAttachment[];
	createdAt: Date;
}

interface ChannelChatProps {
	channel: Channel;
	serverId: string;
}

export default function ChannelChat({ channel, serverId }: ChannelChatProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const flatListRef = useRef<FlatList>(null);

	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [sending, setSending] = useState(false);

	const fetchMessages = useCallback(async (isInitial = true) => {
		try {
			if (isInitial) {
				setLoading(true);
			}

			const params: any = {
				channelId: channel.id,
				limit: 50,
			};
			
			// Only add serverId for server channels, not for direct channels
			if (serverId && serverId.trim() !== '') {
				params.serverId = serverId;
			}

			const response = await api.get('/message/channelMessages', {
				params,
			});

			const fetchedMessages = response.data || [];
			// Messages come in DESC order (newest first), so reverse for chat display
			setMessages(fetchedMessages.reverse());
			setHasMore(fetchedMessages.length === 50);
		} catch (err: any) {
			console.error('Error fetching messages:', err);
			const errorMessage = translateError(err.response?.data?.error || 'Failed to load messages');
			Alert.alert('Error', errorMessage);
		} finally {
			setLoading(false);
		}
	}, [channel.id, serverId]);

	const loadMoreMessages = useCallback(async () => {
		if (loadingMore || !hasMore || messages.length === 0) return;

		try {
			setLoadingMore(true);
			const oldestMessage = messages[0];

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
				// Reverse because they come in DESC order
				setMessages(prev => [...olderMessages.reverse(), ...prev]);
				setHasMore(olderMessages.length === 20);
			} else {
				setHasMore(false);
			}
		} catch (err: any) {
			console.error('Error loading more messages:', err);
			const errorMessage = translateError(err.response?.data?.error || 'Failed to load more messages');
			Alert.alert('Error', errorMessage);
		} finally {
			setLoadingMore(false);
		}
	}, [channel.id, serverId, messages, loadingMore, hasMore]);

	const sendMessage = useCallback(async (content: string, attachments: any[] = []) => {
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
					formData.append('attachments', attachment.file, attachment.name || `attachment_${index}`);
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
				attachments: attachments.map(a => ({
					name: a.name,
					size: a.size,
					type: a.type,
					hasFile: !!a.file
				}))
			});

			const response = await api.post('/message/create', formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			});

			// Add new message to the list
			const newMessage = response.data;
			setMessages(prev => [...prev, newMessage]);

			// Scroll to bottom
			setTimeout(() => {
				flatListRef.current?.scrollToEnd({ animated: true });
			}, 100);

		} catch (err: any) {
			console.error('Error sending message:', err);
			const errorMessage = translateError(err.response?.data?.error || 'Failed to send message');
			Alert.alert('Error', errorMessage);
		} finally {
			setSending(false);
		}
	}, [channel.id, serverId, sending]);

	useEffect(() => {
		fetchMessages();
	}, [fetchMessages]);

	const renderMessage = ({ item }: { item: Message }) => (
		<MessageItem
			message={item}
			serverId={serverId}
			colors={colors}
		/>
	);

	const renderHeader = () => {
		if (!loadingMore || !hasMore) return null;
		return (
			<View style={styles.loadingMore}>
				<ActivityIndicator size="small" color={colors.tint} />
				<Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
					Loading more messages...
				</Text>
			</View>
		);
	};

	if (loading) {
		return (
			<View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
				<ActivityIndicator size="large" color={colors.tint} />
				<Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
					Loading messages...
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
				ListHeaderComponent={renderHeader}
				onEndReached={loadMoreMessages}
				onEndReachedThreshold={0.1}
				inverted={false}
				showsVerticalScrollIndicator={false}
			/>

			{/* Message Input */}
			<MessageInput
				onSendMessage={sendMessage}
				disabled={sending}
				colors={colors}
				placeholder={`Message #${channel.name}`}
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
	loadingText: {
		fontSize: 14,
	},
});
