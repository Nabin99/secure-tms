import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <!-- Modal backdrop -->
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
        (click)="onBackdropClick()"
        (keydown.escape)="onCancel()"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="'modal-title'"
      >
        <!-- Modal content -->
        <div 
          class="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden" 
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
          role="document"
        >
          <!-- Modal header with gradient -->
          <div [ngClass]="{
            'bg-gradient-to-r from-red-600 via-red-600 to-red-700': type === 'danger',
            'bg-gradient-to-r from-yellow-500 via-yellow-600 to-orange-600': type === 'warning',
            'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600': type === 'info'
          }" class="px-6 py-5">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <h3 id="modal-title" class="text-xl font-bold text-white">
                  {{ title }}
                </h3>
              </div>
              <button
                (click)="onCancel()"
                class="text-white hover:text-slate-200 focus:outline-none transition-colors duration-150"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Modal body -->
          <div class="px-6 py-6">
            <div class="flex items-start space-x-4">
              @if (type === 'danger') {
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                  </div>
                </div>
              } @else if (type === 'warning') {
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                  </div>
                </div>
              } @else {
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
              }
              <div class="flex-1">
                <p class="text-slate-700 font-medium leading-relaxed">
                  {{ message }}
                </p>
              </div>
            </div>
          </div>

          <!-- Modal footer -->
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-4">
            <button
              (click)="onCancel()"
              class="inline-flex items-center px-6 py-3 border border-slate-300 rounded-xl shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              {{ cancelText }}
            </button>
            <button
              (click)="onConfirm()"
              class="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
              [ngClass]="{
                'bg-red-600 hover:bg-red-700 focus:ring-red-500': type === 'danger',
                'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500': type === 'warning',
                'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500': type === 'info'
              }"
            >
              @if (type === 'danger') {
                <svg class="w-4 h-4 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              } @else if (type === 'warning') {
                <svg class="w-4 h-4 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              } @else {
                <svg class="w-4 h-4 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              }
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmationModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() type: 'info' | 'warning' | 'danger' = 'info';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() closeOnBackdrop = true;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.onCancel();
    }
  }
}
