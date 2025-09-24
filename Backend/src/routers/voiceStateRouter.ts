import { Router } from 'express';
import { voiceStateController } from '../controllers/voiceStateController';
import { verifyTokenMiddleware } from '../middlewares/verifyToken';

const voiceStateRouter = Router();

voiceStateRouter.use(verifyTokenMiddleware);

voiceStateRouter.post('/join', voiceStateController.joinVoiceChannel);
voiceStateRouter.post('/leave', voiceStateController.leaveVoiceChannel);
voiceStateRouter.put('/update', voiceStateController.updateVoiceState);
voiceStateRouter.get('/channel-users', voiceStateController.getVoiceChannelUsers);
voiceStateRouter.get('/user-state', voiceStateController.getUserVoiceState);

export default voiceStateRouter;