import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrganizationService, CreateOrganizationDto, UpdateOrganizationDto, OrganizationResponse, OrganizationStats } from './organization.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthContext, PERMISSIONS } from '@secure-tms/auth';
import { Permissions } from '../auth/permissions.guard';

@Controller('organizations')
@UseGuards(AuthGuard('jwt'))
export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  /**
   * Get organization hierarchy
   * Only accessible to users with ORG_READ permission
   */
  @Get('hierarchy')
  @Permissions(PERMISSIONS.ORG_READ)
  async getHierarchy(): Promise<OrganizationResponse[]> {
    return this.organizationService.getHierarchy();
  }

  /**
   * Get organizations accessible to the current user
   */
  @Get('accessible')
  async getAccessibleOrganizations(@CurrentUser() user: AuthContext['user']): Promise<OrganizationResponse[]> {
    return this.organizationService.getAccessibleOrganizations(user);
  }

  /**
   * Get parent organizations (level 1)
   * Only accessible to users who can create child organizations
   */
  @Get('parents')
  @Permissions(PERMISSIONS.ORG_READ)
  async getParentOrganizations(@CurrentUser() user: AuthContext['user']): Promise<OrganizationResponse[]> {
    return this.organizationService.getParentOrganizations(user);
  }

  /**
   * Get organization statistics
   */
  @Get(':id/stats')
  @Permissions(PERMISSIONS.ORG_READ)
  async getOrganizationStats(
    @Param('id') id: string,
    @CurrentUser() user: AuthContext['user']
  ): Promise<OrganizationStats> {
    return this.organizationService.getOrganizationStats(id, user);
  }

  /**
   * Get organization by ID
   */
  @Get(':id')
  @Permissions(PERMISSIONS.ORG_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthContext['user']
  ): Promise<OrganizationResponse> {
    return this.organizationService.findOne(id, user);
  }

  /**
   * Get all users in an organization
   */
  @Get(':id/users')
  @Permissions(PERMISSIONS.USER_READ)
  async getOrganizationUsers(
    @Param('id') id: string,
    @CurrentUser() user: AuthContext['user'],
    @Query('includeChildren') includeChildren?: string
  ) {
    const includeChild = includeChildren === 'true';
    return this.organizationService.getOrganizationUsers(id, user, includeChild);
  }

  /**
   * Create a new organization
   * Only accessible to Owners (ORG_UPDATE permission)
   */
  @Post()
  @Permissions(PERMISSIONS.ORG_UPDATE)
  async create(
    @Body() createOrgDto: CreateOrganizationDto,
    @CurrentUser() user: AuthContext['user']
  ): Promise<OrganizationResponse> {
    return this.organizationService.create(createOrgDto, user);
  }

  /**
   * Update an organization
   * Only accessible to Owners (ORG_UPDATE permission)
   */
  @Put(':id')
  @Permissions(PERMISSIONS.ORG_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() updateOrgDto: UpdateOrganizationDto,
    @CurrentUser() user: AuthContext['user']
  ): Promise<OrganizationResponse> {
    return this.organizationService.update(id, updateOrgDto, user);
  }

  /**
   * Delete/deactivate an organization
   * Only accessible to Owners (ORG_UPDATE permission)
   */
  @Delete(':id')
  @Permissions(PERMISSIONS.ORG_UPDATE)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthContext['user']
  ): Promise<void> {
    return this.organizationService.remove(id, user);
  }
}
