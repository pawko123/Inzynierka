import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { User } from '../models/User';
import { ServerMember } from '../models/ServerMember';
import { Message } from '../models/Message';
import { PermissionType } from '../models/RolePermissionType';
import { MemberRole } from '../models/MemberRole';
import { Channel } from '../models/Channel';

export const checkUserPermission = (permission: string) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userId = req.body.userId || req.query.userId || req.params.userId;
			const serverId = req.body.serverId || req.query.serverId || req.params.serverId;
			const channelId = req.body.channelId || req.query.channelId || req.params.channelId;

			if (!userId) {
				return res.status(401).json({ error: 'User ID not provided.' });
			}

			const userRepo = AppDataSource.getRepository(User);
			const memberRepo = AppDataSource.getRepository(ServerMember);
			const channelRepo = AppDataSource.getRepository(Channel);

			const user = await userRepo.findOne({ where: { id: userId } });
			if (!user) {
				return res.status(404).json({ error: 'User not found.' });
			}

			// Direct channels: allow if channel.isDirect === true
			if (channelId) {
				const channel = await channelRepo.findOne({ where: { id: channelId } });
				if (channel?.isDirect) {
					return next();
				}
			}

			// Load member and roles if serverId is provided
			let member: ServerMember | null = null;
			let memberRoles: MemberRole[] = [];
			if (serverId) {
				member = await memberRepo.findOne({
					where: { user: { id: userId }, server: { id: serverId } },
					relations: [
						'roles',
						'roles.role',
						'roles.role.channelPermissions',
						'roles.role.permissions',
						'roles.role.channelPermissions.channel',
					],
				});

				if (!member) {
					// If permission is SERVER_MEMBER, fail here
					if (permission === PermissionType.SERVER_MEMBER) {
						return res
							.status(403)
							.json({ error: 'User is not a member of the server.' });
					}
					// For other permissions, maybe user isn't member → deny access
					return res
						.status(403)
						.json({ error: `User does not have permission: ${permission}` });
				}

				memberRoles = member.roles || [];
			}

			// 1. Default role shortcut — power admin skip all checks
			if (memberRoles.some((mr) => mr.role?.isDefault === true)) {
				return next();
			}

			// 2. Self actions shortcuts
			if (
				isSelfMute(permission, req, userId) ||
				isSelfDeafen(permission, req, userId) ||
				(await isSelfDeleteMessage(permission, req, userId))
			) {
				return next();
			}

			// 3. If permission is SERVER_MEMBER and user is member (already confirmed), allow
			if (permission === PermissionType.SERVER_MEMBER) {
				return next();
			}

			// 4. Permission checks:
			// If channelId provided, check channel permissions first (if any role has that permission defined in channelPermissions)
			// If no channel-specific permission found, check server permissions

			let hasChannelPermission = false;
			let anyRoleHasChannelPermDefined = false;

			if (channelId && memberRoles.length > 0) {
				// Check if any role defines this permission on this channel
				for (const mr of memberRoles) {
					const role = mr.role;
					if (!role || !role.channelPermissions) continue;

					const channelPermsForRole = role.channelPermissions.filter(
						(cp) => cp.channel.id === channelId,
					);
					if (channelPermsForRole.length > 0) {
						anyRoleHasChannelPermDefined = true;
						if (channelPermsForRole.some((cp) => cp.permission === permission)) {
							hasChannelPermission = true;
							break;
						}
					}
				}
			}

			if (anyRoleHasChannelPermDefined) {
				// If channel permissions are defined, server permissions ignored
				if (!hasChannelPermission) {
					return res
						.status(403)
						.json({ error: `User does not have channel permission: ${permission}` });
				}
			} else {
				// No channel-specific permission defined, check server-wide permissions
				const hasServerPermission = memberRoles.some((mr) => {
					const role = mr.role;
					return role?.permissions?.some((p) => p.permission === permission);
				});

				if (!hasServerPermission) {
					return res
						.status(403)
						.json({ error: `User does not have server permission: ${permission}` });
				}
			}

			// Passed all checks
			return next();
		} catch (err) {
			console.error('Permission check error:', err);
			return res
				.status(500)
				.json({ error: 'Internal server error during permission check.' });
		}
	};
};

/*
const checkIfUserIsMember = async (userId: string, serverId: string): Promise<boolean> => {
	const memberRepo = AppDataSource.getRepository(ServerMember);
	const member = await memberRepo.findOne({
		where: { user: { id: userId }, server: { id: serverId } },
	});
	return !!member;
};
*/

const isSelfMute = (permission: string, req: Request, userId: string): boolean => {
	return permission === PermissionType.MUTE_MEMBERS && req.body.userToMuteId === userId;
};

const isSelfDeafen = (permission: string, req: Request, userId: string): boolean => {
	return permission === PermissionType.DEAFEN_MEMBERS && req.body.messageSenderId === userId;
};

const isSelfDeleteMessage = async (
	permission: string,
	req: Request,
	userId: string,
): Promise<boolean> => {
	if (permission !== PermissionType.MANAGE_MESSAGES) {
		return false;
	}

	const messageId = req.body.messageId || req.query.messageId;

	if (!messageId) {
		return false;
	}

	const messageRepo = AppDataSource.getRepository(Message);

	const message = await messageRepo.findOne({ where: { id: messageId }, relations: ['sender'] });

	if (!message || message.sender.id !== userId) {
		return false;
	}

	return true;
};
