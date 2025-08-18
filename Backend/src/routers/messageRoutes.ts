import { Router } from 'express';
import { verifyTokenMiddleware } from '../middlewares/verifyToken';
import { checkUserPermission } from '../middlewares/checkUserPermission';
import { PermissionType } from '../models/RolePermissionType';
import messageController from '../controllers/messageController';
import { uploadAndCheckForMulterError } from '../config/multerConfig';

const messageRouter = Router();

messageRouter.post(
	'/create',
	uploadAndCheckForMulterError,
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.SEND_MESSAGES),
	messageController.createMessage,
);
messageRouter.delete(
	'/delete',
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.MANAGE_MESSAGES),
	messageController.deleteMessage,
);
messageRouter.put(
	'/update',
	uploadAndCheckForMulterError,
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.MANAGE_MESSAGES),
	messageController.updateMessage,
);
messageRouter.get(
	'/channelMessages',
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.VIEW_CHANNEL),
	messageController.getChannelMessages,
);
messageRouter.get(
	'/nextMessages',
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.VIEW_CHANNEL),
	messageController.getNextMessages,
);

export default messageRouter;
