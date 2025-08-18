import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToMany,
	CreateDateColumn,
} from 'typeorm';
import { Server } from './Server';
import { Message } from './Message';
import { ChannelPermission } from './ChannelPermission';
import { ChannelParticipant } from './ChannelParticipant';
import { ChannelType } from './ChannelType';

@Entity()
export class Channel {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => Server, (server) => server.channels, { onDelete: 'CASCADE', nullable: true })
	server: Server;

	@Column()
	name: string;

	@Column({ default: ChannelType.TEXT })
	type: ChannelType;

	@CreateDateColumn()
	createdAt: Date;

	@OneToMany(() => Message, (message) => message.channel)
	messages: Message[];

	@OneToMany(() => ChannelPermission, (cp) => cp.channel)
	permissions: ChannelPermission[];

	@Column({ default: false })
	isDirect: boolean;

	@OneToMany(() => ChannelParticipant, (participant) => participant.channel)
	participants: ChannelParticipant[];
}
