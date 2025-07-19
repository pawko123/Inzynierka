import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { comparePassword } from '../services/encryptionService';
import { User } from '../models/User';


const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: "Email and password are required" });
    }

    try {
        const userRepository = AppDataSource.getRepository(User);

        const user = await userRepository.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const isPasswordValid = await comparePassword(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ msg: "Invalid password" });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY || "default", { expiresIn: '1h' });

        return res.status(200).json({ token, userId: user.id });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ msg: "Internal server error" });
    }
}

export const authController = {
    login
};