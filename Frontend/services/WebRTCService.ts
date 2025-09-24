import { Platform } from 'react-native';
import { webSocketService } from './WebSocketService';
import { getStrings } from '@/i18n';
import {
	VoiceUser,
	WebRTCCallbacks,
	WebRTCOffer,
	WebRTCAnswer,
	WebRTCIceCandidate,
	VoiceChannelJoinData,
	VoiceChannelLeaveData,
	VoiceUserUpdateData,
	WebRTCSignalData,
} from '@/types/webrtc';

let webRTCModule: any = null;
let webRTCModuleLoaded = false;
let webRTCModulePromise: Promise<any> | null = null;
let webRTCModuleLoadFailed = false;

if (Platform.OS !== 'web') {
	webRTCModulePromise = import('react-native-webrtc').then((module) => {
		console.log('WebRTC module imported successfully:', !!module);
		console.log('Module keys:', Object.keys(module));
		// Access the module through the default export
		webRTCModule = module.default || module;
		console.log('WebRTC module after default access:', !!webRTCModule);
		console.log('WebRTC module keys after default:', webRTCModule ? Object.keys(webRTCModule) : 'null');
		
		// Try to access mediaDevices in different ways
		if (webRTCModule) {
			console.log('Checking for mediaDevices...');
			console.log('Direct mediaDevices:', !!webRTCModule.mediaDevices);
			console.log('MediaDevices class:', !!webRTCModule.MediaDevices);
			console.log('mediaDevices as property:', !!webRTCModule['mediaDevices']);
			
			// If mediaDevices doesn't exist, try to create it
			if (!webRTCModule.mediaDevices && webRTCModule.MediaDevices) {
				console.log('Creating mediaDevices instance...');
				webRTCModule.mediaDevices = new webRTCModule.MediaDevices();
			}
		}
		
		webRTCModuleLoaded = true;
		return module;
	}).catch((error) => {
		console.error('React Native WebRTC import failed:', error);
		webRTCModuleLoaded = true; // Mark as loaded even if failed
		webRTCModuleLoadFailed = true;
		return null;
	});
} else {
	webRTCModuleLoaded = true; // Web doesn't need the module
}

class WebRTCService {
	private channelId: string | null = null;
	private localStream: MediaStream | null = null;
	private localVideoStream: MediaStream | null = null;
	private peerConnections: Map<string, RTCPeerConnection> = new Map();
	private connectedUsers: Map<string, VoiceUser> = new Map();
	private callbacks: WebRTCCallbacks | null = null;
	private isInCall = false;
	private isMuted = false;
	private isCameraOn = false;
	
	private readonly iceServers: RTCIceServer[] = [
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:stun1.l.google.com:19302' },
	];

	constructor() {
		this.setupWebSocketListeners();
	}

	private async ensureWebRTCModuleLoaded(): Promise<void> {
		if (Platform.OS === 'web') {
			return; // No module loading needed for web
		}
		
		const strings = getStrings();
		
		if (webRTCModuleLoaded) {
			if (webRTCModuleLoadFailed || !webRTCModule) {
				throw new Error(strings.WebRTC.Module_Load_Failed);
			}
			return; // Already loaded successfully
		}
		
		if (webRTCModulePromise) {
			await webRTCModulePromise;
			if (webRTCModuleLoadFailed || !webRTCModule) {
				throw new Error(strings.WebRTC.Module_Load_Failed);
			}
			return;
		}
		
		throw new Error(strings.WebRTC.Module_Not_Available);
	}

	private setupWebSocketListeners(): void {
		webSocketService.on('webrtc-offer', this.handleOffer.bind(this));
		webSocketService.on('webrtc-answer', this.handleAnswer.bind(this));
		webSocketService.on('webrtc-ice-candidate', this.handleIceCandidate.bind(this));
		webSocketService.on('voice-user-joined', this.handleUserJoined.bind(this));
		webSocketService.on('voice-user-left', this.handleUserLeft.bind(this));
		webSocketService.on('voice-user-updated', this.handleUserUpdated.bind(this));
	}

	async joinVoiceChannel(channelId: string, callbacks: WebRTCCallbacks): Promise<void> {
		try {
			this.channelId = channelId;
			this.callbacks = callbacks;
			this.isInCall = true;

			await this.initializeLocalAudioStream();

			if (webSocketService.isConnected()) {
				const joinData: VoiceChannelJoinData = {
					channelId,
					isMuted: this.isMuted,
					isCameraOn: this.isCameraOn,
				};
				webSocketService.emitToServer('join-voice-channel', joinData);
			}
		} catch (error) {
			console.error('Error joining voice channel:', error);
			this.callbacks?.onError(`Failed to join voice channel: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	async leaveVoiceChannel(): Promise<void> {
		try {
			if (this.channelId && webSocketService.isConnected()) {
				const leaveData: VoiceChannelLeaveData = { channelId: this.channelId };
				webSocketService.emitToServer('leave-voice-channel', leaveData);
			}

			this.peerConnections.forEach((pc) => {
				pc.close();
			});
			this.peerConnections.clear();
			this.connectedUsers.clear();

			if (this.localStream) {
				this.localStream.getTracks().forEach((track) => track.stop());
				this.localStream = null;
			}
			if (this.localVideoStream) {
				this.localVideoStream.getTracks().forEach((track) => track.stop());
				this.localVideoStream = null;
			}

			this.channelId = null;
			this.isInCall = false;
			this.isCameraOn = false;
		} catch (error) {
			console.error('Error leaving voice channel:', error);
		}
	}

	async toggleCamera(): Promise<void> {
		if (!this.isInCall || !this.channelId) return;

		try {
			if (this.isCameraOn) {
				if (this.localVideoStream) {
					this.localVideoStream.getTracks().forEach((track) => track.stop());
					this.localVideoStream = null;
				}
				this.peerConnections.forEach((pc) => {
					const videoSender = pc.getSenders().find((sender) => 
						sender.track && sender.track.kind === 'video'
					);
					if (videoSender) {
						pc.removeTrack(videoSender);
					}
				});
				this.isCameraOn = false;
			} else {
				await this.initializeLocalVideoStream();
				if (this.localVideoStream) {
					const videoTrack = this.localVideoStream.getVideoTracks()[0];
					this.peerConnections.forEach((pc) => {
						pc.addTrack(videoTrack, this.localVideoStream!);
					});
				}
				this.isCameraOn = true;
			}

			if (webSocketService.isConnected() && this.channelId) {
				const updateData: VoiceUserUpdateData = {
					channelId: this.channelId,
					isCameraOn: this.isCameraOn,
					isMuted: this.isMuted,
				};
				webSocketService.emitToServer('voice-user-update', updateData);
			}
		} catch (error) {
			console.error('Error toggling camera:', error);
			this.callbacks?.onError(`Failed to toggle camera: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	async toggleMute(): Promise<void> {
		if (!this.isInCall || !this.localStream) return;

		try {
			const audioTrack = this.localStream.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = this.isMuted;
				this.isMuted = !this.isMuted;

				if (webSocketService.isConnected() && this.channelId) {
					const updateData: VoiceUserUpdateData = {
						channelId: this.channelId,
						isCameraOn: this.isCameraOn,
						isMuted: this.isMuted,
					};
					webSocketService.emitToServer('voice-user-update', updateData);
				}
			}
		} catch (error) {
			console.error('Error toggling mute:', error);
			this.callbacks?.onError(`Failed to toggle mute: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private async getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
		await this.ensureWebRTCModuleLoaded();
		const strings = getStrings();
		
		if (Platform.OS === 'web') {
			if (!navigator.mediaDevices?.getUserMedia) {
				throw new Error(strings.WebRTC.Media_Devices_Not_Available);
			}
			return navigator.mediaDevices.getUserMedia(constraints);
		} else {
			console.log('WebRTC module loaded:', !!webRTCModule);
			console.log('WebRTC mediaDevices available:', !!webRTCModule?.mediaDevices);
			console.log('WebRTC getUserMedia available:', !!webRTCModule?.mediaDevices?.getUserMedia);
			
			if (!webRTCModule) {
				throw new Error(strings.WebRTC.Module_Not_Available);
			}
			
			// Try different ways to access mediaDevices
			let mediaDevices = webRTCModule.mediaDevices;
			
			if (!mediaDevices && webRTCModule.MediaDevices) {
				console.log('Trying to instantiate MediaDevices...');
				try {
					mediaDevices = new webRTCModule.MediaDevices();
				} catch (error) {
					console.log('Failed to instantiate MediaDevices:', error);
				}
			}
			
			if (!mediaDevices) {
				console.log('Trying global mediaDevices...');
				mediaDevices = global.navigator?.mediaDevices;
			}
			
			if (!mediaDevices || !mediaDevices.getUserMedia) {
				throw new Error(strings.WebRTC.Media_Devices_Not_Available);
			}
			
			return mediaDevices.getUserMedia(constraints);
		}
	}

	private async initializeLocalAudioStream(): Promise<void> {
		this.localStream = await this.getUserMedia({
			audio: true,
			video: false,
		});
	}

	private async initializeLocalVideoStream(): Promise<void> {
		const constraints: MediaStreamConstraints = {
			audio: false,
			video: Platform.OS === 'web' ? {
				width: { ideal: 640 },
				height: { ideal: 480 },
				facingMode: 'user'
			} : {
				mandatory: {
					minWidth: 640,
					minHeight: 480,
					minFrameRate: 30,
				},
				facingMode: 'user',
				optional: [],
			} as MediaTrackConstraints
		};

		this.localVideoStream = await this.getUserMedia(constraints);
	}

	private async createPeerConnection(userId: string): Promise<RTCPeerConnection> {
		await this.ensureWebRTCModuleLoaded();
		
		const RTCPeerConnectionClass = Platform.OS === 'web' 
			? window.RTCPeerConnection 
			: webRTCModule?.RTCPeerConnection;

		if (!RTCPeerConnectionClass) {
			throw new Error('RTCPeerConnection not available');
		}

		const pc = new RTCPeerConnectionClass({ iceServers: this.iceServers });

		pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
			if (event.candidate && webSocketService.isConnected() && this.channelId) {
				const signalData: WebRTCSignalData = {
					channelId: this.channelId,
					targetUserId: userId,
					candidate: event.candidate,
				};
				webSocketService.emitToServer('webrtc-ice-candidate', signalData);
			}
		};

		pc.ontrack = (event: RTCTrackEvent) => {
			console.log('Received remote stream from', userId);
			const remoteStream = event.streams[0];
			this.callbacks?.onStreamReceived(userId, remoteStream);
			
			const user = this.connectedUsers.get(userId);
			if (user) {
				user.stream = remoteStream;
				this.connectedUsers.set(userId, user);
			}
		};

		if (this.localStream) {
			this.localStream.getTracks().forEach((track) => {
				pc.addTrack(track, this.localStream!);
			});
		}
		if (this.localVideoStream && this.isCameraOn) {
			this.localVideoStream.getTracks().forEach((track) => {
				pc.addTrack(track, this.localVideoStream!);
			});
		}

		this.peerConnections.set(userId, pc);
		return pc;
	}

	private async handleOffer(data: WebRTCOffer): Promise<void> {
		try {
			const { fromUserId, offer } = data;
			console.log('Received offer from', fromUserId);

			const pc = await this.createPeerConnection(fromUserId);
			await pc.setRemoteDescription(new RTCSessionDescription(offer));
			
			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);

			if (webSocketService.isConnected() && this.channelId) {
				const signalData: WebRTCSignalData = {
					channelId: this.channelId,
					targetUserId: fromUserId,
					answer: answer,
				};
				webSocketService.emitToServer('webrtc-answer', signalData);
			}
		} catch (error) {
			console.error('Error handling offer:', error);
		}
	}

	private async handleAnswer(data: WebRTCAnswer): Promise<void> {
		try {
			const { fromUserId, answer } = data;
			console.log('Received answer from', fromUserId);

			const pc = this.peerConnections.get(fromUserId);
			if (pc) {
				await pc.setRemoteDescription(new RTCSessionDescription(answer));
			}
		} catch (error) {
			console.error('Error handling answer:', error);
		}
	}

	private async handleIceCandidate(data: WebRTCIceCandidate): Promise<void> {
		try {
			await this.ensureWebRTCModuleLoaded();
			
			const { fromUserId, candidate } = data;
			const pc = this.peerConnections.get(fromUserId);
			if (pc && pc.remoteDescription) {
				const RTCIceCandidateClass = Platform.OS === 'web' 
					? window.RTCIceCandidate 
					: webRTCModule?.RTCIceCandidate;
				
				if (RTCIceCandidateClass) {
					await pc.addIceCandidate(new RTCIceCandidateClass(candidate));
				}
			}
		} catch (error) {
			console.error('Error handling ICE candidate:', error);
		}
	}

	private async handleUserJoined(data: VoiceUser): Promise<void> {
		try {
			console.log('User joined voice channel:', data);
			this.connectedUsers.set(data.userId, data);
			this.callbacks?.onUserJoined(data);

			const pc = await this.createPeerConnection(data.userId);
			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);

			if (webSocketService.isConnected() && this.channelId) {
				const signalData: WebRTCSignalData = {
					channelId: this.channelId,
					targetUserId: data.userId,
					offer: offer,
				};
				webSocketService.emitToServer('webrtc-offer', signalData);
			}
		} catch (error) {
			console.error('Error handling user joined:', error);
		}
	}

	private handleUserLeft(data: { userId: string }): void {
		console.log('User left voice channel:', data.userId);
		
		const pc = this.peerConnections.get(data.userId);
		if (pc) {
			pc.close();
			this.peerConnections.delete(data.userId);
		}

		this.connectedUsers.delete(data.userId);
		this.callbacks?.onUserLeft(data.userId);
		this.callbacks?.onStreamRemoved(data.userId);
	}

	private handleUserUpdated(data: Partial<VoiceUser> & { userId: string }): void {
		console.log('User updated voice state:', data);
		
		const user = this.connectedUsers.get(data.userId);
		if (user) {
			const updatedUser = { ...user, ...data };
			this.connectedUsers.set(data.userId, updatedUser);
			this.callbacks?.onUserUpdated(data);
		}
	}

	getLocalStream(): MediaStream | null {
		return this.localStream;
	}

	getLocalVideoStream(): MediaStream | null {
		return this.localVideoStream;
	}

	getConnectedUsers(): VoiceUser[] {
		return Array.from(this.connectedUsers.values());
	}

	isInVoiceCall(): boolean {
		return this.isInCall;
	}

	isMicrophoneMuted(): boolean {
		return this.isMuted;
	}

	isCameraEnabled(): boolean {
		return this.isCameraOn;
	}

	getCurrentChannelId(): string | null {
		return this.channelId;
	}
}

export const webRTCService = new WebRTCService();
export default webRTCService;