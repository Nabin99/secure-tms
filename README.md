# Secure Task Management System (TMS)

A comprehensive task management system built with **NX Monorepo**, **Angular**, **NestJS**, and **SQLite**, featuring robust role-based access control (RBAC) and organization-level data isolation.

## � Features

### Core Functionality
- ✅ **Role-Based Access Control**: Owner, Admin, Viewer roles with specific permissions
- ✅ **Task Management**: Create, read, update, delete tasks with status tracking
- ✅ **Comprehensive User Management**: Full CRUD operations, profile management, and role assignment
- ✅ **Advanced User Administration**: Create, edit, delete users with role-based permissions
- ✅ **Password Management**: Secure password change functionality with validation
- ✅ **Profile Management**: User profile updates with organization context
- ✅ **Task Assignment**: Role-based task assignment capabilities
- ✅ **Organization Isolation**: Multi-tenant data separation
- ✅ **Audit Logging**: Comprehensive action tracking for all operations

### Frontend Features
- ✅ **Responsive Design**: Mobile-first TailwindCSS interface
- ✅ **Drag & Drop**: Interactive task status management
- ✅ **Real-time Updates**: Immediate UI feedback
- ✅ **Authentication Flow**: Secure login/logout with JWT
- ✅ **Role-based UI**: Conditional features based on user permissions
- ✅ **User Management Interface**: Complete user administration with forms and modals
- ✅ **Role Assignment UI**: Dynamic role selection and management
- ✅ **Profile Management**: User profile editing and password changes
- ✅ **Data Tables**: Sortable, filterable user and task lists
- ✅ **Modal Dialogs**: Intuitive create/edit/delete workflows

### Security Features
- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Password Hashing**: bcrypt with secure salt rounds
- ✅ **Permission Guards**: Route-level authorization
- ✅ **Data Validation**: Comprehensive input validation
- ✅ **Organization Boundaries**: Strict data isolation
- ✅ **Secure Token Storage**: JWT-only localStorage with no user object persistence
- ✅ **Token Expiration**: Automatic token validation and cleanup
- ✅ **RBAC**: Role-Based Access Control with granular permissions
- ✅ **HTTP Interceptors**: Automatic token injection and 401 handling
- ✅ **Client-side Security**: No sensitive data persisted in browser storage

## 🔐 Security Architecture

### Authentication Flow

1. **Login**: User provides credentials → Server validates → Returns JWT token
2. **Token Storage**: Only JWT token stored in localStorage (no user object)
3. **Request Authorization**: HTTP interceptor adds `Authorization: Bearer <token>` header
4. **Token Validation**: Server validates JWT on each API request
5. **Session Persistence**: On page refresh, token is validated and user profile re-fetched
6. **Logout**: Token removed from localStorage and user redirected to login

### Security Best Practices Implemented

#### Client-Side Security
```typescript
// ✅ SECURE: Only JWT token in localStorage
localStorage.setItem('token', jwtToken);

// ❌ INSECURE: Never store user objects (avoided)
// localStorage.setItem('user', JSON.stringify(userObject));
```

#### Token Management
```typescript
// Automatic token expiration check
private isTokenExpired(token: string): boolean {
  const payload = this.decodeJWT(token);
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

// Clean token storage on app initialization
private cleanupDeprecatedUserStorage(): void {
  localStorage.removeItem('user'); // Remove legacy user objects
}
```

#### HTTP Security
```typescript
// JWT interceptor adds Authorization header
export function jwtInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn) {
  const token = authService.tokenValue;
  if (token && isApiRequest(request)) {
    request = request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(request);
}
```

### Role-Based Access Control (RBAC)

#### Permission System
```typescript
// Granular permissions
const ROLE_PERMISSIONS = {
  Owner: ['task:create', 'task:read', 'task:update', 'task:delete', 
          'user:create', 'user:read', 'user:update', 'user:delete',
          'org:read', 'org:update', 'audit:read'],
  Admin: ['task:create', 'task:read', 'task:update', 'task:delete',
          'user:create', 'user:read', 'user:update'],
  Viewer: ['task:read', 'user:read']
};
```

#### Route Protection
```typescript
// Angular route guards
@Get('users')
@UseGuards(AuthGuard('jwt'))
@Permissions(PERMISSIONS.USER_READ)
async findAllInOrganization(@CurrentUser() user: AuthContext['user']) {
  return this.userService.findAllInOrganization(user.organizationId);
}
```

### Data Isolation

#### Organization-Level Security
- All data queries include organization context
- Users can only access data within their organization
- Automatic organization ID injection in API requests
- Database-level foreign key constraints enforce isolation

#### API Security Middleware
```typescript
// JWT Strategy validation
async validate(payload: JwtPayload): Promise<AuthContext['user']> {
  const user = await this.userRepository.findOne({
    where: { id: payload.sub, isActive: true },
    relations: ['role']
  });
  
  if (!user) {
    throw new UnauthorizedException();
  }
  
  return {
    id: user.id,
    email: user.email,
    organizationId: user.organizationId,
    roleId: user.roleId,
    roleName: user.role.name,
    permissions: payload.permissions
  };
}
```

## �🏗️ Architecture Overview

### NX Monorepo Structure

```
secure-tms/
├── apps/
│   ├── api/                    # NestJS Backend API
│   ├── dashboard/              # Angular Frontend Dashboard  
│   └── api-e2e/               # End-to-end tests
├── libs/
│   ├── auth/                   # Shared authentication library
│   └── data/                   # Shared data models and DTOs
└── tmp/                        # Development database
```

### Technology Stack

- **Frontend**: Angular 20.2.0 with Standalone Components
- **Backend**: NestJS 11.0.0 with TypeORM
- **Database**: SQLite (development), PostgreSQL-ready for production
- **Authentication**: JWT with role-based permissions
- **Monorepo**: NX 21.5.3 for workspace management
- **Testing**: Jest for unit tests, Karma for Angular tests

### Shared Libraries Rationale

- **@secure-tms/auth**: Centralized authentication logic, permissions, and interfaces
- **@secure-tms/data**: Shared DTOs, interfaces, and data models across frontend/backend
  - User management DTOs: `CreateUserDto`, `UpdateUserDto`, `UserResponse`
  - Profile management: `ChangePasswordDto` for secure password updates
  - Role management: `RoleResponse` interface for role data
  - Complete type safety between frontend and backend APIs

## 🚀 Quick Setup Instructions

### Prerequisites

- Node.js 18+
- npm 8+

### Installation & Development

```bash
# Clone and install dependencies
git clone https://github.com/Nabin99/secure-tms.git
cd secure-tms
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run both applications concurrently
npx nx serve api &
npx nx serve dashboard

# Or run separately:
npx nx serve api        # Backend on http://localhost:3000
npx nx serve dashboard  # Frontend on http://localhost:4200
```

### Test Credentials

The application comes with seeded test accounts for different roles:

| Role | Email | Password | Description |
|------|--------|----------|-------------|
| **Owner** | `owner@test.com` | `password123` | Full system access including user management |
| **Admin** | `admin@test.com` | `password123` | Administrative access, user management |
| **Viewer** | `viewer@test.com` | `password123` | Read-only access to tasks and users |
| **Eng Admin** | `eng.admin@test.com` | `password123` | Admin role in Engineering organization |
| **Eng Viewer** | `eng.viewer@test.com` | `password123` | Viewer role in Engineering organization |

> **Security Note**: These are development-only credentials. The database is automatically seeded on first run of the API server.

### Environment Configuration (.env)

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Database Configuration  
DB_TYPE=sqlite
DB_DATABASE=tmp/dev.sqlite

# For production PostgreSQL:
# DB_TYPE=postgres
# DB_HOST=localhost
# DB_PORT=5432
# DB_USERNAME=your-username
# DB_PASSWORD=your-password
# DB_DATABASE=secure_tms

# Application Settings
API_PORT=3000
NODE_ENV=development
```

## 📊 Data Model & Schema

### Entity Relationship Diagram

```
Organizations (1) ←→ (N) Users
Organizations (1) ←→ (N) Roles  
Organizations (1) ←→ (N) Tasks
Users (1) ←→ (N) Tasks (assignedUser)
Users (1) ←→ (N) Tasks (createdByUser)
Roles (1) ←→ (N) Users
Organizations (1) ←→ (N) AuditLogs
```

### Database Schema

#### Organizations Table

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Roles Table

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) NOT NULL, -- 'Owner', 'Admin', 'Viewer'
  description TEXT,
  organizationId UUID REFERENCES organizations(id),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, organizationId)
);
```

#### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  organizationId UUID REFERENCES organizations(id),
  roleId UUID REFERENCES roles(id),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Tasks Table

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) CHECK (category IN ('Work', 'Personal', 'Other')),
  status VARCHAR(50) DEFAULT 'Todo' CHECK (status IN ('Todo', 'In Progress', 'Done')),
  priority VARCHAR(50) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  assignedUserId UUID REFERENCES users(id),
  organizationId UUID REFERENCES organizations(id),
  createdBy UUID REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  entityType VARCHAR(50) NOT NULL, -- 'Task', 'User', etc.
  entityId UUID NOT NULL,
  userId UUID REFERENCES users(id),
  organizationId UUID REFERENCES organizations(id),
  changes JSON, -- Store the actual changes
  createdAt TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Access Control Implementation

### Role Hierarchy & Permissions

#### **Owner** (Highest Level)

- **Organization Management**: Can update organization settings
- **User Management**: Create, read, update, delete all users in organization
- **Role Management**: Assign and modify user roles
- **Password Management**: Can reset user passwords and manage account security
- **Task Management**: Full CRUD access to all tasks in organization
- **Task Assignment**: Can assign tasks to any user
- **Audit Access**: Can view all audit logs and security events

#### **Admin** (Middle Level)

- **User Management**: Create, read, update users (cannot delete users)
- **Role Assignment**: Can assign roles to users (except Owner role)
- **Profile Updates**: Can update user profiles and basic information
- **Task Management**: Full CRUD access to all tasks in organization
- **Task Assignment**: Can assign tasks to any user
- **Audit Access**: Can view audit logs for their actions and organization

#### **Viewer** (Basic Level)

- **Task Management**: Can only manage their own tasks (CRUD)
- **Profile Management**: Can view and update their own profile
- **Password Management**: Can change their own password
- **User Info**: Can view basic user information within organization
- **No Assignment Rights**: Cannot assign tasks to others
- **No Admin Functions**: Cannot create, edit, or delete other users

### Permission System

```typescript
// libs/auth/src/lib/auth.ts
export const PERMISSIONS = {
  TASK_CREATE: 'task:create',
  TASK_READ: 'task:read', 
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',
  TASK_READ_ALL: 'task:read:all',    // Admin+ only
  TASK_ASSIGN: 'task:assign',        // Admin+ only
  USER_CREATE: 'user:create',        // Admin+ only
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',        // Admin+ only
  USER_DELETE: 'user:delete',        // Owner only
  USER_CHANGE_PASSWORD: 'user:change_password', // Owner only (for others)
  PROFILE_READ: 'profile:read',      // All users (own profile)
  PROFILE_UPDATE: 'profile:update',  // All users (own profile)
  ROLE_READ: 'role:read',            // Admin+ only
  ROLE_ASSIGN: 'role:assign',        // Admin+ only
  ORG_READ: 'org:read',
  ORG_UPDATE: 'org:update',          // Owner only
  AUDIT_READ: 'audit:read'           // Admin+ only
};
```

### JWT Integration

JWT tokens contain user context and permissions:

```typescript
interface JwtPayload {
  sub: string;              // User ID
  email: string;
  organizationId: string;   // Organization isolation
  roleId: string;
  roleName: 'Owner' | 'Admin' | 'Viewer';
  permissions: string[];    // Granular permissions array
  iat?: number;
  exp?: number;
}
```

### Organization Isolation

- **Strict Boundaries**: Users can only access data within their organization
- **Database-Level Filtering**: All queries include `organizationId` filters
- **JWT Context**: Organization ID embedded in every authenticated request

### RBAC Enforcement Examples

#### Task Creation (Viewers)

```typescript
// Viewers can only create tasks for themselves
if (user.roleName === 'Viewer' && createTaskDto.assignedUserId !== user.id) {
  throw new ForbiddenException('Viewers can only create tasks for themselves');
}
```

#### Task Access (Cross-Role)

```typescript
// Access control based on role and ownership
const canAccess = 
  user.roleName === 'Owner' || user.roleName === 'Admin' ||
  (user.roleName === 'Viewer' && task.assignedUserId === user.id);
```

## � User Management Interface

### Frontend User Management Features

The dashboard includes a comprehensive user management interface accessible at `/users` route:

#### User Management Component Features

- **User Listing**: Sortable table showing all users in organization
- **Role-based Visibility**: Users see different options based on their permissions
- **Search & Filter**: Real-time search by name/email and filter by role
- **Create User**: Modal form for adding new users with role selection
- **Edit User**: In-place editing of user details and role assignment
- **Delete User**: Confirmation dialog for user removal (Owner only)
- **Status Management**: Toggle user active/inactive status

#### User Interface Permissions

```typescript
// Permission-based UI rendering
canCreateUsers(): boolean {
  return this.currentUser.roleName === 'Owner' || 
         this.currentUser.roleName === 'Admin';
}

canEditUser(user: UserResponse): boolean {
  return (this.currentUser.roleName === 'Owner' || 
          this.currentUser.roleName === 'Admin') && 
         user.id !== this.currentUser.id;
}

canDeleteUser(user: UserResponse): boolean {
  return this.currentUser.roleName === 'Owner' && 
         user.id !== this.currentUser.id &&
         user.roleName !== 'Owner';
}
```

#### User Form Validation

- **Email**: Valid email format required, uniqueness checked
- **Password**: Minimum 6 characters for new users
- **Names**: Minimum 2 characters for first and last names
- **Role Selection**: Required, populated from available roles API

#### Profile Management

- **Profile Page**: Accessible to all users at `/profile`
- **Edit Profile**: Update first name, last name, and email
- **Change Password**: Secure password update with current password verification
- **View Only Fields**: Organization and role information (read-only)

## �🔌 API Documentation

### Authentication Endpoints

#### POST `/auth/login`

**Purpose**: Authenticate user and receive JWT token

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com", 
    "firstName": "John",
    "lastName": "Doe",
    "roleName": "Admin",
    "organizationId": "org-uuid"
  }
}
```

### Task Management Endpoints

#### GET `/tasks`

**Purpose**: Retrieve tasks based on user role

- **Viewers**: Only their assigned tasks
- **Admins/Owners**: All organization tasks

**Query Parameters**:

- `status`: Filter by status ('Todo', 'In Progress', 'Done')
- `priority`: Filter by priority ('Low', 'Medium', 'High')
- `category`: Filter by category ('Work', 'Personal', 'Other')

**Response**:

```json
[
  {
    "id": "task-uuid",
    "title": "Complete API documentation",
    "description": "Write comprehensive API docs",
    "category": "Work",
    "status": "In Progress", 
    "priority": "High",
    "assignedUserId": "user-uuid",
    "assignedUser": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "createdBy": "creator-uuid",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T14:20:00Z"
  }
]
```

#### POST `/tasks`

**Purpose**: Create new task

**Request Body**:

```json
{
  "title": "New Task",
  "description": "Task description here",
  "category": "Work",
  "priority": "Medium",
  "assignedUserId": "user-uuid"  // Optional for Viewers (defaults to self)
}
```

#### PUT `/tasks/:id`

**Purpose**: Update existing task (with role-based restrictions)

**Request Body**:

```json
{
  "title": "Updated Task Title",
  "status": "Done",
  "assignedUserId": "new-user-uuid"  // Only Admin+ can reassign
}
```

#### DELETE `/tasks/:id`

**Purpose**: Delete task (own tasks for Viewers, any for Admin+)

### User Management Endpoints

#### GET `/users`

**Purpose**: List all users in organization (Admin+ only)

**Query Parameters**:
- `search`: Search users by name or email
- `role`: Filter by role name
- `isActive`: Filter by active status

**Response**:
```json
[
  {
    "id": "user-uuid",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "organizationId": "org-uuid",
    "roleId": "role-uuid",
    "roleName": "Admin",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-16T14:20:00Z",
    "organization": {
      "id": "org-uuid",
      "name": "Acme Corporation"
    },
    "role": {
      "id": "role-uuid",
      "name": "Admin",
      "description": "Can manage users and tasks"
    }
  }
]
```

#### POST `/users`

**Purpose**: Create new user (Admin+ only)

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "firstName": "Jane",
  "lastName": "Smith",
  "roleId": "role-uuid"
}
```

**Response**:
```json
{
  "id": "new-user-uuid",
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "organizationId": "org-uuid",
  "roleId": "role-uuid",
  "roleName": "Viewer",
  "isActive": true,
  "createdAt": "2024-01-17T09:15:00Z",
  "updatedAt": "2024-01-17T09:15:00Z"
}
```

#### GET `/users/:id`

**Purpose**: Get specific user details (Admin+ for others, all for self)

#### PUT `/users/:id`

**Purpose**: Update user information (Admin+ only)

**Request Body**:
```json
{
  "firstName": "Updated First Name",
  "lastName": "Updated Last Name",
  "email": "updated.email@example.com",
  "roleId": "new-role-uuid",
  "isActive": false
}
```

#### DELETE `/users/:id`

**Purpose**: Delete user (Owner only)

#### GET `/users/me`

**Purpose**: Get current user profile (All authenticated users)

**Response**:
```json
{
  "id": "current-user-uuid",
  "email": "current@example.com",
  "firstName": "Current",
  "lastName": "User",
  "organizationId": "org-uuid",
  "roleName": "Admin",
  "isActive": true,
  "organization": {
    "id": "org-uuid",
    "name": "Acme Corporation"
  },
  "role": {
    "id": "role-uuid",
    "name": "Admin",
    "description": "Can manage users and tasks",
    "permissions": ["user:create", "user:read", "user:update", "task:read:all"]
  }
}
```

#### PUT `/users/me`

**Purpose**: Update own profile (All authenticated users)

**Request Body**:
```json
{
  "firstName": "Updated Name",
  "lastName": "Updated Last",
  "email": "newemail@example.com"
}
```

#### PUT `/users/me/password`

**Purpose**: Change own password (All authenticated users)

**Request Body**:
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

### Role Management Endpoints

#### GET `/roles`

**Purpose**: Get available roles in organization (Admin+ only)

**Response**:
```json
[
  {
    "id": "role-uuid-1",
    "name": "Owner",
    "description": "Full system access",
    "permissions": ["*"],
    "organizationId": "org-uuid",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "role-uuid-2", 
    "name": "Admin",
    "description": "Can manage users and tasks",
    "permissions": ["user:create", "user:read", "user:update", "task:read:all"],
    "organizationId": "org-uuid",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### Audit Endpoints

#### GET `/audit`

**Purpose**: Retrieve audit logs (Admin+ only)

**Query Parameters**:

- `action`: Filter by action type
- `entityType`: Filter by entity type
- `startDate`, `endDate`: Date range filter

## 🧪 Testing Strategy

### Backend Testing (Jest)

```bash
# Run all API tests
npx nx test api

# Run specific test suites
npx nx test api --testNamePattern="RBAC"
npx nx test api --testNamePattern="Auth"
```

**Key Test Categories**:

- **RBAC Logic**: Role-based access control enforcement for all operations
- **Authentication**: JWT generation, validation, login/logout flows
- **Authorization**: Permission checking and route guards
- **User Management**: CRUD operations, role assignments, profile updates
- **Password Security**: Secure password hashing and change validation
- **Data Isolation**: Organization-level data separation across all entities
- **API Endpoints**: Request/response validation for all user management endpoints
- **Audit Logging**: Comprehensive tracking of user management operations

### Frontend Testing (Jest/Karma)

```bash
# Run dashboard tests
npx nx test dashboard

# Run with coverage
npx nx test dashboard --coverage
```

**Key Test Categories**:

- **Component Logic**: State management and user interactions
- **Role-based UI**: Conditional rendering based on user permissions
- **User Management Forms**: Create/edit/delete user workflows and validation
- **Profile Management**: User profile editing and password change components
- **Service Integration**: API communication and error handling for user operations
- **Route Guards**: Authentication and authorization guards
- **Data Tables**: User listing, sorting, filtering, and search functionality

### E2E Testing

```bash
# Run end-to-end tests
npx nx e2e api-e2e
```

## 🏃‍♂️ Development Commands

```bash
# Development
npx nx serve api &
npx nx serve dashboard        # Start both applications

# Building
npx nx build api             # Build backend
npx nx build dashboard       # Build frontend

# Testing
npx nx test api             # Run backend tests
npx nx test dashboard       # Run frontend tests
npx nx e2e api-e2e          # Run E2E tests

# Code Quality
npx nx lint api             # Lint backend
npx nx lint dashboard       # Lint frontend
```

## 🔒 Security Features

### Authentication Security

- **Password Hashing**: bcrypt with salt rounds (12)
- **JWT Security**: Signed tokens with expiration
- **Session Management**: Stateless JWT-based authentication

### Authorization Security

- **Route Guards**: Protected API endpoints
- **Permission Checks**: Granular permission validation
- **Data Filtering**: Organization-level data isolation
- **Input Validation**: DTO validation with class-validator

### Audit Trail

- **Comprehensive Logging**: All CRUD operations logged
- **User Attribution**: Every action tied to specific user
- **Change Tracking**: Before/after state capture
- **Organization Scope**: Audit logs isolated by organization

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Ensure SQLite database directory exists
mkdir -p tmp/

# Reset database (development only)
rm tmp/dev.sqlite
npx nx serve api  # Will recreate database with seed data
```

#### Port Conflicts
```bash
# Change default ports in environment
export API_PORT=3001
export FRONTEND_PORT=4201

# Or specify different ports
npx nx serve api --port=3001
npx nx serve dashboard --port=4201
```

#### JWT Token Issues
```bash
# Regenerate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update .env file with new JWT_SECRET
```

#### Module Import Errors
```bash
# Clear NX cache
npx nx reset

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

- Check the [Issues](../../issues) section for known problems
- Review the test files for usage examples
- Ensure all environment variables are properly set

## 🤝 Contributing

1. **Development Setup**: Follow setup instructions above
2. **Code Standards**: Run `npx nx lint`
3. **Testing**: Ensure all tests pass with `npx nx test`
4. **Documentation**: Update README for new features

## 📄 License

This project is licensed under the MIT License.

---

## 🚀 Production Deployment

### Backend Deployment

```bash
# Build for production
npx nx build api --prod

# Set production environment variables
export NODE_ENV=production
export DB_TYPE=postgres
export DB_HOST=your-postgres-host
export DB_PORT=5432
export DB_USERNAME=your-username
export DB_PASSWORD=your-password
export DB_DATABASE=secure_tms
export JWT_SECRET=your-production-jwt-secret

# Start production server
node dist/apps/api/main.js
```

### Frontend Deployment

```bash
# Build for production
npx nx build dashboard --prod

# Deploy static files to your hosting provider
# Output will be in dist/apps/dashboard/
```

### Database Migration (PostgreSQL)

```sql
-- Create production database
CREATE DATABASE secure_tms;

-- Grant permissions to application user
GRANT ALL PRIVILEGES ON DATABASE secure_tms TO your_app_user;
```

---

**Built with ❤️ using NX, Angular, and NestJS**
