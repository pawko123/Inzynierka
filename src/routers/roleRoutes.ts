
import { Router } from 'express';
import { roleController } from '../controllers/roleController';
import { verifyTokenMiddleware } from '../middlewares/verifyToken';
import { checkUserPermission } from '../middlewares/checkUserPermission';
import { RolePermissionType } from '../models/RolePermissionType';

const roleRouter = Router();

roleRouter.post('/create', verifyTokenMiddleware, 
    checkUserPermission(RolePermissionType.MANAGE_ROLES), roleController.createRole);
roleRouter.delete('/delete', verifyTokenMiddleware, 
    checkUserPermission(RolePermissionType.MANAGE_ROLES), roleController.deleteRole);
roleRouter.put('/updatePermissions', verifyTokenMiddleware, 
    checkUserPermission(RolePermissionType.MANAGE_ROLES), roleController.updateRolePermissions);
roleRouter.get('/getRole', verifyTokenMiddleware, 
    checkUserPermission(RolePermissionType.MANAGE_ROLES), roleController.getRoleWithPermissionsById);
roleRouter.post('/assignRole', verifyTokenMiddleware, 
    checkUserPermission(RolePermissionType.MANAGE_ROLES), roleController.addRoleToMember);
roleRouter.post('/removeRole', verifyTokenMiddleware, 
    checkUserPermission(RolePermissionType.MANAGE_ROLES), roleController.removeRoleFromMember);

export default roleRouter;
