import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { UserManagementComponent } from './user-management.component';
import { UserService } from '../services/user.service';
import { RoleService } from '../services/role.service';
import { AuthService } from '../services/auth.service';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;

  beforeEach(async () => {
    const userServiceMock = {
      getUsers: jest.fn().mockReturnValue(of([])),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn()
    };
    
    const roleServiceMock = {
      getRoles: jest.fn().mockReturnValue(of([]))
    };
    
    const authServiceMock = {
      getCurrentUser: jest.fn().mockReturnValue(of({ id: '1', roleName: 'Owner', organizationId: '1' }))
    };

    await TestBed.configureTestingModule({
      imports: [UserManagementComponent, ReactiveFormsModule],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: RoleService, useValue: roleServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
