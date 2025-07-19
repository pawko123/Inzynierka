import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from "typeorm";
import { User } from "./User";
import { ServerMember } from "./ServerMember";
import { Role } from "./Role";
import { Channel } from "./Channel";

@Entity()
export class Server {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => User)
  owner: User;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ServerMember, member => member.server)
  members: ServerMember[];

  @OneToMany(() => Role, role => role.server)
  roles: Role[];

  @OneToMany(() => Channel, channel => channel.server)
  channels: Channel[];
}