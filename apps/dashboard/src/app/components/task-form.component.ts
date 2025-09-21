import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TaskService } from '../services/task.service';
import { CreateTaskDto, UpdateTaskDto, TaskResponse } from '@secure-tms/data';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" class="space-y-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            id="title"
            formControlName="title"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter task title"
          />
          @if (taskForm.get('title')?.invalid && taskForm.get('title')?.touched) {
            <p class="mt-1 text-sm text-red-600">Title is required</p>
          }
        </div>

        <div>
          <label for="category" class="block text-sm font-medium text-gray-700">Category</label>
          <select
            id="category"
            formControlName="category"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select category</option>
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Other">Other</option>
          </select>
          @if (taskForm.get('category')?.invalid && taskForm.get('category')?.touched) {
            <p class="mt-1 text-sm text-red-600">Category is required</p>
          }
        </div>

        <div>
          <label for="priority" class="block text-sm font-medium text-gray-700">Priority</label>
          <select
            id="priority"
            formControlName="priority"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          @if (taskForm.get('priority')?.invalid && taskForm.get('priority')?.touched) {
            <p class="mt-1 text-sm text-red-600">Priority is required</p>
          }
        </div>

        @if (isEditing) {
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="status"
              formControlName="status"
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="Todo">Todo</option>
              <option value="InProgress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
        }

        <div>
          <label for="dueDate" class="block text-sm font-medium text-gray-700">Due Date</label>
          <input
            type="date"
            id="dueDate"
            formControlName="dueDate"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          id="description"
          formControlName="description"
          rows="3"
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Enter task description (optional)"
        ></textarea>
      </div>

      @if (errorMessage) {
        <div class="rounded-md bg-red-50 p-4">
          <div class="text-sm text-red-700">
            {{ errorMessage }}
          </div>
        </div>
      }

      <div class="flex justify-end space-x-3">
        <button
          type="button"
          (click)="onCancel()"
          class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          [disabled]="taskForm.invalid || isLoading"
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          @if (isLoading) {
            <span class="inline-flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isEditing ? 'Updating...' : 'Creating...' }}
            </span>
          } @else {
            {{ isEditing ? 'Update Task' : 'Create Task' }}
          }
        </button>
      </div>
    </form>
  `
})
export class TaskFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);

  @Input() task?: TaskResponse;
  @Output() taskCreated = new EventEmitter<TaskResponse>();
  @Output() taskUpdated = new EventEmitter<TaskResponse>();
  @Output() cancelled = new EventEmitter<void>();

  taskForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  isEditing = false;

  constructor() {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      category: ['', Validators.required],
      priority: ['', Validators.required],
      status: ['Todo'],
      dueDate: ['']
    });
  }

  ngOnInit(): void {
    if (this.task) {
      this.isEditing = true;
      this.populateForm();
    }
  }

  private populateForm(): void {
    if (this.task) {
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description || '',
        category: this.task.category,
        priority: this.task.priority,
        status: this.task.status,
        dueDate: this.task.dueDate ? new Date(this.task.dueDate).toISOString().split('T')[0] : ''
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
        dueDate: formValue.dueDate ? new Date(formValue.dueDate) : undefined
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
            this.taskCreated.emit(newTask);
            this.taskForm.reset();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error creating task:', error);
            this.errorMessage = 'Failed to create task. Please try again.';
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
