import { Injectable, ForbiddenException } from '@nestjs/common';
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

  async findAll(user: AuthContext['user'], options?: { includeChildren?: boolean }): Promise<AuditLog[]> {
    // Only users with AUDIT_READ reach here (guard). Owner can expand scope.
    const includeChildren = !!options?.includeChildren;
    let orgIds: string[] = [user.organizationId];

    if (includeChildren && user.roleName === 'Owner') {
      interface ChildRow { id: string }
      const children: ChildRow[] = await this.auditLogRepository.manager.query(
        'SELECT id FROM organizations WHERE parentId = $1',
        [user.organizationId]
      );
      if (children.length) {
        orgIds = [user.organizationId, ...children.map(c => c.id)];
      }
    } else if (includeChildren && user.roleName !== 'Owner') {
      throw new ForbiddenException('Only owners can include child organizations');
    }

    return this.auditLogRepository.createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .where('log.organizationId IN (:...orgIds)', { orgIds })
      .orderBy('log.timestamp', 'DESC')
      .limit(200)
      .getMany();
  }
}
