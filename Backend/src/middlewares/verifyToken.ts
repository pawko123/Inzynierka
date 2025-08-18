import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { User } from '../models/User';

const checkForToken = async (req: Request): Promise<string> => {
	if (req.body.token) {
		return req.body.token;
	} else if (req.headers['authorization']) {
		return req.headers['authorization'] as string;
	} else if (req.headers['Authorization']) {
		return req.headers['Authorization'] as string;
	} else {
		return '';
	}
};

export const verifyTokenMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<NextFunction | Response> => {
	const token = await checkForToken(req);
	if (!token || token === '')
		return res.status(403).json({
			msg: 'No token provided',
		});
	try {
		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET_KEY || 'default',
		) as jwt.JwtPayload;
		req.body.userId = decoded.id;
	} catch (err) {
		console.error('Token verification error:', err);
		return res.status(401).json({
			msg: 'Invalid Token',
		});
	}
	next();
};

export const verifyTokenAndReturnUser = async (req: Request, res: Response): Promise<NextFunction | Response> => {
	const token = await checkForToken(req);
	if (!token) return res.status(403).json({ msg: 'No token provided' });

	try {
		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET_KEY || 'default',
		) as jwt.JwtPayload;

		const userRepo = AppDataSource.getRepository(User);
		const user = await userRepo.findOne({
			where: { id: decoded.id },
		});

		if (!user) {
			return res.status(404).send('User not found');
		}

		const userData = { ...user };
		delete userData.passwordHash;

		return res.status(200).json(userData);
	} catch (err) {
		console.error('Token verification error:', err);
		return res.status(401).json({ msg: 'Invalid Token' });
	}
};
