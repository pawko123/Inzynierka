import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Channel } from './Channel';
import { User } from './User';

@Entity()
export class VoiceState {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => User)
	user: User;

	@ManyToOne(() => Channel)
	channel: Channel;

	@Column({ default: false })
	isMuted: boolean;

	@Column({ default: false })
	isDeafened: boolean;
	
	@Column({ default: false })
	isCameraOn: boolean;

	@Column({ default: false })
	isScreenSharing: boolean;

	@CreateDateColumn()
	joinedAt: Date;

	@Column({ type: 'timestamp', nullable: true })
	leftAt: Date;
}
