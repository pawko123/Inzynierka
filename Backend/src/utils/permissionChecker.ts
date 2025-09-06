import { AppDataSource } from '../config/data-source';
import { User } from '../models/User';
import { ServerMember } from '../models/ServerMember';
import { Message } from '../models/Message';
import { PermissionType } from '../models/RolePermissionType';
import { MemberRole } from '../models/MemberRole';
import { Channel } from '../models/Channel';

interface PermissionCheckResult {
	[permission: string]: boolean;
}

interface SelfActionContext {
	userToMuteId?: string;
	messageSenderId?: string;
	messageId?: string;
}

export const checkUserPermissions = async (
	userId: string,
	serverId?: string,
	channelId?: string,
	permissions: string[] = [],
	selfActionContext?: SelfActionContext
): Promise<PermissionCheckResult> => {
	const result: PermissionCheckResult = {};
	
	try {
		const userRepo = AppDataSource.getRepository(User);
		const memberRepo = AppDataSource.getRepository(ServerMember);
		const channelRepo = AppDataSource.getRepository(Channel);

		const user = await userRepo.findOne({ where: { id: userId } });
		if (!user) {
			// User not found, no permissions
			permissions.forEach(perm => result[perm] = false);
			return result;
		}

		// Direct channels: allow if channel.isDirect === true
		if (channelId) {
			const channel = await channelRepo.findOne({ where: { id: channelId } });
			if (channel?.isDirect) {
				permissions.forEach(perm => result[perm] = true);
				return result;
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
				// User is not a member of the server
				permissions.forEach(perm => {
					if (perm === PermissionType.SERVER_MEMBER) {
						result[perm] = false;
					} else {
						result[perm] = false;
					}
				});
				return result;
			}

			memberRoles = member.roles || [];
		}

		// Check each permission
		for (const permission of permissions) {
			// 1. Default role shortcut — power admin skip all checks
			if (memberRoles.some((mr) => mr.role?.isDefault === true)) {
				result[permission] = true;
				continue;
			}

			// 2. Self actions shortcuts
			if (selfActionContext) {
				if (permission === PermissionType.MUTE_MEMBERS && 
					selfActionContext.userToMuteId === userId) {
					result[permission] = true;
					continue;
				}
				
				if (permission === PermissionType.DEAFEN_MEMBERS && 
					selfActionContext.messageSenderId === userId) {
					result[permission] = true;
					continue;
				}
				
				if (permission === PermissionType.MANAGE_MESSAGES && 
					selfActionContext.messageId) {
					// Check if user owns the message
					const messageRepo = AppDataSource.getRepository(Message);
					const message = await messageRepo.findOne({ 
						where: { id: selfActionContext.messageId }, 
						relations: ['sender'] 
					});
					if (message && message.sender.id === userId) {
						result[permission] = true;
						continue;
					}
				}
			}

			// 3. If permission is SERVER_MEMBER and user is member (already confirmed), allow
			if (permission === PermissionType.SERVER_MEMBER) {
				result[permission] = true;
				continue;
			}

			// 4. Permission checks:
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
				result[permission] = hasChannelPermission;
			} else {
				// No channel-specific permission defined, check server-wide permissions
				const hasServerPermission = memberRoles.some((mr) => {
					const role = mr.role;
					return role?.permissions?.some((p) => p.permission === permission);
				});

				result[permission] = hasServerPermission;
			}
		}

		return result;
	} catch (err) {
		console.error('Permission check error:', err);
		// On error, deny all permissions
		permissions.forEach(perm => result[perm] = false);
		return result;
	}
};
