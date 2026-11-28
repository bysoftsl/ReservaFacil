import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { StaffCredentials, StaffCredentialsPort } from '../../../application/ports/out/staff-credentials.port';
import { StaffUser } from './entities/staff-user.entity';

@Injectable()
export class TypeOrmStaffCredentialsRepository implements StaffCredentialsPort {
  constructor(@InjectRepository(StaffUser) private readonly staffUsers: Repository<StaffUser>) {}

  async findByUsername(username: string): Promise<StaffCredentials | null> {
    const staff = await this.staffUsers.findOne({
      select: { id: true, role: true, passwordHash: true, active: true },
      where: { username },
    });

    return staff && { id: staff.id, role: staff.role, passwordHash: staff.passwordHash, active: staff.active };
  }
}
