import { Router } from 'express';
import { roleController } from '../controllers/roleController';
import { verifyTokenMiddleware } from '../middlewares/verifyToken';
import { checkUserPermission } from '../middlewares/checkUserPermission';
import { PermissionType } from '../models/RolePermissionType';

const roleRouter = Router();

roleRouter.post(
	'/create',
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.MANAGE_ROLES),
	roleController.createRole,
);
roleRouter.delete(
	'/delete',
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.MANAGE_ROLES),
	roleController.deleteRole,
);
roleRouter.put(
	'/updatePermissions',
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.MANAGE_ROLES),
	roleController.updateRolePermissions,
);
roleRouter.get(
	'/getRole',
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.MANAGE_ROLES),
	roleController.getRoleWithPermissionsById,
);
roleRouter.post(
	'/assignRole',
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.MANAGE_ROLES),
	roleController.addRoleToMember,
);
roleRouter.post(
	'/removeRole',
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.MANAGE_ROLES),
	roleController.removeRoleFromMember,
);
roleRouter.put(
	'/updateChannelPermissions',
	verifyTokenMiddleware,
	checkUserPermission(PermissionType.MANAGE_ROLES),
	roleController.editRoleChannelPermissions,
);

export default roleRouter;
