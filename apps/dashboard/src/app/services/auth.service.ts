import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginDto, AuthResponse } from '@secure-tms/data';
import { AuthContext } from '@secure-tms/auth';

interface AuthResponseExtended extends AuthResponse {
  user: AuthResponse['user'] & {
    role?: {
      name: 'Owner' | 'Admin' | 'Viewer';
      permissions: string[];
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private currentUserSubject = new BehaviorSubject<AuthContext['user'] | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('token'));

  constructor() {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      this.loadProfile();
    }
  }

  get currentUserValue(): AuthContext['user'] | null {
    return this.currentUserSubject.value;
  }

  get tokenValue(): string | null {
    return this.tokenSubject.value;
  }

  login(credentials: LoginDto): Observable<AuthResponseExtended> {
    return this.http.post<AuthResponseExtended>('/api/auth/login', credentials)
      .pipe(
        tap(response => {
          // Store token and user data
          localStorage.setItem('token', response.access_token);
          this.tokenSubject.next(response.access_token);
          
          // Create auth context user from response
          const authUser: AuthContext['user'] = {
            id: response.user.id,
            email: response.user.email,
            organizationId: response.user.organizationId,
            roleId: response.user.roleId,
            roleName: response.user.role?.name || 'Viewer',
            permissions: response.user.role?.permissions || []
          };
          
          this.currentUserSubject.next(authUser);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.tokenValue && !!this.currentUserValue;
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserValue;
    return user?.permissions.includes(permission) || false;
  }

  hasAnyPermission(permissions: string[]): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  }

  private loadProfile(): void {
    this.http.post<AuthContext['user']>('/api/auth/profile', {})
      .subscribe({
        next: (user) => {
          this.currentUserSubject.next(user);
        },
        error: () => {
          this.logout();
        }
      });
  }
}
