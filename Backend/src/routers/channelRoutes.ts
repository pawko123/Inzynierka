import { Router } from 'express';
import { channelController } from '../controllers/channelController';
import { verifyTokenMiddleware } from '../middlewares/verifyToken';
import { checkUserPermission } from '../middlewares/checkUserPermission';
import { PermissionType } from '../models/RolePermissionType';

const router = Router();

router.post(
	'/create',
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.MANAGE_SERVER),
	channelController.createChannel,
);
router.post('/direct/create', verifyTokenMiddleware, channelController.createDirectChannel);
router.put(
	'/update',
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.MANAGE_SERVER),
	channelController.updateChannel,
);
router.delete(
	'/delete',
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.MANAGE_SERVER),
	channelController.deleteChannel,
);
router.post(
	'/direct/add-member',
	verifyTokenMiddleware,
	channelController.addMemberToDirectChannel,
);
router.get(
	'/direct/participants',
	verifyTokenMiddleware,
	channelController.getDirectChannelParticipants,
);
router.get('/direct/userChannels', verifyTokenMiddleware, channelController.getUserDirectChannels);

export default router;
