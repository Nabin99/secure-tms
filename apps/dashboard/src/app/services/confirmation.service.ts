import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmationData {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger';
  confirmText: string;
  cancelText: string;
  confirmCallback?: () => void;
  cancelCallback?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private confirmationSubject = new BehaviorSubject<ConfirmationData>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  public confirmation$ = this.confirmationSubject.asObservable();

  /**
   * Show a confirmation dialog
   * @param options Configuration options for the confirmation dialog
   * @returns Promise that resolves to true if confirmed, false if cancelled
   */
  confirm(options: Partial<ConfirmationData>): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmationData: ConfirmationData = {
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        type: options.type || 'info',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        confirmCallback: () => {
          this.close();
          resolve(true);
        },
        cancelCallback: () => {
          this.close();
          resolve(false);
        }
      };

      this.confirmationSubject.next(confirmationData);
    });
  }

  /**
   * Show a delete confirmation dialog with predefined styling
   * @param itemName Name of the item being deleted
   * @param customMessage Optional custom message
   * @returns Promise that resolves to true if confirmed, false if cancelled
   */
  confirmDelete(itemName: string = 'item', customMessage?: string): Promise<boolean> {
    const message = customMessage || `Are you sure you want to delete this ${itemName}? This action cannot be undone.`;
    
    return this.confirm({
      title: `🗑️ Delete ${itemName.charAt(0).toUpperCase() + itemName.slice(1)}`,
      message,
      type: 'danger',
      confirmText: `Delete ${itemName.charAt(0).toUpperCase() + itemName.slice(1)}`,
      cancelText: 'Cancel'
    });
  }

  /**
   * Show a warning confirmation dialog
   * @param title Dialog title
   * @param message Dialog message
   * @returns Promise that resolves to true if confirmed, false if cancelled
   */
  confirmWarning(title: string, message: string): Promise<boolean> {
    return this.confirm({
      title: `⚠️ ${title}`,
      message,
      type: 'warning',
      confirmText: 'Proceed',
      cancelText: 'Cancel'
    });
  }

  /**
   * Close the confirmation dialog
   */
  close(): void {
    this.confirmationSubject.next({
      ...this.confirmationSubject.value,
      isOpen: false
    });
  }

  /**
   * Get current confirmation data
   */
  getCurrentConfirmation(): ConfirmationData {
    return this.confirmationSubject.value;
  }
}
