import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../services/task.service';
import { TaskResponse } from '@secure-tms/data';
import { TaskFormComponent } from './task-form.component';
import { ConfirmationModalComponent } from './confirmation-modal.component';

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [CommonModule, TaskFormComponent, ConfirmationModalComponent],
  template: `
    <div>
      @if (!isEditing) {
        <div class="space-y-3">
          <!-- Task Header -->
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-gray-900 line-clamp-2">
              {{ task.title }}
            </h4>
            <span 
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0"
              [ngClass]="{
                'bg-red-100 text-red-800': task.priority === 'High',
                'bg-yellow-100 text-yellow-800': task.priority === 'Medium',
                'bg-green-100 text-green-800': task.priority === 'Low'
              }"
            >
              {{ task.priority }}
            </span>
          </div>

          <!-- Task Description -->
          @if (task.description) {
            <p class="text-sm text-gray-600 line-clamp-3">
              {{ task.description }}
            </p>
          }

          <!-- Task Meta Information -->
          <div class="space-y-2">
            <!-- Category -->
            <div class="flex items-center text-xs text-gray-500">
              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zm2 2V5h1v1h-1z" clip-rule="evenodd"></path>
              </svg>
              {{ task.category }}
            </div>

            <!-- Due Date -->
            @if (task.dueDate) {
              <div class="flex items-center text-xs text-gray-500">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                </svg>
                Due: {{ formatDate(task.dueDate) }}
              </div>
            }

            <!-- Assigned User -->
            @if (task.assignedUser) {
              <div class="flex items-center text-xs text-gray-500">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                </svg>
                {{ task.assignedUser.firstName }} {{ task.assignedUser.lastName }}
              </div>
            }
          </div>

          <!-- Action Buttons -->
          @if (canEdit || canDelete) {
            <div class="flex items-center justify-between pt-2 border-t border-gray-100">
              <div class="flex space-x-2">
                @if (canEdit) {
                  <button
                    (click)="startEditing()"
                    class="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                  >
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                    </svg>
                    Edit
                  </button>
                }
                @if (canDelete) {
                  <button
                    (click)="deleteTask()"
                    [disabled]="isDeleting"
                    class="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  >
                    @if (isDeleting) {
                      <svg class="animate-spin w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    } @else {
                      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clip-rule="evenodd"></path>
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                      </svg>
                    }
                    Delete
                  </button>
                }
              </div>
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

      <!-- Confirmation Modal for Delete -->
      <app-confirmation-modal
        [isOpen]="showDeleteConfirmation"
        title="🗑️ Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        type="danger"
        confirmText="Delete Task"
        cancelText="Cancel"
        (confirmed)="confirmDelete()"
        (cancelled)="cancelDelete()"
      ></app-confirmation-modal>
    </div>
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
  showDeleteConfirmation = false;

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
    this.showDeleteConfirmation = true;
  }

  confirmDelete(): void {
    this.showDeleteConfirmation = false;
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

  cancelDelete(): void {
    this.showDeleteConfirmation = false;
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  }
}
