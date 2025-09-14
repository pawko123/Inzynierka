import { api } from './api';

export interface MessagePermissions {
	canEdit: boolean;
	canDelete: boolean;
}

export interface UserPermissions {
	[permission: string]: boolean;
}

export class MessageService {
	/**
	 * Get user's permissions for the server
	 */
	static async getUserPermissions(
		serverId: string,
		permissions: string[],
	): Promise<UserPermissions> {
		const response = await api.post('/server/getUserPermissions', {
			serverId,
			permissions,
		});
		return response.data;
	}

	/**
	 * Get user's permissions for a specific channel
	 */
	static async getUserPermissionsOnChannel(
		channelId: string,
		serverId?: string,
		permissions: string[] = ['MANAGE_MESSAGES'],
	): Promise<UserPermissions> {
		const response = await api.post('/server/getUserPermissionsOnChannel', {
			channelId,
			serverId,
			permissions,
		});
		return response.data;
	}

	/**
	 * Check if a user can edit/delete a message based on permissions and ownership
	 */
	static async getMessagePermissions(
		messageId: string,
		channelId: string,
		currentUserId: string,
		messageSenderId?: string,
		serverId?: string,
		isDirect: boolean = false,
	): Promise<MessagePermissions> {
		const isOwner = currentUserId === messageSenderId;

		// For direct channels, only the message owner can edit/delete
		if (isDirect) {
			return {
				canEdit: isOwner,
				canDelete: isOwner,
			};
		}

		// For server channels, check permissions
		if (serverId) {
			try {
				// Check both server-wide and channel-specific permissions
				const [serverPermissions, channelPermissions] = await Promise.all([
					this.getUserPermissions(serverId, ['MANAGE_MESSAGES']),
					this.getUserPermissionsOnChannel(channelId, serverId, ['MANAGE_MESSAGES']),
				]);

				const hasManageMessages =
					serverPermissions.MANAGE_MESSAGES || channelPermissions.MANAGE_MESSAGES;

				return {
					canEdit: isOwner, // Only message owner can edit
					canDelete: isOwner || hasManageMessages, // Owner or users with MANAGE_MESSAGES can delete
				};
			} catch (error) {
				console.error('Error checking permissions:', error);
				// Fallback to owner-only permissions on error
				return {
					canEdit: isOwner,
					canDelete: isOwner,
				};
			}
		}

		// Fallback for other cases
		return {
			canEdit: isOwner,
			canDelete: isOwner,
		};
	}

	/**
	 * Delete a message
	 */
	static async deleteMessage(messageId: string): Promise<void> {
		await api.delete(`/message/delete?messageId=${messageId}`);
	}

	/**
	 * Update a message
	 */
	static async updateMessage(messageId: string, content: string): Promise<void> {
		await api.put('/message/update', {
			messageId,
			content,
		});
	}
}
