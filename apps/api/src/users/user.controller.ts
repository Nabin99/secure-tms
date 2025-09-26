import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthContext, PERMISSIONS } from '@secure-tms/auth';
import { Permissions } from '../auth/permissions.guard';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, UserResponse } from '@secure-tms/data';
import { OrganizationService } from '../organizations/organization.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(
    private userService: UserService,
    private organizationService: OrganizationService
  ) {}

  /**
   * Get all users in the current user's organization
   * Only accessible to users with USER_READ permission
   */
  @Get()
  @Permissions(PERMISSIONS.USER_READ)
  async findAllInOrganization(@CurrentUser() user: AuthContext['user']): Promise<UserResponse[]> {
    const accessibleOrganizations = await this.organizationService.getAccessibleOrganizations(user);
    const organizationIds = accessibleOrganizations.map(org => org.id);
    return this.userService.findAllInAccessibleOrganizations(organizationIds);
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
    const accessibleOrganizations = await this.organizationService.getAccessibleOrganizations(user);
    const organizationIds = accessibleOrganizations.map(org => org.id);
    return this.userService.findOneInAccessibleOrganizations(id, organizationIds);
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
    // Validate that the user can create users in the specified organization
    const accessibleOrganizations = await this.organizationService.getAccessibleOrganizations(user);
    const canCreateInOrganization = accessibleOrganizations.some(org => org.id === createUserDto.organizationId);
    
    if (!canCreateInOrganization) {
      throw new BadRequestException('You do not have permission to create users in the specified organization');
    }
    
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
    // Validate that the user can update users in accessible organizations
    const accessibleOrganizations = await this.organizationService.getAccessibleOrganizations(user);
    const organizationIds = accessibleOrganizations.map(org => org.id);
    
    // If updating organization, validate it's accessible
    if (updateUserDto.organizationId) {
      const canUpdateToOrganization = organizationIds.includes(updateUserDto.organizationId);
      if (!canUpdateToOrganization) {
        throw new BadRequestException('You do not have permission to assign users to the specified organization');
      }
    }
    
    return this.userService.updateInAccessibleOrganizations(id, updateUserDto, user, organizationIds);
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
    const accessibleOrganizations = await this.organizationService.getAccessibleOrganizations(user);
    const organizationIds = accessibleOrganizations.map(org => org.id);
    return this.userService.removeInAccessibleOrganizations(id, user, organizationIds);
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
