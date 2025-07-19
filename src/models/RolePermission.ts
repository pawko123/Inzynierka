import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Role } from "./Role";

@Entity()
export class RolePermission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Role, role => role.permissions)
  role: Role;

  @Column()
  permission: string; // e.g. "SEND_MESSAGES"
}