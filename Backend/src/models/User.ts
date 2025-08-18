import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ServerMember } from './ServerMember';
import { Message } from './Message';

@Entity()
export class User {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ unique: true })
	username: string;

	@Column({ unique: true })
	email: string;

	@Column()
	passwordHash: string;

	@CreateDateColumn()
	createdAt: Date;

	@OneToMany(() => ServerMember, (member) => member.user)
	memberships: ServerMember[];

	@OneToMany(() => Message, (message) => message.sender)
	messages: Message[];
}
