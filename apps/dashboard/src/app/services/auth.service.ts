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
    organization?: {
      id: string;
      name: string;
    };
  };
}

interface ProfileResponse {
  id: string;
  email: string;
  organizationId: string;
  roleId: string;
  roleName?: string;
  permissions?: string[];
  role?: {
    name: string;
    permissions: string[];
  };
  organization?: {
    id: string;
    name: string;
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
  private tokenSubject = new BehaviorSubject<string | null>(this.getTokenFromStorage());

  constructor() {
    // Clean up any existing user data from localStorage (security improvement)
    this.cleanupDeprecatedUserStorage();
    
    // Check if user has a valid token
    const token = this.getTokenFromStorage();
    
    console.log('AuthService constructor - token from localStorage:', token ? 'present' : 'none');
    
    if (token) {
      // Check if token is expired before using it
      if (this.isTokenExpired(token)) {
        console.log('AuthService constructor - token is expired, removing it');
        this.removeTokenFromStorage();
        return;
      }
      
      console.log('AuthService constructor - token found and valid, setting token and loading user profile from API');
      // Ensure token is set in the BehaviorSubject before making API calls
      this.tokenSubject.next(token);
      // Use setTimeout to ensure the token is available to the interceptor
      setTimeout(() => {
        this.loadProfile();
      }, 0);
    } else {
      console.log('AuthService constructor - no token, user needs to login');
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
          // Store only the JWT token
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
            permissions: tokenPayload?.permissions || response.user.role?.permissions || [],
            organizationName: response.user.organization?.name
          };
          
          // Store user data only in memory (BehaviorSubject)
          this.currentUserSubject.next(authUser);
        })
      );
  }

  logout(): void {
    this.removeTokenFromStorage();
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
    console.log('loadProfile() called - current token:', this.tokenValue ? 'present' : 'none');
    
    if (!this.tokenValue) {
      console.log('loadProfile() - no token available, logging out');
      this.logout();
      return;
    }
    
    this.http.get<ProfileResponse>('/api/users/profile/me')
      .subscribe({
        next: (user) => {
          console.log('Profile loaded successfully:', user);
          // Transform the API response to match AuthContext user structure
          const authUser: AuthContext['user'] = {
            id: user.id,
            email: user.email,
            organizationId: user.organizationId,
            roleId: user.roleId,
            roleName: (user.roleName || user.role?.name || 'Viewer') as 'Owner' | 'Admin' | 'Viewer',
            permissions: user.permissions || user.role?.permissions || [],
            organizationName: user.organization?.name
          };
          
          // Store user data only in memory (BehaviorSubject)
          this.currentUserSubject.next(authUser);
        },
        error: (error) => {
          console.error('Failed to load user profile:', error);
          console.log('Error status:', error.status);
          console.log('Error message:', error.message);
          console.log('Current token when error occurred:', this.tokenValue ? 'present' : 'none');
          
          // If it's a 401 Unauthorized, the token is invalid
          if (error.status === 401) {
            console.log('401 Unauthorized - token is invalid, logging out');
          } else {
            console.log('Profile load failed with status:', error.status);
          }
          
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

  private cleanupDeprecatedUserStorage(): void {
    // Remove any existing user data from localStorage for security
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

  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeJWT(token);
      if (!payload || !payload.exp) {
        return true;
      }
      
      // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < currentTime;
      
      console.log('Token expiration check:', {
        exp: payload.exp,
        now: currentTime,
        expired: isExpired,
        expiresAt: new Date(payload.exp * 1000).toISOString()
      });
      
      return isExpired;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // If we can't decode it, consider it expired
    }
  }
}
