import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/constants/env';

export interface MessageData {
	messageId: string;
	content: string | null;
	channelId: string;
	sender: {
		id?: string;
		userId: string;
		memberName: string;
	};
	attachments: {
		id: string;
		fileName: string;
		url: string;
		fileType: string;
		size: number;
	}[];
	createdAt: string;
}

export interface TypingData {
	userId: string;
	username?: string;
	channelId: string;
	isTyping: boolean;
}

export interface MessageDeletedData {
	messageId: string;
	channelId: string;
}

export interface MessageUpdatedData {
	messageId: string;
	content: string;
	channelId: string;
	sender: {
		id?: string;
		userId: string;
		memberName: string;
	};
	attachments: {
		id: string;
		fileName: string;
		url: string;
		fileType: string;
		size: number;
	}[];
	createdAt: string;
}

class WebSocketService {
	private socket: Socket | null = null;
	private token: string | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;

	// Event listeners storage
	private eventListeners: { [key: string]: ((...args: any[]) => void)[] } = {};

	initialize(token: string) {
		if (this.socket && this.socket.connected) {
			return;
		}

		this.token = token;
		this.connect();
	}

	private connect() {
		if (!this.token) {
			console.error('Cannot connect to WebSocket: No token provided');
			return;
		}

		try {
			this.socket = io(API_URL, {
				auth: {
					token: this.token,
				},
				transports: ['websocket', 'polling'],
				timeout: 20000,
			});

			this.setupEventListeners();
		} catch (error) {
			console.error('Failed to initialize WebSocket:', error);
		}
	}

	private setupEventListeners() {
		if (!this.socket) return;

		this.socket.on('connect', () => {
			console.log('Connected to WebSocket server');
			this.reconnectAttempts = 0;
		});

		this.socket.on('disconnect', (reason) => {
			console.log('Disconnected from WebSocket server:', reason);
		});

		this.socket.on('connect_error', (error) => {
			console.error('WebSocket connection error:', error);
			this.handleReconnection();
		});

		// Message events
		this.socket.on('message-created', (data: MessageData) => {
			this.emit('message-created', data);
		});

		this.socket.on('message-updated', (data: MessageUpdatedData) => {
			this.emit('message-updated', data);
		});

		this.socket.on('message-deleted', (data: MessageDeletedData) => {
			this.emit('message-deleted', data);
		});

		// Typing events
		this.socket.on('user-typing', (data: TypingData) => {
			this.emit('user-typing', data);
		});
	}

	private handleReconnection() {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;
			const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

			setTimeout(() => {
				console.log(
					`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
				);
				this.connect();
			}, delay);
		}
	}

	// Join a channel to receive real-time updates
	joinChannel(channelId: string, serverId?: string) {
		if (this.socket && this.socket.connected) {
			this.socket.emit('join-channel', { channelId, serverId });
		}
	}

	// Leave a channel
	leaveChannel(channelId: string, serverId?: string) {
		if (this.socket && this.socket.connected) {
			this.socket.emit('leave-channel', { channelId, serverId });
		}
	}

	// Typing indicators
	startTyping(channelId: string, username: string) {
		if (this.socket && this.socket.connected) {
			this.socket.emit('typing-start', { channelId, username });
		}
	}

	stopTyping(channelId: string) {
		if (this.socket && this.socket.connected) {
			this.socket.emit('typing-stop', { channelId });
		}
	}

	// Event listener management
	on(event: string, callback: (...args: any[]) => void) {
		if (!this.eventListeners[event]) {
			this.eventListeners[event] = [];
		}
		this.eventListeners[event].push(callback);
	}

	off(event: string, callback?: (...args: any[]) => void) {
		if (!this.eventListeners[event]) return;

		if (callback) {
			this.eventListeners[event] = this.eventListeners[event].filter((cb) => cb !== callback);
		} else {
			this.eventListeners[event] = [];
		}
	}

	private emit(event: string, ...args: any[]) {
		if (this.eventListeners[event]) {
			this.eventListeners[event].forEach((callback) => {
				try {
					callback(...args);
				} catch (error) {
					console.error(`Error in WebSocket event handler for ${event}:`, error);
				}
			});
		}
	}

	// Disconnect from WebSocket
	disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}
		this.eventListeners = {};
		this.token = null;
		this.reconnectAttempts = 0;
	}

	// Check connection status
	isConnected(): boolean {
		return this.socket?.connected ?? false;
	}

	// Update token (useful when token refreshes)
	updateToken(newToken: string) {
		if (this.token !== newToken) {
			this.token = newToken;
			if (this.socket && this.socket.connected) {
				this.disconnect();
				this.initialize(newToken);
			}
		}
	}
}

// Create a singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
