import { Router } from 'express';
import { createInvite, acceptInvite } from '../controllers/inviteController';
import { verifyTokenMiddleware } from '../middlewares/verifyToken';
import { checkUserPermission } from '../middlewares/checkUserPermission';
import { RolePermissionType } from '../models/RolePermissionType';

const inviteRouter = Router();

inviteRouter.post('/create', verifyTokenMiddleware, 
    checkUserPermission(RolePermissionType.CREATE_INVITE), createInvite);
inviteRouter.post('/accept/:code', verifyTokenMiddleware, acceptInvite);

export default inviteRouter;
