import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Organization, Role, Task, AuditLog } from '../entities';
import { AuthModule } from '../auth/auth.module';
import { TaskModule } from '../tasks/task.module';
import { AuditModule } from '../audit/audit.module';
import { UserModule } from '../users/user.module';
import { RoleModule } from '../roles/role.module';
// import { OrganizationModule } from '../organizations/organization.module';
import { SeedService } from '../seed/seed.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const isPostgres = !!process.env.DATABASE_URL;
        const isProd = process.env.NODE_ENV === 'production';
        return isPostgres
          ? {
              type: 'postgres',
              url: process.env.DATABASE_URL,
              ssl:
                process.env.DB_SSL === 'true'
                  ? { rejectUnauthorized: false }
                  : undefined,
              entities: [User, Organization, Role, Task, AuditLog],
              synchronize: process.env.TYPEORM_SYNC === 'true' || !isProd,
              migrationsRun: process.env.TYPEORM_MIGRATIONS_RUN === 'true',
            }
          : {
              type: 'sqlite',
              database: process.env.SQLITE_PATH || 'tmp/dev.sqlite',
              entities: [User, Organization, Role, Task, AuditLog],
              synchronize: true,
            };
      },
    }),
    TypeOrmModule.forFeature([User, Organization, Role]),
    AuthModule,
    TaskModule,
    AuditModule,
    UserModule,
    RoleModule,
    // OrganizationModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule implements OnModuleInit {
  constructor(private seedService: SeedService) {}

  async onModuleInit() {
    // Only seed in development
    if (process.env.NODE_ENV !== 'production') {
      await this.seedService.seed();
    }
  }
}
