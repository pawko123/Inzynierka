import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Server } from './Server';
import { RolePermission } from './RolePermission';
import { MemberRole } from './MemberRole';
import { ChannelPermission } from './ChannelPermission';

@Entity()
export class Role {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => Server, (server) => server.roles, { onDelete: 'CASCADE' })
	server: Server;

	@Column()
	name: string;

	@Column({ nullable: true })
	color: string;

	@Column({ default: false })
	isDefault: boolean;

	@OneToMany(() => RolePermission, (rp) => rp.role)
	permissions: RolePermission[];

	@OneToMany(() => MemberRole, (mr) => mr.role)
	members: MemberRole[];

	@OneToMany(() => ChannelPermission, (cp) => cp.role)
	channelPermissions: ChannelPermission[];
}
