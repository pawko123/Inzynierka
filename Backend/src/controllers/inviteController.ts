import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Server } from '../models/Server';
import { ServerInvite } from '../models/ServerInvite';
import { v4 as uuidv4 } from 'uuid';
import { ServerMember } from '../models/ServerMember';
import { User } from '../models/User';

export const createInvite = async (req: Request, res: Response) => {
	const { serverId } = req.body;
	if (!serverId) {
		return res.status(400).json({ error: 'Missing serverId.' });
	}
	try {
		const serverRepo = AppDataSource.getRepository(Server);
		const inviteRepo = AppDataSource.getRepository(ServerInvite);
		const server = await serverRepo.findOne({ where: { id: serverId } });
		if (!server) {
			return res.status(404).json({ error: 'Server not found.' });
		}
		const code = uuidv4();
		const invite = new ServerInvite();
		invite.code = code;
		invite.server = server;
		invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		await inviteRepo.save(invite);
		return res.status(201).json({ inviteCode: `${code}` });
	} catch (err: unknown) {
		console.error(err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

export const acceptInvite = async (req: Request, res: Response) => {
	const { code } = req.params;
	const userId = req.body.userId;
	if (!code || !userId) {
		return res.status(400).json({ error: 'Missing invite code or user not authenticated.' });
	}
	try {
		let joinedServerId: string | undefined;
		await AppDataSource.transaction(async (manager) => {
			const inviteRepo = manager.getRepository(ServerInvite);
			const memberRepo = manager.getRepository(ServerMember);
			const userRepo = manager.getRepository(User);
			const invite = await inviteRepo.findOne({ where: { code }, relations: ['server'] });
			if (!invite) {
				throw new Error('INVITE_NOT_FOUND');
			}
			if (invite.expiresAt && new Date() > invite.expiresAt) {
				throw new Error('INVITE_EXPIRED');
			}
			const user = await userRepo.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('USER_NOT_FOUND');
			}

			const existingMember = await memberRepo.findOne({
				where: { user: { id: userId }, server: { id: invite.server.id } },
				relations: ['user', 'server'],
			});
			if (existingMember) {
				throw new Error('ALREADY_MEMBER');
			}

			const member = new ServerMember();
			member.user = user;
			member.server = invite.server;
			member.memberName = user.username;
			invite.uses += 1;
			await inviteRepo.save(invite);
			await memberRepo.save(member);

			joinedServerId = invite.server.id;
		});
		return res.status(200).json({
			message: 'Joined server successfully.',
			serverId: joinedServerId,
		});
	} catch (err: unknown) {
		if (err instanceof Error && err.message === 'INVITE_NOT_FOUND') {
			return res.status(404).json({ error: 'Invite not found.' });
		}
		if (err instanceof Error && err.message === 'INVITE_EXPIRED') {
			return res.status(400).json({ error: 'Invite expired.' });
		}
		if (err instanceof Error && err.message === 'INVITE_MAXED') {
			return res.status(400).json({ error: 'Invite has reached max uses.' });
		}
		if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
			return res.status(404).json({ error: 'User not found.' });
		}
		if (err instanceof Error && err.message === 'ALREADY_MEMBER') {
			return res.status(400).json({ error: 'User is already a member of this server.' });
		}
		console.error(err);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};
