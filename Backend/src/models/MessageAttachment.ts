import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Message } from './Message';

@Entity()
export class MessageAttachment {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => Message, (message) => message.attachments, { onDelete: 'CASCADE' })
	message: Message;

	@Column()
	fileName: string;

	@Column()
	fileType: string; // e.g. "image/png", "application/pdf"

	@Column()
	url: string; // points to your file storage (e.g. S3, local, CDN)

	@Column({ nullable: true })
	size: number; // in bytes

	@CreateDateColumn()
	uploadedAt: Date;
}
