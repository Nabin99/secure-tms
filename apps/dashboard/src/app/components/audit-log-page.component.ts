import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuditService } from '../services/audit.service';
import { AuthService } from '../services/auth.service';
import { AuditLog } from '@secure-tms/data';
import { PERMISSIONS } from '@secure-tms/auth';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-audit-log-page',
  standalone: true,
  imports: [CommonModule],
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
                Audit Log
              </h1>
              @if (isAutoRefreshEnabled) {
                <div class="flex items-center text-sm text-green-600">
                  <div class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Auto-refreshing
                </div>
              }
            </div>
            <div class="flex items-center space-x-4">
              <button
                (click)="toggleAutoRefresh()"
                class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                [ngClass]="{
                  'bg-green-50 border-green-300 text-green-700': isAutoRefreshEnabled,
                  'bg-white border-gray-300 text-gray-700': !isAutoRefreshEnabled
                }"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                {{ isAutoRefreshEnabled ? 'Disable' : 'Enable' }} Auto-refresh
              </button>
              <button
                (click)="refreshLogs()"
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                [disabled]="isRefreshing"
              >
                <svg 
                  class="w-4 h-4 mr-2" 
                  [ngClass]="{ 'animate-spin': isRefreshing }"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main content -->
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <!-- Stats -->
        <div class="mb-6">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Total Entries</dt>
                      <dd class="text-lg font-medium text-gray-900">{{ auditLogs.length }}</dd>
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
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Created</dt>
                      <dd class="text-lg font-medium text-gray-900">{{ getActionCount('CREATE') }}</dd>
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
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Updated</dt>
                      <dd class="text-lg font-medium text-gray-900">{{ getActionCount('UPDATE') }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Deleted</dt>
                      <dd class="text-lg font-medium text-gray-900">{{ getActionCount('DELETE') }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Audit Log Table -->
        <div class="bg-white shadow overflow-hidden sm:rounded-md">
          <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 class="text-lg leading-6 font-medium text-gray-900">Activity Log</h3>
              <p class="mt-1 max-w-2xl text-sm text-gray-500">
                Detailed audit trail of all system activities
                @if (lastRefresh) {
                  <span class="ml-2 text-xs text-gray-400">
                    Last updated: {{ formatTimestamp(lastRefresh) }}
                  </span>
                }
              </p>
            </div>
          </div>

          @if (isLoading && auditLogs.length === 0) {
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
              <div class="overflow-y-auto" style="max-height: 600px;">
                <ul class="divide-y divide-gray-200">
                  @for (log of auditLogs; track log.id) {
                    <li class="px-4 py-4 hover:bg-gray-50" 
                        [ngClass]="{ 'bg-green-50': isNewEntry(log) }">
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
                              @if (isNewEntry(log)) {
                                <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  New
                                </span>
                              }
                            </p>
                            <p class="text-xs text-gray-500">
                              {{ formatTimestamp(log.timestamp) }}
                            </p>
                          </div>
                          <p class="text-sm text-gray-500">
                            Resource: <span class="font-medium">{{ log.resource }}</span> 
                            <span class="text-gray-400">({{ log.resourceId }})</span>
                          </p>
                          @if (log.user) {
                            <p class="text-xs text-gray-400 mt-1">
                              By: <span class="font-medium">{{ log.user.firstName }} {{ log.user.lastName }}</span> 
                              <span class="text-gray-300">({{ log.user.email }})</span>
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
      </div>
    </div>
  `
})
export class AuditLogPageComponent implements OnInit, OnDestroy {
  private auditService = inject(AuditService);
  private authService = inject(AuthService);
  private router = inject(Router);

  auditLogs: AuditLog[] = [];
  isLoading = true;
  isRefreshing = false;
  isAutoRefreshEnabled = true;
  lastRefresh: Date | null = null;
  private newEntryIds = new Set<string>();
  private autoRefreshSubscription?: Subscription;

  ngOnInit(): void {
    // Check if user has permission to view audit logs
    if (!this.authService.hasPermission(PERMISSIONS.AUDIT_READ)) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadAuditLogs();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  loadAuditLogs(): void {
    this.isLoading = true;
    this.auditService.getAuditLogs().subscribe({
      next: (logs) => {
        // Mark new entries
        const existingIds = new Set(this.auditLogs.map(log => log.id));
        logs.forEach(log => {
          if (!existingIds.has(log.id)) {
            this.newEntryIds.add(log.id);
          }
        });

        // Clear new entry markers after 5 seconds
        setTimeout(() => {
          this.newEntryIds.clear();
        }, 5000);

        this.auditLogs = logs;
        this.lastRefresh = new Date();
        this.isLoading = false;
        this.isRefreshing = false;
      },
      error: (error) => {
        console.error('Error loading audit logs:', error);
        this.isLoading = false;
        this.isRefreshing = false;
      }
    });
  }

  refreshLogs(): void {
    this.isRefreshing = true;
    this.loadAuditLogs();
  }

  toggleAutoRefresh(): void {
    this.isAutoRefreshEnabled = !this.isAutoRefreshEnabled;
    if (this.isAutoRefreshEnabled) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  private startAutoRefresh(): void {
    if (this.isAutoRefreshEnabled) {
      this.autoRefreshSubscription = interval(5000) // Refresh every 5 seconds
        .pipe(
          startWith(0),
          switchMap(() => this.auditService.getAuditLogs())
        )
        .subscribe({
          next: (logs) => {
            // Mark new entries
            const existingIds = new Set(this.auditLogs.map(log => log.id));
            logs.forEach(log => {
              if (!existingIds.has(log.id)) {
                this.newEntryIds.add(log.id);
              }
            });

            // Clear new entry markers after 5 seconds
            setTimeout(() => {
              this.newEntryIds.clear();
            }, 5000);

            this.auditLogs = logs;
            this.lastRefresh = new Date();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error auto-refreshing audit logs:', error);
          }
        });
    }
  }

  private stopAutoRefresh(): void {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
      this.autoRefreshSubscription = undefined;
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  getActionCount(action: string): number {
    return this.auditLogs.filter(log => log.action === action).length;
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

  isNewEntry(log: AuditLog): boolean {
    return this.newEntryIds.has(log.id);
  }
}
