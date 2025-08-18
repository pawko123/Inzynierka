import { ServerMember } from '../models/ServerMember';
import { MemberRole } from '../models/MemberRole';
import { RolePermission } from '../models/RolePermission';
import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Role } from '../models/Role';
import { Server } from '../models/Server';
import { PermissionType } from '../models/RolePermissionType';
import { ChannelRulesUpdateDto } from './dto/channel/channelRules.dto';
import { ChannelPermissionDto } from './dto/channel/channelPermission.dto';
import { Channel } from '../models/Channel';
import { In } from 'typeorm/find-options/operator/In';
import { ChannelPermission } from '../models/ChannelPermission';
import { GetRoleResponseDto } from './dto/role/getRole.dto';

const createRole = async (req: Request, res: Response) => {
	const { serverId, name, color } = req.body;
	if (!serverId || !name) {
		return res.status(400).json({ error: 'Missing serverId or role name.' });
	}
	try {
		const serverRepo = AppDataSource.getRepository(Server);
		const roleRepo = AppDataSource.getRepository(Role);
		const server = await serverRepo.findOne({ where: { id: serverId } });
		if (!server) {
			return res.status(404).json({ error: 'Server not found.' });
		}
		const role = new Role();
		role.server = server;
		role.name = name;
		role.color = color || '#6d6d6dff';
		role.isDefault = false;
		await roleRepo.save(role);

		const roleSanitized = {
			id: role.id,
			name: role.name,
			color: role.color,
			isDefault: role.isDefault,
			serverId: server.id,
		};

		return res.status(201).json(roleSanitized);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

export const deleteRole = async (req: Request, res: Response) => {
	const { roleId } = req.query;
	if (!roleId) {
		return res.status(400).json({ error: 'Missing roleId.' });
	}
	try {
		const roleRepo = AppDataSource.getRepository(Role);
		const role = await roleRepo.findOne({ where: { id: String(roleId) } });
		if (!role) {
			return res.status(404).json({ error: 'Role not found.' });
		}
		if (role.isDefault) {
			return res.status(400).json({ error: 'Default roles cannot be deleted.' });
		}
		await roleRepo.remove(role);
		return res.status(200).json({ message: 'Role deleted successfully.' });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const updateRolePermissions = async (req: Request, res: Response) => {
	const { roleId, permissions } = req.body;
	if (!roleId || !Array.isArray(permissions)) {
		return res.status(400).json({ error: 'Missing roleId or permissions array.' });
	}
	try {
		await AppDataSource.transaction(async (manager) => {
			const roleRepo = manager.getRepository(Role);
			const rolePermissionRepo = manager.getRepository(RolePermission);
			const role = await roleRepo.findOne({
				where: { id: roleId },
				relations: ['permissions'],
			});
			if (!role) {
				throw new Error('NOT_FOUND');
			}
			if (role.permissions && role.permissions.length > 0) {
				await rolePermissionRepo.remove(role.permissions);
			}
			const newPermissions: RolePermission[] = permissions.map((perm: string) => {
				if (!Object.values(PermissionType).includes(perm as PermissionType)) {
					throw new Error(`Invalid permission type: ${perm}`);
				}
				const rp = new RolePermission();
				rp.role = role;
				rp.permission = perm as PermissionType;
				return rp;
			});
			await rolePermissionRepo.save(newPermissions);
		});
		return res.status(200).json({ message: 'Role permissions updated successfully.' });
	} catch (err) {
		if (err.message === 'NOT_FOUND') {
			return res.status(404).json({ error: 'Role not found.' });
		}
		if (err.message.startsWith('Invalid permission type:')) {
			return res.status(400).json({ error: err.message });
		}
		console.error(err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const getRoleWithPermissionsById = async (req: Request, res: Response) => {
	const { roleId } = req.query;
	if (!roleId) {
		return res.status(400).json({ error: 'Missing roleId.' });
	}
	try {
		const roleRepo = AppDataSource.getRepository(Role);
		const role = await roleRepo.findOne({
			where: { id: String(roleId) },
			relations: ['permissions', 'server', 'members.member', 'members.member.user'],
		});
		if (!role) {
			return res.status(404).json({ error: 'Role not found.' });
		}

		const channelPermissions: ChannelPermissionDto[] = await AppDataSource.getRepository(
			ChannelPermission,
		)
			.createQueryBuilder('cp')
			.select('cp.channelId', 'channelId')
			.addSelect('ARRAY_AGG(cp.permission)', 'permissions')
			.where('cp.roleId = :roleId', { roleId })
			.groupBy('cp.channelId')
			.getRawMany();

		const result: GetRoleResponseDto = {
			id: role.id,
			name: role.name,
			color: role.color,
			isDefault: role.isDefault,
			serverId: role.server?.id,
			rolePermissions: role.permissions.map((p) => p.permission),
			channelPermissions: channelPermissions,
			currentHolders: role.members.map((memberRole) => ({
				id: memberRole.member.id,
				userId: memberRole.member.user.id,
				memberName: memberRole.member.memberName,
			})),
		};
		return res.status(200).json(result);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const addRoleToMember = async (req: Request, res: Response) => {
	const { memberId, roleId } = req.body;
	if (!memberId || !roleId) {
		return res.status(400).json({ error: 'Missing memberId or roleId.' });
	}
	try {
		const memberRepo = AppDataSource.getRepository(ServerMember);
		const roleRepo = AppDataSource.getRepository(Role);
		const memberRoleRepo = AppDataSource.getRepository(MemberRole);
		const member = await memberRepo.findOne({ where: { id: memberId } });
		if (!member) {
			return res.status(404).json({ error: 'Member not found.' });
		}
		const role = await roleRepo.findOne({ where: { id: roleId } });
		if (!role) {
			return res.status(404).json({ error: 'Role not found.' });
		}

		const existing = await memberRoleRepo.findOne({
			where: { member: { id: memberId }, role: { id: roleId } },
			relations: ['member', 'role'],
		});
		if (existing) {
			return res.status(400).json({ error: 'Role already assigned to member.' });
		}
		const memberRole = new MemberRole();
		memberRole.member = member;
		memberRole.role = role;
		await memberRoleRepo.save(memberRole);
		return res.status(200).json({ message: 'Role assigned to member.' });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const removeRoleFromMember = async (req: Request, res: Response) => {
	const { memberId, roleId } = req.body;
	if (!memberId || !roleId) {
		return res.status(400).json({ error: 'Missing memberId or roleId.' });
	}
	try {
		const memberRoleRepo = AppDataSource.getRepository(MemberRole);
		const memberRole = await memberRoleRepo.findOne({
			where: { member: { id: memberId }, role: { id: roleId } },
			relations: ['member', 'role'],
		});
		if (!memberRole) {
			return res.status(404).json({ error: 'Role not assigned to member.' });
		}
		await memberRoleRepo.remove(memberRole);
		return res.status(200).json({ message: 'Role removed from member.' });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const editRoleChannelPermissions = async (req: Request, res: Response) => {
	const requestBody = req.body as ChannelRulesUpdateDto;

	if (
		!requestBody ||
		!Array.isArray(requestBody.channelPermissions) ||
		!requestBody.serverId ||
		!requestBody.roleId
	) {
		return res.status(400).json({ error: 'Invalid request body.' });
	}

	try {
		await AppDataSource.transaction(async (manager) => {
			const roleRepo = manager.getRepository(Role);
			const channelPermissionRepo = manager.getRepository(ChannelPermission);

			const channelRepo = manager.getRepository(Channel);
			const channels = await channelRepo.find({
				where: {
					server: { id: requestBody.serverId },
					id: In(requestBody.channelPermissions.map((cp) => cp.channelId)),
				},
				select: ['id'],
			});

			if (channels.length !== requestBody.channelPermissions.length) {
				throw new Error('Invalid body: One or more channels do not exist on the server.');
			}

			const role = await roleRepo.findOne({
				where: { id: requestBody.roleId, server: { id: requestBody.serverId } },
				relations: ['channelPermissions'],
			});
			if (!role) {
				throw new Error(
					'Invalid body: Role not found or does not belong to the specified server.',
				);
			}

			const existingPermissions = await channelPermissionRepo.find({
				where: { role: { id: role.id }, channel: { id: In(channels.map((c) => c.id)) } },
			});

			await channelPermissionRepo.remove(existingPermissions);

			const newPermissions: ChannelPermission[] = [];
			for (const cp of requestBody.channelPermissions) {
				if (!Array.isArray(cp.permissions)) {
					throw new Error(
						`Invalid body: Permissions for channel ${cp.channelId} must be an array.`,
					);
				}
				for (const perm of cp.permissions) {
					if (!Object.values(PermissionType).includes(perm as PermissionType)) {
						throw new Error(
							`Invalid body: Invalid permission type in channel ${cp.channelId}: ${perm}`,
						);
					}
					const channelPerm = new ChannelPermission();
					channelPerm.channel = channels.find((c) => c.id === cp.channelId);
					channelPerm.role = role;
					channelPerm.permission = perm as PermissionType;
					newPermissions.push(channelPerm);
				}
			}
			await channelPermissionRepo.save(newPermissions);
		});

		return res.status(200).json({ message: 'Channel permissions updated successfully.' });
	} catch (err) {
		if (err.message.startsWith('Invalid body:')) {
			return res.status(400).json({ error: err.message });
		}
		console.error(err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

export const roleController = {
	createRole,
	deleteRole,
	updateRolePermissions,
	getRoleWithPermissionsById,
	addRoleToMember,
	removeRoleFromMember,
	editRoleChannelPermissions,
};
