import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { VoiceState } from '../models/VoiceState';
import { Channel } from '../models/Channel';
import { User } from '../models/User';
import { ChannelType } from '../models/ChannelType';

const joinVoiceChannel = async (req: Request, res: Response) => {
	try {
		const { channelId, isMuted = false, isCameraOn = false } = req.body;
		const userId = req.body.userId;

		if (!channelId || !userId) {
			return res.status(400).json({ message: 'channelId and userId are required' });
		}

		const userRepo = AppDataSource.getRepository(User);
		const channelRepo = AppDataSource.getRepository(Channel);
		const voiceStateRepo = AppDataSource.getRepository(VoiceState);

		const user = await userRepo.findOneBy({ id: userId });
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		const channel = await channelRepo.findOneBy({ id: channelId });
		if (!channel) {
			return res.status(404).json({ message: 'Channel not found' });
		}

		if (channel.type !== ChannelType.VOICE) {
			return res.status(400).json({ message: 'Channel is not a voice channel' });
		}

		const existingVoiceState = await voiceStateRepo.findOne({
			where: {
				user: { id: userId },
				channel: { id: channelId },
				leftAt: null,
			},
		});

		if (existingVoiceState) {
			return res.status(409).json({ message: 'User is already in this voice channel' });
		}

		const voiceState = voiceStateRepo.create({
			user,
			channel,
			isMuted,
			isCameraOn,
			isDeafened: false,
			isScreenSharing: false,
			leftAt: null,
		});

		await voiceStateRepo.save(voiceState);

		const voiceStateData = {
			id: voiceState.id,
			userId: user.id,
			username: user.username,
			channelId: channel.id,
			isMuted: voiceState.isMuted,
			isCameraOn: voiceState.isCameraOn,
			isDeafened: voiceState.isDeafened,
			isScreenSharing: voiceState.isScreenSharing,
			joinedAt: voiceState.joinedAt,
		};

		return res.status(201).json(voiceStateData);
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		return res.status(500).json({ 
			message: 'Error joining voice channel', 
			error: errorMessage 
		});
	}
};

const leaveVoiceChannel = async (req: Request, res: Response) => {
	try {
		const { channelId } = req.body;
		const userId = req.body.userId;

		if (!channelId || !userId) {
			return res.status(400).json({ message: 'channelId and userId are required' });
		}

		const voiceStateRepo = AppDataSource.getRepository(VoiceState);

		const voiceState = await voiceStateRepo.findOne({
			where: {
				user: { id: userId },
				channel: { id: channelId },
				leftAt: null,
			},
			relations: ['user', 'channel'],
		});

		if (!voiceState) {
			return res.status(404).json({ message: 'User is not in this voice channel' });
		}

		await voiceStateRepo.delete(voiceState.id);

		return res.status(200).json({ 
			message: 'Successfully left voice channel'
		});
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		return res.status(500).json({ 
			message: 'Error leaving voice channel', 
			error: errorMessage 
		});
	}
};

const updateVoiceState = async (req: Request, res: Response) => {
	try {
		const { channelId, isMuted, isCameraOn, isDeafened, isScreenSharing } = req.body;
		const userId = req.body.userId;

		if (!channelId || !userId) {
			return res.status(400).json({ message: 'channelId and userId are required' });
		}

		const voiceStateRepo = AppDataSource.getRepository(VoiceState);

		const voiceState = await voiceStateRepo.findOne({
			where: {
				user: { id: userId },
				channel: { id: channelId },
				leftAt: null,
			},
			relations: ['user', 'channel'],
		});

		if (!voiceState) {
			return res.status(404).json({ message: 'User is not in this voice channel' });
		}

		if (isMuted !== undefined) voiceState.isMuted = isMuted;
		if (isCameraOn !== undefined) voiceState.isCameraOn = isCameraOn;
		if (isDeafened !== undefined) voiceState.isDeafened = isDeafened;
		if (isScreenSharing !== undefined) voiceState.isScreenSharing = isScreenSharing;

		await voiceStateRepo.save(voiceState);

		const voiceStateData = {
			id: voiceState.id,
			userId: voiceState.user.id,
			username: voiceState.user.username,
			channelId: voiceState.channel.id,
			isMuted: voiceState.isMuted,
			isCameraOn: voiceState.isCameraOn,
			isDeafened: voiceState.isDeafened,
			isScreenSharing: voiceState.isScreenSharing,
			joinedAt: voiceState.joinedAt,
		};

		return res.status(200).json(voiceStateData);
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		return res.status(500).json({ 
			message: 'Error updating voice state', 
			error: errorMessage 
		});
	}
};

const getVoiceChannelUsers = async (req: Request, res: Response) => {
	try {
		const { channelId } = req.query;

		if (!channelId) {
			return res.status(400).json({ message: 'channelId is required' });
		}

		const voiceStateRepo = AppDataSource.getRepository(VoiceState);
		const channelRepo = AppDataSource.getRepository(Channel);

		const channel = await channelRepo.findOneBy({ id: String(channelId) });
		if (!channel) {
			return res.status(404).json({ message: 'Channel not found' });
		}

		if (channel.type !== ChannelType.VOICE) {
			return res.status(400).json({ message: 'Channel is not a voice channel' });
		}

		const voiceStates = await voiceStateRepo.find({
			where: {
				channel: { id: String(channelId) },
				leftAt: null,
			},
			relations: ['user', 'channel'],
		});

		const voiceUsers = voiceStates.map((voiceState) => ({
			id: voiceState.id,
			userId: voiceState.user.id,
			username: voiceState.user.username,
			channelId: voiceState.channel.id,
			isMuted: voiceState.isMuted,
			isCameraOn: voiceState.isCameraOn,
			isDeafened: voiceState.isDeafened,
			isScreenSharing: voiceState.isScreenSharing,
			joinedAt: voiceState.joinedAt,
		}));

		return res.status(200).json(voiceUsers);
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		return res.status(500).json({ 
			message: 'Error getting voice channel users', 
			error: errorMessage 
		});
	}
};

const getUserVoiceState = async (req: Request, res: Response) => {
	try {
		const userId = req.body.userId;
		const { channelId } = req.query;

		if (!userId || !channelId) {
			return res.status(400).json({ message: 'userId and channelId are required' });
		}

		const voiceStateRepo = AppDataSource.getRepository(VoiceState);

		const voiceState = await voiceStateRepo.findOne({
			where: {
				user: { id: userId },
				channel: { id: String(channelId) },
				leftAt: null,
			},
			relations: ['user', 'channel'],
		});

		if (!voiceState) {
			return res.status(404).json({ message: 'User is not in this voice channel' });
		}

		const voiceStateData = {
			id: voiceState.id,
			userId: voiceState.user.id,
			username: voiceState.user.username,
			channelId: voiceState.channel.id,
			isMuted: voiceState.isMuted,
			isCameraOn: voiceState.isCameraOn,
			isDeafened: voiceState.isDeafened,
			isScreenSharing: voiceState.isScreenSharing,
			joinedAt: voiceState.joinedAt,
		};

		return res.status(200).json(voiceStateData);
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		return res.status(500).json({ 
			message: 'Error getting user voice state', 
			error: errorMessage 
		});
	}
};

export const voiceStateController = {
	joinVoiceChannel,
	leaveVoiceChannel,
	updateVoiceState,
	getVoiceChannelUsers,
	getUserVoiceState,
};