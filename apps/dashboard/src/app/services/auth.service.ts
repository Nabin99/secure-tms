import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginDto, AuthResponse } from '@secure-tms/data';
import { AuthContext, JwtPayload } from '@secure-tms/auth';

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
  private currentUserSubject = new BehaviorSubject<AuthContext['user'] | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenSubject = new BehaviorSubject<string | null>(this.getTokenFromStorage());

  constructor() {
    // Check if user is already logged in
    const token = this.getTokenFromStorage();
    const user = this.getUserFromStorage();
    
    console.log('AuthService constructor - token from localStorage:', token ? 'present' : 'none');
    console.log('AuthService constructor - user from localStorage:', user ? 'present' : 'none');
    
    if (token && !user) {
      console.log('AuthService constructor - have token but no user, calling loadProfile()');
      this.loadProfile();
    } else if (token && user) {
      console.log('AuthService constructor - have both token and user, ready to go');
    } else {
      console.log('AuthService constructor - no token or user, user needs to login');
    }
  }

  get currentUserValue(): AuthContext['user'] | null {
    return this.currentUserSubject.value;
  }

  get tokenValue(): string | null {
    return this.tokenSubject.value;
  }

  get isLoadingUser(): boolean {
    // When we have a token but no user, we're still loading
    return !!this.tokenValue && !this.currentUserValue;
  }

  login(credentials: LoginDto): Observable<AuthResponseExtended> {
    return this.http.post<AuthResponseExtended>('/api/auth/login', credentials)
      .pipe(
        tap(response => {
          // Store token
          this.saveTokenToStorage(response.access_token);
          this.tokenSubject.next(response.access_token);
          
          // Decode JWT to get permissions
          const tokenPayload = this.decodeJWT(response.access_token);
          
          // Create auth context user from response and JWT payload
          const authUser: AuthContext['user'] = {
            id: response.user.id,
            email: response.user.email,
            organizationId: response.user.organizationId,
            roleId: response.user.roleId,
            roleName: tokenPayload?.roleName || response.user.role?.name || 'Viewer',
            permissions: tokenPayload?.permissions || response.user.role?.permissions || []
          };
          
          this.currentUserSubject.next(authUser);
          this.saveUserToStorage(authUser);
        })
      );
  }

  logout(): void {
    this.removeTokenFromStorage();
    this.removeUserFromStorage();
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.tokenValue && (!!this.currentUserValue || this.isLoadingUser);
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
    console.log('loadProfile() called');
    this.http.post<AuthContext['user']>('/api/auth/profile', {})
      .subscribe({
        next: (user) => {
          console.log('Profile loaded successfully:', user);
          this.currentUserSubject.next(user);
          this.saveUserToStorage(user);
        },
        error: (error) => {
          console.error('Failed to load user profile:', error);
          console.log('Error status:', error.status);
          console.log('Error message:', error.message);
          this.logout();
        }
      });
  }

  private getTokenFromStorage(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private saveTokenToStorage(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  private removeTokenFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private getUserFromStorage(): AuthContext['user'] | null {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
          localStorage.removeItem('user');
        }
      }
    }
    return null;
  }

  private saveUserToStorage(user: AuthContext['user']): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  private removeUserFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('user');
    }
  }

  private decodeJWT(token: string): JwtPayload | null {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded) as JwtPayload;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }
}
