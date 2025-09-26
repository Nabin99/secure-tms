import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { Task, User, AuditLog, Organization } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Task, User, AuditLog, Organization])],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
