import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Organization, User, Task, Role, AuditLog } from '../entities';
import { AuthContext } from '@secure-tms/auth';

export interface CreateOrganizationDto {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface OrganizationStats {
  totalUsers: number;
  activeUsers: number;
  totalTasks: number;
  completedTasks: number;
  totalRoles: number;
  subOrganizations: number;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  description?: string;
  level: number;
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  parent?: {
    id: string;
    name: string;
  };
  children?: OrganizationResponse[];
  stats?: OrganizationStats;
}

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Get organization hierarchy (max 2 levels)
   * Returns all parent organizations with their children
   */
  async getHierarchy(): Promise<OrganizationResponse[]> {
    const parentOrgs = await this.organizationRepository.find({
      where: { parentId: IsNull(), isActive: true },
      relations: ['children'],
      order: { name: 'ASC' }
    });

    return parentOrgs.map(org => this.mapToResponse(org, true));
  }

  /**
   * Get organizations accessible to a user
   * - Owner (Parent org): can see their org and all child orgs
   * - Owner (Child org): can see their org and parent org  
   * - Admin: can only see their own org (no parent access)
   * - Viewer: should not have ORG_READ permission
   */
  async getAccessibleOrganizations(user: AuthContext['user']): Promise<OrganizationResponse[]> {
    const userOrg = await this.organizationRepository.findOne({
      where: { id: user.organizationId },
      relations: ['parent', 'children']
    });

    if (!userOrg) {
      throw new NotFoundException('User organization not found');
    }

    if (userOrg.level === 1) {
      // Parent org user - can see their org and all children
      const result: OrganizationResponse[] = [this.mapToResponse(userOrg, false)];
      
      // Add all child organizations
      for (const child of userOrg.children) {
        if (child.isActive) {
          result.push(this.mapToResponse(child, false));
        }
      }
      
      return result;
    } else {
      // Child org user
      if (user.roleName === 'Admin') {
        // Admins can only see their own organization (no parent access)
        return [this.mapToResponse(userOrg, false)];
      } else {
        // Owners can see their org and parent
        const result: OrganizationResponse[] = [this.mapToResponse(userOrg, false)];
        if (userOrg.parent) {
          result.unshift(this.mapToResponse(userOrg.parent, false));
        }
        return result;
      }
    }
  }

  /**
   * Get parent organizations (level 1)
   * Returns parent organizations that the user can access
   * - Owner (Parent org): can see all level 1 organizations
   * - Owner (Child org): can see their parent org
   * - Admin: cannot see parent organizations
   */
  async getParentOrganizations(user: AuthContext['user']): Promise<OrganizationResponse[]> {
    const userOrg = await this.organizationRepository.findOne({
      where: { id: user.organizationId },
      relations: ['parent']
    });

    if (!userOrg) {
      throw new NotFoundException('User organization not found');
    }

    if (userOrg.level === 1) {
      // Parent org user - can see all level 1 organizations (for creating child orgs)
      const parentOrgs = await this.organizationRepository.find({
        where: { level: 1, isActive: true },
        order: { name: 'ASC' }
      });
      return parentOrgs.map(org => this.mapToResponse(org, false));
    } else {
      // Child org user
      if (user.roleName === 'Admin') {
        // Admins cannot see parent organizations
        return [];
      } else {
        // Owners can see their parent org
        if (userOrg.parent) {
          return [this.mapToResponse(userOrg.parent, false)];
        }
        return [];
      }
    }
  }

  /**
   * Get organization by ID with access control
   */
  async findOne(id: string, user: AuthContext['user']): Promise<OrganizationResponse> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
      relations: ['parent', 'children']
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Access control: users can only access their org, parent org, or child orgs
    const userOrg = await this.organizationRepository.findOne({
      where: { id: user.organizationId },
      relations: ['parent', 'children']
    });

    if (!userOrg) {
      throw new NotFoundException('User organization not found');
    }

    const hasAccess = this.checkOrganizationAccess(organization, userOrg);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this organization');
    }

    return this.mapToResponse(organization, true);
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStats(organizationId: string, user: AuthContext['user']): Promise<OrganizationStats> {
    const organization = await this.findOne(organizationId, user);

    const orgIds = [organizationId];
    if (organization.level === 1) {
      const children = await this.organizationRepository.find({
        where: { parentId: organizationId },
        select: ['id']
      });
      orgIds.push(...children.map(child => child.id));
    }

    const [totalUsers, activeUsers, totalTasks, completedTasks, totalRoles, subOrganizations] = await Promise.all([
      this.userRepository.count({ where: { organizationId: In(orgIds) } }),
      this.userRepository.count({ where: { organizationId: In(orgIds), isActive: true } }),
      this.taskRepository.count({ where: { organizationId: In(orgIds) } }),
      this.taskRepository.count({ where: { organizationId: In(orgIds), status: 'Done' } }),
      this.roleRepository.count(), // Global roles count
      organization.level === 1 ?
        this.organizationRepository.count({ where: { parentId: organizationId } }) :
        Promise.resolve(0)
    ]);

    return { totalUsers, activeUsers, totalTasks, completedTasks, totalRoles, subOrganizations };
  }

  /**
   * Create a new organization (only parent org admins can create child orgs)
   */
  async create(createOrgDto: CreateOrganizationDto, user: AuthContext['user']): Promise<OrganizationResponse> {
    const userOrg = await this.organizationRepository.findOne({
      where: { id: user.organizationId }
    });

    if (!userOrg) {
      throw new BadRequestException('User organization not found');
    }

    let level = 1;
    let parentId: string | undefined;

    if (createOrgDto.parentId) {
      // Creating a child organization
      const parentOrg = await this.organizationRepository.findOne({
        where: { id: createOrgDto.parentId }
      });

      if (!parentOrg) {
        throw new BadRequestException('Parent organization not found');
      }

      if (parentOrg.level !== 1) {
        throw new BadRequestException('Cannot create organization under a child organization');
      }

      // Only users from the parent organization can create child orgs
      if (user.organizationId !== createOrgDto.parentId) {
        throw new ForbiddenException('Only parent organization members can create child organizations');
      }

      level = 2;
      parentId = createOrgDto.parentId;
    }

    const organization = this.organizationRepository.create({
      name: createOrgDto.name,
      description: createOrgDto.description,
      level,
      parentId,
      isActive: true
    });

    const savedOrg = await this.organizationRepository.save(organization);

    // Log the creation
    await this.auditLogRepository.save({
      userId: user.id,
      action: 'ORGANIZATION_CREATE',
      resource: 'Organization',
      resourceId: savedOrg.id,
      organizationId: user.organizationId,
      metadata: {
        organizationName: savedOrg.name,
        level: savedOrg.level,
        parentId: savedOrg.parentId
      },
      timestamp: new Date(),
    });

    return this.findOne(savedOrg.id, user);
  }

  /**
   * Update an organization
   */
  async update(id: string, updateOrgDto: UpdateOrganizationDto, user: AuthContext['user']): Promise<OrganizationResponse> {
    const organization = await this.findOne(id, user);

    // Only allow updating if user has appropriate permissions
    if (user.organizationId !== id) {
      throw new ForbiddenException('Can only update your own organization');
    }

    await this.organizationRepository.update(id, {
      ...updateOrgDto,
      updatedAt: new Date()
    });

    // Log the update
    await this.auditLogRepository.save({
      userId: user.id,
      action: 'ORGANIZATION_UPDATE',
      resource: 'Organization',
      resourceId: id,
      organizationId: user.organizationId,
      metadata: {
        updatedFields: Object.keys(updateOrgDto),
        organizationName: organization.name
      },
      timestamp: new Date(),
    });

    return this.findOne(id, user);
  }

  /**
   * Deactivate an organization (soft delete)
   */
  async remove(id: string, user: AuthContext['user']): Promise<void> {
    const organization = await this.findOne(id, user);

    // Prevent deleting parent org if it has active children
    if (organization.level === 1) {
      const activeChildren = await this.organizationRepository.count({
        where: { parentId: id, isActive: true }
      });
      
      if (activeChildren > 0) {
        throw new BadRequestException('Cannot deactivate parent organization with active child organizations');
      }
    }

    await this.organizationRepository.update(id, { 
      isActive: false,
      updatedAt: new Date()
    });

    // Log the deletion
    await this.auditLogRepository.save({
      userId: user.id,
      action: 'ORGANIZATION_DELETE',
      resource: 'Organization',
      resourceId: id,
      organizationId: user.organizationId,
      metadata: {
        organizationName: organization.name,
        level: organization.level
      },
      timestamp: new Date(),
    });
  }

  /**
   * Get all users in an organization (with hierarchy support)
   */
  async getOrganizationUsers(organizationId: string, user: AuthContext['user'], includeChildren = false) {
    await this.findOne(organizationId, user); // Access control check

    const orgIds = [organizationId];
    
    if (includeChildren) {
      const children = await this.organizationRepository.find({
        where: { parentId: organizationId },
        select: ['id']
      });
      orgIds.push(...children.map(child => child.id));
    }

    return this.userRepository.find({
      where: orgIds.map(id => ({ organizationId: id })),
      relations: ['role', 'organization'],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        roleId: true,
        isActive: true,
        createdAt: true,
        organizationId: true,
        role: { id: true, name: true },
        organization: { id: true, name: true, level: true }
      }
    });
  }

  /**
   * Check if user has access to an organization
   */
  private checkOrganizationAccess(targetOrg: Organization, userOrg: Organization): boolean {
    if (targetOrg.id === userOrg.id) return true;
    
    if (userOrg.level === 1) {
      // Parent org users can access their children
      return targetOrg.parentId === userOrg.id;
    } else {
      // Child org users can access their parent
      return targetOrg.id === userOrg.parentId;
    }
  }

  /**
   * Map organization entity to response DTO
   */
  private mapToResponse(org: Organization, includeChildren = false): OrganizationResponse {
    const response: OrganizationResponse = {
      id: org.id,
      name: org.name,
      description: org.description,
      level: org.level,
      parentId: org.parentId,
      isActive: org.isActive,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt
    };

    if (org.parent) {
      response.parent = {
        id: org.parent.id,
        name: org.parent.name
      };
    }

    if (includeChildren && org.children) {
      response.children = org.children
        .filter(child => child.isActive)
        .map(child => this.mapToResponse(child, false));
    }

    return response;
  }
}
