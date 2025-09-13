import { Request, Response } from 'express';
import path from 'path';
import mime from 'mime-types';

const getFileFromUrl = (req: Request, res: Response) => {
	const { fileUrl } = req.params;
	const { channelId } = req.query;

	if (!channelId) {
		return res.status(400).json({ error: 'Channel ID not provided.' });
	}

	if (!fileUrl || typeof fileUrl !== 'string') {
		return res.status(400).json({ error: 'Invalid file URL.' });
	}

	const filePath = path.resolve(process.cwd(), process.env.FILE_PATH || './data', fileUrl);
	
	// Set appropriate headers for media files
	const mimeType = mime.lookup(fileUrl) || 'application/octet-stream';
	res.setHeader('Content-Type', mimeType);
	
	// For video files, set additional headers to support partial content requests
	if (mimeType.startsWith('video/')) {
		res.setHeader('Accept-Ranges', 'bytes');
		res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
	}

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
