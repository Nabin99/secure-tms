import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RoleResponse {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private http = inject(HttpClient);

  /**
   * Get all global roles (same as getAccessibleRoles - kept for backward compatibility)
   */
  getRoles(): Observable<RoleResponse[]> {
    return this.http.get<RoleResponse[]>('/api/roles');
  }

  /**
   * Get all global roles accessible to any user
   */
  getAccessibleRoles(): Observable<RoleResponse[]> {
    return this.http.get<RoleResponse[]>('/api/roles/accessible');
  }

  /**
   * Get a specific role by ID
   */
  getRole(id: string): Observable<RoleResponse> {
    return this.http.get<RoleResponse>(`/api/roles/${id}`);
  }
}
