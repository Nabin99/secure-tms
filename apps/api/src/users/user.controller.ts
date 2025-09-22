import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthContext, PERMISSIONS } from '@secure-tms/auth';
import { Permissions } from '../auth/permissions.guard';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Get all users in the current user's organization
   * Only accessible to users with USER_READ permission
   */
  @Get()
  @Permissions(PERMISSIONS.USER_READ)
  async findAllInOrganization(@CurrentUser() user: AuthContext['user']) {
    return this.userService.findAllInOrganization(user.organizationId);
  }
}
