// Permission constants
export const PERMISSIONS = {
  // Task permissions
  TASK_CREATE: 'task:create',
  TASK_READ: 'task:read',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',
  TASK_READ_ALL: 'task:read:all', // Can read all tasks in org (or parent+children if owner at parent)
  TASK_ASSIGN: 'task:assign', // Can assign tasks to other users
  
  // User permissions
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Organization permissions
  ORG_READ: 'org:read',
  ORG_UPDATE: 'org:update',
  
  // Audit permissions
  AUDIT_READ: 'audit:read',
} as const;

// Role permission mapping aligned to new requirements:
// Owner: Full CRUD + audit, can operate across parent + children (cross-org logic enforced in services)
// Admin: CRUD only within own org (no org CRUD operations, only read)
// Viewer: Read-only tasks in own org
export const ROLE_PERMISSIONS = {
  Owner: [
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_READ_ALL,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.ORG_READ,
    PERMISSIONS.ORG_UPDATE,
    PERMISSIONS.AUDIT_READ,
  ],
  Admin: [
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_READ_ALL,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.ORG_READ,
  ],
  Viewer: [
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_READ_ALL,
  ],
} as const;

// JWT payload interface
export interface JwtPayload {
  sub: string; // user id
  email: string;
  organizationId: string;
  roleId: string;
  roleName: 'Owner' | 'Admin' | 'Viewer';
  permissions: string[];
  iat?: number;
  exp?: number;
}

// Auth context for guards/decorators
export interface AuthContext {
  user: {
    id: string;
    email: string;
    organizationId: string;
    roleId: string;
    roleName: 'Owner' | 'Admin' | 'Viewer';
    permissions: string[];
    organizationName?: string;
  };
}

// Helper functions
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

export function canAccessResource(
  userOrgId: string,
  resourceOrgId: string,
  userRole: 'Owner' | 'Admin' | 'Viewer',
  isOwner = false
): boolean {
  // Must be in same organization
  if (userOrgId !== resourceOrgId) {
    return false;
  }
  
  // Owners and Admins can access all resources in their org
  if (userRole === 'Owner' || userRole === 'Admin') {
    return true;
  }
  
  // Viewers can only access their own resources
  return isOwner;
}
