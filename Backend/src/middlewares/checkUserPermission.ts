import { Request, Response, NextFunction } from 'express';
import { PermissionType } from '../models/RolePermissionType';
import { checkUserPermissions } from '../utils/permissionChecker';

export const checkUserPermission = (permission: string) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userId = req.body.userId || req.query.userId || req.params.userId;
			const serverId = req.body.serverId || req.query.serverId || req.params.serverId;
			const channelId = req.body.channelId || req.query.channelId || req.params.channelId;

			if (!userId) {
				return res.status(401).json({ error: 'User ID not provided.' });
			}

			// Handle self actions shortcuts that need request context
			let selfActionContext = undefined;
			if (permission === PermissionType.MUTE_MEMBERS || 
				permission === PermissionType.DEAFEN_MEMBERS || 
				permission === PermissionType.MANAGE_MESSAGES) {
				selfActionContext = {
					userToMuteId: req.body.userToMuteId,
					messageSenderId: req.body.messageSenderId,
					messageId: req.body.messageId || req.query.messageId,
				};
			}

			// Use the permission checker utility
			const permissionResult = await checkUserPermissions(
				userId,
				serverId,
				channelId,
				[permission],
				selfActionContext
			);

			if (permissionResult[permission]) {
				return next();
			} else {
				return res.status(403).json({ 
					error: `User does not have permission: ${permission}` 
				});
			}
		} catch (err) {
			console.error('Permission check error:', err);
			return res.status(500).json({ 
				error: 'Internal server error during permission check.' 
			});
		}
	};
};
