import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import type { StaffRole } from '../../../../domain/stay-state-machine';

const staffRoles = ['administrador', 'recepcionista'] satisfies StaffRole[];

@Entity({ name: 'staff_user' })
@Unique('uq_staff_user_username', ['username'])
export class StaffUser {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  username!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'enum', enum: staffRoles })
  role!: StaffRole;

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}
