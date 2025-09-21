import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Clear any invalid/expired tokens and redirect to login
  authService.logout();
  return false;
};

export const permissionGuard = (permissions: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);

    if (!authService.isAuthenticated()) {
      authService.logout();
      return false;
    }

    if (authService.hasAnyPermission(permissions)) {
      return true;
    }

    // User doesn't have required permissions, stay on current page
    return false;
  };
};
