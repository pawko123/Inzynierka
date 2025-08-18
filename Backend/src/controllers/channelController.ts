import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Channel } from '../models/Channel';
import { Server } from '../models/Server';
import { ChannelParticipant } from '../models/ChannelParticipant';
import { User } from '../models/User';
import { ChannelType } from '../models/ChannelType';

const createChannel = async (req: Request, res: Response) => {
	try {
		const { serverId, name, type } = req.body;
		if (type && !Object.values(ChannelType).includes(type)) {
			return res.status(400).json({
				message: `Invalid channel type. Must be one of: ${Object.values(ChannelType).join(', ')}`,
			});
		}
		const serverRepo = AppDataSource.getRepository(Server);
		const channelRepo = AppDataSource.getRepository(Channel);

		const server = await serverRepo.findOneBy({ id: serverId });
		if (!server) {
			return res.status(404).json({ message: 'Server not found' });
		}

		const channel = channelRepo.create({
			server,
			name,
			type: type,
			isDirect: false,
		});

		await channelRepo.save(channel);

		const sanitizedChannel = {
			id: channel.id,
			name: channel.name,
			type: channel.type,
			isDirect: channel.isDirect,
			serverId: channel.server.id,
		};

		return res.status(201).json(sanitizedChannel);
	} catch (err) {
		return res.status(500).json({ message: 'Error creating channel', error: err.message });
	}
};

const createDirectChannel = async (req: Request, res: Response) => {
	try {
		const { userId, invitedUserId, name } = req.body;
		if (!userId || !invitedUserId || userId === invitedUserId) {
			return res.status(400).json({ message: 'Two different user IDs are required' });
		}

		const result = await AppDataSource.transaction(async (manager) => {
			const userRepo = manager.getRepository(User);
			const channelRepo = manager.getRepository(Channel);
			const participantRepo = manager.getRepository(ChannelParticipant);

			const user1 = await userRepo.findOneBy({ id: userId });
			const user2 = await userRepo.findOneBy({ id: invitedUserId });
			if (!user1 || !user2) {
				throw new Error('USER_NOT_FOUND');
			}

			const channel = channelRepo.create({
				name: name || `${user1.username} & ${user2.username}`,
				type: ChannelType.TEXT,
				isDirect: true,
				server: null,
			});
			await channelRepo.save(channel);

			const participant1 = participantRepo.create({ channel, user: user1 });
			const participant2 = participantRepo.create({ channel, user: user2 });
			await participantRepo.save([participant1, participant2]);

			return channel;
		});

		return res.status(201).json(result);
	} catch (err) {
		if (err.message === 'USER_NOT_FOUND') {
			return res.status(404).json({ message: 'One or both users not found' });
		}
		return res
			.status(500)
			.json({ message: 'Error creating direct channel', error: err.message });
	}
};

const updateChannel = async (req: Request, res: Response) => {
	try {
		const { name, channelId } = req.body;
		const channelRepo = AppDataSource.getRepository(Channel);
		const channel = await channelRepo.findOneBy({ id: String(channelId) });
		if (!channel) {
			return res.status(404).json({ message: 'Channel not found' });
		}

		if (name !== undefined) {
			channel.name = name;
		}
		await channelRepo.save(channel);
		return res.status(200).json(channel);
	} catch (err) {
		return res.status(500).json({ message: 'Error updating channel', error: err.message });
	}
};

const deleteChannel = async (req: Request, res: Response) => {
	try {
		const { channelId } = req.query;
		const channelRepo = AppDataSource.getRepository(Channel);
		const channel = await channelRepo.findOneBy({ id: String(channelId) });
		if (!channel) {
			return res.status(404).json({ message: 'Channel not found' });
		}
		if (channel.isDirect) {
			return res.status(403).json({ message: 'Direct channels cannot be deleted' });
		}
		await channelRepo.remove(channel);
		return res.status(200).json({ message: 'Channel deleted' });
	} catch (err) {
		return res.status(500).json({ message: 'Error deleting channel', error: err.message });
	}
};

const addMemberToDirectChannel = async (req: Request, res: Response) => {
	try {
		const { channelId, invitedUserId, userId } = req.body;
		if (!channelId || !invitedUserId || !userId) {
			return res
				.status(400)
				.json({ message: 'channelId, userId, and invitedUserId are required' });
		}
		const channelRepo = AppDataSource.getRepository(Channel);
		const userRepo = AppDataSource.getRepository(User);
		const participantRepo = AppDataSource.getRepository(ChannelParticipant);

		const channel = await channelRepo.findOneBy({ id: String(channelId) });
		if (!channel) {
			return res.status(404).json({ message: 'Channel not found' });
		}
		if (!channel.isDirect) {
			return res.status(400).json({ message: 'Can only add members to direct channels' });
		}

		const inviterParticipant = await participantRepo.findOne({
			where: { channel: { id: channel.id }, user: { id: String(userId) } },
		});
		if (!inviterParticipant) {
			return res
				.status(403)
				.json({ message: 'Inviter must be a participant of the channel' });
		}

		const user = await userRepo.findOneBy({ id: String(invitedUserId) });
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		const existing = await participantRepo.findOne({
			where: { channel: { id: channel.id }, user: { id: user.id } },
		});
		if (existing) {
			return res.status(409).json({ message: 'User is already a member of this channel' });
		}

		const participant = participantRepo.create({ channel, user });
		await participantRepo.save(participant);
		return res.status(201).json({ message: 'User added to channel' });
	} catch (err) {
		return res
			.status(500)
			.json({ message: 'Error adding member to direct channel', error: err.message });
	}
};

const getDirectChannelParticipants = async (req: Request, res: Response) => {
	try {
		const { channelId } = req.query;
		const { userId } = req.body;

		if (!channelId) {
			return res.status(400).json({ message: 'channelId is required' });
		}

		const channelRepo = AppDataSource.getRepository(Channel);
		const participantRepo = AppDataSource.getRepository(ChannelParticipant);

		const channel = await channelRepo.findOneBy({ id: String(channelId) });
		if (!channel) {
			return res.status(404).json({ message: 'Channel not found' });
		}
		if (!channel.isDirect) {
			return res.status(400).json({ message: 'Not a direct channel' });
		}

		const isParticipant = await participantRepo.findOne({
			where: { channel: { id: channel.id }, user: { id: String(userId) } },
			relations: ['user'],
		});
		if (!isParticipant) {
			return res.status(403).json({ message: 'You are not a participant of this channel' });
		}

		const participants = await participantRepo.find({
			where: { channel: { id: channel.id } },
			relations: ['user'],
		});

		const users = participants.map((p) => ({ id: p.user.id, username: p.user.username }));

		return res.status(200).json(users);
	} catch (err) {
		return res
			.status(500)
			.json({ message: 'Error getting channel participants', error: err.message });
	}
};

const getUserDirectChannels = async (req: Request, res: Response) => {
	try {
		const { userId } = req.body;
		if (!userId) {
			return res.status(400).json({ message: 'userId is required' });
		}

		const participantRepo = AppDataSource.getRepository(ChannelParticipant);

		const participants = await participantRepo.find({
			where: { user: { id: String(userId) }, channel: { isDirect: true } },
			relations: ['channel'],
		});

		const directChannels = participants
			.filter((p) => p.channel.isDirect)
			.map((p) => ({
				id: p.channel.id,
				name: p.channel.name,
				type: p.channel.type,
			}));

		return res.status(200).json(directChannels);
	} catch (err) {
		return res
			.status(500)
			.json({ message: 'Error getting direct channels', error: err.message });
	}
};

export const channelController = {
	createChannel,
	createDirectChannel,
	updateChannel,
	deleteChannel,
	addMemberToDirectChannel,
	getDirectChannelParticipants,
	getUserDirectChannels,
};
