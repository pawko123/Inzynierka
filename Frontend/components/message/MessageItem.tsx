import React from 'react';
import {
	View,
	Text,
	StyleSheet,
} from 'react-native';
import MessageAttachment from './attachment/MessageAttachment';

interface MessageAttachmentData {
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
	sender?: MessageSender; // Make sender optional to handle undefined cases
	attachments: MessageAttachmentData[];
	createdAt: Date;
}

interface MessageItemProps {
	message: Message;
	serverId: string;
	colors: any;
}

export default function MessageItem({ message, serverId, colors }: MessageItemProps) {
	const formatTime = (date: Date) => {
		const messageDate = new Date(date);
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
	};

	return (
		<View style={[styles.messageContainer, { borderBottomColor: colors.border }]}>
			<View style={styles.messageHeader}>
				<Text style={[styles.senderName, { color: colors.text }]}>
					{message.sender?.memberName || 'Unknown User'}
				</Text>
				<Text style={[styles.timestamp, { color: colors.tabIconDefault }]}>
					{formatTime(message.createdAt)}
				</Text>
			</View>
			
			{message.content && (
				<Text style={[styles.messageContent, { color: colors.text }]}>
					{message.content}
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
