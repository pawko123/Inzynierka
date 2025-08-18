import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { comparePassword } from '../services/encryptionService';
import { User } from '../models/User';
import { hashPassword } from '../services/encryptionService';

const login = async (req: Request, res: Response) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ msg: 'Email and password are required' });
	}

	try {
		const userRepository = AppDataSource.getRepository(User);

		const user = await userRepository.findOne({ where: { email } });

		if (!user) {
			return res.status(404).json({ msg: 'User not found' });
		}

		const isPasswordValid = await comparePassword(password, user.passwordHash);

		if (!isPasswordValid) {
			return res.status(401).json({ msg: 'Invalid password' });
		}

		const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY || 'default', {
			expiresIn: '1h',
		});

		return res.status(200).json({ token, userId: user.id });
	} catch (error) {
		console.error('Login error:', error);
		return res.status(500).json({ msg: 'Internal server error' });
	}
};

const registerUser = async (req: Request, res: Response) => {
	try {
		const { username, email, password, repeatPassword } = req.body;
		if (!username || !email || !password || !repeatPassword) {
			return res.status(400).json({ error: 'All fields are required.' });
		}
		if (password !== repeatPassword) {
			return res.status(400).json({ error: 'Passwords do not match.' });
		}

		const userRepo = AppDataSource.getRepository(User);
		const existingUser = await userRepo.findOne({ where: [{ username }, { email }] });
		if (existingUser) {
			return res.status(409).json({ error: 'Username or email already exists.' });
		}

		const passwordHash = await hashPassword(password);
		const user = userRepo.create({ username, email, passwordHash });
		await userRepo.save(user);

		return res.status(201).json({
			id: user.id,
			username: user.username,
			email: user.email,
			createdAt: user.createdAt,
		});
	} catch (err) {
		console.error('Registration error:', err);
		return res.status(500).json({ error: 'Registration failed.' });
	}
};

export const authController = {
	login,
	registerUser,
};
