import { Route } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'audit-log',
    loadComponent: () => import('./components/audit-log-page.component').then(m => m.AuditLogPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./components/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
