import { Component, inject, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    // Redirect to login if not authenticated and not already on login page
    if (!this.authService.isAuthenticated() && !window.location.pathname.includes('/login')) {
      this.router.navigate(['/login']);
    }
  }
}
