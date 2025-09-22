import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, User, AuditLog } from '../entities';
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
  ) {}

  async create(createTaskDto: CreateTaskDto, user: AuthContext['user']): Promise<TaskResponse> {
    // For Viewers, they can only create tasks for themselves
    if (user.roleName === 'Viewer') {
      if (createTaskDto.assignedUserId && createTaskDto.assignedUserId !== user.id) {
        throw new ForbiddenException('Viewers can only create tasks for themselves');
      }
    }

    // If no assignedUserId provided, assign to current user
    const assignedUserId = createTaskDto.assignedUserId || user.id;
    
    // Verify assigned user exists and is in same organization
    const assignedUser = await this.userRepository.findOne({
      where: { id: assignedUserId },
      relations: ['organization'],
    });

    if (!assignedUser) {
      throw new NotFoundException('Assigned user not found');
    }

    if (assignedUser.organizationId !== user.organizationId) {
      throw new ForbiddenException('Cannot assign task to user from different organization');
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      assignedUserId,
      organizationId: user.organizationId,
      createdBy: user.id,
      status: 'Todo',
    });

    const savedTask = await this.taskRepository.save(task);
    
    // Log audit
    await this.logAudit(user.id, 'CREATE', 'task', savedTask.id, user.organizationId, {
      title: savedTask.title,
      assignedUserId: savedTask.assignedUserId,
    });

    return this.mapToResponse(savedTask);
  }

  async findAll(user: AuthContext['user']): Promise<TaskResponse[]> {
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignedUser', 'assignedUser')
      .leftJoinAndSelect('task.createdByUser', 'createdByUser')
      .where('task.organizationId = :organizationId', { organizationId: user.organizationId });

    // Viewers can only see their own tasks
    if (user.roleName === 'Viewer') {
      queryBuilder.andWhere(
        '(task.assignedUserId = :userId OR task.createdBy = :userId)',
        { userId: user.id }
      );
    }

    const tasks = await queryBuilder.getMany();
    return tasks.map(task => this.mapToResponse(task));
  }

  async findOne(id: string, user: AuthContext['user']): Promise<TaskResponse> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignedUser', 'createdByUser', 'organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access permissions based on role
    const isTaskOwner = task.assignedUserId === user.id || task.createdBy === user.id;
    
    if (user.roleName === 'Viewer') {
      // Viewers can only view their own tasks
      if (!isTaskOwner) {
        throw new ForbiddenException('Viewers can only view their own tasks');
      }
    } else if (user.roleName === 'Owner' || user.roleName === 'Admin') {
      // Owners and Admins can view any task in their organization
      if (task.organizationId !== user.organizationId) {
        throw new ForbiddenException('Access denied');
      }
    }

    return this.mapToResponse(task);
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: AuthContext['user']): Promise<TaskResponse> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignedUser', 'createdByUser', 'organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access permissions based on role
    const isTaskOwner = task.assignedUserId === user.id || task.createdBy === user.id;
    
    if (user.roleName === 'Viewer') {
      // Viewers can only update their own tasks
      if (!isTaskOwner) {
        throw new ForbiddenException('Viewers can only update their own tasks');
      }
      
      // Viewers cannot reassign tasks to other users
      if (updateTaskDto.assignedUserId && updateTaskDto.assignedUserId !== user.id && updateTaskDto.assignedUserId !== task.assignedUserId) {
        throw new ForbiddenException('Viewers cannot reassign tasks to other users');
      }
    } else if (user.roleName === 'Owner' || user.roleName === 'Admin') {
      // Owners and Admins can update any task in their organization
      if (task.organizationId !== user.organizationId) {
        throw new ForbiddenException('Access denied');
      }
    }

    // If updating assignedUserId, verify the new user
    if (updateTaskDto.assignedUserId && updateTaskDto.assignedUserId !== task.assignedUserId) {
      const newAssignedUser = await this.userRepository.findOne({
        where: { id: updateTaskDto.assignedUserId },
      });

      if (!newAssignedUser || newAssignedUser.organizationId !== user.organizationId) {
        throw new ForbiddenException('Cannot assign task to user from different organization');
      }
    }

    Object.assign(task, updateTaskDto);
    const savedTask = await this.taskRepository.save(task);

    // Log audit
    await this.logAudit(user.id, 'UPDATE', 'task', savedTask.id, user.organizationId, {
      changes: updateTaskDto,
    });

    return this.mapToResponse(savedTask);
  }

  async remove(id: string, user: AuthContext['user']): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access permissions based on role
    const isTaskOwner = task.assignedUserId === user.id || task.createdBy === user.id;
    
    if (user.roleName === 'Viewer') {
      // Viewers can only delete their own tasks
      if (!isTaskOwner) {
        throw new ForbiddenException('Viewers can only delete their own tasks');
      }
    } else if (user.roleName === 'Owner' || user.roleName === 'Admin') {
      // Owners and Admins can delete any task in their organization
      if (task.organizationId !== user.organizationId) {
        throw new ForbiddenException('Access denied');
      }
    }

    await this.taskRepository.remove(task);

    // Log audit
    await this.logAudit(user.id, 'DELETE', 'task', id, user.organizationId, {
      title: task.title,
    });
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
    };
  }
}
