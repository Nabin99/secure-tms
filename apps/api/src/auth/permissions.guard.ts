import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthContext, hasAnyPermission } from '@secure-tms/auth';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => 
  Reflector.createDecorator<string[]>({ key: PERMISSIONS_KEY })(permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthContext['user'] = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    const hasRequiredPermissions = hasAnyPermission(user.permissions, requiredPermissions);
    
    if (!hasRequiredPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
