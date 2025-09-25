import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthContext, PERMISSIONS } from '@secure-tms/auth';
import { Permissions } from '../auth/permissions.guard';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, UserResponse } from '@secure-tms/data';

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
  async findAllInOrganization(@CurrentUser() user: AuthContext['user']): Promise<UserResponse[]> {
    return this.userService.findAllInOrganization(user.organizationId);
  }

  /**
   * Get a specific user by ID
   * Only accessible to users with USER_READ permission
   */
  @Get(':id')
  @Permissions(PERMISSIONS.USER_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthContext['user']
  ): Promise<UserResponse> {
    return this.userService.findOne(id, user.organizationId);
  }

  /**
   * Create a new user
   * Only accessible to users with USER_CREATE permission
   */
  @Post()
  @Permissions(PERMISSIONS.USER_CREATE)
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: AuthContext['user']
  ): Promise<UserResponse> {
    // Ensure the new user belongs to the same organization as the creator
    createUserDto.organizationId = user.organizationId;
    return this.userService.create(createUserDto, user);
  }

  /**
   * Update a user
   * Only accessible to users with USER_UPDATE permission
   */
  @Put(':id')
  @Permissions(PERMISSIONS.USER_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: AuthContext['user']
  ): Promise<UserResponse> {
    return this.userService.update(id, updateUserDto, user);
  }

  /**
   * Delete (deactivate) a user
   * Only accessible to users with USER_DELETE permission
   */
  @Delete(':id')
  @Permissions(PERMISSIONS.USER_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthContext['user']
  ): Promise<void> {
    return this.userService.remove(id, user);
  }

  /**
   * Change user password
   * Only accessible to users with USER_UPDATE permission or the user themselves
   */
  @Put(':id/password')
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() user: AuthContext['user']
  ): Promise<void> {
    return this.userService.changePassword(id, changePasswordDto, user);
  }

  /**
   * Get current user's profile
   */
  @Get('profile/me')
  async getProfile(@CurrentUser() user: AuthContext['user']): Promise<UserResponse> {
    return this.userService.getProfile(user.id, user.organizationId);
  }

  /**
   * Update current user's profile
   */
  @Put('profile/me')
  async updateProfile(
    @Body() updateData: Pick<UpdateUserDto, 'firstName' | 'lastName' | 'email'>,
    @CurrentUser() user: AuthContext['user']
  ): Promise<UserResponse> {
    return this.userService.updateProfile(user.id, updateData, user.organizationId);
  }
}
