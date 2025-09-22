import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
   * Get all users in the current organization for task assignment
   */
  getUsers(): Observable<UserOption[]> {
    return this.http.get<UserOption[]>('/api/users');
  }
}
