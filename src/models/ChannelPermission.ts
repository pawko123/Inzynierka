import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Channel } from "./Channel";
import { Role } from "./Role";

@Entity()
export class ChannelPermission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Channel, channel => channel.permissions)
  channel: Channel;

  @ManyToOne(() => Role, role => role.channelPermissions)
  role: Role;

  @Column()
  permission: string;

  @Column()
  allow: boolean;
}