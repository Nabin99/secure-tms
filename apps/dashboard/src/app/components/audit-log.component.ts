import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditService } from '../services/audit.service';
import { AuthService } from '../services/auth.service';
import { EventService } from '../services/event.service';
import { AuditLog } from '@secure-tms/data';
import { PERMISSIONS } from '@secure-tms/auth';
import { interval, Subscription, merge } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Audit Log</h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">
          Recent system activities and changes
        </p>
      </div>

      @if (isLoading) {
        <div class="px-4 py-12 text-center">
          <div class="inline-flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading audit logs...
          </div>
        </div>
      } @else if (auditLogs.length === 0) {
        <div class="px-4 py-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No audit logs</h3>
          <p class="mt-1 text-sm text-gray-500">No system activities have been recorded yet.</p>
        </div>
      } @else {
        <div class="border-t border-gray-200">
          <div class="max-h-96 overflow-y-auto">
            <ul class="divide-y divide-gray-200">
              @for (log of auditLogs; track log.id) {
                <li class="px-4 py-4">
                  <div class="flex space-x-3">
                    <div class="flex-shrink-0">
                      <div 
                        class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                        [ngClass]="{
                          'bg-green-500': log.action === 'CREATE',
                          'bg-blue-500': log.action === 'READ',
                          'bg-yellow-500': log.action === 'UPDATE',
                          'bg-red-500': log.action === 'DELETE'
                        }"
                      >
                        @switch (log.action) {
                          @case ('CREATE') {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                          }
                          @case ('UPDATE') {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                          }
                          @case ('DELETE') {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                          }
                          @default {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                          }
                        }
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <p class="text-sm font-medium text-gray-900">
                          {{ getActionDescription(log) }}
                        </p>
                        <p class="text-xs text-gray-500">
                          {{ formatTimestamp(log.timestamp) }}
                        </p>
                      </div>
                      <p class="text-sm text-gray-500">
                        Resource: {{ log.resource }} ({{ log.resourceId }})
                      </p>
                      @if (log.user) {
                        <p class="text-xs text-gray-400">
                          By: {{ log.user.firstName }} {{ log.user.lastName }} ({{ log.user.email }})
                        </p>
                      }
                      @if (log.metadata && hasMetadata(log.metadata)) {
                        <div class="mt-2">
                          <details class="group">
                            <summary class="text-xs text-gray-600 cursor-pointer hover:text-gray-800 list-none flex items-center">
                              <svg class="w-3 h-3 mr-1 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                              </svg>
                              View Details
                            </summary>
                            <div class="mt-1 bg-gray-50 rounded p-2 text-xs">
                              <pre class="whitespace-pre-wrap font-mono text-gray-700">{{ formatMetadata(log.metadata) }}</pre>
                            </div>
                          </details>
                        </div>
                      }
                    </div>
                  </div>
                </li>
              }
            </ul>
          </div>
        </div>
      }
    </div>
  `
})
export class AuditLogComponent implements OnInit, OnDestroy {
  private auditService = inject(AuditService);
  private authService = inject(AuthService);
  private eventService = inject(EventService);

  auditLogs: AuditLog[] = [];
  isLoading = true;
  private autoRefreshSubscription?: Subscription;

  ngOnInit(): void {
    // Only load audit logs if user has permission
    if (this.authService.hasPermission(PERMISSIONS.AUDIT_READ)) {
      this.startAutoRefresh();
    } else {
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
    }
  }

  private startAutoRefresh(): void {
    // Combine interval-based refresh with event-driven refresh
    this.autoRefreshSubscription = merge(
      interval(30000), // Refresh every 30 seconds
      this.eventService.taskChanged$ // Refresh when tasks change
    )
      .pipe(
        startWith(0), // Load immediately
        switchMap(() => this.auditService.getAuditLogs())
      )
      .subscribe({
        next: (logs) => {
          this.auditLogs = logs;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading audit logs:', error);
          this.isLoading = false;
        }
      });
  }

  getActionDescription(log: AuditLog): string {
    const actionMap = {
      CREATE: 'Created',
      READ: 'Viewed',
      UPDATE: 'Updated',
      DELETE: 'Deleted'
    };
    
    const action = actionMap[log.action as keyof typeof actionMap] || log.action;
    const resource = log.resource.charAt(0).toUpperCase() + log.resource.slice(1);
    
    return `${action} ${resource}`;
  }

  formatTimestamp(timestamp: Date | string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  }

  hasMetadata(metadata: Record<string, unknown> | undefined): boolean {
    return !!metadata && Object.keys(metadata).length > 0;
  }

  formatMetadata(metadata: Record<string, unknown>): string {
    return JSON.stringify(metadata, null, 2);
  }
}
