import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, OneToMany } from "typeorm";
import { User } from "./User";
import { Server } from "./Server";
import { MemberRole } from "./MemberRole";

@Entity()
export class ServerMember {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, user => user.memberships)
  user: User;

  @ManyToOne(() => Server, server => server.members, { onDelete: "CASCADE" })
  server: Server;

  @CreateDateColumn()
  joinedAt: Date;

  @OneToMany(() => MemberRole, mr => mr.member)
  roles: MemberRole[];
}