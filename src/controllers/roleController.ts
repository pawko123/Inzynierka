import { ServerMember } from '../models/ServerMember';
import { MemberRole } from '../models/MemberRole';
import { RolePermission } from '../models/RolePermission';
import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Role } from '../models/Role';
import { Server } from '../models/Server';


const createRole = async (req: Request, res: Response) => {
    const { serverId, name, color } = req.body;
    if (!serverId || !name) {
        return res.status(400).json({ error: 'Missing serverId or role name.' });
    }
    try {
        const serverRepo = AppDataSource.getRepository(Server);
        const roleRepo = AppDataSource.getRepository(Role);
        const server = await serverRepo.findOne({ where: { id: serverId } });
        if (!server) {
            return res.status(404).json({ error: 'Server not found.' });
        }
        const role = new Role();
        role.server = server;
        role.name = name;
        role.color = color || "#6d6d6dff"; 
        role.isDefault = false;
        await roleRepo.save(role);

        const roleSanitized = {
            id: role.id,
            name: role.name,
            color: role.color,
            isDefault: role.isDefault,
            serverId: server.id,
        };

        return res.status(201).json(roleSanitized);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

export const deleteRole = async (req: Request, res: Response) => {
    const { roleId } = req.query;
    if (!roleId) {
        return res.status(400).json({ error: 'Missing roleId.' });
    }
    try {
        const roleRepo = AppDataSource.getRepository(Role);
        const role = await roleRepo.findOne({ where: { id: String(roleId) } });
        if (!role) {
            return res.status(404).json({ error: 'Role not found.' });
        }
        if (role.isDefault) {
            return res.status(400).json({ error: 'Default roles cannot be deleted.' });
        }
        await roleRepo.remove(role);
        return res.status(200).json({ message: 'Role deleted successfully.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

const updateRolePermissions = async (req: Request, res: Response) => {
    const { roleId, permissions } = req.body;
    if (!roleId || !Array.isArray(permissions)) {
        return res.status(400).json({ error: 'Missing roleId or permissions array.' });
    }
    try {
        await AppDataSource.transaction(async (manager) => {
            const roleRepo = manager.getRepository(Role);
            const rolePermissionRepo = manager.getRepository(RolePermission);
            const role = await roleRepo.findOne({ where: { id: roleId }, relations: ['permissions'] });
            if (!role) {
                throw new Error('NOT_FOUND');
            }
            if (role.permissions && role.permissions.length > 0) {
                await rolePermissionRepo.remove(role.permissions);
            }
            const newPermissions: RolePermission[] = permissions.map((perm: string) => {
                const rp = new RolePermission();
                rp.role = role;
                rp.permission = perm;
                return rp;
            });
            await rolePermissionRepo.save(newPermissions);
        });
        return res.status(200).json({ message: 'Role permissions updated successfully.' });
    } catch (err) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ error: 'Role not found.' });
        }
        console.error(err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

const getRoleWithPermissionsById = async (req: Request, res: Response) => {
    const { roleId } = req.query;
    if (!roleId) {
        return res.status(400).json({ error: 'Missing roleId.' });
    }
    try {
        const roleRepo = AppDataSource.getRepository(Role);
        const role = await roleRepo.findOne({
            where: { id: String(roleId) },
            relations: ['permissions', 'channelPermissions', 'server'],
        });
        if (!role) {
            return res.status(404).json({ error: 'Role not found.' });
        }
        const result = {
            id: role.id,
            name: role.name,
            color: role.color,
            isDefault: role.isDefault,
            serverId: role.server?.id,
            permissions: role.permissions?.map(p => p.permission) || [],
            channelPermissions: role.channelPermissions || [],
        };
        return res.status(200).json(result);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

const addRoleToMember = async (req: Request, res: Response) => {
    const { memberId, roleId } = req.body;
    if (!memberId || !roleId) {
        return res.status(400).json({ error: 'Missing memberId or roleId.' });
    }
    try {
        const memberRepo = AppDataSource.getRepository(ServerMember);
        const roleRepo = AppDataSource.getRepository(Role);
        const memberRoleRepo = AppDataSource.getRepository(MemberRole);
        const member = await memberRepo.findOne({ where: { id: memberId } });
        if (!member) {
            return res.status(404).json({ error: 'Member not found.' });
        }
        const role = await roleRepo.findOne({ where: { id: roleId } });
        if (!role) {
            return res.status(404).json({ error: 'Role not found.' });
        }
        
        const existing = await memberRoleRepo.findOne({ where: { member: { id: memberId }, role: { id: roleId } }, relations: ['member', 'role'] });
        if (existing) {
            return res.status(400).json({ error: 'Role already assigned to member.' });
        }
        const memberRole = new MemberRole();
        memberRole.member = member;
        memberRole.role = role;
        await memberRoleRepo.save(memberRole);
        return res.status(200).json({ message: 'Role assigned to member.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

const removeRoleFromMember = async (req: Request, res: Response) => {
    const { memberId, roleId } = req.body;
    if (!memberId || !roleId) {
        return res.status(400).json({ error: 'Missing memberId or roleId.' });
    }
    try {
        const memberRoleRepo = AppDataSource.getRepository(MemberRole);
        const memberRole = await memberRoleRepo.findOne({ where: { member: { id: memberId }, role: { id: roleId } }, relations: ['member', 'role'] });
        if (!memberRole) {
            return res.status(404).json({ error: 'Role not assigned to member.' });
        }
        await memberRoleRepo.remove(memberRole);
        return res.status(200).json({ message: 'Role removed from member.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};


export const roleController = {
    createRole,
    deleteRole,
    updateRolePermissions,
    getRoleWithPermissionsById,
    addRoleToMember,
    removeRoleFromMember,
};
