import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	CreateDateColumn
} from 'typeorm';
import { Server } from './Server';

@Entity()
export class ServerInvite {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ unique: true })
	code: string;

	@ManyToOne(() => Server, (server) => server.invites, { onDelete: 'CASCADE' })
	server: Server;

	@Column({ nullable: true })
	expiresAt: Date;

	@Column({ default: 0 })
	uses: number;

	@CreateDateColumn()
	createdAt: Date;
}
