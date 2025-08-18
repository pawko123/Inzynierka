import { PermissionType } from '../../../models/RolePermissionType';

export class ChannelPermissionDto {
	channelId: string;
	permissions: PermissionType[];
}
