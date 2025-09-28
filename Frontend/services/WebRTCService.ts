import { Platform, PermissionsAndroid } from 'react-native';
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
	private remoteStreams: Map<string, MediaStream> = new Map();
	private peerConnections: Map<string, RTCPeerConnection> = new Map();
	private connectedUsers: Map<string, VoiceUser> = new Map();
	private callbacks: WebRTCCallbacks | null = null;
	private isInCall = false;
	private isMuted = false;
	private isCameraOn = false;
	private status = 'idle';
	
	private readonly iceServers: RTCIceServer[] = [
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:stun1.l.google.com:19302' },
	];

	constructor() {
		this.setupWebSocketListeners();
	}

	// Request Android runtime permissions
	private async requestPermissions(): Promise<boolean> {
		if (Platform.OS === "android") {
			try {
				const granted = await PermissionsAndroid.requestMultiple([
					PermissionsAndroid.PERMISSIONS.CAMERA,
					PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
				]);

				const camGranted =
					granted["android.permission.CAMERA"] ===
					PermissionsAndroid.RESULTS.GRANTED;
				const micGranted =
					granted["android.permission.RECORD_AUDIO"] ===
					PermissionsAndroid.RESULTS.GRANTED;

				if (!camGranted || !micGranted) {
					console.log("Permissions denied");
					return false;
				}
				return true;
			} catch (err) {
				console.warn("Permission error", err);
				return false;
			}
		}
		return true;
	}

	// Get local media stream
	private async getLocalStream(): Promise<void> {
		const ok = await this.requestPermissions();
		if (!ok) {
			throw new Error('Permissions denied');
		}

		const constraints: MediaStreamConstraints = {
			audio: true,
			video: this.isCameraOn ? { facingMode: "user" } : false,
		};

		this.localStream = await this.getUserMedia(constraints);
		this.setStatus('local stream ready');
	}

	private setStatus(newStatus: string): void {
		this.status = newStatus;
		console.log('WebRTC Status:', newStatus);
	}

	private setupWebSocketListeners(): void {
		console.log('Setting up WebSocket listeners for WebRTC');
		
		// Add debugging wrapper for each event
		webSocketService.on('webrtc-offer', (data) => {
			console.log('WebRTC Service received webrtc-offer event:', {
				fromUserId: data?.fromUserId,
				offerType: data?.offer?.type
			});
			this.handleOffer(data);
		});
		
		webSocketService.on('webrtc-answer', (data) => {
			console.log('WebRTC Service received webrtc-answer event:', {
				fromUserId: data?.fromUserId,
				answerType: data?.answer?.type
			});
			this.handleAnswer(data);
		});
		
		webSocketService.on('webrtc-ice-candidate', (data) => {
			console.log('WebRTC Service received webrtc-ice-candidate event:', {
				fromUserId: data?.fromUserId,
				candidateType: data?.candidate?.candidate ? 'valid' : 'empty'
			});
			this.handleIceCandidate(data);
		});
		
		webSocketService.on('voice-user-joined', (data) => {
			console.log('WebRTC Service received voice-user-joined event:', {
				userId: data?.userId,
				username: data?.username
			});
			this.handleUserJoined(data);
		});
		
		webSocketService.on('voice-user-left', (data) => {
			console.log('WebRTC Service received voice-user-left event:', {
				userId: data?.userId
			});
			this.handleUserLeft(data);
		});
		
		webSocketService.on('voice-user-updated', (data) => {
			console.log('WebRTC Service received voice-user-updated event:', {
				userId: data?.userId,
				isMuted: data?.isMuted,
				isCameraOn: data?.isCameraOn
			});
			this.handleUserUpdated(data);
		});
		
		// Add listeners for debugging
		webSocketService.on('connect', () => {
			console.log('WebSocket connected for WebRTC');
		});
		
		webSocketService.on('disconnect', () => {
			console.log('WebSocket disconnected for WebRTC');
		});
	}

	// Create or get existing peer connection
	private ensurePeer(userId: string): RTCPeerConnection {
		// Always check if we already have a peer connection for this user
		const existingPc = this.peerConnections.get(userId);
		if (existingPc) {
			console.log(`Reusing existing peer connection for user ${userId}, state: ${existingPc.connectionState}`);
			return existingPc;
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
				console.log(`Sending ICE candidate to ${userId}`);
				const signalData: WebRTCSignalData = {
					channelId: this.channelId,
					targetUserId: userId,
					candidate: event.candidate,
				};
				webSocketService.emitToServer('webrtc-ice-candidate', signalData);
			}
		};

		pc.ontrack = (event: any) => {
			console.log('Received remote stream from', userId);
			const [stream] = event.streams;
			this.remoteStreams.set(userId, stream);
			this.callbacks?.onStreamReceived(userId, stream);
			
			const user = this.connectedUsers.get(userId);
			if (user) {
				user.stream = stream;
				this.connectedUsers.set(userId, user);
			}
		};

		pc.onconnectionstatechange = () => {
			console.log(`Peer connection state with ${userId}:`, pc.connectionState);
			if (pc.connectionState === 'connected') {
				this.setStatus(`connected to ${userId}`);
			} else if (pc.connectionState === 'failed') {
				console.log(`Peer connection failed with ${userId}, removing connection`);
				this.peerConnections.delete(userId);
				this.remoteStreams.delete(userId);
			}
		};

		// Add local stream tracks if available
		if (this.localStream) {
			this.localStream.getTracks().forEach((track) => {
				if (this.localStream) {
					console.log(`Adding ${track.kind} track to peer connection for ${userId}`);
					(pc as any).addTrack(track, this.localStream);
				}
			});
		}

		this.peerConnections.set(userId, pc);
		return pc;
	}

	private cleanup(): void {
		this.peerConnections.forEach((pc) => {
			pc.close();
		});
		this.peerConnections.clear();
		this.remoteStreams.clear();
		this.connectedUsers.clear();
		
		if (this.localStream) {
			this.localStream.getTracks().forEach((track) => track.stop());
			this.localStream = null;
		}

		this.channelId = null;
		this.isInCall = false;
		this.setStatus('idle');
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

	private async connectToExistingUsers(channelId: string): Promise<void> {
		try {
			const { api } = await import('@/services/api');
			const response = await api.get(`/voice-state/channel-users?channelId=${channelId}`);
			const existingUsers = response.data;
			
			console.log(`Found ${existingUsers.length} existing users in voice channel`);
			
			const { storage } = await import('@/utils/storage');
			const userData = await storage.getItem('user');
			const currentUserId = userData ? JSON.parse(userData).id : null;
			
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
				const pc = this.ensurePeer(userData.userId);
				const offer = await pc.createOffer();
				await pc.setLocalDescription(offer);

				if (webSocketService.isConnected() && this.channelId) {
					console.log(`Sending offer to existing user ${userData.userId}`);
					const signalData: WebRTCSignalData = {
						channelId: this.channelId,
						targetUserId: userData.userId,
						offer: offer,
					};
					console.log('Emitting webrtc-offer with data:', {
						channelId: signalData.channelId,
						targetUserId: signalData.targetUserId,
						offerType: signalData.offer?.type
					});
					webSocketService.emitToServer('webrtc-offer', signalData);
				}
			}
		} catch (error) {
			console.error('Error connecting to existing users:', error);
		}
	}

	// Public methods
	async joinVoiceChannel(channelId: string, callbacks: WebRTCCallbacks): Promise<void> {
		try {
			this.channelId = channelId;
			this.callbacks = callbacks;
			this.isInCall = true;
			this.setStatus('joining channel...');

			await this.getLocalStream();

			if (webSocketService.isConnected()) {
				const joinData: VoiceChannelJoinData = {
					channelId,
					isMuted: this.isMuted,
					isCameraOn: this.isCameraOn,
				};
				webSocketService.emitToServer('join-voice-channel', joinData);
				this.setStatus('socket connected');

				// Notify callback about local stream
				if (this.localStream) {
					this.callbacks.onStreamReceived('local', this.localStream);
				}

				// Connect to existing users in the channel
				await this.connectToExistingUsers(channelId);
			}
		} catch (error) {
			console.error('Error joining voice channel:', error);
			this.callbacks?.onError(`Failed to join voice channel: ${error instanceof Error ? error.message : String(error)}`);
			this.cleanup();
		}
	}

	async leaveVoiceChannel(): Promise<void> {
		try {
			if (this.channelId && webSocketService.isConnected()) {
				const leaveData: VoiceChannelLeaveData = { channelId: this.channelId };
				webSocketService.emitToServer('leave-voice-channel', leaveData);
			}
			this.cleanup();
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
				this.setStatus(this.isMuted ? 'muted' : 'unmuted');

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
			this.setStatus(this.isCameraOn ? 'camera on' : 'camera off');

			// Re-initialize stream with new video constraint
			const constraints: MediaStreamConstraints = {
				audio: true,
				video: this.isCameraOn ? { facingMode: "user" } : false,
			};

			// Stop current stream
			if (this.localStream) {
				this.localStream.getTracks().forEach((track) => track.stop());
			}

			// Get new stream
			this.localStream = await this.getUserMedia(constraints);

			// Update all peer connections with new tracks
			for (const [userId, pc] of this.peerConnections) {
				// Remove old senders
				const senders = pc.getSenders();
				for (const sender of senders) {
					if (sender.track) {
						pc.removeTrack(sender);
					}
				}

				// Add new tracks
				if (this.localStream) {
					this.localStream.getTracks().forEach((track) => {
						(pc as any).addTrack(track, this.localStream!);
					});
				}

				// Create new offer to update the connection
				const offer = await pc.createOffer();
				await pc.setLocalDescription(offer);

				if (webSocketService.isConnected() && this.channelId) {
					const signalData: WebRTCSignalData = {
						channelId: this.channelId,
						targetUserId: userId,
						offer: offer,
					};
					webSocketService.emitToServer('webrtc-offer', signalData);
				}
			}

			// Update server about camera state
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

	// WebSocket event handlers
	private async handleOffer(data: WebRTCOffer): Promise<void> {
		try {
			const { fromUserId, offer } = data;
			console.log('Received offer from', fromUserId, 'offer type:', offer?.type);

			const RTCSessionDescriptionClass = Platform.OS === 'web' 
				? window.RTCSessionDescription 
				: webRTCModule?.RTCSessionDescription;

			if (!RTCSessionDescriptionClass) {
				console.error('RTCSessionDescription not available');
				return;
			}

			const pc = this.ensurePeer(fromUserId);
			
			// Check if we can set remote description
			if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer') {
				console.warn(`Cannot set remote offer for ${fromUserId}, signaling state is:`, pc.signalingState);
				return;
			}

			// If we're in have-local-offer state, we need to handle offer collision
			if (pc.signalingState === 'have-local-offer') {
				console.log('Offer collision detected, handling...');
				// In a real implementation, you might want to compare offer strengths
				// For now, let's just ignore this offer if we already sent one
				return;
			}
			
			// Set remote description first
			console.log('Setting remote description for', fromUserId);
			await (pc as any).setRemoteDescription(offer);
			
			// Create and send answer
			console.log('Creating answer for', fromUserId);
			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);

			if (webSocketService.isConnected() && this.channelId) {
				console.log('Sending answer to', fromUserId, 'answer type:', answer.type);
				const signalData: WebRTCSignalData = {
					channelId: this.channelId,
					targetUserId: fromUserId,
					answer: answer,
				};
				console.log('Emitting webrtc-answer with data:', {
					channelId: signalData.channelId,
					targetUserId: signalData.targetUserId,
					answerType: signalData.answer?.type
				});
				webSocketService.emitToServer('webrtc-answer', signalData);
				this.setStatus('answered offer');
			}
		} catch (error) {
			console.error('Error handling offer:', error);
		}
	}

	private async handleAnswer(data: WebRTCAnswer): Promise<void> {
		try {
			const { fromUserId, answer } = data;
			console.log('Received answer from', fromUserId, 'answer type:', answer?.type);

			const pc = this.peerConnections.get(fromUserId);
			if (!pc) {
				console.error('No peer connection found for user', fromUserId);
				return;
			}

			// Check if we can set remote description
			if (pc.signalingState !== 'have-local-offer') {
				console.warn(`Cannot set remote answer for ${fromUserId}, signaling state is:`, pc.signalingState);
				return;
			}

			console.log('Setting remote description (answer) for', fromUserId);
			await (pc as any).setRemoteDescription(answer);
			this.setStatus('connected (answer set)');
			console.log('Set remote description for', fromUserId);
		} catch (error) {
			console.error('Error handling answer:', error);
		}
	}

	private async handleIceCandidate(data: WebRTCIceCandidate): Promise<void> {
		try {
			const { fromUserId, candidate } = data;
			console.log('Received ICE candidate from', fromUserId);
			
			const pc = this.peerConnections.get(fromUserId);
			if (!pc) {
				console.warn('No peer connection found for ICE candidate from', fromUserId);
				return;
			}

			if (!pc.remoteDescription) {
				console.warn('No remote description set yet for', fromUserId, 'signaling state:', pc.signalingState);
				return;
			}

			const RTCIceCandidateClass = Platform.OS === 'web'
				? window.RTCIceCandidate
				: webRTCModule?.RTCIceCandidate;

			if (RTCIceCandidateClass) {
				await (pc as any).addIceCandidate(new RTCIceCandidateClass(candidate));
				console.log('Added ICE candidate for', fromUserId);
			}
		} catch (error) {
			console.warn('Failed to add ICE candidate:', error);
		}
	}

	private async handleUserJoined(data: VoiceUser): Promise<void> {
		try {
			console.log('User joined voice channel:', data);
			
			// Check if we already have this user
			if (this.connectedUsers.has(data.userId)) {
				console.log('User', data.userId, 'already exists, skipping duplicate join');
				return;
			}

			this.connectedUsers.set(data.userId, data);
			this.callbacks?.onUserJoined(data);
			this.setStatus('peer joined, waiting for ready');

			// Check if we already have a peer connection for this user
			if (this.peerConnections.has(data.userId)) {
				console.log('Peer connection already exists for', data.userId, 'skipping offer creation');
				return;
			}

			// Create peer connection and send offer
			const pc = this.ensurePeer(data.userId);
			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);

			if (webSocketService.isConnected() && this.channelId) {
				console.log(`Sending offer to user ${data.userId}`);
				const signalData: WebRTCSignalData = {
					channelId: this.channelId,
					targetUserId: data.userId,
					offer: offer,
				};
				console.log('Emitting webrtc-offer (user joined) with data:', {
					channelId: signalData.channelId,
					targetUserId: signalData.targetUserId,
					offerType: signalData.offer?.type
				});
				webSocketService.emitToServer('webrtc-offer', signalData);
				this.setStatus('sent offer');
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

		this.remoteStreams.delete(data.userId);
		this.connectedUsers.delete(data.userId);
		this.callbacks?.onUserLeft(data.userId);
		this.callbacks?.onStreamRemoved(data.userId);
		this.setStatus('peer left');
	}

	private handleUserUpdated(data: Partial<VoiceUser> & { userId: string }): void {
		console.log('User updated voice state:', data);
		
		const user = this.connectedUsers.get(data.userId);
		if (user) {
			const updatedUser = { ...user, ...data };
			this.connectedUsers.set(data.userId, updatedUser);
			this.callbacks?.onUserUpdated(data);

			if (data.isCameraOn !== undefined) {
				this.callbacks?.onCameraToggled?.(data.userId, data.isCameraOn);
			}
		}
	}

	// Getters
	getLocalStreamData(): MediaStream | null {
		return this.localStream;
	}

	getRemoteStream(userId: string): MediaStream | null {
		return this.remoteStreams.get(userId) || null;
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

	getStatus(): string {
		return this.status;
	}
}

export const webRTCService = new WebRTCService();
export default webRTCService;