import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, timer } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private authService = inject(AuthService);
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
  
  private sessionStartTime = 0;
  private sessionTimeoutSubject = new BehaviorSubject<boolean>(false);
  public sessionTimeout$ = this.sessionTimeoutSubject.asObservable();

  startSession(): void {
    this.sessionStartTime = Date.now();
    this.sessionTimeoutSubject.next(false);
    this.startSessionTimer();
  }

  extendSession(): void {
    this.sessionStartTime = Date.now();
    this.sessionTimeoutSubject.next(false);
  }

  endSession(): void {
    this.sessionStartTime = 0;
    this.sessionTimeoutSubject.next(false);
  }

  private startSessionTimer(): void {
    // Check session every minute
    timer(0, 60000)
      .pipe(
        takeWhile(() => this.authService.isAuthenticated()),
        map(() => {
          const now = Date.now();
          const elapsed = now - this.sessionStartTime;
          return elapsed;
        })
      )
      .subscribe(elapsed => {
        // If session exceeded timeout, logout
        if (elapsed >= this.SESSION_TIMEOUT) {
          this.authService.logout();
        }
        // If within warning period, show warning
        else if (elapsed >= (this.SESSION_TIMEOUT - this.WARNING_TIME)) {
          this.sessionTimeoutSubject.next(true);
        }
      });
  }

  getRemainingTime(): number {
    if (!this.sessionStartTime) return 0;
    const elapsed = Date.now() - this.sessionStartTime;
    return Math.max(0, this.SESSION_TIMEOUT - elapsed);
  }

  isSessionWarning(): boolean {
    const remaining = this.getRemainingTime();
    return remaining > 0 && remaining <= this.WARNING_TIME;
  }
}
