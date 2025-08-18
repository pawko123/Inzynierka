import { PermissionType } from '../../../models/RolePermissionType';
import { ChannelPermissionDto } from '../channel/channelPermission.dto';
import { MemberDto } from '../member/member.dto';

export class GetRoleResponseDto {
	id: string;
	name: string;
	color: string;
	isDefault: boolean;
	serverId: string;
	rolePermissions: PermissionType[];
	channelPermissions: ChannelPermissionDto[];
	currentHolders: MemberDto[];
}
