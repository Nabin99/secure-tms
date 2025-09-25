import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, UserResponse } from '@secure-tms/data';

export interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  /**
   * Get all users in the current organization
   */
  getUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>('/api/users');
  }

  /**
   * Get users for task assignment (simplified format)
   */
  getUserOptions(): Observable<UserOption[]> {
    return this.http.get<UserOption[]>('/api/users');
  }

  /**
   * Get a specific user by ID
   */
  getUser(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`/api/users/${id}`);
  }

  /**
   * Create a new user
   */
  createUser(userData: Omit<CreateUserDto, 'organizationId'>): Observable<UserResponse> {
    return this.http.post<UserResponse>('/api/users', userData);
  }

  /**
   * Update a user
   */
  updateUser(id: string, userData: UpdateUserDto): Observable<UserResponse> {
    return this.http.put<UserResponse>(`/api/users/${id}`, userData);
  }

  /**
   * Delete (deactivate) a user
   */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`/api/users/${id}`);
  }

  /**
   * Change user password
   */
  changePassword(id: string, passwordData: ChangePasswordDto): Observable<void> {
    return this.http.put<void>(`/api/users/${id}/password`, passwordData);
  }

  /**
   * Get current user's profile
   */
  getProfile(): Observable<UserResponse> {
    return this.http.get<UserResponse>('/api/users/profile/me');
  }

  /**
   * Update current user's profile
   */
  updateProfile(profileData: Pick<UpdateUserDto, 'firstName' | 'lastName' | 'email'>): Observable<UserResponse> {
    return this.http.put<UserResponse>('/api/users/profile/me', profileData);
  }
}
