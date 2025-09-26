import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TaskService } from '../services/task.service';
import { UserService, UserOption } from '../services/user.service';
import { OrganizationService } from '../services/organization.service';
import { AuthService } from '../services/auth.service';
import { CreateTaskDto, UpdateTaskDto, TaskResponse, OrganizationResponse } from '@secure-tms/data';
import { PERMISSIONS } from '@secure-tms/auth';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <!-- Form Header with Modern Gradient -->
      <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5 border-b border-slate-200">
        <h3 class="text-xl font-bold text-white flex items-center">
          📝
          <span class="ml-2">{{ isEditing ? 'Edit Task' : 'Create New Task' }}</span>
        </h3>
        <p class="mt-2 text-blue-100">
          {{ isEditing ? 'Update the task details below.' : 'Fill in the details to create a new task.' }}
        </p>
      </div>

      <!-- Form Content -->
      <div class="p-6">

      <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Main Fields Grid -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <!-- Title Field -->
          <div class="sm:col-span-2">
            <label for="title" class="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
              📝 <span class="ml-2">Task Title</span> <span class="text-red-500 ml-1">*</span>
            </label>
            <div class="relative">
              <input
                type="text"
                id="title"
                formControlName="title"
                class="block w-full px-4 py-3 text-slate-900 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all duration-200 sm:text-sm"
                placeholder="Enter a descriptive task title..."
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                <span class="text-slate-400">✏️</span>
              </div>
            </div>
            @if (taskForm.get('title')?.invalid && taskForm.get('title')?.touched) {
              <p class="mt-2 text-sm text-red-600 flex items-center bg-red-50 px-3 py-2 rounded-lg">
                <span class="mr-2">⚠️</span>
                Title is required
              </p>
            }
          </div>

          <!-- Category Field -->
          <div>
            <label for="category" class="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
              📁 <span class="ml-2">Category</span> <span class="text-red-500 ml-1">*</span>
            </label>
            <div class="relative">
              <select
                id="category"
                formControlName="category"
                class="block w-full px-4 py-3 text-slate-900 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all duration-200 sm:text-sm appearance-none cursor-pointer"
              >
                <option value="">Choose category...</option>
                <option value="Work">🏢 Work</option>
                <option value="Personal">👤 Personal</option>
                <option value="Other">📝 Other</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span class="text-slate-400">▼</span>
              </div>
            </div>
            @if (taskForm.get('category')?.invalid && taskForm.get('category')?.touched) {
              <p class="mt-2 text-sm text-red-600 flex items-center bg-red-50 px-3 py-2 rounded-lg">
                <span class="mr-2">⚠️</span>
                Category is required
              </p>
            }
          </div>

          <!-- Priority Field -->
          <div>
            <label for="priority" class="block text-sm font-semibold text-gray-900 mb-2">
              Priority <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <select
                id="priority"
                formControlName="priority"
                class="block w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all duration-200 sm:text-sm appearance-none"
              >
                <option value="">Choose priority...</option>
                <option value="Low">🟢 Low Priority</option>
                <option value="Medium">🟡 Medium Priority</option>
                <option value="High">🔴 High Priority</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
            @if (taskForm.get('priority')?.invalid && taskForm.get('priority')?.touched) {
              <p class="mt-2 text-sm text-red-600 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                Priority is required
              </p>
            }
          </div>

          <!-- Status Field (Only for editing) -->
          @if (isEditing) {
            <div>
              <label for="status" class="block text-sm font-semibold text-gray-900 mb-2">
                Status
              </label>
              <div class="relative">
                <select
                  id="status"
                  formControlName="status"
                  class="block w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all duration-200 sm:text-sm appearance-none"
                >
                  <option value="Todo">📋 Todo</option>
                  <option value="InProgress">⚡ In Progress</option>
                  <option value="Done">✅ Done</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          }

          <!-- Due Date Field -->
          <div class="{{ isEditing ? '' : 'sm:col-span-1' }}">
            <label for="dueDate" class="block text-sm font-semibold text-gray-900 mb-2">
              Due Date
            </label>
            <div class="relative">
              <input
                type="date"
                id="dueDate"
                formControlName="dueDate"
                class="block w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all duration-200 sm:text-sm"
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
            </div>
          </div>

          <!-- Assigned User Field (Only for Admin/Owner) -->
          @if (canAssignTasks) {
            <div class="{{ isEditing ? '' : 'sm:col-span-1' }}">
              <label for="assignedUserId" class="block text-sm font-semibold text-gray-900 mb-2">
                Assign To
              </label>
              <div class="relative">
                <select
                  id="assignedUserId"
                  formControlName="assignedUserId"
                  class="block w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all duration-200 sm:text-sm appearance-none"
                >
                  <option value="">👤 Select user (optional)</option>
                  @for (user of users; track user.id) {
                    <option [value]="user.id">
                      {{ user.firstName }} {{ user.lastName }} ({{ user.roleName }})
                    </option>
                  }
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              <p class="mt-1 text-xs text-gray-500">Leave empty to assign to yourself</p>
            </div>
          }

          <!-- Organization Selection (Only for Owners creating tasks) -->
          @if (canSelectOrganization && !isEditing) {
            <div class="{{ canAssignTasks ? '' : 'sm:col-span-1' }}">
              <label for="organizationId" class="block text-sm font-semibold text-gray-900 mb-2">
                Target Organization
              </label>
              <div class="relative">
                <select
                  id="organizationId"
                  formControlName="organizationId"
                  class="block w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all duration-200 sm:text-sm appearance-none"
                >
                  <option value="">🏢 Select organization (optional)</option>
                  @for (org of organizations; track org.id) {
                    <option [value]="org.id">
                      {{ org.name }} {{ org.level === 1 ? '(Parent)' : '(Child)' }}
                    </option>
                  }
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              <p class="mt-1 text-xs text-gray-500">Leave empty to use your organization</p>
            </div>
          }
        </div>

        <!-- Description Field -->
        <div>
          <label for="description" class="block text-sm font-semibold text-gray-900 mb-2">
            Description
          </label>
          <div class="relative">
            <textarea
              id="description"
              formControlName="description"
              rows="4"
              class="block w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all duration-200 sm:text-sm resize-none"
              placeholder="Add a detailed description of the task... (optional)"
            ></textarea>
            <div class="absolute bottom-3 right-3">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        @if (errorMessage) {
          <div class="rounded-lg bg-red-50 border border-red-200 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Error</h3>
                <div class="mt-1 text-sm text-red-700">
                  {{ errorMessage }}
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            (click)="onCancel()"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="taskForm.invalid || isLoading"
            class="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            @if (isLoading) {
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isEditing ? 'Updating Task...' : 'Creating Task...' }}
            } @else {
              @if (isEditing) {
                <span class="mr-2">✏️</span>
                Update Task
              } @else {
                <span class="mr-2">➕</span>
                Create Task
              }
            }
          </button>
        </div>
      </form>
      </div>
    </div>
  `
})
export class TaskFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private userService = inject(UserService);
  private organizationService = inject(OrganizationService);
  private authService = inject(AuthService);

  @Input() task?: TaskResponse;
  @Output() taskCreated = new EventEmitter<TaskResponse>();
  @Output() taskUpdated = new EventEmitter<TaskResponse>();
  @Output() cancelled = new EventEmitter<void>();

  taskForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  isEditing = false;
  users: UserOption[] = [];
  organizations: OrganizationResponse[] = [];
  canAssignTasks = false;
  canSelectOrganization = false;
  currentUser: { roleName: string; organizationId: string } | null = null;

  constructor() {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      category: ['', Validators.required],
      priority: ['', Validators.required],
      status: ['Todo'],
      dueDate: [''],
      assignedUserId: [''],
      organizationId: ['']
    });
  }

  ngOnInit(): void {
    // Get current user
    this.currentUser = this.authService.currentUserValue;
    
    // Check if user can assign tasks to others
    this.canAssignTasks = this.authService.hasPermission(PERMISSIONS.TASK_ASSIGN);
    
    // Check if user can select organization (only Owners)
    this.canSelectOrganization = this.currentUser?.roleName === 'Owner';
    
    // Load organizations for selection dropdown if user has permission
    if (this.canSelectOrganization) {
      this.loadAccessibleOrganizations();
    }
    
    // Load users for assignment dropdown if user has permission
    if (this.canAssignTasks) {
      this.loadUsers();
    }
    
    if (this.task) {
      this.isEditing = true;
      this.populateForm();
    }
  }

  private loadAccessibleOrganizations(): void {
    this.organizationService.getAccessibleOrganizations().subscribe({
      next: (orgs) => {
        this.organizations = orgs;
      },
      error: (error) => {
        console.error('Error loading organizations:', error);
      }
    });
  }

  private loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  private populateForm(): void {
    if (this.task) {
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description || '',
        category: this.task.category,
        priority: this.task.priority,
        status: this.task.status,
        dueDate: this.task.dueDate ? new Date(this.task.dueDate).toISOString().split('T')[0] : '',
        assignedUserId: this.task.assignedUserId || '',
        organizationId: this.task.organizationId || ''
      });
    }
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formValue = this.taskForm.value;
      const taskData = {
        ...formValue,
        dueDate: formValue.dueDate ? new Date(formValue.dueDate) : undefined,
        assignedUserId: formValue.assignedUserId || undefined, // Only include if not empty
        organizationId: formValue.organizationId || undefined // Only include if not empty
      };

      if (this.isEditing && this.task) {
        const updateDto: UpdateTaskDto = taskData;
        this.taskService.updateTask(this.task.id, updateDto).subscribe({
          next: (updatedTask) => {
            this.taskUpdated.emit(updatedTask);
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error updating task:', error);
            this.errorMessage = 'Failed to update task. Please try again.';
            this.isLoading = false;
          }
        });
      } else {
        const createDto: CreateTaskDto = taskData;
        this.taskService.createTask(createDto).subscribe({
          next: (newTask) => {
            console.log('TaskForm: Task created successfully', newTask);
            this.taskCreated.emit(newTask);
            this.taskForm.reset();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('TaskForm: Error creating task:', error);
            console.error('TaskForm: Error status:', error.status);
            console.error('TaskForm: Error message:', error.message);
            console.error('TaskForm: Error details:', error.error);
            this.errorMessage = `Failed to create task: ${error.status} ${error.statusText}`;
            this.isLoading = false;
          }
        });
      }
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
