import { Router } from 'express';
import { attachmentsController } from '../controllers/attachmentsController';
import { verifyTokenMiddleware } from '../middlewares/verifyToken';
import { checkUserPermission } from '../middlewares/checkUserPermission';
import { PermissionType } from '../models/RolePermissionType';

const fileRouter = Router();

fileRouter.get(
	`/:fileUrl`,
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.VIEW_CHANNEL),
	attachmentsController.getFileFromUrl,
);

export default fileRouter;
