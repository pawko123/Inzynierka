import { Request, Response } from 'express';
import { Server } from '../models/Server';
import { AppDataSource } from '../config/data-source';
import { Role } from '../models/Role';
import { User } from '../models/User';
import { MemberRole } from '../models/MemberRole';
import { ServerMember } from '../models/ServerMember';
import { ServerDto } from './dto/server/serverResponse.dto';
import { checkUserPermissions } from '../utils/permissionChecker';
import { PermissionType } from '../models/RolePermissionType';

const createServer = async (req: Request, res: Response) => {
	const { name, userId } = req.body;

	let logoBase64: string | null = null;
	if (req.file && req.file.buffer) {
		logoBase64 = req.file.buffer.toString('base64');
	}

	if (!name) {
		return res.status(400).json({ error: 'Server name is required.' });
	}
	if (!userId) {
		return res.status(400).json({ error: 'User ID is required.' });
	}

	try {
		const result = await AppDataSource.transaction(async (manager) => {
			const userRepo = manager.getRepository(User);
			const serverRepo = manager.getRepository(Server);
			const roleRepo = manager.getRepository(Role);
			const serverMemberRepo = manager.getRepository(ServerMember);
			const memberRoleRepo = manager.getRepository(MemberRole);

			const user = await userRepo.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			const newServer = new Server();
			newServer.name = name;
			newServer.owner = user;
			newServer.logo = logoBase64;

			const powerAdminRole = new Role();
			powerAdminRole.name = 'Power Admin';
			powerAdminRole.isDefault = true;
			powerAdminRole.color = '#FF0000';
			powerAdminRole.server = newServer;
			newServer.roles = [powerAdminRole];

			await serverRepo.save(newServer);
			await roleRepo.save(powerAdminRole);

			const serverMember = new ServerMember();
			serverMember.user = user;
			serverMember.memberName = user.username;
			serverMember.server = newServer;
			await serverMemberRepo.save(serverMember);

			const memberRole = new MemberRole();
			memberRole.member = serverMember;
			memberRole.role = powerAdminRole;
			await memberRoleRepo.save(memberRole);

			return newServer;
		});

		const sanitizedServer: ServerDto = {
			id: result.id,
			name: result.name,
			owner: {
				id: result.owner.id,
				username: result.owner.username,
			},
			roles: result.roles.map((role) => ({
				id: role.id,
				name: role.name,
				color: role.color,
				isDefault: role.isDefault,
			})),
			createdAt: result.createdAt,
			haveLogo: !!result.logo,
		};

		return res.status(201).json(sanitizedServer);
	} catch (err) {
		if (err.message === 'User not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error(err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const deleteServer = async (req: Request, res: Response) => {
	const { serverId } = req.query;
	const { userId } = req.body;

	if (!serverId || !userId) {
		return res.status(400).json({ error: 'Missing serverId or userId.' });
	}

	try {
		await AppDataSource.transaction(async (manager) => {
			const serverRepo = manager.getRepository(Server);

			const server = await serverRepo.findOne({
				where: { id: String(serverId), owner: { id: userId } },
				relations: ['owner'],
			});

			if (!server) {
				throw new Error('NOT_FOUND');
			}

			await serverRepo.remove(server);
		});

		return res.status(200).json({ message: 'Server deleted successfully.' });
	} catch (err) {
		if (err.message === 'NOT_FOUND') {
			return res.status(404).json({ error: 'Server not found.' });
		}
		console.error(err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const getUserServers = async (req: Request, res: Response) => {
	const userId = req.body.userId;
	if (!userId) {
		return res.status(400).json({ error: 'Missing userId.' });
	}
	try {
		const serverMemberRepo = AppDataSource.getRepository(ServerMember);

		const memberships = await serverMemberRepo.find({
			where: { user: { id: String(userId) } },
			relations: ['server'],
		});

		const servers = memberships.map((m) => m.server);

		return res.json(servers);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const getServer = async (req: Request, res: Response) => {
	const { serverId } = req.query;
	if (!serverId) {
		return res.status(400).json({ error: 'Missing serverId.' });
	}
	try {
		const serverRepo = AppDataSource.getRepository(Server);
		const server = await serverRepo.findOne({
			where: { id: String(serverId) },
			relations: ['owner', 'roles'],
		});
		if (!server) {
			return res.status(404).json({ error: 'Server not found.' });
		}
		const sanitizedServer: ServerDto = {
			id: server.id,
			name: server.name,
			owner: {
				id: server.owner.id,
				username: server.owner.username,
			},
			roles: server.roles
				? server.roles.map((role) => ({
						id: role.id,
						name: role.name,
						color: role.color,
						isDefault: role.isDefault,
					}))
				: [],
			createdAt: server.createdAt,
			haveLogo: !!server.logo,
		};
		return res.status(200).json(sanitizedServer);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const updateServer = async (req: Request, res: Response) => {
	const { serverId } = req.body;
	const { name, userId } = req.body;
	let logoBase64: string | undefined = undefined;
	if (req.file && req.file.buffer) {
		logoBase64 = req.file.buffer.toString('base64');
	}

	if (!serverId || !userId) {
		return res.status(400).json({ error: 'Missing serverId or userId.' });
	}

	try {
		const result = await AppDataSource.transaction(async (manager) => {
			const serverRepo = manager.getRepository(Server);
			let server = await serverRepo.findOne({
				where: { id: String(serverId), owner: { id: userId } },
				relations: ['owner'],
			});
			if (!server) {
				throw new Error('NOT_FOUND');
			}
			if (name) server.name = name;
			if (logoBase64 !== undefined) {
				server.logo = logoBase64;
			} else {
				server.logo = null;
			}
			await serverRepo.save(server);
			// refetch with roles
			server = await serverRepo.findOne({
				where: { id: String(serverId) },
				relations: ['owner', 'roles'],
			});
			return server;
		});

		const sanitizedServer: ServerDto = {
			id: result.id,
			name: result.name,
			owner: {
				id: result.owner.id,
				username: result.owner.username,
			},
			roles: result.roles
				? result.roles.map((role) => ({
						id: role.id,
						name: role.name,
						color: role.color,
						isDefault: role.isDefault,
					}))
				: [],
			createdAt: result.createdAt,
			haveLogo: !!result.logo,
		};

		return res.status(200).json(sanitizedServer);
	} catch (err) {
		if (err.message === 'NOT_FOUND') {
			return res.status(404).json({ error: 'Server not found or not owned by user.' });
		}
		console.error(err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const getServerMembers = async (req: Request, res: Response) => {
	const { serverId } = req.query;
	if (!serverId) {
		return res.status(400).json({ error: 'Missing serverId.' });
	}
	try {
		const serverMemberRepo = AppDataSource.getRepository(ServerMember);
		const members = await serverMemberRepo.find({
			where: { server: { id: String(serverId) } },
			relations: ['user', 'roles', 'roles.role'],
		});
		const result = members.map((member) => ({
			id: member.id,
			memberName: member.memberName,
			user: {
				id: member.user.id,
				username: member.user.username,
			},
			roles: member.roles
				? member.roles.map((mr) => ({
						id: mr.role.id,
						name: mr.role.name,
						color: mr.role.color,
					}))
				: [],
		}));
		return res.status(200).json(result);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const getServerChannels = async (req: Request, res: Response) => {
	const { serverId } = req.query;
	if (!serverId) {
		return res.status(400).json({ error: 'Missing serverId.' });
	}
	try {
		const channelRepo = AppDataSource.getRepository('Channel');
		const channels = await channelRepo.find({
			where: { server: { id: String(serverId) }, isDirect: false },
		});

		const result = channels.map((channel) => ({
			id: channel.id,
			name: channel.name,
			type: channel.type,
			createdAt: channel.createdAt,
		}));

		return res.status(200).json(result);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const getUserPermissions = async (req: Request, res: Response) => {
	try {
		const { serverId, userId, permissions } = req.body;
		
		if (!serverId || !userId) {
			return res.status(400).json({ error: 'Missing serverId or userId.' });
		}

		// Parse permissions array from body
		let permissionsToCheck: string[] = [];
		if (permissions) {
			if (Array.isArray(permissions)) {
				permissionsToCheck = permissions as string[];
			} else {
				permissionsToCheck = [permissions as string];
			}
		} else {
			// Default: check all permissions
			permissionsToCheck = Object.values(PermissionType);
		}

		const result = await checkUserPermissions(
			String(userId),
			String(serverId),
			undefined,
			permissionsToCheck
		);

		return res.status(200).json(result);
	} catch (err) {
		console.error('Error checking user permissions:', err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

export const serverController = {
	createServer,
	deleteServer,
	getUserServers,
	updateServer,
	getServer,
	getServerMembers,
	getServerChannels,
	getUserPermissions,
};
