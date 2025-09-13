import multer from 'multer';
import path from 'path';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';

// Allowed MIME types: images, audio, video, office suite
const allowedMimeTypes = [
	// Images
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml',
	// Audio
	'audio/mpeg',
	'audio/wav',
	'audio/ogg',
	'audio/mp3',
	'audio/x-wav',
	'audio/webm',
	// Video
	'video/mp4',
	'video/x-msvideo',
	'video/x-matroska',
	'video/webm',
	'video/quicktime',
	// Office Suite
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.ms-powerpoint',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		// Resolve path relative to project root (where package.json is located)
		const uploadPath = path.resolve(process.cwd(), process.env.FILE_PATH || './data');
		
		// Ensure directory exists
		if (!fs.existsSync(uploadPath)) {
			fs.mkdirSync(uploadPath, { recursive: true });
		}
		
		cb(null, uploadPath);
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname);
		const nameWithoutExt = path.basename(file.originalname, ext);
		const sanitizedFilename = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');
		const uniqueSuffix = Date.now();
		cb(null, `${sanitizedFilename}_${uniqueSuffix}${ext}`);
	},
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
	if (allowedMimeTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new Error(
				`Invalid file type: ${file.mimetype}. Only images, audio, video, and office suite files are allowed.`,
			),
		);
	}
};

const upload = multer({
	storage: storage,
	limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
	fileFilter: fileFilter,
});

export const uploadAndCheckForMulterError = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	upload.array('attachments')(req, res, (err) => {
		if (err) {
			// Cleanup files if error
			const files = req.files as Express.Multer.File[];
			if (files) {
				files.forEach((file) => fs.unlinkSync(file.path));
			}
			if (err.code === 'LIMIT_FILE_SIZE') {
				return res
					.status(400)
					.json({ error: 'File size too large. Max limit is 10MB per file.' });
			}
			return res.status(400).json({ error: err.message });
		}
		next();
	});
};

export default upload;
