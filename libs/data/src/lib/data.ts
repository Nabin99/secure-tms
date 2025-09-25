// User entity
export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  roleId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Organization entity (2-level hierarchy)
export interface Organization {
  id: string;
  name: string;
  parentId?: string; // For 2-level hierarchy
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Role entity
export interface Role {
  id: string;
  name: 'Owner' | 'Admin' | 'Viewer';
  description: string;
  permissions: string[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Task entity
export interface Task {
  id: string;
  title: string;
  description?: string;
  category: 'Work' | 'Personal' | 'Other';
  status: 'Todo' | 'InProgress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: Date;
  assignedUserId: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Audit Log entity
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  organizationId: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// DTOs for API
export interface CreateTaskDto {
  title: string;
  description?: string;
  category: 'Work' | 'Personal' | 'Other';
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: Date;
  assignedUserId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  category?: 'Work' | 'Personal' | 'Other';
  status?: 'Todo' | 'InProgress' | 'Done';
  priority?: 'Low' | 'Medium' | 'High';
  dueDate?: Date;
  assignedUserId?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  roleId: string;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  organization?: {
    id: string;
    name: string;
  };
  role?: {
    id: string;
    name: string;
    description: string;
  };
}

// Response DTOs
export interface AuthResponse {
  access_token: string;
  user: Omit<User, 'password'>;
}

export interface TaskResponse extends Omit<Task, 'createdBy'> {
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
