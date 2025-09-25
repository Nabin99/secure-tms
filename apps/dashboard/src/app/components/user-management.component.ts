import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../services/user.service';
import { RoleService, RoleResponse } from '../services/role.service';
import { AuthService } from '../services/auth.service';
import { UserResponse, CreateUserDto, UpdateUserDto } from '@secure-tms/data';
import { PERMISSIONS } from '@secure-tms/auth';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation -->
      <nav class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center space-x-4">
              <button
                (click)="goBack()"
                class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Dashboard
              </button>
              <h1 class="text-xl font-semibold text-gray-900">
                User Management
              </h1>
            </div>
            @if (canCreateUsers()) {
              <div class="flex items-center">
                <button
                  (click)="showCreateForm = !showCreateForm"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  {{ showCreateForm ? 'Cancel' : 'Add User' }}
                </button>
              </div>
            }
          </div>
        </div>
      </nav>

      <!-- Main content -->
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Create User Form -->
      @if (showCreateForm && canCreateUsers()) {
        <div class="mb-6 bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
            <form [formGroup]="createUserForm" (ngSubmit)="createUser()" class="space-y-4">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label for="firstName" class="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    formControlName="firstName"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    [class.border-red-300]="createUserForm.get('firstName')?.invalid && createUserForm.get('firstName')?.touched"
                  >
                </div>
                <div>
                  <label for="lastName" class="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    formControlName="lastName"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    [class.border-red-300]="createUserForm.get('lastName')?.invalid && createUserForm.get('lastName')?.touched"
                  >
                </div>
                <div>
                  <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    id="email"
                    formControlName="email"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    [class.border-red-300]="createUserForm.get('email')?.invalid && createUserForm.get('email')?.touched"
                  >
                </div>
                <div>
                  <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    id="password"
                    formControlName="password"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    [class.border-red-300]="createUserForm.get('password')?.invalid && createUserForm.get('password')?.touched"
                  >
                </div>
                <div class="sm:col-span-2">
                  <label for="roleId" class="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    id="roleId"
                    formControlName="roleId"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    [class.border-red-300]="createUserForm.get('roleId')?.invalid && createUserForm.get('roleId')?.touched"
                  >
                    <option value="">Select a role</option>
                    @for (role of availableRoles; track role.id) {
                      <option [value]="role.id">{{ role.name }} - {{ role.description }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  (click)="showCreateForm = false"
                  class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="createUserForm.invalid || isCreating"
                  class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {{ isCreating ? 'Creating...' : 'Create User' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Users List -->
      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        @if (isLoading) {
          <div class="px-4 py-12 text-center">
            <div class="inline-flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading users...
            </div>
          </div>
        } @else if (users.length === 0) {
          <div class="px-4 py-12 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by creating a new user.</p>
          </div>
        } @else {
          <ul class="divide-y divide-gray-200">
            @for (user of users; track user.id) {
              <li class="px-6 py-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                        {{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="flex items-center">
                        <div class="text-sm font-medium text-gray-900">
                          {{ user.firstName }} {{ user.lastName }}
                        </div>
                        @if (!user.isActive) {
                          <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        }
                      </div>
                      <div class="text-sm text-gray-500">{{ user.email }}</div>
                      <div class="text-sm text-gray-500">
                        Role: {{ user.roleName }} | Created: {{ user.createdAt | date:'short' }}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    @if (canUpdateUsers()) {
                      <button
                        (click)="editUser(user)"
                        class="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Edit
                      </button>
                    }
                    @if (canDeleteUsers() && user.id !== currentUser?.id) {
                      <button
                        (click)="deleteUser(user)"
                        class="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                    }
                  </div>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    </div>

    <!-- Edit User Modal -->
    @if (showEditModal && selectedUser) {
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
            <form [formGroup]="editUserForm" (ngSubmit)="updateUser()" class="space-y-4">
              <div>
                <label for="editFirstName" class="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  id="editFirstName"
                  formControlName="firstName"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
              <div>
                <label for="editLastName" class="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  id="editLastName"
                  formControlName="lastName"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
              <div>
                <label for="editEmail" class="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="editEmail"
                  formControlName="email"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
              <div>
                <label for="editRoleId" class="block text-sm font-medium text-gray-700">Role</label>
                <select
                  id="editRoleId"
                  formControlName="roleId"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  @for (role of availableRoles; track role.id) {
                    <option [value]="role.id">{{ role.name }} - {{ role.description }}</option>
                  }
                </select>
              </div>
              <div class="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  formControlName="isActive"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                >
                <label for="editIsActive" class="ml-2 block text-sm text-gray-900">Active User</label>
              </div>
              <div class="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  (click)="closeEditModal()"
                  class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="editUserForm.invalid || isUpdating"
                  class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {{ isUpdating ? 'Updating...' : 'Update User' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
    </div>
  `
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private authService = inject(AuthService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);

  users: UserResponse[] = [];
  availableRoles: RoleResponse[] = [];
  isLoading = true;
  showCreateForm = false;
  showEditModal = false;
  selectedUser: UserResponse | null = null;
  isCreating = false;
  isUpdating = false;

  currentUser = this.authService.currentUserValue;

  createUserForm: FormGroup = this.formBuilder.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    roleId: ['', Validators.required]
  });

  editUserForm: FormGroup = this.formBuilder.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    roleId: ['', Validators.required],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadUsers();
    this.loadAvailableRoles();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      }
    });
  }

  loadAvailableRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.availableRoles = roles;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        // Fallback to basic roles if API fails
        this.availableRoles = [];
      }
    });
  }

  createUser(): void {
    if (this.createUserForm.valid) {
      this.isCreating = true;
      const userData = this.createUserForm.value as Omit<CreateUserDto, 'organizationId'>;
      
      this.userService.createUser(userData).subscribe({
        next: (newUser) => {
          this.users.unshift(newUser);
          this.createUserForm.reset();
          this.showCreateForm = false;
          this.isCreating = false;
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.isCreating = false;
        }
      });
    }
  }

  editUser(user: UserResponse): void {
    this.selectedUser = user;
    this.editUserForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: user.roleId,
      isActive: user.isActive
    });
    this.showEditModal = true;
  }

  updateUser(): void {
    if (this.editUserForm.valid && this.selectedUser) {
      this.isUpdating = true;
      const updateData = this.editUserForm.value as UpdateUserDto;
      
      this.userService.updateUser(this.selectedUser.id, updateData).subscribe({
        next: (updatedUser) => {
          const index = this.users.findIndex(u => u.id === updatedUser.id);
          if (index !== -1) {
            this.users[index] = updatedUser;
          }
          this.closeEditModal();
          this.isUpdating = false;
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.isUpdating = false;
        }
      });
    }
  }

  deleteUser(user: UserResponse): void {
    if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
        },
        error: (error) => {
          console.error('Error deleting user:', error);
        }
      });
    }
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedUser = null;
    this.editUserForm.reset();
  }

  canCreateUsers(): boolean {
    return this.authService.hasPermission(PERMISSIONS.USER_CREATE);
  }

  canUpdateUsers(): boolean {
    return this.authService.hasPermission(PERMISSIONS.USER_UPDATE);
  }

  canDeleteUsers(): boolean {
    return this.authService.hasPermission(PERMISSIONS.USER_DELETE);
  }
}
