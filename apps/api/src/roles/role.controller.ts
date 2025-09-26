import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities';
import { PERMISSIONS } from '@secure-tms/auth';
import { Permissions } from '../auth/permissions.guard';

@Controller('roles')
@UseGuards(AuthGuard('jwt'))
export class RoleController {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  /**
   * Get all global roles available in the system
   * These roles can be assigned to users in any organization
   */
  @Get()
  @Permissions(PERMISSIONS.USER_READ)
  async findAll() {
    return this.roleRepository.find({
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      },
      order: {
        name: 'ASC'
      }
    });
  }

  /**
   * Get a specific role by ID
   */
  @Get(':id')
  @Permissions(PERMISSIONS.USER_READ)
  async findOne(@Param('id') id: string) {
    return this.roleRepository.findOne({
      where: { id },
    });
  }
}
