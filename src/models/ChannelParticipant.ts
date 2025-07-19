import { Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Channel } from "./Channel";
import { User } from "./User";

@Entity()
export class ChannelParticipant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Channel, channel => channel.participants)
  channel: Channel;

  @ManyToOne(() => User)
  user: User;
}