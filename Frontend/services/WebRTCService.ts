import { Platform } from 'react-native';
import { webSocketService } from './WebSocketService';
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

let webRTCModule: typeof import('react-native-webrtc') | null = null;

if (Platform.OS !== 'web') {
	import('react-native-webrtc').then((module) => {
		webRTCModule = module;
	}).catch((error) => {
		console.error('Failed to load react-native-webrtc:', error);
	});
}

class WebRTCService {
	private channelId: string | null = null;
	private localStream: MediaStream | null = null;
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

			await this.initializeLocalStream();

			if (webSocketService.isConnected()) {
				const joinData: VoiceChannelJoinData = {
					channelId,
					isMuted: this.isMuted,
					isCameraOn: this.isCameraOn,
				};
				webSocketService.emitToServer('join-voice-channel', joinData);

				// Notify callback about local stream
				if (this.localStream) {
					this.callbacks.onStreamReceived('local', this.localStream);
				}

				// Get existing users in the channel and establish connections
				await this.connectToExistingUsers(channelId);
			}
		} catch (error) {
			console.error('Error joining voice channel:', error);
			this.callbacks?.onError(`Failed to join voice channel: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private async connectToExistingUsers(channelId: string): Promise<void> {
		try {
			// Import API service
			const { api } = await import('@/services/api');
			
			// Get existing users in the voice channel
			const response = await api.get(`/voice-state/channel-users?channelId=${channelId}`);
			const existingUsers = response.data;
			
			console.log(`Found ${existingUsers.length} existing users in voice channel`);
			
			// Get current user ID to avoid creating connection with self
			// We need to get this from storage or auth context
			const { storage } = await import('@/utils/storage');
			const userData = await storage.getItem('user');
			const currentUserId = userData ? JSON.parse(userData).id : null;
			
			// Create peer connections with existing users (excluding self)
			for (const userData of existingUsers) {
				if (currentUserId && userData.userId === currentUserId) {
					console.log('Skipping self connection for user', userData.userId);
					continue;
				}
				
				const voiceUser: VoiceUser = {
					userId: userData.userId,
					username: userData.username,
					isMuted: userData.isMuted,
					isCameraOn: userData.isCameraOn,
				};
				
				this.connectedUsers.set(userData.userId, voiceUser);
				this.callbacks?.onUserJoined(voiceUser);
				
				// Create peer connection and send offer
				const pc = this.createPeerConnection(userData.userId);
				const offer = await pc.createOffer();
				await pc.setLocalDescription(offer);

				if (webSocketService.isConnected() && this.channelId) {
					console.log(`Sending offer to existing user ${userData.userId}`);
					const signalData: WebRTCSignalData = {
						channelId: this.channelId,
						targetUserId: userData.userId,
						offer: offer,
					};
					webSocketService.emitToServer('webrtc-offer', signalData);
				}
			}
		} catch (error) {
			console.error('Error connecting to existing users:', error);
			// Don't throw - this shouldn't prevent joining the channel
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

			this.channelId = null;
			this.isInCall = false;
		} catch (error) {
			console.error('Error leaving voice channel:', error);
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

	async toggleCamera(): Promise<void> {
		if (!this.isInCall) return;

		try {
			this.isCameraOn = !this.isCameraOn;

			// If turning camera on and we don't have video track, add it
			if (this.isCameraOn) {
				if (!this.localStream || this.localStream.getVideoTracks().length === 0) {
					await this.addVideoTrack();
				} else {
					// Enable existing video track
					const videoTrack = this.localStream.getVideoTracks()[0];
					if (videoTrack) {
						videoTrack.enabled = true;
					}
				}
			} else {
				// Disable video track but don't remove it
				if (this.localStream) {
					const videoTrack = this.localStream.getVideoTracks()[0];
					if (videoTrack) {
						videoTrack.enabled = false;
					}
				}
			}

			// Update all peer connections
			await this.updatePeerConnectionTracks();

			if (webSocketService.isConnected() && this.channelId) {
				const updateData: VoiceUserUpdateData = {
					channelId: this.channelId,
					isCameraOn: this.isCameraOn,
					isMuted: this.isMuted,
				};
				webSocketService.emitToServer('voice-user-update', updateData);
			}

			// Notify callback about stream update
			if (this.localStream) {
				this.callbacks?.onStreamReceived('local', this.localStream);
				this.callbacks?.onCameraToggled?.('local', this.isCameraOn);
				this.callbacks?.onLocalStreamUpdated?.(this.localStream);
			}
		} catch (error) {
			console.error('Error toggling camera:', error);
			this.callbacks?.onError(`Failed to toggle camera: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private async getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
		if (Platform.OS === 'web') {
			if (!navigator.mediaDevices?.getUserMedia) {
				throw new Error('getUserMedia not available on this platform');
			}
			return navigator.mediaDevices.getUserMedia(constraints);
		} else {
			if (!webRTCModule?.mediaDevices?.getUserMedia) {
				throw new Error('getUserMedia not available on this platform');
			}
			return webRTCModule.mediaDevices.getUserMedia(constraints as any) as unknown as Promise<MediaStream>;
		}
	}

	private async initializeLocalStream(): Promise<void> {
		try {
			const constraints: MediaStreamConstraints = {
				audio: true,
				video: this.isCameraOn,
			};
			this.localStream = await this.getUserMedia(constraints);
		} catch (error) {
			console.error('Error initializing local stream:', error);
			// Fallback to audio-only if video fails
			if (this.isCameraOn) {
				try {
					this.isCameraOn = false;
					const constraints: MediaStreamConstraints = {
						audio: true,
						video: false,
					};
					this.localStream = await this.getUserMedia(constraints);
				} catch (audioError) {
					throw new Error(`Failed to initialize even audio stream: ${audioError instanceof Error ? audioError.message : String(audioError)}`);
				}
			} else {
				throw error;
			}
		}
	}

	private async addVideoTrack(): Promise<void> {
		if (!this.localStream) return;

		try {
			const videoStream = await this.getUserMedia({ video: true, audio: false });
			const videoTrack = videoStream.getVideoTracks()[0];
			if (videoTrack) {
				this.localStream.addTrack(videoTrack);
			}
		} catch (error) {
			console.error('Error adding video track:', error);
			throw error;
		}
	}

	private async updatePeerConnectionTracks(): Promise<void> {
		if (!this.localStream) return;

		for (const [userId, pc] of this.peerConnections) {
			try {
				// Get current senders
				const senders = pc.getSenders();
				
				// Handle video track
				const videoTrack = this.localStream.getVideoTracks()[0];
				const videoSender = senders.find(s => s.track?.kind === 'video');
				
				if (videoTrack && this.isCameraOn) {
					if (videoSender) {
						// Replace existing video track
						await videoSender.replaceTrack(videoTrack);
					} else {
						// Add new video track
						pc.addTrack(videoTrack, this.localStream);
					}
				} else if (videoSender && videoSender.track) {
					// Remove video track
					await videoSender.replaceTrack(null);
				}

				// Handle audio track (should always be present)
				const audioTrack = this.localStream.getAudioTracks()[0];
				const audioSender = senders.find(s => s.track?.kind === 'audio');
				
				if (audioTrack) {
					if (audioSender) {
						await audioSender.replaceTrack(audioTrack);
					} else {
						pc.addTrack(audioTrack, this.localStream);
					}
				}
			} catch (error) {
				console.error(`Error updating peer connection tracks for user ${userId}:`, error);
			}
		}
	}

	private async initializeLocalAudioStream(): Promise<void> {
		this.localStream = await this.getUserMedia({
			audio: true,
			video: false,
		});
	}

	private createPeerConnection(userId: string): RTCPeerConnection {
		// Check if peer connection already exists
		if (this.peerConnections.has(userId)) {
			console.log(`Peer connection already exists for user ${userId}`);
			return this.peerConnections.get(userId)!;
		}

		const RTCPeerConnectionClass = Platform.OS === 'web' 
			? window.RTCPeerConnection 
			: webRTCModule?.RTCPeerConnection;

		if (!RTCPeerConnectionClass) {
			throw new Error('RTCPeerConnection not available');
		}

		console.log(`Creating new peer connection for user ${userId}`);
		const pc = new RTCPeerConnectionClass({ iceServers: this.iceServers }) as RTCPeerConnection;

		pc.onicecandidate = (event: any) => {
			if (event.candidate && webSocketService.isConnected() && this.channelId) {
				console.log(`Sending ICE candidate to ${userId}:`, event.candidate);
				const signalData: WebRTCSignalData = {
					channelId: this.channelId,
					targetUserId: userId,
					candidate: event.candidate,
				};
				webSocketService.emitToServer('webrtc-ice-candidate', signalData);
			}
		};

		pc.onconnectionstatechange = () => {
			console.log(`Peer connection state with ${userId}:`, pc.connectionState);
		};

		pc.oniceconnectionstatechange = () => {
			console.log(`ICE connection state with ${userId}:`, pc.iceConnectionState);
		};

		pc.ontrack = (event: any) => {
			console.log('Received remote stream from', userId);
			const remoteStream = event.streams[0];
			this.callbacks?.onStreamReceived(userId, remoteStream);
			
			const user = this.connectedUsers.get(userId);
			if (user) {
				user.stream = remoteStream;
				this.connectedUsers.set(userId, user);
			}
		};

		// Add local stream tracks
		if (this.localStream) {
			this.localStream.getTracks().forEach((track) => {
				if (this.localStream) {
					console.log(`Adding ${track.kind} track to peer connection for user ${userId}`);
					(pc as any).addTrack(track, this.localStream);
				}
			});
		}

		this.peerConnections.set(userId, pc);
		return pc;
	}

	private async ensureWebRTCModule(): Promise<void> {
		// Simple check to ensure webRTC module is available
		if (Platform.OS !== 'web' && !webRTCModule) {
			// Wait a bit for the module to load
			await new Promise(resolve => setTimeout(resolve, 100));
			if (!webRTCModule) {
				throw new Error('WebRTC module not available');
			}
		}
	}

	private async handleOffer(data: WebRTCOffer): Promise<void> {
		try {
			await this.ensureWebRTCModule();
			
			const { fromUserId, offer } = data;
			console.log('Received offer from', fromUserId, 'offer:', offer);

			// Get the correct RTCSessionDescription class
			const RTCSessionDescriptionClass = Platform.OS === 'web' 
				? window.RTCSessionDescription 
				: webRTCModule?.RTCSessionDescription;

			if (!RTCSessionDescriptionClass) {
				console.error('RTCSessionDescription not available');
				return;
			}

			const pc = this.peerConnections.get(fromUserId) || this.createPeerConnection(fromUserId);
			await (pc as any).setRemoteDescription(offer);
			
			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);

			if (webSocketService.isConnected() && this.channelId) {
				console.log('Sending answer to', fromUserId);
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
			await this.ensureWebRTCModule();
			
			const { fromUserId, answer } = data;
			console.log('Received answer from', fromUserId, 'answer:', answer);

			const pc = this.peerConnections.get(fromUserId);
			if (pc) {
				await (pc as any).setRemoteDescription(answer);
				console.log('Set remote description for', fromUserId);
			} else {
				console.error('No peer connection found for user', fromUserId);
			}
		} catch (error) {
			console.error('Error handling answer:', error);
		}
	}

	private async handleIceCandidate(data: WebRTCIceCandidate): Promise<void> {
		try {
			await this.ensureWebRTCModule();
			
			const { fromUserId, candidate } = data;
			console.log('Received ICE candidate from', fromUserId, 'candidate:', candidate);
			const pc = this.peerConnections.get(fromUserId);
			if (pc && pc.remoteDescription) {
				await (pc as any).addIceCandidate(candidate);
				console.log('Added ICE candidate for', fromUserId);
			} else {
				console.warn('Cannot add ICE candidate: no peer connection or remote description for', fromUserId);
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

			// Create peer connection and immediately create an offer
			const pc = this.createPeerConnection(data.userId);
			
			// Create and send offer to the new user
			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);

			if (webSocketService.isConnected() && this.channelId) {
				console.log(`Sending offer to user ${data.userId}`);
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