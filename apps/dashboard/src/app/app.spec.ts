import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AppComponent } from './app';
import { AuthService } from './services/auth.service';

describe('AppComponent', () => {
  let mockAuthService: Partial<AuthService>;
  let mockRouter: Partial<Router>;

  beforeEach(async () => {
    mockAuthService = {
      isAuthenticated: jest.fn(),
      getCurrentUser: jest.fn(),
      login: jest.fn(),
      logout: jest.fn()
    };

    mockRouter = {
      navigate: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should redirect to login when not authenticated', () => {
    (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(false);
    Object.defineProperty(window, 'location', {
      value: { pathname: '/dashboard' },
      writable: true
    });

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should not redirect when already authenticated', () => {
    (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
    
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
