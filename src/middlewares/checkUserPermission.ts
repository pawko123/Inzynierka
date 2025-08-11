import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../models/User";
import { RolePermission } from "../models/RolePermission";
import { ServerMember } from "../models/ServerMember";
import { Message } from "../models/Message";
import { PermissionType } from "../models/RolePermissionType";

export const checkUserPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body.userId || req.query.userId || req.params.userId;
    const serverId = req.body.serverId || req.query.serverId || req.params.serverId;
    const channelId = req.body.channelId || req.query.channelId || req.params.channelId;
    if (!userId) {
      return res.status(401).json({ error: "User ID not provided." });
    }

    const userRepo = AppDataSource.getRepository(User);
    const memberRepo = AppDataSource.getRepository(ServerMember);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if ((permission === PermissionType.MANAGE_SERVER 
          || permission === PermissionType.SEND_MESSAGES
          || permission === PermissionType.VIEW_CHANNEL) 
          && channelId) {
            const channelRepo = AppDataSource.getRepository("Channel");
            const channel = await channelRepo.findOne({ where: { id: channelId } });
            if (channel && channel.isDirect) {
                return next();
            }
        }
        
    let memberRoles = [];
    if (serverId) {
      const member = await memberRepo.findOne({ where: { user: { id: userId }, server: { id: serverId } }, relations: ["roles", "roles.role", "roles.role.channelPermissions", "roles.role.permissions"] });
      if (member && member.roles) {
      memberRoles = member.roles;
      }
    }

    if (memberRoles.some(mr => mr.role && mr.role.isDefault == true)) {
      return next();
    }

    let hasPermission = false;
    if (channelId && memberRoles.length > 0) {
      for (const memberRole of memberRoles) {
        const role = memberRole.role;
        if (role && role.channelPermissions) {
          const channelPerm = role.channelPermissions.find(cp => cp.channelId === channelId && cp.permission === permission);
          if (channelPerm) {
            hasPermission = true;
            break;
          }
        }
      }
    }

    if (!hasPermission && memberRoles.length > 0) {
      for (const memberRole of memberRoles) {
        const role = memberRole.role;
        if (role && role.permissions) {
          if (role.permissions.some(p => p.permission === permission)) {
            hasPermission = true;
            break;
          }
        }
      }
    }

    if (!hasPermission) {
        if (isSelfMute(permission, req, userId)) {
            return next();
        }

        if (isSelfDeafen(permission, req, userId)) {
            return next();
        }

        if(permission === PermissionType.SERVER_MEMBER) {
            if (await checkIfUserIsMember(userId, serverId)) {
                return next();
            }
        }

        if (await isSelfDeleteMessage(permission, req, userId)) {
            return next();
        }
      
      return res.status(403).json({ error: `User does not have permission: ${permission}` });
    }

    next();
  };
};

const checkIfUserIsMember = async (userId: string, serverId: string): Promise<boolean> => {
  const memberRepo = AppDataSource.getRepository(ServerMember);
  const member = await memberRepo.findOne({ where: { user: { id: userId }, server: { id: serverId } } });
  return !!member;
}

const isSelfMute = (permission: string, req: Request, userId: string): boolean => {
  return permission === PermissionType.MUTE_MEMBERS && req.body.userToMuteId === userId;
}

const isSelfDeafen = (permission: string, req: Request, userId: string): boolean => {
  return permission === PermissionType.DEAFEN_MEMBERS && req.body.messageSenderId === userId;
}

const isSelfDeleteMessage = async (permission: string, req: Request, userId: string): Promise<boolean> => {

    if (permission !== PermissionType.MANAGE_MESSAGES) {
        return false;
    }

    let messageId = req.body.messageId || req.query.messageId;
    
    if (!messageId) {
      return false;
    }

    let messageRepo = AppDataSource.getRepository(Message);
    
    let message = await messageRepo.findOne({ where: { id: messageId }, relations: ["sender"] });

    if(!message || (message.sender.id !== userId)) {
        return false;
    }

    return true;
}
