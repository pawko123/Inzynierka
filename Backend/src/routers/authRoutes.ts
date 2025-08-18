import { Router } from 'express';
import { authController } from '../controllers/authController';
import { verifyTokenAndReturnUser } from '../middlewares/verifyToken';

const authRouter = Router();

authRouter.post('/login', authController.login);
authRouter.post('/register', authController.registerUser);
authRouter.get('/current-user', verifyTokenAndReturnUser);

export default authRouter;
