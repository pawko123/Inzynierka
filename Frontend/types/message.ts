export interface MessageAttachmentData {
	id: string;
	fileName: string;
	url: string;
	fileType: string;
	size: number;
}

export interface MessageSender {
	id?: string;
	userId: string;
	memberName: string;
}

export interface Message {
	id?: string;
	messageId: string; // primary identifier
	content: string | null;
	channelId: string; // Required - every message belongs to a channel
	createdAt: Date;
	updatedAt?: Date;
	attachments?: MessageAttachmentData[];
	sender?: MessageSender; // Make sender optional to handle undefined cases
}

export interface MessageItemProps {
	message: Message;
	serverId?: string;
	colors: any;
	onDeleteMessage?: (messageId: string) => void;
	onEditMessage?: (messageId: string, newContent: string) => void;
	canEdit?: boolean;
	canDelete?: boolean;
}

export interface MessageInputProps {
	onSendMessage: (content: string, attachments: any[]) => void;
	disabled: boolean;
	colors: any;
	placeholder: string;
	channelId: string;
}

export interface VideoAttachmentProps {
	attachment: MessageAttachmentData;
	serverId?: string;
	channelId: string;
	colors: any;
}

export interface AudioAttachmentProps {
	attachment: MessageAttachmentData;
	serverId?: string;
	channelId: string;
	colors: any;
}

export interface ImageAttachmentProps {
	attachment: MessageAttachmentData;
	serverId?: string;
	channelId: string;
	colors: any;
}

export interface FileAttachmentProps {
	attachment: MessageAttachmentData;
	serverId?: string;
	channelId: string;
	colors: any;
}

export interface MessageAttachmentProps {
	attachment: MessageAttachmentData;
	serverId?: string;
	channelId: string;
	colors: any;
}
