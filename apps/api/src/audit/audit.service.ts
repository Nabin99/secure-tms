import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities';
import { AuthContext } from '@secure-tms/auth';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async findAll(user: AuthContext['user']): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { organizationId: user.organizationId },
      relations: ['user'],
      order: { timestamp: 'DESC' },
      take: 100, // Limit to last 100 entries
    });
  }
}
