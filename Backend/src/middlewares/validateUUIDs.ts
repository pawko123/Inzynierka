import { NextFunction } from 'express';
import { Request, Response } from 'express';
import validator from 'validator';

export function validateAllUUIDs(req: Request, res: Response, next: NextFunction) {
	const checkObject = (obj: Record<string, unknown>, source: string) => {
		for (const key in obj) {
			if (key.toLowerCase().includes('id') && obj[key] != null) {
				const value = String(obj[key]);
				if (!validator.isUUID(value)) {
					return `${key} in ${source} is not a valid UUID.`;
				}
			}
		}
		return null;
	};

	const error = checkObject(req.query, 'query') || checkObject(req.body, 'body');

	if (error) {
		return res.status(400).json({ error });
	}

	next();
}
