import { MediaStream as RNMediaStream } from 'react-native-webrtc';

export type CrossPlatformMediaStream = MediaStream | RNMediaStream;

export interface VoiceUser {
	userId: string;
	username: string;
	isMuted: boolean;
	isCameraOn: boolean;
	stream?: CrossPlatformMediaStream;
	peerConnection?: RTCPeerConnection;
}

export interface WebRTCCallbacks {
	onUserJoined: (user: VoiceUser) => void;
	onUserLeft: (userId: string) => void;
	onUserUpdated: (user: Partial<VoiceUser> & { userId: string }) => void;
	onStreamReceived: (userId: string, stream: CrossPlatformMediaStream) => void;
	onStreamRemoved: (userId: string) => void;
	onError: (error: string) => void;
}

export interface WebRTCOffer {
	fromUserId: string;
	offer: RTCSessionDescriptionInit;
}

export interface WebRTCAnswer {
	fromUserId: string;
	answer: RTCSessionDescriptionInit;
}

export interface WebRTCIceCandidate {
	fromUserId: string;
	candidate: RTCIceCandidateInit;
}

export interface VoiceChannelJoinData {
	channelId: string;
	isMuted: boolean;
	isCameraOn: boolean;
}

export interface VoiceChannelLeaveData {
	channelId: string;
}

export interface VoiceUserUpdateData {
	channelId: string;
	isCameraOn: boolean;
	isMuted: boolean;
}

export interface WebRTCSignalData {
	channelId: string;
	targetUserId: string;
	candidate?: RTCIceCandidateInit;
	offer?: RTCSessionDescriptionInit;
	answer?: RTCSessionDescriptionInit;
}
