import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthContext, PERMISSIONS } from '@secure-tms/auth';
import { Permissions } from '../auth/permissions.guard';

@Controller('roles')
@UseGuards(AuthGuard('jwt'))
export class RoleController {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  /**
   * Get all roles in the current user's organization
   * Only accessible to users with USER_READ permission (for user management)
   */
  @Get()
  @Permissions(PERMISSIONS.USER_READ)
  async findAllInOrganization(@CurrentUser() user: AuthContext['user']) {
    return this.roleRepository.find({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  /**
   * Get a specific role by ID
   */
  @Get(':id')
  @Permissions(PERMISSIONS.USER_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthContext['user']
  ) {
    return this.roleRepository.findOne({
      where: { id, organizationId: user.organizationId },
    });
  }
}
