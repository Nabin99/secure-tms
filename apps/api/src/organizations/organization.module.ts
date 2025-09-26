import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { Organization, User, Task, Role, AuditLog } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, User, Task, Role, AuditLog]),
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
