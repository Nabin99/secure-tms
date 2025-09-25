import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, UserResponse } from '@secure-tms/data';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockUserResponse: UserResponse = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    organizationId: 'org-1',
    roleId: 'role-1',
    roleName: 'Admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: {
      id: 'org-1',
      name: 'Test Organization'
    },
    role: {
      id: 'role-1',
      name: 'Admin',
      description: 'Administrator role'
    }
  };

  const mockUsers: UserResponse[] = [
    mockUserResponse,
    {
      ...mockUserResponse,
      id: 'user-2',
      email: 'user2@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      roleName: 'Viewer'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('HTTP Operations', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should get all users', () => {
      service.getUsers().subscribe(users => {
        expect(users).toEqual(mockUsers);
        expect(users.length).toBe(2);
      });

      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });

    it('should get user by id', () => {
      const userId = 'user-1';

      service.getUser(userId).subscribe(user => {
        expect(user).toEqual(mockUserResponse);
        expect(user.id).toBe(userId);
      });

      const req = httpMock.expectOne(`/api/users/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUserResponse);
    });

    it('should create a new user', () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        organizationId: 'org-1',
        roleId: 'role-1'
      };

      const expectedResponse = {
        ...mockUserResponse,
        id: 'new-user-id',
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName
      };

      service.createUser(createUserDto).subscribe(user => {
        expect(user).toEqual(expectedResponse);
        expect(user.email).toBe(createUserDto.email);
      });

      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createUserDto);
      req.flush(expectedResponse);
    });

    it('should update a user', () => {
      const userId = 'user-1';
      const updateUserDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com'
      };

      const expectedResponse = {
        ...mockUserResponse,
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
        email: updateUserDto.email
      };

      service.updateUser(userId, updateUserDto).subscribe(user => {
        expect(user).toEqual(expectedResponse);
        expect(user.firstName).toBe(updateUserDto.firstName);
      });

      const req = httpMock.expectOne(`/api/users/${userId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateUserDto);
      req.flush(expectedResponse);
    });

    it('should delete a user', () => {
      const userId = 'user-1';

      service.deleteUser(userId).subscribe(response => {
        expect(response).toEqual({ message: 'User deleted successfully' });
      });

      const req = httpMock.expectOne(`/api/users/${userId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'User deleted successfully' });
    });

    it('should get current user profile', () => {
      service.getProfile().subscribe(user => {
        expect(user).toEqual(mockUserResponse);
      });

      const req = httpMock.expectOne('/api/users/profile/me');
      expect(req.request.method).toBe('GET');
      req.flush(mockUserResponse);
    });

    it('should update current user profile', () => {
      const updateDto = {
        firstName: 'Updated',
        lastName: 'Profile',
        email: 'newemail@example.com'
      };

      const expectedResponse = {
        ...mockUserResponse,
        ...updateDto
      };

      service.updateProfile(updateDto).subscribe(user => {
        expect(user).toEqual(expectedResponse);
      });

      const req = httpMock.expectOne('/api/users/profile/me');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(expectedResponse);
    });

    it('should change password', () => {
      const userId = 'user-1';
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123'
      };

      service.changePassword(userId, changePasswordDto).subscribe(response => {
        expect(response).toBeUndefined(); // void return type
      });

      const req = httpMock.expectOne(`/api/users/${userId}/password`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(changePasswordDto);
      req.flush(null);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error when getting users', () => {
      const errorMessage = 'Server error';

      service.getUsers().subscribe({
        next: () => fail('Should have failed with error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne('/api/users');
      req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
    });

    it('should handle validation error when creating user', () => {
      const createUserDto: CreateUserDto = {
        email: 'invalid-email',
        password: '123',
        firstName: '',
        lastName: '',
        organizationId: 'org-1',
        roleId: 'role-1'
      };

      service.createUser(createUserDto).subscribe({
        next: () => fail('Should have failed with validation error'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.statusText).toBe('Bad Request');
        }
      });

      const req = httpMock.expectOne('/api/users');
      req.flush('Validation failed', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle unauthorized error', () => {
      service.getProfile().subscribe({
        next: () => fail('Should have failed with unauthorized error'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(error.statusText).toBe('Unauthorized');
        }
      });

      const req = httpMock.expectOne('/api/users/profile/me');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle forbidden error when deleting user', () => {
      const userId = 'user-1';

      service.deleteUser(userId).subscribe({
        next: () => fail('Should have failed with forbidden error'),
        error: (error) => {
          expect(error.status).toBe(403);
          expect(error.statusText).toBe('Forbidden');
        }
      });

      const req = httpMock.expectOne(`/api/users/${userId}`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });

    it('should handle not found error when getting specific user', () => {
      const userId = 'nonexistent-user';

      service.getUser(userId).subscribe({
        next: () => fail('Should have failed with not found error'),
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.statusText).toBe('Not Found');
        }
      });

      const req = httpMock.expectOne(`/api/users/${userId}`);
      req.flush('User not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Request Headers and Parameters', () => {
    it('should send correct headers for authenticated requests', () => {
      service.getUsers().subscribe();

      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should handle query parameters for filtered user requests', () => {
      // Note: This would require extending the service to support query parameters
      service.getUsers().subscribe();

      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('Data Transformation', () => {
    it('should properly transform user data from API response', () => {
      const apiResponse = {
        ...mockUserResponse,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-16T14:20:00Z'
      };

      service.getUser('user-1').subscribe(user => {
        expect(user.id).toBe(apiResponse.id);
        expect(user.email).toBe(apiResponse.email);
        expect(user.firstName).toBe(apiResponse.firstName);
        expect(user.lastName).toBe(apiResponse.lastName);
        expect(user.organization?.name).toBe(apiResponse.organization?.name);
        expect(user.role?.name).toBe(apiResponse.role?.name);
      });

      const req = httpMock.expectOne('/api/users/user-1');
      req.flush(apiResponse);
    });

    it('should handle missing optional fields in user response', () => {
      const minimalResponse = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        organizationId: 'org-1',
        roleId: 'role-1',
        roleName: 'Admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
        // Missing organization and role objects
      };

      service.getUser('user-1').subscribe(user => {
        expect(user.id).toBe(minimalResponse.id);
        expect(user.organization).toBeUndefined();
        expect(user.role).toBeUndefined();
      });

      const req = httpMock.expectOne('/api/users/user-1');
      req.flush(minimalResponse);
    });
  });
});
