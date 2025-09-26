import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { OrganizationModule } from '../organizations/organization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, AuditLog]),
    OrganizationModule
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
