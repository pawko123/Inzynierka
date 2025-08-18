import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { ServerMember } from './ServerMember';
import { Role } from './Role';

@Entity()
export class MemberRole {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => ServerMember, (member) => member.roles, { onDelete: 'CASCADE' })
	member: ServerMember;

	@ManyToOne(() => Role, (role) => role.members, { onDelete: 'CASCADE' })
	role: Role;
}
