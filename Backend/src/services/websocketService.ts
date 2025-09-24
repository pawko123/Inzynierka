import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { User } from '../models/User';
import {
	JoinChannelData,
	VoiceChannelJoinData,
	VoiceChannelLeaveData,
	VoiceUserUpdateData,
	WebRTCSignalData
} from '../types/websocket';
interface AuthenticatedSocket extends Socket {
	userId?: string;
	user?: User;
}

export const initializeWebSocket = (io: SocketIOServer) => {
	// Authentication middleware for WebSocket connections
	io.use(async (socket: AuthenticatedSocket, next) => {
		try {
			const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
			
			if (!token) {
				return next(new Error('Authentication error: No token provided'));
			}

			// Remove 'Bearer ' prefix if present
			const cleanToken = token.replace('Bearer ', '');
			
			const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET_KEY || 'default') as jwt.JwtPayload;
			
			// Get user from database
			const userRepo = AppDataSource.getRepository(User);
			const user = await userRepo.findOne({ where: { id: decoded.id } });
			
			if (!user) {
				return next(new Error('Authentication error: User not found'));
			}

			socket.userId = user.id;
			socket.user = user;
			next();
		} catch (error) {
			console.error('WebSocket authentication error:', error);
			next(new Error('Authentication error: Invalid token'));
		}
	});

	io.on('connection', (socket: AuthenticatedSocket) => {
		console.log(`User ${socket.user?.username} connected with socket ID: ${socket.id}`);

		// Join a channel room for real-time updates
		socket.on('join-channel', (data: JoinChannelData) => {
			const roomName = `channel:${data.channelId}`;
			socket.join(roomName);
			console.log(`User ${socket.user?.username} joined channel room: ${roomName}`);
			
			// Optionally join server room as well
			if (data.serverId) {
				const serverRoom = `server:${data.serverId}`;
				socket.join(serverRoom);
				console.log(`User ${socket.user?.username} joined server room: ${serverRoom}`);
			}
		});

		// Leave a channel room
		socket.on('leave-channel', (data: JoinChannelData) => {
			const roomName = `channel:${data.channelId}`;
			socket.leave(roomName);
			console.log(`User ${socket.user?.username} left channel room: ${roomName}`);
			
			if (data.serverId) {
				const serverRoom = `server:${data.serverId}`;
				socket.leave(serverRoom);
				console.log(`User ${socket.user?.username} left server room: ${serverRoom}`);
			}
		});

		// Handle user typing indicators
		socket.on('typing-start', (data: { channelId: string; username: string }) => {
			socket.to(`channel:${data.channelId}`).emit('user-typing', {
				userId: socket.userId,
				username: data.username || socket.user?.username,
				channelId: data.channelId,
				isTyping: true,
			});
		});

		socket.on('typing-stop', (data: { channelId: string }) => {
			socket.to(`channel:${data.channelId}`).emit('user-typing', {
				userId: socket.userId,
				channelId: data.channelId,
				isTyping: false,
			});
		});

		socket.on('join-voice-channel', (data: VoiceChannelJoinData) => {
			const voiceRoomName = `voice:${data.channelId}`;
			socket.join(voiceRoomName);
			console.log(`User ${socket.user?.username} joined voice channel: ${data.channelId}`);

			const voiceUserData = {
				userId: socket.userId!,
				username: socket.user?.username || 'Unknown',
				isMuted: data.isMuted || false,
				isCameraOn: data.isCameraOn || false,
			};

			socket.to(voiceRoomName).emit('voice-user-joined', voiceUserData);
		});

		socket.on('leave-voice-channel', (data: VoiceChannelLeaveData) => {
			const voiceRoomName = `voice:${data.channelId}`;
			console.log(`User ${socket.user?.username} left voice channel: ${data.channelId}`);

			socket.to(voiceRoomName).emit('voice-user-left', {
				userId: socket.userId,
			});

			socket.leave(voiceRoomName);
		});

		socket.on('voice-user-update', (data: VoiceUserUpdateData) => {
			const voiceRoomName = `voice:${data.channelId}`;
			console.log(`User ${socket.user?.username} updated voice state in channel: ${data.channelId}`);

			const updateData = {
				userId: socket.userId,
				...data,
			};

			socket.to(voiceRoomName).emit('voice-user-updated', updateData);
		});

		socket.on('webrtc-offer', (data: WebRTCSignalData) => {
			console.log(`WebRTC offer from ${socket.userId} to ${data.targetUserId} in channel ${data.channelId}`);
			
			io.sockets.sockets.forEach((targetSocket: AuthenticatedSocket) => {
				if (targetSocket.userId === data.targetUserId) {
					targetSocket.emit('webrtc-offer', {
						fromUserId: socket.userId,
						offer: data.offer,
					});
				}
			});
		});

		socket.on('webrtc-answer', (data: WebRTCSignalData) => {
			console.log(`WebRTC answer from ${socket.userId} to ${data.targetUserId} in channel ${data.channelId}`);
			
			io.sockets.sockets.forEach((targetSocket: AuthenticatedSocket) => {
				if (targetSocket.userId === data.targetUserId) {
					targetSocket.emit('webrtc-answer', {
						fromUserId: socket.userId,
						answer: data.answer,
					});
				}
			});
		});

		socket.on('webrtc-ice-candidate', (data: WebRTCSignalData) => {
			console.log(`WebRTC ICE candidate from ${socket.userId} to ${data.targetUserId} in channel ${data.channelId}`);
			
			io.sockets.sockets.forEach((targetSocket: AuthenticatedSocket) => {
				if (targetSocket.userId === data.targetUserId) {
					targetSocket.emit('webrtc-ice-candidate', {
						fromUserId: socket.userId,
						candidate: data.candidate,
					});
				}
			});
		});

		socket.on('disconnect', () => {
			console.log(`User ${socket.user?.username} disconnected from socket ID: ${socket.id}`);
			
			io.sockets.sockets.forEach((otherSocket: AuthenticatedSocket) => {
				if (otherSocket.id !== socket.id) {
					otherSocket.emit('voice-user-left', {
						userId: socket.userId,
					});
				}
			});
		});
	});

	return io;
};

// Helper function to emit message events
export const emitMessageEvent = (io: SocketIOServer, event: string, channelId: string, data: unknown) => {
	io.to(`channel:${channelId}`).emit(event, data);
};

// Helper function to emit server events
export const emitServerEvent = (io: SocketIOServer, event: string, serverId: string, data: unknown) => {
	io.to(`server:${serverId}`).emit(event, data);
};
