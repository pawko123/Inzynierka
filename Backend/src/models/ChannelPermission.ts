import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Channel } from './Channel';
import { Role } from './Role';
import { PermissionType } from './RolePermissionType';

@Entity()
export class ChannelPermission {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => Channel, (channel) => channel.permissions, { onDelete: 'CASCADE' })
	channel: Channel;

	@ManyToOne(() => Role, (role) => role.channelPermissions, { onDelete: 'CASCADE' })
	role: Role;

	@Column()
	permission: PermissionType;
}
