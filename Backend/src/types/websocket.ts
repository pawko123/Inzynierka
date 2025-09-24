export interface JoinChannelData {
	channelId: string;
	serverId?: string;
}

export interface SendMessageData {
	channelId: string;
	content: string;
	serverId?: string;
}

export interface MessageUpdateData {
	messageId: string;
	content: string;
}

export interface MessageDeleteData {
	messageId: string;
}

export interface VoiceChannelJoinData {
	channelId: string;
	isMuted?: boolean;
	isCameraOn?: boolean;
}

export interface VoiceChannelLeaveData {
	channelId: string;
}

export interface VoiceUserUpdateData {
	channelId: string;
	isMuted?: boolean;
	isCameraOn?: boolean;
	isDeafened?: boolean;
	isScreenSharing?: boolean;
}

export interface WebRTCSignalData {
	channelId: string;
	targetUserId: string;
	offer?: RTCSessionDescriptionInit;
	answer?: RTCSessionDescriptionInit;
	candidate?: RTCIceCandidateInit;
}