export interface Role {
	id: string;
	name: string;
	color: string;
	isDefault: boolean;
	permissions: number;
}

export interface ServerMember {
	id: string;
	userId: string;
	username: string;
	email: string;
	memberName: string;
	createdAt: string;
	roles: Role[];
	user?: {
		id: string;
		username: string;
	};
}

export interface RolePermissions {
	[key: string]: boolean;
}

export interface ServerRolesTabProps {
	roles: Role[];
	onCreateRole: () => void;
	onRoleSelect: (role: Role) => void;
	onDeleteRole: (roleId: string) => void;
}

export interface ServerMembersTabProps {
	members: ServerMember[];
	roles: Role[];
	onManageMemberRoles: (memberId: string) => void;
	onMemberSelect: (member: ServerMember) => void;
}

export interface RolesManagementProps {
	serverId: string;
	serverName?: string;
	roles?: Role[];
	members?: ServerMember[];
	onRoleUpdate?: () => void;
	onClose?: () => void;
}

export interface RoleDetailsModalProps {
	visible: boolean;
	role: Role | null;
	serverId: string;
	onClose: () => void;
	onSave: (roleData: any) => void;
	colors: any;
}

export interface PermissionItemProps {
	permission: import('@/utils/permissions').Permission;
	value: boolean;
	onValueChange: () => void;
	disabled?: boolean;
}

export interface MemberRoleModalProps {
	visible: boolean;
	member: ServerMember | null;
	roles: Role[];
	assigningRoles: Set<string>;
	removingRoles: Set<string>;
	onClose: () => void;
	onAssignRole: (memberId: string, roleId: string) => void;
	onRemoveRole: (memberId: string, roleId: string) => void;
}

export interface CreateRoleModalProps {
	visible: boolean;
	onClose: () => void;
	onCreateRole: (name: string, color: string) => Promise<void>;
}
