import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, filter, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('AuthGuard: Checking authentication');
  console.log('AuthGuard: Token present:', !!authService.tokenValue);
  console.log('AuthGuard: User present:', !!authService.currentUserValue);
  console.log('AuthGuard: Is loading user:', authService.isLoadingUser);

  // If no token, redirect to login immediately
  if (!authService.tokenValue) {
    console.log('AuthGuard: No token, redirecting to login');
    router.navigate(['/login']);
    return false;
  }

  // If we have both token and user (in memory), allow access immediately
  if (authService.tokenValue && authService.currentUserValue) {
    console.log('AuthGuard: Have both token and user, allowing access');
    return true;
  }

  // If we have a token but no user yet (still loading), wait for user to load
  if (authService.isLoadingUser) {
    console.log('AuthGuard: User is loading, waiting...');
    return authService.currentUser$.pipe(
      filter(user => user !== null || !authService.tokenValue), // Wait until user is loaded OR token is cleared
      take(1),
      map(user => {
        console.log('AuthGuard: User loaded after waiting:', !!user);
        console.log('AuthGuard: Token still present after waiting:', !!authService.tokenValue);
        if (user && authService.tokenValue) {
          return true;
        } else {
          console.log('AuthGuard: No user after loading or token cleared, redirecting to login');
          router.navigate(['/login']);
          return false;
        }
      })
    );
  }

  // If we have a token but no user and not loading, something went wrong
  console.log('AuthGuard: Have token but no user and not loading, redirecting to login');
  router.navigate(['/login']);
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
