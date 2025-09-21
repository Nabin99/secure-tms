import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Organization, Role, Task, AuditLog } from '../entities';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
