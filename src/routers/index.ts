import express from 'express';
import authRouter from './authRoutes';
import serverRouter from './serverRoutes';
import roleRouter from './roleRoutes';
import inviteRouter from './inviteRoutes';

const router = express.Router();

export default (): express.Router => {
    router.use('/auth', authRouter);
    router.use('/server', serverRouter);
    router.use('/role', roleRouter);
    router.use('/invite', inviteRouter);
    return router;
};