import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, User, AuditLog, Organization } from '../entities';
import { CreateTaskDto, UpdateTaskDto, TaskResponse } from '@secure-tms/data';
import { AuthContext } from '@secure-tms/auth';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
  ) {}

  private mapToResponse(task: Task): TaskResponse {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assignedUserId: task.assignedUserId,
      organizationId: task.organizationId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignedUser: task.assignedUser ? {
        id: task.assignedUser.id,
        firstName: task.assignedUser.firstName,
        lastName: task.assignedUser.lastName,
      } : undefined,
      createdByUser: task.createdByUser ? {
        id: task.createdByUser.id,
        firstName: task.createdByUser.firstName,
        lastName: task.createdByUser.lastName,
      } : undefined,
      organization: task.organization ? {
        id: task.organization.id,
        name: task.organization.name,
        level: task.organization.level,
      } : undefined,
    };
  }

  private async getAccessibleOrgIds(user: AuthContext['user']): Promise<string[]> {
    if (user.roleName === 'Owner') {
      const org = await this.orgRepository.findOne({ 
        where: { id: user.organizationId },
        relations: ['parent', 'children']
      });
      
      if (!org) return [user.organizationId];
      
      if (org.level === 1) {
        // Parent organization Owner - can access their org and all child orgs
        const children = await this.orgRepository.find({ where: { parentId: user.organizationId, isActive: true } });
        return [user.organizationId, ...children.map(c => c.id)];
      } else {
        // Child organization Owner - can access their org and parent org
        const accessibleIds = [user.organizationId];
        if (org.parent) {
          accessibleIds.push(org.parent.id);
        }
        return accessibleIds;
      }
    }
    return [user.organizationId];
  }

  private async getWritableOrgIds(user: AuthContext['user']): Promise<string[]> {
    if (user.roleName === 'Viewer') return [];
    return this.getAccessibleOrgIds(user);
  }

  private async logAudit(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    organizationId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      resource,
      resourceId,
      organizationId,
      metadata,
    });
    await this.auditLogRepository.save(auditLog);
  }

  async create(createTaskDto: CreateTaskDto & { organizationId?: string }, user: AuthContext['user']): Promise<TaskResponse> {
    console.log('🚀 Task creation attempt:', {
      userEmail: user.email,
      userRole: user.roleName,
      userOrgId: user.organizationId,
      requestedOrgId: createTaskDto.organizationId,
      isViewer: user.roleName === 'Viewer'
    });

    if (user.roleName === 'Viewer') {
      throw new ForbiddenException('Viewers cannot create tasks');
    }

    let targetOrgId = user.organizationId;

    // If Owner wants to create task in a different organization, validate access
    if (user.roleName === 'Owner' && createTaskDto.organizationId && createTaskDto.organizationId !== user.organizationId) {
      const requestedOrgId = createTaskDto.organizationId;
      console.log('🔍 Owner cross-org validation:', { requestedOrgId, userOrgId: user.organizationId });
      
      // Get user's organization to check if they're parent or child org owner
      const userOrg = await this.orgRepository.findOne({ 
        where: { id: user.organizationId },
        relations: ['parent', 'children']
      });
      
      console.log('👤 User org details:', {
        userOrg: userOrg ? {
          id: userOrg.id,
          name: userOrg.name,
          level: userOrg.level,
          parentId: userOrg.parentId,
          childrenCount: userOrg.children?.length || 0
        } : null
      });
      
      if (!userOrg) {
        throw new NotFoundException('User organization not found');
      }

      let hasAccess = false;

      if (userOrg.level === 1) {
        // Parent org Owner - can create tasks in child organizations
        console.log('🏢 Checking parent org owner access to child org');
        const child = await this.orgRepository.findOne({ 
          where: { id: requestedOrgId, parentId: user.organizationId, isActive: true } 
        });
        console.log('🔍 Child org lookup result:', { 
          found: !!child,
          childId: child?.id,
          childName: child?.name
        });
        hasAccess = !!child;
      } else {
        // Child org Owner - can create tasks in their own org and parent org
        console.log('🏢 Checking child org owner access to parent org');
        hasAccess = requestedOrgId === userOrg.parentId;
        console.log('🔍 Parent access check:', {
          requestedOrgId,
          userOrgParentId: userOrg.parentId,
          hasAccess
        });
      }

      console.log('✅ Access validation result:', { hasAccess });

      if (!hasAccess) {
        throw new ForbiddenException('Not authorized for target organization');
      }
      
      targetOrgId = requestedOrgId;
    }

    console.log('🎯 Final target org ID:', targetOrgId);

    const assignedUserId = createTaskDto.assignedUserId || user.id;
    const assignedUser = await this.userRepository.findOne({ where: { id: assignedUserId } });
    if (!assignedUser) throw new NotFoundException('Assigned user not found');
    
    console.log('👥 User assignment check:', {
      assignedUserId,
      assignedUserOrgId: assignedUser.organizationId,
      targetOrgId,
      match: assignedUser.organizationId === targetOrgId,
      isOwnerCrossOrgAssignment: user.roleName === 'Owner' && assignedUser.id === user.id && assignedUser.organizationId !== targetOrgId
    });
    
    // Allow cross-organization assignment for Owners assigning tasks to themselves
    // This enables parent org Owners to create tasks in child orgs assigned to themselves
    const isOwnerSelfAssignmentCrossOrg = user.roleName === 'Owner' && assignedUser.id === user.id && assignedUser.organizationId !== targetOrgId;
    
    if (!isOwnerSelfAssignmentCrossOrg && assignedUser.organizationId !== targetOrgId) {
      throw new ForbiddenException('Cannot assign outside target organization scope');
    }

    const createPayload = ((dto) => {
      const { organizationId: _, ...rest } = dto; // eslint-disable-line @typescript-eslint/no-unused-vars
      return rest;
    })(createTaskDto);

    const task = this.taskRepository.create({
      ...createPayload,
      organizationId: targetOrgId,
      assignedUserId,
      createdBy: user.id,
      status: 'Todo',
    });
    const saved = await this.taskRepository.save(task);
    await this.logAudit(user.id, 'CREATE', 'task', saved.id, targetOrgId, { title: saved.title });
    
    console.log('✅ Task created successfully:', { taskId: saved.id, title: saved.title });
    
    return this.mapToResponse(saved);
  }

  async findAll(user: AuthContext['user'], filterOrgId?: string): Promise<TaskResponse[]> {
    let orgIds = await this.getAccessibleOrgIds(user);
    
    // If specific organization filter is requested, validate access and narrow down
    if (filterOrgId) {
      if (!orgIds.includes(filterOrgId)) {
        throw new ForbiddenException('Access denied to requested organization');
      }
      orgIds = [filterOrgId];
    }
    
    const qb = this.taskRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignedUser', 'assignedUser')
      .leftJoinAndSelect('task.createdByUser', 'createdByUser')
      .leftJoinAndSelect('task.organization', 'organization')
      .where('task.organizationId IN (:...orgIds)', { orgIds });

    // If user doesn't have TASK_READ_ALL permission, they can only see their own tasks
    if (!user.permissions.includes('task:read:all')) {
      qb.andWhere('(task.assignedUserId = :uid OR task.createdBy = :uid)', { uid: user.id });
    }

    const tasks = await qb.getMany();
    return tasks.map(t => this.mapToResponse(t));
  }

  async findOne(id: string, user: AuthContext['user']): Promise<TaskResponse> {
    const task = await this.taskRepository.findOne({ 
      where: { id }, 
      relations: ['assignedUser', 'createdByUser', 'organization'] 
    });
    if (!task) throw new NotFoundException('Task not found');

    const accessibleOrgIds = await this.getAccessibleOrgIds(user);
    if (!accessibleOrgIds.includes(task.organizationId)) {
      throw new ForbiddenException('Access denied');
    }

    if (user.roleName === 'Viewer') {
      const isOwner = task.assignedUserId === user.id || task.createdBy === user.id;
      if (!isOwner) throw new ForbiddenException('Viewers limited to own tasks');
    }

    return this.mapToResponse(task);
  }

  async update(id: string, updateTaskDto: UpdateTaskDto & { organizationId?: string }, user: AuthContext['user']): Promise<TaskResponse> {
    if (user.roleName === 'Viewer') throw new ForbiddenException('Viewers cannot update tasks');

    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    const writableOrgIds = await this.getWritableOrgIds(user);
    if (!writableOrgIds.includes(task.organizationId)) throw new ForbiddenException('Access denied');

    if (updateTaskDto.assignedUserId && updateTaskDto.assignedUserId !== task.assignedUserId) {
      const newAssigned = await this.userRepository.findOne({ where: { id: updateTaskDto.assignedUserId } });
      if (!newAssigned) throw new NotFoundException('Assigned user not found');
      if (newAssigned.organizationId !== task.organizationId) {
        throw new ForbiddenException('Cannot reassign outside task organization');
      }
    }

    if (updateTaskDto.organizationId && updateTaskDto.organizationId !== task.organizationId) {
      delete updateTaskDto.organizationId; // disallow moving tasks between orgs
    }

    const updatePayload = ((dto) => {
      const { organizationId: _, ...rest } = dto; // eslint-disable-line @typescript-eslint/no-unused-vars
      return rest;
    })(updateTaskDto);

    Object.assign(task, updatePayload);
    const saved = await this.taskRepository.save(task);
    await this.logAudit(user.id, 'UPDATE', 'task', saved.id, task.organizationId, { changes: updatePayload });
    return this.mapToResponse(saved);
  }

  async remove(id: string, user: AuthContext['user']): Promise<void> {
    if (user.roleName === 'Viewer') throw new ForbiddenException('Viewers cannot delete tasks');

    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    const writableOrgIds = await this.getWritableOrgIds(user);
    if (!writableOrgIds.includes(task.organizationId)) throw new ForbiddenException('Access denied');

    await this.taskRepository.remove(task);
    await this.logAudit(user.id, 'DELETE', 'task', id, task.organizationId, { title: task.title });
  }
}
