import express from 'express';
import authRouter from './authRoutes';
import serverRouter from './serverRoutes';
import roleRouter from './roleRoutes';
import inviteRouter from './inviteRoutes';
import channelRouter from './channelRoutes';
import messageRouter from './messageRoutes';
import fileRouter from './attachmentsRouter';

const router = express.Router();

export default (): express.Router => {
	router.use('/auth', authRouter);
	router.use('/server', serverRouter);
	router.use('/role', roleRouter);
	router.use('/invite', inviteRouter);
	router.use('/channel', channelRouter);
	router.use('/message', messageRouter);
	router.use(`${process.env.ATTACHMENTS_PATH}`, fileRouter);

	return router;
};
