import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Message } from '../models/Message';
import { Channel } from '../models/Channel';
import { User } from '../models/User';
import { MessageAttachment } from '../models/MessageAttachment';
import { MessageDTO } from './dto/message/message.dto';
import { Brackets } from 'typeorm/query-builder/Brackets';

const createMessage = async (req: Request, res: Response) => {
	const files = req.files as Express.Multer.File[];
	const { content, channelId, userId } = req.body;

	if (!channelId || !userId) {
		return res.status(400).json({ error: 'Missing required fields.' });
	}

	if (!content && (!files || files.length === 0)) {
		return res.status(400).json({ error: 'Message content or files are required.' });
	}

	try {
		await AppDataSource.transaction(async (manager) => {
			const messageRepo = manager.getRepository(Message);
			const channelRepo = manager.getRepository(Channel);
			const userRepo = manager.getRepository(User);

			const user = await userRepo.findOne({ where: { id: userId } });
			if (!user) {
				return res.status(404).json({ error: 'User not found.' });
			}

			const channel = await channelRepo.findOne({ where: { id: channelId } });
			if (!channel) {
				return res.status(404).json({ error: 'Channel not found.' });
			}
			const message = new Message();
			message.content = content;
			message.channel = channel;
			message.sender = user;

			message.attachments = files.map((file) => {
				const attachment = new MessageAttachment();
				attachment.fileName = file.originalname;
				attachment.url = `${process.env.ATTACHMENTS_PATH}${file.filename}`;
				attachment.fileType = file.mimetype;
				attachment.size = file.size;
				return attachment;
			});

			await messageRepo.save(message);

			const sterilizedMessage = {
				messageId: message.id,
				content: message.content,
				channelId: message.channel.id,
				senderId: message.sender.id,
				attachments: message.attachments.map((attachment) => ({
					id: attachment.id,
					fileName: attachment.fileName,
					url: attachment.url,
					fileType: attachment.fileType,
					size: attachment.size,
				})),
				createdAt: message.sentAt,
			};

			return res.status(201).json(sterilizedMessage);
		});
	} catch (error) {
		if (files) {
			for (const file of files) {
				try {
					await fs.promises.unlink(file.path);
				} catch (err) {
					console.error('Error deleting file:', err);
					console.warn(`File not found or cannot be deleted: ${file.path}`);
				}
			}
		}
		console.error('Error creating message:', error);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const deleteMessage = async (req: Request, res: Response) => {
	const { messageId } = req.query;

	if (!messageId) {
		return res.status(400).json({ error: 'Message ID is required.' });
	}

	try {
		await AppDataSource.transaction(async (manager) => {
			const messageRepo = manager.getRepository(Message);

			const message = await messageRepo.findOne({
				where: { id: String(messageId) },
				relations: ['attachments'],
			});

			if (!message) {
				return res.status(404).json({ error: 'Message not found.' });
			}

			for (const attachment of message.attachments) {
				if (attachment.url && typeof attachment.url === 'string') {
					try {
						const filePath = path.resolve(
							process.cwd(), 
							process.env.FILE_PATH || './data',
							attachment.url.replace(new RegExp('^' + process.env.ATTACHMENTS_PATH), '')
						);
						await fs.promises.unlink(filePath);
					} catch (err) {
						console.error('Error deleting attachment file:', err);
						console.warn(`File not found or cannot be deleted: ${attachment.url}`);
					}
				}
			}

			await messageRepo.remove(message);

			return res.status(200).json({ message: 'Message deleted successfully.' });
		});
	} catch (error) {
		console.error('Error deleting message:', error);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const updateMessage = async (req: Request, res: Response) => {
	const { messageId } = req.body;
	const { content } = req.body;

	if (!messageId) {
		return res.status(400).json({ error: 'Message ID is required.' });
	}

	if (content === undefined || content === null) {
		return res.status(400).json({ error: 'Content is required.' });
	}

	try {
		await AppDataSource.transaction(async (manager) => {
			const messageRepo = manager.getRepository(Message);

			const message = await messageRepo.findOne({ where: { id: String(messageId) } });
			if (!message) {
				return res.status(404).json({ error: 'Message not found.' });
			}

			message.content = content;

			await messageRepo.save(message);

			return res.status(200).json(message);
		});
	} catch (error) {
		console.error('Error updating message:', error);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const getChannelMessages = async (req: Request, res: Response) => {
	const { channelId, serverId } = req.query;
	const { limit = 50 } = req.query;

	if (!channelId) {
		return res.status(400).json({ error: 'Channel ID is required.' });
	}

	try {
		const messageRepo = AppDataSource.getRepository(Message);

		const qb = messageRepo
			.createQueryBuilder('message')
			.leftJoinAndSelect('message.sender', 'sender')
			.leftJoinAndSelect('message.channel', 'channel')
			.leftJoinAndSelect('message.attachments', 'attachments')
			.where('message.channelId = :channelId', { channelId })
			.orderBy('message.sentAt', 'DESC')
			.take(Number(limit));

		if (serverId) {
			qb.leftJoinAndSelect(
				'sender.memberships',
				'memberships',
				'memberships.serverId = :serverId',
				{ serverId },
			);
		}

		const messages = await qb.getMany();

		const sterilizedMessages: MessageDTO[] = messages.map((message) => ({
			messageId: message.id,
			content: message.content,
			channelId: message.channel.id,
			sender: {
				id: message.sender.memberships?.[0]?.id || undefined,
				userId: message.sender.id,
				memberName: message.sender.memberships?.[0]?.memberName || message.sender.username,
			},
			attachments: message.attachments.map((attachment) => ({
				id: attachment.id,
				fileName: attachment.fileName,
				url: attachment.url,
				fileType: attachment.fileType,
				size: attachment.size,
			})),
			createdAt: message.sentAt,
		}));

		return res.status(200).json(sterilizedMessages);
	} catch (error) {
		console.error('Error fetching channel messages:', error);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const getNextMessages = async (req: Request, res: Response) => {
	const { channelId, serverId } = req.query;
	const { lastMessageId, limit = 5 } = req.query;

	if (!channelId) {
		return res.status(400).json({ error: 'Channel ID is required.' });
	}
	if (!lastMessageId) {
		return res.status(400).json({ error: 'Last message ID is required.' });
	}

	try {
		const messageRepo = AppDataSource.getRepository(Message);

		const lastMessage = await messageRepo.findOne({
			where: { id: String(lastMessageId) },
			select: ['sentAt'],
		});

		if (!lastMessage) {
			return res.status(404).json({ error: 'Last message not found.' });
		}

		const qb = messageRepo
			.createQueryBuilder('message')
			.leftJoinAndSelect('message.sender', 'sender')
			.leftJoinAndSelect('message.channel', 'channel')
			.leftJoinAndSelect('message.attachments', 'attachments')
			.where(
				new Brackets((qb) => {
					qb.where('message.channelId = :channelId AND message.sentAt < :sentAt', {
						channelId,
						sentAt: lastMessage.sentAt,
					}).orWhere(
						'message.channelId = :channelId AND message.sentAt = :sentAt AND message.id < :id',
						{
							channelId,
							sentAt: lastMessage.sentAt,
							id: lastMessage.id,
						},
					);
				}),
			)
			.orderBy('message.sentAt', 'DESC')
			.addOrderBy('message.id', 'DESC')
			.take(Number(limit));

		if (serverId) {
			qb.leftJoinAndSelect(
				'sender.memberships',
				'memberships',
				'memberships.serverId = :serverId',
				{ serverId },
			);
		}

		const messages = await qb.getMany();
		const sterilizedMessages: MessageDTO[] = messages.map((message) => ({
			messageId: message.id,
			content: message.content,
			channelId: message.channel.id,
			senderId: message.sender.id,
			sender: {
				id: message.sender.memberships?.[0]?.id || undefined,
				userId: message.sender.id,
				memberName: message.sender.memberships?.[0]?.memberName || message.sender.username,
			},
			attachments: message.attachments.map((attachment) => ({
				id: attachment.id,
				fileName: attachment.fileName,
				url: attachment.url,
				fileType: attachment.fileType,
				size: attachment.size,
			})),
			createdAt: message.sentAt,
		}));

		return res.status(200).json(sterilizedMessages);
	} catch (error) {
		console.error('Error fetching next messages:', error);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const messageController = {
	createMessage,
	deleteMessage,
	updateMessage,
	getChannelMessages,
	getNextMessages,
};

export default messageController;
