import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, TaskResponse } from '@secure-tms/data';
import { CurrentUser } from '../auth/current-user.decorator';
import { Permissions, PermissionsGuard } from '../auth/permissions.guard';
import { AuthContext, PERMISSIONS } from '@secure-tms/auth';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @Permissions(PERMISSIONS.TASK_CREATE)
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: AuthContext['user']
  ): Promise<TaskResponse> {
    return this.taskService.create(createTaskDto, user);
  }

  @Get()
  @Permissions(PERMISSIONS.TASK_READ)
  findAll(@CurrentUser() user: AuthContext['user']): Promise<TaskResponse[]> {
    return this.taskService.findAll(user);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.TASK_READ)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthContext['user']
  ): Promise<TaskResponse> {
    return this.taskService.findOne(id, user);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.TASK_UPDATE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: AuthContext['user']
  ): Promise<TaskResponse> {
    return this.taskService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.TASK_DELETE)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthContext['user']
  ): Promise<void> {
    return this.taskService.remove(id, user);
  }
}
