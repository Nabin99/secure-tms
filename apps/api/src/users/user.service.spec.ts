import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User, Role, AuditLog } from '../entities';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    organizationId: 'org-1',
    roleId: 'role-1',
    isActive: true,
    assignedTasks: [],
    createdTasks: [],
    auditLogs: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: { id: 'org-1', name: 'Test Org' },
    role: { id: 'role-1', name: 'Admin' as const, description: 'Admin role' }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find users in organization', async () => {
    jest.spyOn(userRepository, 'find').mockResolvedValue([mockUser] as User[]);

    const result = await service.findAllInOrganization('org-1');

    expect(userRepository.find).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('user-1');
  });

  it('should find one user', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);

    const result = await service.findOne('user-1', 'org-1');

    expect(userRepository.findOne).toHaveBeenCalled();
    expect(result.id).toBe('user-1');
  });
});
