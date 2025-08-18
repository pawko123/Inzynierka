import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Role } from './Role';
import { PermissionType } from './RolePermissionType';

@Entity()
export class RolePermission {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => Role, (role) => role.permissions, { onDelete: 'CASCADE' })
	role: Role;

	@Column()
	permission: PermissionType;
}
