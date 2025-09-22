import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
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
  imports: [CommonModule, RouterModule, FormsModule, DragDropModule, TaskFormComponent, TaskItemComponent, ConfirmationModalComponent, AuditLogComponent],
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
                      <dd class="text-lg font-medium text-gray-900">{{ filteredTasks.length }}</dd>
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
                      <dd class="text-lg font-medium text-gray-900">{{ getFilteredTasksByStatus('InProgress').length }}</dd>
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
                      <dd class="text-lg font-medium text-gray-900">{{ getFilteredTasksByStatus('Done').length }}</dd>
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

          <!-- Filters and Search -->
          <div class="px-6 py-6 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-t border-slate-200/60">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <!-- Search -->
              <div class="group">
                <label for="search" class="block text-sm font-semibold text-slate-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                  🔍 Search Tasks
                </label>
                <input
                  type="text"
                  id="search"
                  [(ngModel)]="searchTerm"
                  (input)="applyFilters()"
                  placeholder="Search by title or description..."
                  class="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-300"
                />
              </div>

              <!-- Category Filter -->
              <div class="group">
                <label for="category" class="block text-sm font-semibold text-slate-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                  📁 Category
                </label>
                <select
                  id="category"
                  [(ngModel)]="selectedCategory"
                  (change)="applyFilters()"
                  class="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 cursor-pointer"
                >
                  <option value="">All Categories</option>
                  <option value="Work">🏢 Work</option>
                  <option value="Personal">👤 Personal</option>
                  <option value="Other">📋 Other</option>
                </select>
              </div>

              <!-- Priority Filter -->
              <div class="group">
                <label for="priority" class="block text-sm font-semibold text-slate-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                  ⚡ Priority
                </label>
                <select
                  id="priority"
                  [(ngModel)]="selectedPriority"
                  (change)="applyFilters()"
                  class="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 cursor-pointer"
                >
                  <option value="">All Priorities</option>
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </div>

              <!-- Sort -->
              <div class="group">
                <label for="sort" class="block text-sm font-semibold text-slate-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                  📊 Sort By
                </label>
                <select
                  id="sort"
                  [(ngModel)]="sortBy"
                  (change)="applyFilters()"
                  class="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 cursor-pointer"
                >
                  <option value="createdAt">📅 Created Date</option>
                  <option value="dueDate">⏰ Due Date</option>
                  <option value="priority">⚡ Priority</option>
                  <option value="title">🔤 Title</option>
                  <option value="status">📊 Status</option>
                </select>
              </div>
            </div>
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
          } @else if (filteredTasks.length === 0) {
            <div class="px-4 py-12 text-center">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
              <p class="mt-1 text-sm text-gray-500">
                @if (searchTerm || selectedCategory || selectedPriority) {
                  Try adjusting your filters to see more tasks.
                } @else {
                  Get started by creating a new task.
                }
              </p>
            </div>
          } @else {
            <!-- Kanban Board View -->
            <div class="p-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Todo Column -->
                <div class="bg-gray-50 rounded-lg p-4">
                  <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <div class="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                    Todo ({{ getFilteredTasksByStatus('Todo').length }})
                  </h3>
                  <div
                    cdkDropList
                    id="todo-list"
                    [cdkDropListData]="getFilteredTasksByStatus('Todo')"
                    [cdkDropListConnectedTo]="['in-progress-list', 'done-list']"
                    (cdkDropListDropped)="drop($event)"
                    class="min-h-[200px] space-y-3"
                  >
                    @for (task of getFilteredTasksByStatus('Todo'); track task.id) {
                      <div 
                        cdkDrag
                        [cdkDragData]="task"
                        class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow"
                      >
                        <app-task-item 
                          [task]="task"
                          [canEdit]="canEditTask(task)"
                          [canDelete]="canDeleteTask(task)"
                          (taskUpdated)="onTaskUpdated($event)"
                          (taskDeleted)="onTaskDeleted($event)">
                        </app-task-item>
                      </div>
                    }
                  </div>
                </div>

                <!-- In Progress Column -->
                <div class="bg-blue-50 rounded-lg p-4">
                  <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    In Progress ({{ getFilteredTasksByStatus('InProgress').length }})
                  </h3>
                  <div
                    cdkDropList
                    id="in-progress-list"
                    [cdkDropListData]="getFilteredTasksByStatus('InProgress')"
                    [cdkDropListConnectedTo]="['todo-list', 'done-list']"
                    (cdkDropListDropped)="drop($event)"
                    class="min-h-[200px] space-y-3"
                  >
                    @for (task of getFilteredTasksByStatus('InProgress'); track task.id) {
                      <div 
                        cdkDrag
                        [cdkDragData]="task"
                        class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow"
                      >
                        <app-task-item 
                          [task]="task"
                          [canEdit]="canEditTask(task)"
                          [canDelete]="canDeleteTask(task)"
                          (taskUpdated)="onTaskUpdated($event)"
                          (taskDeleted)="onTaskDeleted($event)">
                        </app-task-item>
                      </div>
                    }
                  </div>
                </div>

                <!-- Done Column -->
                <div class="bg-green-50 rounded-lg p-4">
                  <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Done ({{ getFilteredTasksByStatus('Done').length }})
                  </h3>
                  <div
                    cdkDropList
                    id="done-list"
                    [cdkDropListData]="getFilteredTasksByStatus('Done')"
                    [cdkDropListConnectedTo]="['todo-list', 'in-progress-list']"
                    (cdkDropListDropped)="drop($event)"
                    class="min-h-[200px] space-y-3"
                  >
                    @for (task of getFilteredTasksByStatus('Done'); track task.id) {
                      <div 
                        cdkDrag
                        [cdkDragData]="task"
                        class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow"
                      >
                        <app-task-item 
                          [task]="task"
                          [canEdit]="canEditTask(task)"
                          [canDelete]="canDeleteTask(task)"
                          (taskUpdated)="onTaskUpdated($event)"
                          (taskDeleted)="onTaskDeleted($event)">
                        </app-task-item>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
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
  filteredTasks: TaskResponse[] = [];
  isLoading = true;
  showCreateForm = false;

  // Filter and sort properties
  searchTerm = '';
  selectedCategory = '';
  selectedPriority = '';
  sortBy = 'createdAt';

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
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.tasks];

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(task => task.category === this.selectedCategory);
    }

    // Apply priority filter
    if (this.selectedPriority) {
      filtered = filtered.filter(task => task.priority === this.selectedPriority);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority': {
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'createdAt':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    this.filteredTasks = filtered;
  }

  getTasksByStatus(status: string): TaskResponse[] {
    return this.tasks.filter(task => task.status === status);
  }

  getFilteredTasksByStatus(status: string): TaskResponse[] {
    return this.filteredTasks.filter(task => task.status === status);
  }

  drop(event: CdkDragDrop<TaskResponse[]>): void {
    console.log('Drop event:', event);
    
    if (event.previousContainer === event.container) {
      // Reordering within the same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving between columns - update task status
      const task = event.previousContainer.data[event.previousIndex];
      const newStatus = this.getStatusFromContainerId(event.container.id);
      
      console.log('Moving task:', task.title, 'from', task.status, 'to', newStatus);
      
      if (newStatus && task.status !== newStatus) {
        // Update task status
        this.taskService.updateTask(task.id, { status: newStatus as 'Todo' | 'InProgress' | 'Done' }).subscribe({
          next: (updatedTask) => {
            console.log('Task status updated successfully:', updatedTask);
            // Update local task data
            const taskIndex = this.tasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
              this.tasks[taskIndex] = updatedTask;
              this.applyFilters();
            }
          },
          error: (error) => {
            console.error('Error updating task status:', error);
            // Revert the drag operation by reloading tasks
            this.loadTasks();
          }
        });
      }
    }
  }

  private getStatusFromContainerId(containerId: string): string | null {
    const statusMap: { [key: string]: string } = {
      'todo-list': 'Todo',
      'in-progress-list': 'InProgress',
      'done-list': 'Done'
    };
    
    return statusMap[containerId] || null;
  }

  canCreateTasks(): boolean {
    return this.authService.hasPermission(PERMISSIONS.TASK_CREATE);
  }

  canEditTask(task: TaskResponse): boolean {
    if (!this.authService.hasPermission(PERMISSIONS.TASK_UPDATE)) {
      return false;
    }
    
    // Viewers can only edit their own tasks (tasks they created or are assigned to)
    if (this.currentUser?.roleName === 'Viewer') {
      return task.assignedUserId === this.currentUser.id || task.createdByUser?.id === this.currentUser.id;
    }
    
    return true;
  }

  canDeleteTask(task: TaskResponse): boolean {
    if (!this.authService.hasPermission(PERMISSIONS.TASK_DELETE)) {
      return false;
    }
    
    // Viewers cannot delete tasks (only Admin/Owner can delete)
    if (this.currentUser?.roleName === 'Viewer') {
      return false;
    }
    
    // Admin and Owner can delete any task in their organization
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
      this.applyFilters(); // Update the filtered view
    }
  }

  onTaskDeleted(taskId: string): void {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.applyFilters(); // Update the filtered view
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
