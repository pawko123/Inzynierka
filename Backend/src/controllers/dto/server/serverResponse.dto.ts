export class OwnerDto {
	id: string;
	username: string;
}

export class RoleDto {
	id: string;
	name: string;
	color: string;
	isDefault: boolean;
}

export class ServerDto {
	id: string;
	name: string;
	owner: OwnerDto;
	roles: RoleDto[];
	createdAt: Date;
	haveLogo: boolean;
}
