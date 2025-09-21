import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditService } from './audit.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { Permissions, PermissionsGuard } from '../auth/permissions.guard';
import { AuthContext, PERMISSIONS } from '@secure-tms/auth';
import { AuditLog } from '../entities';

@Controller('audit-log')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permissions(PERMISSIONS.AUDIT_READ)
  findAll(@CurrentUser() user: AuthContext['user']): Promise<AuditLog[]> {
    return this.auditService.findAll(user);
  }
}
