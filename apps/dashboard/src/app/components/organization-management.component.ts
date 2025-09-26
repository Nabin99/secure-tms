import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrganizationService } from '../services/organization.service';
import { AuthService } from '../services/auth.service';
import { OrganizationResponse, OrganizationStats } from '@secure-tms/data';
import { PERMISSIONS } from '@secure-tms/auth';

interface OrganizationNode extends OrganizationResponse { children?: OrganizationNode[]; expanded?: boolean; }

@Component({
  selector: 'app-organization-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <nav class="bg-white shadow-lg border-b border-slate-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-4">
            <button (click)="goBack()" class="inline-flex items-center px-4 py-2 border border-slate-200 rounded-xl shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Back
            </button>
            <div class="hidden sm:block w-px h-6 bg-slate-200"></div>
            <h1 class="text-xl font-bold text-slate-900 flex items-center">🏢<span class="ml-2">Organization Management</span></h1>
          </div>
          <div class="flex items-center space-x-3" *ngIf="canCreateOrgs()">
            <button (click)="toggleCreateForm()" [class]="showCreateForm ? 'inline-flex items-center px-5 py-2 rounded-xl text-sm font-medium bg-white border border-slate-300 text-slate-700 shadow hover:bg-slate-50' : 'inline-flex items-center px-5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow hover:from-blue-700 hover:to-indigo-700'">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path *ngIf="!showCreateForm" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                <path *ngIf="showCreateForm" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              {{ showCreateForm ? 'Cancel' : 'New Organization' }}
            </button>
            <button (click)="refreshHierarchy()" class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-white border border-slate-300 text-slate-700 shadow hover:bg-slate-50">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v6h6M20 20v-6h-6M20 4l-6 6M4 20l6-6"/></svg>
              Refresh
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div *ngIf="message()" class="mb-6"><div class="rounded-xl p-4 flex items-start gap-3 text-sm" [ngClass]="message()!.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path *ngIf="message()!.type==='success'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/><path *ngIf="message()!.type==='error'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg><div class="flex-1">{{ message()!.text }}</div><button (click)="clearMessage()" class="text-slate-400 hover:text-slate-600">✕</button></div></div>

      <div *ngIf="showCreateForm" class="mb-10 bg-white shadow-lg rounded-xl border border-slate-200 overflow-hidden">
        <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5 border-b border-slate-200">
          <h3 class="text-xl font-bold text-white flex items-center">
            {{ editingOrganization() ? '✏️' : '🏢' }}
            <span class="ml-2">{{ editingOrganization() ? 'Edit Organization' : 'Create New Organization' }}</span>
          </h3>
          <p class="mt-2 text-blue-100">
            {{ editingOrganization() ? 'Update the organization details below.' : 'Fill in the details to create a new organization.' }}
          </p>
        </div>
        
        <form [formGroup]="organizationForm" (ngSubmit)="onSubmit()" class="p-6">
          <div class="space-y-6">
            <!-- Main Fields Grid -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <!-- Name Field -->
              <div>
                <label for="org-name" class="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                  🏷️ <span class="ml-2">Organization Name</span> <span class="text-red-500 ml-1">*</span>
                </label>
                <div class="relative">
                  <input
                    type="text"
                    id="org-name"
                    formControlName="name"
                    class="block w-full px-4 py-3 text-slate-900 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all duration-200 sm:text-sm"
                    placeholder="Enter organization name..."
                  />
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span class="text-slate-400">🏢</span>
                  </div>
                </div>
                <p *ngIf="organizationForm.get('name')?.invalid && organizationForm.get('name')?.touched" 
                   class="mt-2 text-sm text-red-600 flex items-center bg-red-50 px-3 py-2 rounded-lg">
                  <span class="mr-2">⚠️</span>
                  Name is required (minimum 2 characters)
                </p>
              </div>

              <!-- Description Field -->
              <div>
                <label for="org-description" class="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                  📝 <span class="ml-2">Description</span>
                </label>
                <div class="relative">
                  <textarea
                    id="org-description"
                    formControlName="description"
                    rows="3"
                    class="block w-full px-4 py-3 text-slate-900 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all duration-200 sm:text-sm resize-none"
                    placeholder="Optional organization description..."
                  ></textarea>
                  <div class="absolute bottom-3 right-3">
                    <span class="text-slate-400">💬</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Level and Parent Grid -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <!-- Level Field -->
              <div>
                <label for="org-level" class="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                  📊 <span class="ml-2">Organization Level</span> <span class="text-red-500 ml-1">*</span>
                </label>
                <div class="relative">
                  <select
                    id="org-level"
                    formControlName="level"
                    (change)="onLevelChange()"
                    class="block w-full px-4 py-3 text-slate-900 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all duration-200 sm:text-sm appearance-none cursor-pointer"
                  >
                    <option value="1">🏢 Parent Organization (Level 1)</option>
                    <option value="2">🏬 Child Organization (Level 2)</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span class="text-slate-400">▼</span>
                  </div>
                </div>
              </div>

              <!-- Parent Selection (Only for Level 2) -->
              <div *ngIf="selectedLevel() === '2'">
                <label for="org-parent" class="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                  👑 <span class="ml-2">Parent Organization</span> <span class="text-red-500 ml-1">*</span>
                </label>
                <div class="relative">
                  <select
                    id="org-parent"
                    formControlName="parentId"
                    class="block w-full px-4 py-3 text-slate-900 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all duration-200 sm:text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Choose parent organization...</option>
                    <option *ngFor="let p of parentOrganizations()" [value]="p.id">
                      {{ p.name }} (Level {{ p.level }})
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span class="text-slate-400">▼</span>
                  </div>
                </div>
                <p *ngIf="organizationForm.get('parentId')?.invalid && organizationForm.get('parentId')?.touched"
                   class="mt-2 text-sm text-red-600 flex items-center bg-red-50 px-3 py-2 rounded-lg">
                  <span class="mr-2">⚠️</span>
                  Parent organization is required for child organizations
                </p>
              </div>
            </div>

            <!-- Error Message -->
            <div *ngIf="message() && message()!.type === 'error'" class="rounded-lg bg-red-50 border border-red-200 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">Error</h3>
                  <div class="mt-1 text-sm text-red-700">
                    {{ message()!.text }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                (click)="cancelForm()"
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="organizationForm.invalid || isSubmitting()"
                class="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path *ngIf="editingOrganization()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  <path *ngIf="!editingOrganization()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                {{ isSubmitting() ? (editingOrganization() ? 'Updating...' : 'Creating...') : (editingOrganization() ? 'Update Organization' : 'Create Organization') }}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div class="mb-10 bg-white shadow rounded-2xl border border-slate-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between bg-gradient-to-r from-slate-50 to-slate-100"><h2 class="text-lg font-semibold text-slate-800">📂 Hierarchy</h2><span class="text-xs text-slate-500" *ngIf="!isLoading()">{{ organizations().length }} root</span></div>
        <div *ngIf="isLoading()" class="p-10 text-center text-slate-500 text-sm">Loading...</div>
        <div *ngIf="!isLoading() && !organizations().length" class="p-12 text-center text-slate-600">No organizations.</div>
        <div *ngIf="!isLoading() && organizations().length" class="divide-y divide-slate-100">
          <div *ngFor="let parent of organizations()" class="p-6 hover:bg-slate-50 transition">
            <div class="flex justify-between">
              <div>
                <div class="flex items-center gap-3">
                  <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 font-semibold">P</span>
                  <h3 class="font-semibold text-slate-800 text-base">{{ parent.name }}</h3>
                  <span class="px-2 py-0.5 rounded-full text-xs" [ngClass]="parent.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">{{ parent.isActive?'Active':'Inactive' }}</span>
                  <span class="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700">Level 1</span>
                  <span *ngIf="parent.children?.length" class="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">{{ parent.children?.length }} Child{{ (parent.children?.length||0)>1?'ren':'' }}</span>
                </div>
                <p *ngIf="parent.description" class="mt-2 text-sm text-slate-600 max-w-xl">{{ parent.description }}</p>
                <div class="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>Created: {{ parent.createdAt | date:'short' }}</span>
                  <button class="text-blue-600 hover:text-blue-700" (click)="viewStats(parent)">Stats</button>
                  <button *ngIf="canUpdateOrgs()" class="text-indigo-600 hover:text-indigo-700" (click)="editOrganization(parent)">Edit</button>
                  <button *ngIf="canDeleteOrgs()" class="text-red-600 hover:text-red-700" (click)="deleteOrganization(parent)" [disabled]="parent.children?.length">Delete</button>
                  <button *ngIf="canCreateOrgs() && parent.children?.length===0" class="text-emerald-600 hover:text-emerald-700" (click)="startCreateChild(parent)">Add Child</button>
                </div>
              </div>
              <button *ngIf="parent.children?.length" (click)="parent.expanded = !parent.expanded" class="mt-1 text-slate-400 hover:text-slate-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path *ngIf="!parent.expanded" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/><path *ngIf="parent.expanded" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
            </div>
            <div *ngIf="parent.children?.length && parent.expanded" class="mt-6 ml-6 border-l border-slate-200 pl-6 space-y-4">
              <div *ngFor="let child of parent.children" class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div class="flex items-center gap-3">
                  <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 font-semibold">C</span>
                  <h4 class="font-medium text-slate-800 text-sm">{{ child.name }}</h4>
                  <span class="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">Level 2</span>
                  <span class="px-2 py-0.5 rounded-full text-xs" [ngClass]="child.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">{{ child.isActive?'Active':'Inactive' }}</span>
                </div>
                <p *ngIf="child.description" class="mt-2 text-xs text-slate-600">{{ child.description }}</p>
                <div class="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>Created: {{ child.createdAt | date:'short' }}</span>
                  <button class="text-blue-600 hover:text-blue-700" (click)="viewStats(child)">Stats</button>
                  <button *ngIf="canUpdateOrgs()" class="text-indigo-600 hover:text-indigo-700" (click)="editOrganization(child)">Edit</button>
                  <button *ngIf="canDeleteOrgs()" class="text-red-600 hover:text-red-700" (click)="deleteOrganization(child)">Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="selectedOrgStats()" class="mb-10 bg-white shadow rounded-2xl border border-slate-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between bg-gradient-to-r from-slate-50 to-slate-100"><h2 class="text-lg font-semibold text-slate-800">📊 {{ selectedOrgForStats()?.name }} Statistics</h2><button (click)="closeStats()" class="text-slate-400 hover:text-slate-600">✕</button></div>
        <div class="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let s of orgStatList()" class="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <p class="text-xs uppercase tracking-wide font-semibold text-slate-500">{{ s.label }}</p>
            <p class="mt-2 text-2xl font-bold text-slate-800">{{ s.value }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>`,
  styles: []
})
export class OrganizationManagementComponent implements OnInit {
  private orgService = inject(OrganizationService);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  organizations = signal<OrganizationNode[]>([]);
  parentOrganizations = signal<OrganizationResponse[]>([]);
  selectedOrgStats = signal<OrganizationStats | null>(null);
  selectedOrgForStats = signal<OrganizationResponse | null>(null);
  isLoading = signal(false);
  isSubmitting = signal(false);
  showCreateForm = false;
  editingOrganization = signal<OrganizationResponse | null>(null);
  message = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  organizationForm: FormGroup;
  selectedLevel = computed(() => this.organizationForm.get('level')?.value || '1');
  constructor() {
    this.organizationForm = this.fb.group({ name: ['', [Validators.required, Validators.minLength(2)]], description: [''], level: ['1', Validators.required], parentId: [''] });
  }
  ngOnInit(): void { this.loadHierarchy(); this.loadParentOrganizations(); }
  goBack() { this.router.navigate(['/dashboard']); }
  clearMessage() { this.message.set(null); }
  toggleCreateForm() { this.showCreateForm = !this.showCreateForm; if (!this.showCreateForm) this.cancelForm(); }
  canCreateOrgs() { return this.auth.hasPermission(PERMISSIONS.ORG_UPDATE) || this.auth.hasPermission(PERMISSIONS.ORG_READ); }
  canUpdateOrgs() { return this.auth.hasPermission(PERMISSIONS.ORG_UPDATE); }
  canDeleteOrgs() { return this.auth.hasPermission(PERMISSIONS.ORG_UPDATE); }
  orgStatList() { const s = this.selectedOrgStats(); return s ? [ { label: 'Total Users', value: s.totalUsers }, { label: 'Active Users', value: s.activeUsers }, { label: 'Total Tasks', value: s.totalTasks }, { label: 'Completed Tasks', value: s.completedTasks }, { label: 'Total Roles', value: s.totalRoles }, { label: 'Sub Orgs', value: s.subOrganizations } ] : []; }
  loadHierarchy() { this.isLoading.set(true); this.orgService.getHierarchy().subscribe({ next: data => { this.organizations.set(data.map(o => ({ ...o, expanded: true }))); this.isLoading.set(false); }, error: () => { this.message.set({ type: 'error', text: 'Failed to load organizations.' }); this.isLoading.set(false); } }); }
  loadParentOrganizations() { this.orgService.getParentOrganizations().subscribe({ next: d => this.parentOrganizations.set(d) }); }
  onLevelChange() { const lvl = this.organizationForm.get('level')?.value; const pid = this.organizationForm.get('parentId'); if (lvl === '2') pid?.setValidators([Validators.required]); else { pid?.clearValidators(); pid?.setValue(''); } pid?.updateValueAndValidity(); }
  startCreateChild(parent: OrganizationResponse) { this.showCreateForm = true; this.editingOrganization.set(null); this.organizationForm.reset({ name: '', description: '', level: '2', parentId: parent.id }); }
  onSubmit() { if (this.organizationForm.invalid) return; this.isSubmitting.set(true); const raw = { ...this.organizationForm.value }; if (raw.level === '1') delete raw.parentId; delete raw.level; const editing = this.editingOrganization(); (editing ? this.orgService.updateOrganization(editing.id, raw) : this.orgService.createOrganization(raw)).subscribe({ next: () => { this.message.set({ type: 'success', text: editing ? 'Organization updated.' : 'Organization created.' }); this.refreshHierarchy(); this.cancelForm(); }, error: () => { this.message.set({ type: 'error', text: editing ? 'Update failed.' : 'Creation failed.' }); this.isSubmitting.set(false); } }); }
  editOrganization(org: OrganizationResponse) { this.editingOrganization.set(org); this.showCreateForm = true; this.organizationForm.patchValue({ name: org.name, description: org.description || '', level: String(org.level), parentId: org.parentId || '' }); }
  deleteOrganization(org: OrganizationResponse) { if (!confirm(`Delete "${org.name}"?`)) return; this.orgService.deleteOrganization(org.id).subscribe({ next: () => { this.message.set({ type: 'success', text: 'Organization deleted.' }); this.refreshHierarchy(); }, error: () => this.message.set({ type: 'error', text: 'Delete failed.' }) }); }
  viewStats(org: OrganizationResponse) { this.selectedOrgForStats.set(org); this.orgService.getOrganizationStats(org.id).subscribe({ next: s => this.selectedOrgStats.set(s), error: () => this.message.set({ type: 'error', text: 'Failed to load statistics.' }) }); }
  closeStats() { this.selectedOrgStats.set(null); this.selectedOrgForStats.set(null); }
  cancelForm() { this.showCreateForm = false; this.editingOrganization.set(null); this.organizationForm.reset({ level: '1' }); this.isSubmitting.set(false); }
  refreshHierarchy() { this.loadHierarchy(); this.loadParentOrganizations(); this.closeStats(); }
}
