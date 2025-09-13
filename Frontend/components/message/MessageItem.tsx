import React from 'react';
import {
	View,
	Text,
	StyleSheet,
} from 'react-native';
import { getStrings } from '@/i18n';
import { MessageItemProps } from '@/types/message';
import MessageAttachment from './attachment/MessageAttachment';

export default function MessageItem({ message, serverId, colors }: MessageItemProps) {
	const Resources = getStrings();
	
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
					minute: '2-digit' 
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

	return (
		<View style={[styles.messageContainer, { borderBottomColor: colors.border }]}>
			<View style={styles.messageHeader}>
				<Text style={[styles.senderName, { color: colors.text }]}>
					{(message.sender?.memberName || Resources.Chat.Unknown_User).toString()}
				</Text>
				<Text style={[styles.timestamp, { color: colors.tabIconDefault }]}>
					{formatTime(message.createdAt)}
				</Text>
			</View>
			
			{message.content && typeof message.content === 'string' && message.content.trim() && (
				<Text style={[styles.messageContent, { color: colors.text }]}>
					{message.content.toString().trim()}
				</Text>
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
});
