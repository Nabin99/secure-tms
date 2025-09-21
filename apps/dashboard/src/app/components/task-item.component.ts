import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../services/task.service';
import { TaskResponse } from '@secure-tms/data';
import { TaskFormComponent } from './task-form.component';

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [CommonModule, TaskFormComponent],
  template: `
    <li class="px-4 py-4 hover:bg-gray-50">
      @if (!isEditing) {
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  [ngClass]="{
                    'bg-gray-100 text-gray-800': task.status === 'Todo',
                    'bg-yellow-100 text-yellow-800': task.status === 'InProgress',
                    'bg-green-100 text-green-800': task.status === 'Done'
                  }"
                >
                  {{ task.status === 'InProgress' ? 'In Progress' : task.status }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ task.title }}
                </p>
                @if (task.description) {
                  <p class="text-sm text-gray-500 truncate">
                    {{ task.description }}
                  </p>
                }
                <div class="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                  <span class="flex items-center">
                    <span 
                      class="inline-block w-2 h-2 rounded-full mr-1"
                      [ngClass]="{
                        'bg-green-400': task.priority === 'Low',
                        'bg-yellow-400': task.priority === 'Medium',
                        'bg-red-400': task.priority === 'High'
                      }"
                    ></span>
                    {{ task.priority }} Priority
                  </span>
                  <span>{{ task.category }}</span>
                  @if (task.dueDate) {
                    <span>Due: {{ formatDate(task.dueDate) }}</span>
                  }
                  @if (task.assignedUser) {
                    <span>Assigned to: {{ task.assignedUser.firstName }} {{ task.assignedUser.lastName }}</span>
                  }
                </div>
              </div>
            </div>
          </div>
          
          @if (canEdit || canDelete) {
            <div class="flex items-center space-x-2">
              @if (canEdit) {
                <button
                  (click)="startEditing()"
                  class="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  Edit
                </button>
              }
              @if (canDelete) {
                <button
                  (click)="deleteTask()"
                  [disabled]="isDeleting"
                  class="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                >
                  @if (isDeleting) {
                    <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  } @else {
                    Delete
                  }
                </button>
              }
            </div>
          }
        </div>
      } @else {
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h4 class="text-sm font-medium text-gray-900">Edit Task</h4>
            <button
              (click)="cancelEditing()"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <app-task-form
            [task]="task"
            (taskUpdated)="onTaskUpdated($event)"
            (cancelled)="cancelEditing()"
          ></app-task-form>
        </div>
      }
    </li>
  `
})
export class TaskItemComponent {
  private taskService = inject(TaskService);

  @Input() task!: TaskResponse;
  @Input() canEdit = false;
  @Input() canDelete = false;
  @Output() taskUpdated = new EventEmitter<TaskResponse>();
  @Output() taskDeleted = new EventEmitter<string>();

  isEditing = false;
  isDeleting = false;

  startEditing(): void {
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.isEditing = false;
  }

  onTaskUpdated(updatedTask: TaskResponse): void {
    this.taskUpdated.emit(updatedTask);
    this.isEditing = false;
  }

  deleteTask(): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.isDeleting = true;
      this.taskService.deleteTask(this.task.id).subscribe({
        next: () => {
          this.taskDeleted.emit(this.task.id);
        },
        error: (error) => {
          console.error('Error deleting task:', error);
          this.isDeleting = false;
        }
      });
    }
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  }
}
