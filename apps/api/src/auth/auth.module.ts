import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PermissionsGuard } from './permissions.guard';
import { User, Role } from '../entities';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    TypeOrmModule.forFeature([User, Role]),
  ],
  providers: [AuthService, JwtStrategy, PermissionsGuard],
  controllers: [AuthController],
  exports: [AuthService, PermissionsGuard],
})
export class AuthModule {}
