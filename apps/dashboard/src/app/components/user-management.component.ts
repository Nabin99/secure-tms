import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../services/user.service';
import { RoleService, RoleResponse } from '../services/role.service';
import { AuthService } from '../services/auth.service';
import { UserResponse, CreateUserDto, UpdateUserDto } from '@secure-tms/data';
import { PERMISSIONS } from '@secure-tms/auth';
import { ConfirmationModalComponent } from './confirmation-modal.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ConfirmationModalComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <!-- Navigation -->
      <nav class="bg-white shadow-lg border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center space-x-4">
              <button
                (click)="goBack()"
                class="inline-flex items-center px-4 py-2 border border-slate-200 rounded-xl shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Dashboard
              </button>
              <div class="hidden sm:block w-px h-6 bg-slate-200"></div>
              <h1 class="text-xl font-bold text-slate-900 flex items-center">
                👥
                <span class="ml-2">User Management</span>
              </h1>
            </div>
            @if (canCreateUsers()) {
              <div class="flex items-center">
                <button
                  (click)="showCreateForm = !showCreateForm"
                  [class]="showCreateForm 
                    ? 'inline-flex items-center px-6 py-2 border border-slate-300 text-sm font-medium rounded-xl shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200'
                    : 'inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200'"
                >
                  @if (showCreateForm) {
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Cancel
                  } @else {
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add User
                  }
                </button>
              </div>
            }
          </div>
        </div>
      </nav>

      <!-- Main content -->
      <div class="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
      <!-- Create User Form -->
      @if (showCreateForm && canCreateUsers()) {
        <div class="mb-8 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <!-- Form Header with Modern Gradient -->
          <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5">
            <h3 class="text-xl font-bold text-white flex items-center">
              👤
              <span class="ml-2">Add New User</span>
            </h3>
            <p class="mt-2 text-blue-100">
              Create a new user account with appropriate role and permissions.
            </p>
          </div>

          <!-- Form Content -->
          <div class="p-6">
            <form [formGroup]="createUserForm" (ngSubmit)="createUser()" class="space-y-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <!-- First Name -->
                <div>
                  <label for="firstName" class="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    👤 <span class="ml-2">First Name</span> <span class="text-red-500 ml-1">*</span>
                  </label>
                  <div class="relative">
                    <input
                      type="text"
                      id="firstName"
                      formControlName="firstName"
                      class="block w-full px-4 py-3 text-slate-900 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all duration-200 sm:text-sm"
                      [class.border-red-300]="createUserForm.get('firstName')?.invalid && createUserForm.get('firstName')?.touched"
                      [class.focus:ring-red-500]="createUserForm.get('firstName')?.invalid && createUserForm.get('firstName')?.touched"
                      placeholder="Enter first name..."
                    />
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span class="text-slate-400">✏️</span>
                    </div>
                  </div>
                  @if (createUserForm.get('firstName')?.invalid && createUserForm.get('firstName')?.touched) {
                    <p class="mt-2 text-sm text-red-600 flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                      </svg>
                      First name is required
                    </p>
                  }
                </div>

                <!-- Last Name -->
                <div>
                  <label for="lastName" class="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    👤 <span class="ml-2">Last Name</span> <span class="text-red-500 ml-1">*</span>
                  </label>
                  <div class="relative">
                    <input
                      type="text"
                      id="lastName"
                      formControlName="lastName"
                      class="block w-full px-4 py-3 text-slate-900 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all duration-200 sm:text-sm"
                      [class.border-red-300]="createUserForm.get('lastName')?.invalid && createUserForm.get('lastName')?.touched"
                      [class.focus:ring-red-500]="createUserForm.get('lastName')?.invalid && createUserForm.get('lastName')?.touched"
                      placeholder="Enter last name..."
                    />
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span class="text-slate-400">✏️</span>
                    </div>
                  </div>
                  @if (createUserForm.get('lastName')?.invalid && createUserForm.get('lastName')?.touched) {
                    <p class="mt-2 text-sm text-red-600 flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                      </svg>
                      Last name is required
                    </p>
                  }
                </div>

                <!-- Email -->
                <div class="sm:col-span-2">
                  <label for="email" class="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    📧 <span class="ml-2">Email Address</span> <span class="text-red-500 ml-1">*</span>
                  </label>
                  <div class="relative">
                    <input
                      type="email"
                      id="email"
                      formControlName="email"
                      class="block w-full px-4 py-3 text-slate-900 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all duration-200 sm:text-sm"
                      [class.border-red-300]="createUserForm.get('email')?.invalid && createUserForm.get('email')?.touched"
                      [class.focus:ring-red-500]="createUserForm.get('email')?.invalid && createUserForm.get('email')?.touched"
                      placeholder="user@example.com"
                    />
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span class="text-slate-400">✉️</span>
                    </div>
                  </div>
                  @if (createUserForm.get('email')?.invalid && createUserForm.get('email')?.touched) {
                    <p class="mt-2 text-sm text-red-600 flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                      </svg>
                      Please enter a valid email address
                    </p>
                  }
                </div>

                <!-- Password -->
                <div>
                  <label for="password" class="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    🔒 <span class="ml-2">Password</span> <span class="text-red-500 ml-1">*</span>
                  </label>
                  <div class="relative">
                    <input
                      type="password"
                      id="password"
                      formControlName="password"
                      class="block w-full px-4 py-3 text-slate-900 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all duration-200 sm:text-sm"
                      [class.border-red-300]="createUserForm.get('password')?.invalid && createUserForm.get('password')?.touched"
                      [class.focus:ring-red-500]="createUserForm.get('password')?.invalid && createUserForm.get('password')?.touched"
                      placeholder="Enter secure password..."
                    />
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span class="text-slate-400">🔐</span>
                    </div>
                  </div>
                  @if (createUserForm.get('password')?.invalid && createUserForm.get('password')?.touched) {
                    <p class="mt-2 text-sm text-red-600 flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                      </svg>
                      Password must be at least 8 characters
                    </p>
                  }
                </div>

                <!-- Role -->
                <div>
                  <label for="roleId" class="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    🎭 <span class="ml-2">Role</span> <span class="text-red-500 ml-1">*</span>
                  </label>
                  <div class="relative">
                    <select
                      id="roleId"
                      formControlName="roleId"
                      class="block w-full px-4 py-3 text-slate-900 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all duration-200 sm:text-sm appearance-none"
                      [class.border-red-300]="createUserForm.get('roleId')?.invalid && createUserForm.get('roleId')?.touched"
                      [class.focus:ring-red-500]="createUserForm.get('roleId')?.invalid && createUserForm.get('roleId')?.touched"
                    >
                      <option value="">Select a role...</option>
                      @for (role of availableRoles; track role.id) {
                        <option [value]="role.id">{{ role.name }} - {{ role.description }}</option>
                      }
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg class="w-5 h-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                      </svg>
                    </div>
                  </div>
                  @if (createUserForm.get('roleId')?.invalid && createUserForm.get('roleId')?.touched) {
                    <p class="mt-2 text-sm text-red-600 flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                      </svg>
                      Please select a role
                    </p>
                  }
                </div>
              </div>

              <!-- Form Actions -->
              <div class="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  (click)="showCreateForm = false"
                  class="inline-flex items-center px-6 py-3 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="createUserForm.invalid || isCreating"
                  class="inline-flex items-center px-8 py-3 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  @if (isCreating) {
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  } @else {
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Create User
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Users List -->
      <div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <!-- List Header -->
        <div class="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <h3 class="text-lg font-bold text-slate-900 flex items-center">
                👥
                <span class="ml-2">Team Members</span>
              </h3>
              <span class="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {{ users.length }} {{ users.length === 1 ? 'User' : 'Users' }}
              </span>
            </div>
          </div>
        </div>

        @if (isLoading) {
          <div class="px-6 py-16 text-center">
            <div class="inline-flex flex-col items-center">
              <svg class="animate-spin h-8 w-8 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="text-slate-600 font-medium">Loading team members...</p>
            </div>
          </div>
        } @else if (users.length === 0) {
          <div class="px-6 py-16 text-center">
            <div class="flex flex-col items-center">
              <div class="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg class="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-slate-900 mb-2">No team members yet</h3>
              <p class="text-slate-500 mb-6 max-w-sm">Get started by adding your first team member to begin collaborating.</p>
              @if (canCreateUsers()) {
                <button
                  (click)="showCreateForm = true"
                  class="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Add First User
                </button>
              }
            </div>
          </div>
        } @else {
          <div class="divide-y divide-slate-100">
            @for (user of users; track user.id) {
              <div class="p-6 hover:bg-slate-50 transition-colors duration-150">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    <!-- User Avatar -->
                    <div class="flex-shrink-0">
                      <div class="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}
                      </div>
                    </div>
                    
                    <!-- User Info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center space-x-3 mb-1">
                        <p class="text-lg font-semibold text-slate-900 truncate">
                          {{ user.firstName }} {{ user.lastName }}
                        </p>
                        @if (!user.isActive) {
                          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                            🚫 Inactive
                          </span>
                        } @else {
                          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                            ✅ Active
                          </span>
                        }
                      </div>
                      <div class="flex items-center space-x-4 text-sm text-slate-600">
                        <span class="flex items-center">
                          📧 {{ user.email }}
                        </span>
                        <span class="flex items-center">
                          🎭 {{ user.roleName }}
                        </span>
                        @if (user.createdAt) {
                          <span class="flex items-center">
                            📅 {{ user.createdAt | date:'MMM d, y' }}
                          </span>
                        }
                      </div>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  @if (canUpdateUsers() || canDeactivateUsers() || canDeleteUsers()) {
                    <div class="flex items-center space-x-2">
                      @if (canUpdateUsers()) {
                        <button
                          (click)="editUser(user)"
                          class="inline-flex items-center p-2 border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                          title="Edit user"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                      }
                      @if (canDeactivateUsers()) {
                        <button
                          (click)="toggleUserStatus(user)"
                          [class]="user.isActive 
                            ? 'inline-flex items-center p-2 border border-slate-200 rounded-lg text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-150'
                            : 'inline-flex items-center p-2 border border-slate-200 rounded-lg text-slate-600 hover:text-green-600 hover:border-green-300 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-150'"
                          [title]="user.isActive ? 'Deactivate user' : 'Activate user'"
                        >
                          @if (user.isActive) {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
                            </svg>
                          } @else {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          }
                        </button>
                      }
                      @if (canDeleteUsers() && user.id !== currentUser?.id) {
                        <button
                          (click)="deleteUser(user)"
                          class="inline-flex items-center p-2 border border-slate-200 rounded-lg text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-150"
                          title="Delete user"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- Edit User Modal -->
    @if (showEditModal && selectedUser) {
      <div class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div class="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
          <!-- Modal Header -->
          <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold text-white flex items-center">
                ✏️
                <span class="ml-2">Edit User</span>
              </h3>
              <button
                (click)="closeEditModal()"
                class="text-white hover:text-slate-200 focus:outline-none"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <p class="mt-2 text-blue-100">
              Update user information and permissions.
            </p>
          </div>

          <!-- Modal Content -->
          <div class="p-6">
            <form [formGroup]="editUserForm" (ngSubmit)="updateUser()" class="space-y-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <!-- First Name -->
                <div>
                  <label for="editFirstName" class="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    👤 <span class="ml-2">First Name</span>
                  </label>
                  <div class="relative">
                    <input
                      type="text"
                      id="editFirstName"
                      formControlName="firstName"
                      class="block w-full px-4 py-3 text-slate-900 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all duration-200 sm:text-sm"
                      placeholder="Enter first name..."
                    />
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span class="text-slate-400">✏️</span>
                    </div>
                  </div>
                </div>

                <!-- Last Name -->
                <div>
                  <label for="editLastName" class="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    👤 <span class="ml-2">Last Name</span>
                  </label>
                  <div class="relative">
                    <input
                      type="text"
                      id="editLastName"
                      formControlName="lastName"
                      class="block w-full px-4 py-3 text-slate-900 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all duration-200 sm:text-sm"
                      placeholder="Enter last name..."
                    />
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span class="text-slate-400">✏️</span>
                    </div>
                  </div>
                </div>

                <!-- Email -->
                <div class="sm:col-span-2">
                  <label for="editEmail" class="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    📧 <span class="ml-2">Email Address</span>
                  </label>
                  <div class="relative">
                    <input
                      type="email"
                      id="editEmail"
                      formControlName="email"
                      class="block w-full px-4 py-3 text-slate-900 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all duration-200 sm:text-sm"
                      placeholder="user@example.com"
                    />
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span class="text-slate-400">✉️</span>
                    </div>
                  </div>
                </div>

                <!-- Role -->
                <div>
                  <label for="editRoleId" class="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    🎭 <span class="ml-2">Role</span>
                  </label>
                  <div class="relative">
                    <select
                      id="editRoleId"
                      formControlName="roleId"
                      class="block w-full px-4 py-3 text-slate-900 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all duration-200 sm:text-sm appearance-none"
                    >
                      @for (role of availableRoles; track role.id) {
                        <option [value]="role.id">{{ role.name }} - {{ role.description }}</option>
                      }
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg class="w-5 h-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Active Status -->
                <div class="flex items-center">
                  <div class="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      id="editIsActive"
                      formControlName="isActive"
                      class="h-5 w-5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                    />
                    <label for="editIsActive" class="block text-sm font-medium text-slate-900 flex items-center">
                      ✅ <span class="ml-2">Active User</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  (click)="closeEditModal()"
                  class="inline-flex items-center px-6 py-3 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="editUserForm.invalid || isUpdating"
                  class="inline-flex items-center px-8 py-3 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  @if (isUpdating) {
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  } @else {
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Update User
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- Confirmation Modal for Delete -->
    <app-confirmation-modal
      [isOpen]="showDeleteConfirmation"
      title="Delete User"
      [message]="deleteConfirmationMessage"
      type="danger"
      confirmText="Delete User"
      cancelText="Cancel"
      (confirmed)="confirmDelete()"
      (cancelled)="cancelDelete()"
    ></app-confirmation-modal>

    <!-- Confirmation Modal for Status Toggle -->
    <app-confirmation-modal
      [isOpen]="showStatusConfirmation"
      [title]="statusToggleTitle"
      [message]="statusToggleMessage"
      type="warning"
      [confirmText]="statusToggleConfirmText"
      cancelText="Cancel"
      (confirmed)="confirmStatusToggle()"
      (cancelled)="cancelStatusToggle()"
    ></app-confirmation-modal>
    </div>
  `
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private authService = inject(AuthService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);

  users: UserResponse[] = [];
  availableRoles: RoleResponse[] = [];
  isLoading = true;
  showCreateForm = false;
  showEditModal = false;
  selectedUser: UserResponse | null = null;
  isCreating = false;
  isUpdating = false;

  // Modal properties
  showDeleteConfirmation = false;
  showStatusConfirmation = false;
  userToDelete: UserResponse | null = null;
  userToToggle: UserResponse | null = null;

  currentUser = this.authService.currentUserValue;

  createUserForm: FormGroup = this.formBuilder.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    roleId: ['', Validators.required]
  });

  editUserForm: FormGroup = this.formBuilder.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    roleId: ['', Validators.required],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadUsers();
    this.loadAvailableRoles();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      }
    });
  }

  loadAvailableRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.availableRoles = roles;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        // Fallback to basic roles if API fails
        this.availableRoles = [];
      }
    });
  }

  createUser(): void {
    if (this.createUserForm.valid) {
      this.isCreating = true;
      const userData = this.createUserForm.value as Omit<CreateUserDto, 'organizationId'>;
      
      this.userService.createUser(userData).subscribe({
        next: (newUser) => {
          this.users.unshift(newUser);
          this.createUserForm.reset();
          this.showCreateForm = false;
          this.isCreating = false;
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.isCreating = false;
        }
      });
    }
  }

  editUser(user: UserResponse): void {
    this.selectedUser = user;
    this.editUserForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: user.roleId,
      isActive: user.isActive
    });
    this.showEditModal = true;
  }

  updateUser(): void {
    if (this.editUserForm.valid && this.selectedUser) {
      this.isUpdating = true;
      const updateData = this.editUserForm.value as UpdateUserDto;
      
      this.userService.updateUser(this.selectedUser.id, updateData).subscribe({
        next: (updatedUser) => {
          const index = this.users.findIndex(u => u.id === updatedUser.id);
          if (index !== -1) {
            this.users[index] = updatedUser;
          }
          this.closeEditModal();
          this.isUpdating = false;
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.isUpdating = false;
        }
      });
    }
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedUser = null;
    this.editUserForm.reset();
  }

  toggleUserStatus(user: UserResponse): void {
    this.userToToggle = user;
    this.showStatusConfirmation = true;
  }

  confirmStatusToggle(): void {
    if (!this.userToToggle) return;

    const user = this.userToToggle;
    const updateData: UpdateUserDto = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: user.roleId,
      isActive: !user.isActive
    };

    this.userService.updateUser(user.id, updateData).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.showStatusConfirmation = false;
        this.userToToggle = null;
      },
      error: (error) => {
        console.error('Error updating user status:', error);
        this.showStatusConfirmation = false;
        this.userToToggle = null;
      }
    });
  }

  cancelStatusToggle(): void {
    this.showStatusConfirmation = false;
    this.userToToggle = null;
  }

  deleteUser(user: UserResponse): void {
    this.userToDelete = user;
    this.showDeleteConfirmation = true;
  }

  confirmDelete(): void {
    if (!this.userToDelete) return;

    this.userService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== this.userToDelete?.id);
        this.showDeleteConfirmation = false;
        this.userToDelete = null;
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.showDeleteConfirmation = false;
        this.userToDelete = null;
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.userToDelete = null;
  }

  // Getter methods for modal content
  get deleteConfirmationMessage(): string {
    return this.userToDelete 
      ? `Are you sure you want to delete ${this.userToDelete.firstName} ${this.userToDelete.lastName}? This action cannot be undone.`
      : '';
  }

  get statusToggleTitle(): string {
    if (!this.userToToggle) return '';
    return this.userToToggle.isActive ? '⏸️ Deactivate User' : '▶️ Activate User';
  }

  get statusToggleMessage(): string {
    if (!this.userToToggle) return '';
    const action = this.userToToggle.isActive ? 'deactivate' : 'activate';
    return `Are you sure you want to ${action} ${this.userToToggle.firstName} ${this.userToToggle.lastName}?`;
  }

  get statusToggleConfirmText(): string {
    if (!this.userToToggle) return '';
    return this.userToToggle.isActive ? 'Deactivate' : 'Activate';
  }

  canCreateUsers(): boolean {
    return this.authService.hasPermission(PERMISSIONS.USER_CREATE);
  }

  canUpdateUsers(): boolean {
    return this.authService.hasPermission(PERMISSIONS.USER_UPDATE);
  }

  canDeleteUsers(): boolean {
    return this.authService.hasPermission(PERMISSIONS.USER_DELETE);
  }

  canDeactivateUsers(): boolean {
    return this.authService.hasPermission(PERMISSIONS.USER_UPDATE);
  }
}
