import { serverController } from '../controllers/serverController';
import { checkUserPermission } from '../middlewares/checkUserPermission';
import { verifyTokenMiddleware } from '../middlewares/verifyToken';
import { Router } from 'express';
import multer from 'multer';
import { PermissionType } from '../models/RolePermissionType';

const serverRouter = Router();
const upload = multer();

serverRouter.post(
	'/create',
	upload.single('logo'),
	verifyTokenMiddleware,
	serverController.createServer,
);
serverRouter.delete('/delete', verifyTokenMiddleware, serverController.deleteServer);
serverRouter.get('/user-servers', verifyTokenMiddleware, serverController.getUserServers);
serverRouter.put(
	'/update',
	upload.single('logo'),
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.MANAGE_SERVER),
	serverController.updateServer,
);
serverRouter.get('/getServer', verifyTokenMiddleware, serverController.getServer);
serverRouter.get(
	'/getMembers',
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.SERVER_MEMBER),
	serverController.getServerMembers,
);
serverRouter.get(
	'/getChannels',
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.MANAGE_SERVER),
	serverController.getServerChannels,
);

export default serverRouter;
