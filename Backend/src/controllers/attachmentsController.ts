import { Request, Response } from 'express';
import path from 'path';

const getFileFromUrl = (req: Request, res: Response) => {
	const { fileUrl } = req.params;
	const { channelId } = req.query;

	if (!channelId) {
		return res.status(400).json({ error: 'Channel ID not provided.' });
	}

	if (!fileUrl || typeof fileUrl !== 'string') {
		return res.status(400).json({ error: 'Invalid file URL.' });
	}

	const filePath = path.join(process.env.FILE_PATH, fileUrl);

	res.sendFile(filePath, (err) => {
		if (err) {
			console.error('File not found:', err);
			return res.status(404).json({ error: 'File not found.' });
		}
	});
};

export const attachmentsController = {
	getFileFromUrl,
};
