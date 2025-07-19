import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { Channel } from "./Channel";
import { User } from "./User";
import { MessageAttachment } from "./MessageAttachment";

@Entity()
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Channel, channel => channel.messages)
  channel: Channel;

  @ManyToOne(() => User, user => user.messages)
  sender: User;

  @Column("text")
  content: string;

  @CreateDateColumn()
  sentAt: Date;

  @OneToMany(() => MessageAttachment, attachment => attachment.message, { cascade: true })
  attachments: MessageAttachment[];
}