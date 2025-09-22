import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TaskService } from '../services/task.service';
import { TaskResponse } from '@secure-tms/data';
import { PERMISSIONS } from '@secure-tms/auth';
import { TaskFormComponent } from './task-form.component';
import { TaskItemComponent } from './task-item.component';
import { ConfirmationModalComponent } from './confirmation-modal.component';
import { AuditLogComponent } from './audit-log.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TaskFormComponent, TaskItemComponent, ConfirmationModalComponent, AuditLogComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation -->
      <nav class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-semibold text-gray-900">
                Task Management System
              </h1>
            </div>
            <div class="flex items-center space-x-4">
              @if (currentUser$ | async; as currentUser) {
                <div class="flex items-center space-x-3">
                  @if (canViewAuditLog()) {
                    <button
                      (click)="navigateToAuditLog()"
                      class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      Audit Log
                    </button>
                  }
                  <div class="text-sm">
                    <p class="text-gray-700 font-medium">{{ currentUser.email }}</p>
                    <p class="text-gray-500 text-xs">{{ currentUser.roleName }}</p>
                  </div>
                  <button
                    (click)="logout()"
                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                    Logout
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      </nav>

      <!-- Main content -->
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

        <!-- Stats -->
        <div class="mb-8">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                      <dd class="text-lg font-medium text-gray-900">{{ tasks.length }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                      <dd class="text-lg font-medium text-gray-900">{{ getTasksByStatus('InProgress').length }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Completed</dt>
                      <dd class="text-lg font-medium text-gray-900">{{ getTasksByStatus('Done').length }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tasks section -->
        <div class="bg-white shadow overflow-hidden sm:rounded-md">
          <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 class="text-lg leading-6 font-medium text-gray-900">Tasks</h3>
              <p class="mt-1 max-w-2xl text-sm text-gray-500">
                Manage your tasks and track progress
              </p>
            </div>
            @if (canCreateTasks()) {
              <button
                (click)="showCreateForm = !showCreateForm"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {{ showCreateForm ? 'Cancel' : 'Add Task' }}
              </button>
            }
          </div>

          <!-- Create task form -->
          @if (showCreateForm && canCreateTasks()) {
            <div class="border-t border-gray-200 px-4 py-5 sm:px-6 bg-gray-50">
              <app-task-form 
                (taskCreated)="onTaskCreated($event)"
                (cancelled)="showCreateForm = false">
              </app-task-form>
            </div>
          }

          <!-- Tasks list -->
          @if (isLoading) {
            <div class="px-4 py-12 text-center">
              <div class="inline-flex items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading tasks...
              </div>
            </div>
          } @else if (tasks.length === 0) {
            <div class="px-4 py-12 text-center">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
              <p class="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
            </div>
          } @else {
            <ul class="divide-y divide-gray-200">
              @for (task of tasks; track task.id) {
                <app-task-item 
                  [task]="task"
                  [canEdit]="canEditTask(task)"
                  [canDelete]="canDeleteTask(task)"
                  (taskUpdated)="onTaskUpdated($event)"
                  (taskDeleted)="onTaskDeleted($event)">
                </app-task-item>
              }
            </ul>
          }
        </div>
      </div>

        <!-- Audit Log Section (for Owners/Admins) -->
        @if (canViewAuditLogs()) {
          <div class="mt-8">
            <app-audit-log></app-audit-log>
          </div>
        }
      </div>

    <!-- Logout Confirmation Modal -->
    <app-confirmation-modal
      [isOpen]="showLogoutModal"
      title="Confirm Logout"
      message="Are you sure you want to logout? You will need to sign in again to access your account."
      type="warning"
      confirmText="Logout"
      cancelText="Cancel"
      (confirmed)="confirmLogout()"
      (cancelled)="cancelLogout()"
    ></app-confirmation-modal>
  `
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  private router = inject(Router);

  currentUser$ = this.authService.currentUser$;
  private currentUser = this.authService.currentUserValue;
  showLogoutModal = false;
  tasks: TaskResponse[] = [];
  isLoading = true;
  showCreateForm = false;

  ngOnInit(): void {
    this.loadTasks();
    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  loadTasks(): void {
    this.isLoading = true;
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.isLoading = false;
      }
    });
  }

  getTasksByStatus(status: string): TaskResponse[] {
    return this.tasks.filter(task => task.status === status);
  }

  canCreateTasks(): boolean {
    return this.authService.hasPermission(PERMISSIONS.TASK_CREATE);
  }

  canEditTask(task: TaskResponse): boolean {
    if (!this.authService.hasPermission(PERMISSIONS.TASK_UPDATE)) {
      return false;
    }
    
    // Viewers can only edit their own tasks
    if (this.currentUser?.roleName === 'Viewer') {
      return task.assignedUserId === this.currentUser.id;
    }
    
    return true;
  }

  canDeleteTask(task: TaskResponse): boolean {
    if (!this.authService.hasPermission(PERMISSIONS.TASK_DELETE)) {
      return false;
    }
    
    // Viewers can only delete their own tasks
    if (this.currentUser?.roleName === 'Viewer') {
      return task.assignedUserId === this.currentUser.id;
    }
    
    return true;
  }

  canViewAuditLogs(): boolean {
    return this.authService.hasPermission(PERMISSIONS.AUDIT_READ);
  }

  canViewAuditLog(): boolean {
    return this.authService.hasPermission(PERMISSIONS.AUDIT_READ);
  }

  navigateToAuditLog(): void {
    this.router.navigate(['/audit-log']);
  }

  onTaskCreated(task: TaskResponse): void {
    this.tasks.unshift(task);
    this.showCreateForm = false;
  }

  onTaskUpdated(updatedTask: TaskResponse): void {
    const index = this.tasks.findIndex(t => t.id === updatedTask.id);
    if (index !== -1) {
      this.tasks[index] = updatedTask;
    }
  }

  onTaskDeleted(taskId: string): void {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
  }

  logout(): void {
    this.showLogoutModal = true;
  }

  confirmLogout(): void {
    this.showLogoutModal = false;
    this.authService.logout();
  }

  cancelLogout(): void {
    this.showLogoutModal = false;
  }
}
