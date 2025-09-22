# @secure-tms/data

Shared data models and DTOs for the Secure Task Management System.

## Overview

This library contains shared data transfer objects (DTOs), interfaces, and type definitions used across both frontend and backend applications.

## Features

- Task-related DTOs and interfaces
- User management DTOs
- Organization data models
- API request/response types

## Contents

- Data transfer objects for API communication
- TypeScript interfaces for type safety
- Shared constants and enums

## Building

Run `nx build data` to build the library.

## Running unit tests

Run `nx test data` to execute the unit tests via [Jest](https://jestjs.io).

## Usage

```typescript
import { CreateTaskDto, TaskStatus } from '@secure-tms/data';

// Use DTOs for API calls
const taskData: CreateTaskDto = {
  title: 'New Task',
  status: TaskStatus.TODO,
  assignedUserId: 'user-id'
};
```
