import { ChannelPermissionDto } from './channelPermission.dto';

export class ChannelRulesUpdateDto {
	channelPermissions: ChannelPermissionDto[];
	serverId: string;
	roleId: string;
}
