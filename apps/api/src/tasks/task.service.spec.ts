import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskService } from './task.service';
import { Task, User, AuditLog } from '../entities';
import { ForbiddenException } from '@nestjs/common';
import { CreateTaskDto, UpdateTaskDto } from '@secure-tms/data';
import { AuthContext } from '@secure-tms/auth';

describe('TaskService - RBAC Tests', () => {
  let service: TaskService;
  let taskRepository: Repository<Task>;
  let userRepository: Repository<User>;
  let auditLogRepository: Repository<AuditLog>;

  // Mock users with different roles
  const mockViewerUser: AuthContext['user'] = {
    id: 'viewer-id',
    email: 'viewer@test.com',
    organizationId: 'org-1',
    roleId: 'role-3',
    roleName: 'Viewer',
    permissions: ['task:create', 'task:read', 'task:update', 'task:delete']
  };

  const mockAdminUser: AuthContext['user'] = {
    id: 'admin-id',
    email: 'admin@test.com',
    organizationId: 'org-1',
    roleId: 'role-2',
    roleName: 'Admin',
    permissions: ['task:create', 'task:read', 'task:update', 'task:delete', 'task:read:all', 'task:assign']
  };

  const mockOwnerUser: AuthContext['user'] = {
    id: 'owner-id',
    email: 'owner@test.com',
    organizationId: 'org-1',
    roleId: 'role-1',
    roleName: 'Owner',
    permissions: ['task:create', 'task:read', 'task:update', 'task:delete', 'task:read:all', 'task:assign']
  };

  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    category: 'Work',
    status: 'Todo',
    priority: 'Medium',
    assignedUserId: 'viewer-id',
    organizationId: 'org-1',
    createdBy: 'viewer-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    assignedUser: null,
    createdByUser: null,
    organization: null
  } as Task;

  const mockOtherUserTask = {
    ...mockTask,
    id: 'task-2',
    assignedUserId: 'other-user-id',
    createdBy: 'other-user-id'
  } as Task;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
            remove: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    auditLogRepository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
  });

  describe('RBAC - Task Creation', () => {
    it('should allow Viewer to create task for themselves', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'My Task',
        description: 'Task description',
        category: 'Work',
        priority: 'Medium'
      };

      const mockUser = { id: 'viewer-id', organizationId: 'org-1' };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(taskRepository, 'create').mockReturnValue(mockTask);
      jest.spyOn(taskRepository, 'save').mockResolvedValue(mockTask);
      jest.spyOn(auditLogRepository, 'create').mockReturnValue({} as AuditLog);
      jest.spyOn(auditLogRepository, 'save').mockResolvedValue({} as AuditLog);

      const result = await service.create(createTaskDto, mockViewerUser);

      expect(result).toBeDefined();
      expect(taskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedUserId: mockViewerUser.id,
          organizationId: mockViewerUser.organizationId,
          createdBy: mockViewerUser.id
        })
      );
    });

    it('should prevent Viewer from creating task for other users', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Task for others',
        description: 'Task description',
        category: 'Work',
        priority: 'Medium',
        assignedUserId: 'other-user-id'
      };

      await expect(service.create(createTaskDto, mockViewerUser))
        .rejects.toThrow(ForbiddenException);
    });

    it('should allow Admin to create task for any user', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Task for team',
        description: 'Task description',
        category: 'Work',
        priority: 'Medium',
        assignedUserId: 'other-user-id'
      };

      const mockUser = { id: 'other-user-id', organizationId: 'org-1' };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(taskRepository, 'create').mockReturnValue(mockTask);
      jest.spyOn(taskRepository, 'save').mockResolvedValue(mockTask);
      jest.spyOn(auditLogRepository, 'create').mockReturnValue({} as AuditLog);
      jest.spyOn(auditLogRepository, 'save').mockResolvedValue({} as AuditLog);

      const result = await service.create(createTaskDto, mockAdminUser);

      expect(result).toBeDefined();
    });
  });

  describe('RBAC - Task Reading', () => {
    it('should allow Viewer to read only their own task', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask);

      const result = await service.findOne('task-1', mockViewerUser);

      expect(result).toBeDefined();
      expect(result.id).toBe('task-1');
    });

    it('should prevent Viewer from reading other users tasks', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockOtherUserTask);

      await expect(service.findOne('task-2', mockViewerUser))
        .rejects.toThrow(ForbiddenException);
    });

    it('should allow Admin to read any task in organization', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockOtherUserTask);

      const result = await service.findOne('task-2', mockAdminUser);

      expect(result).toBeDefined();
      expect(result.id).toBe('task-2');
    });
  });

  describe('RBAC - Task Updates', () => {
    it('should allow Viewer to update their own task', async () => {
      const updateTaskDto: UpdateTaskDto = { title: 'Updated Title' };
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask);
      jest.spyOn(taskRepository, 'save').mockResolvedValue({ ...mockTask, ...updateTaskDto });
      jest.spyOn(auditLogRepository, 'create').mockReturnValue({} as AuditLog);
      jest.spyOn(auditLogRepository, 'save').mockResolvedValue({} as AuditLog);

      const result = await service.update('task-1', updateTaskDto, mockViewerUser);

      expect(result).toBeDefined();
      expect(result.title).toBe('Updated Title');
    });

    it('should prevent Viewer from updating other users tasks', async () => {
      const updateTaskDto: UpdateTaskDto = { title: 'Updated Title' };
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockOtherUserTask);

      await expect(service.update('task-2', updateTaskDto, mockViewerUser))
        .rejects.toThrow(ForbiddenException);
    });

    it('should prevent Viewer from reassigning tasks to others', async () => {
      const updateTaskDto: UpdateTaskDto = { assignedUserId: 'other-user-id' };
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask);

      await expect(service.update('task-1', updateTaskDto, mockViewerUser))
        .rejects.toThrow(ForbiddenException);
    });

    it('should allow Admin to update any task and reassign', async () => {
      const updateTaskDto: UpdateTaskDto = { 
        title: 'Updated by Admin',
        assignedUserId: 'other-user-id'
      };
      const mockUser = { id: 'other-user-id', organizationId: 'org-1' };
      
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockOtherUserTask);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(taskRepository, 'save').mockResolvedValue({ ...mockOtherUserTask, ...updateTaskDto });
      jest.spyOn(auditLogRepository, 'create').mockReturnValue({} as AuditLog);
      jest.spyOn(auditLogRepository, 'save').mockResolvedValue({} as AuditLog);

      const result = await service.update('task-2', updateTaskDto, mockAdminUser);

      expect(result).toBeDefined();
    });
  });

  describe('RBAC - Task Deletion', () => {
    it('should allow Viewer to delete their own task', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask);
      jest.spyOn(taskRepository, 'remove').mockResolvedValue(mockTask);
      jest.spyOn(auditLogRepository, 'create').mockReturnValue({} as AuditLog);
      jest.spyOn(auditLogRepository, 'save').mockResolvedValue({} as AuditLog);

      await expect(service.remove('task-1', mockViewerUser)).resolves.toBeUndefined();
    });

    it('should prevent Viewer from deleting other users tasks', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockOtherUserTask);

      await expect(service.remove('task-2', mockViewerUser))
        .rejects.toThrow(ForbiddenException);
    });

    it('should allow Admin to delete any task in organization', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockOtherUserTask);
      jest.spyOn(taskRepository, 'remove').mockResolvedValue(mockOtherUserTask);
      jest.spyOn(auditLogRepository, 'create').mockReturnValue({} as AuditLog);
      jest.spyOn(auditLogRepository, 'save').mockResolvedValue({} as AuditLog);

      await expect(service.remove('task-2', mockAdminUser)).resolves.toBeUndefined();
    });
  });

  describe('Organization Isolation', () => {
    it('should prevent access to tasks from different organizations', async () => {
      const differentOrgTask = { ...mockTask, organizationId: 'org-2' };
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(differentOrgTask);

      await expect(service.findOne('task-1', mockOwnerUser))
        .rejects.toThrow(ForbiddenException);
    });
  });
});
