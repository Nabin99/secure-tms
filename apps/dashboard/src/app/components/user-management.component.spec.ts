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
  let userService: jasmine.SpyObj<UserService>;
  let roleService: jasmine.SpyObj<RoleService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const userSpy = jasmine.createSpyObj('UserService', ['getUsers', 'createUser', 'updateUser', 'deleteUser']);
    const roleSpy = jasmine.createSpyObj('RoleService', ['getRoles']);
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    await TestBed.configureTestingModule({
      imports: [UserManagementComponent, ReactiveFormsModule],
      providers: [
        { provide: UserService, useValue: userSpy },
        { provide: RoleService, useValue: roleSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    roleService = TestBed.inject(RoleService) as jasmine.SpyObj<RoleService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Setup default returns
    userService.getUsers.and.returnValue(of([]));
    roleService.getRoles.and.returnValue(of([]));
    authService.getCurrentUser.and.returnValue(of({ id: '1', roleName: 'Owner', organizationId: '1' }));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize on ngOnInit', () => {
    spyOn(component, 'loadUsers');
    spyOn(component, 'loadRoles');
    
    component.ngOnInit();
    
    expect(component.loadUsers).toHaveBeenCalled();
    expect(component.loadRoles).toHaveBeenCalled();
  });
});