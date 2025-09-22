# Role-Based Task Management System

## Overview
The Secure Task Management System now implements comprehensive role-based access control (RBAC) for task operations, ensuring that users can only perform actions appropriate to their role level.

## Role Definitions

### 🔵 Viewer Role
**Permissions:**
- ✅ Can create tasks (only for themselves)
- ✅ Can read their own tasks
- ✅ Can update their own tasks
- ✅ Can delete their own tasks
- ❌ Cannot assign tasks to other users
- ❌ Cannot view, modify, or delete other users' tasks

### 🟡 Admin Role  
**Permissions:**
- ✅ Can create tasks for any user in their organization
- ✅ Can read all tasks in their organization
- ✅ Can update any task in their organization
- ✅ Can delete any task in their organization
- ✅ Can assign/reassign tasks to any user in their organization

### 🔴 Owner Role
**Permissions:**
- ✅ Can create tasks for any user in their organization
- ✅ Can read all tasks in their organization
- ✅ Can update any task in their organization
- ✅ Can delete any task in their organization
- ✅ Can assign/reassign tasks to any user in their organization
- ✅ Full organizational control

## Implementation Details

### API Endpoints
All task endpoints are protected with JWT authentication and role-based permissions:

```
POST   /api/tasks           - Create a new task
GET    /api/tasks           - Get all accessible tasks
GET    /api/tasks/:id       - Get a specific task
PATCH  /api/tasks/:id       - Update a task
DELETE /api/tasks/:id       - Delete a task
```

### Permission Enforcement

#### Task Creation
- **Viewers**: Can only create tasks for themselves
- **Admins/Owners**: Can create tasks for any user in their organization

#### Task Reading
- **Viewers**: Only see tasks they own (assigned to them or created by them)
- **Admins/Owners**: See all tasks in their organization

#### Task Updates
- **Viewers**: Can only update their own tasks, cannot reassign to others
- **Admins/Owners**: Can update any task and reassign to any user in organization

#### Task Deletion
- **Viewers**: Can only delete their own tasks
- **Admins/Owners**: Can delete any task in their organization

### Security Features

1. **Organization Isolation**: Users can only access tasks within their own organization
2. **Ownership Validation**: Viewers are restricted to tasks they own or created
3. **Role Verification**: All operations check user role before allowing access
4. **Audit Logging**: All task operations are logged with user context
5. **Input Validation**: Assignment validation ensures users exist in same organization

### Database Schema
The system uses the existing task schema with proper foreign key relationships:
- Tasks belong to an organization
- Tasks are assigned to users within the same organization
- Tasks track who created them for ownership validation

### Error Handling
The system provides clear error messages for unauthorized actions:
- `403 Forbidden`: When trying to access resources outside permission scope
- `404 Not Found`: When requested resources don't exist
- `400 Bad Request`: When trying to assign tasks to users in different organizations

## Testing the Implementation

### As a Viewer:
1. Login as a viewer user
2. Try creating a task - should succeed (assigned to self)
3. Try viewing tasks - should only see own tasks
4. Try updating own task - should succeed
5. Try deleting own task - should succeed
6. Try accessing another user's task - should fail with 403

### As an Admin/Owner:
1. Login as admin/owner user
2. Try creating tasks for different users - should succeed
3. Try viewing all tasks - should see all organization tasks
4. Try updating any task - should succeed
5. Try deleting any task - should succeed
6. Try reassigning tasks - should succeed

## Configuration
The role-based permissions are configured in `/libs/auth/src/lib/auth.ts`:
- Permission constants define available actions
- Role permission mapping assigns permissions to roles
- Helper functions validate access rights

This implementation ensures data security while providing appropriate access levels for different user roles in the organization.
