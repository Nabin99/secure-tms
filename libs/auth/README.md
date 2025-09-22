# @secure-tms/auth

Shared authentication library for the Secure Task Management System.

## Overview

This library provides centralized authentication logic, permissions, and interfaces used across both frontend and backend applications.

## Features

- JWT token interfaces and types
- Role-based permission definitions
- Authentication guards and utilities
- Shared authentication DTOs

## Contents

- `auth.ts` - Authentication interfaces and permission constants
- `index.ts` - Public API exports

## Building

Run `nx build auth` to build the library.

## Running unit tests

Run `nx test auth` to execute the unit tests via [Jest](https://jestjs.io).

## Usage

```typescript
import { UserRole, PERMISSIONS } from '@secure-tms/auth';

// Use role definitions
const userRole: UserRole = 'Admin';

// Check permissions
if (user.permissions.includes(PERMISSIONS.TASK_CREATE)) {
  // Allow task creation
}
```
