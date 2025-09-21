import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, AuthResponse } from '@secure-tms/data';
import { CurrentUser } from './current-user.decorator';
import { AuthContext } from '@secure-tms/auth';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Post('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@CurrentUser() user: AuthContext['user']) {
    return user;
  }
}
