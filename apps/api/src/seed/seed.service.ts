import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, Organization, Role } from '../entities';
import { ROLE_PERMISSIONS } from '@secure-tms/auth';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async seed(): Promise<void> {
    console.log('Starting database seeding...');

    // Check if data already exists
    const existingOrg = await this.organizationRepository.findOne({ where: { name: 'Secure TMS' } });

    if (existingOrg) {
      // Idempotent seeding - check for missing data only
      await this.ensureGlobalRoles();
      await this.ensureChildOrg(existingOrg);
      await this.ensureUsers(existingOrg);
      console.log('Seeding check completed (idempotent).');
    } else {
      // Fresh seeding
      await this.freshSeed();
      console.log('Fresh seeding completed.');
    }
  }

  private async ensureGlobalRoles(): Promise<{ ownerRole: Role, adminRole: Role, viewerRole: Role }> {
    let ownerRole = await this.roleRepository.findOne({ where: { name: 'Owner' } });
    if (!ownerRole) {
      ownerRole = await this.roleRepository.save({
        name: 'Owner',
        description: 'Full access to organization and its resources',
        permissions: [...ROLE_PERMISSIONS.Owner],
      });
      console.log('Created missing global Owner role');
    }

    let adminRole = await this.roleRepository.findOne({ where: { name: 'Admin' } });
    if (!adminRole) {
      adminRole = await this.roleRepository.save({
        name: 'Admin',
        description: 'Administrative access to organization resources',
        permissions: [...ROLE_PERMISSIONS.Admin],
      });
      console.log('Created missing global Admin role');
    }

    let viewerRole = await this.roleRepository.findOne({ where: { name: 'Viewer' } });
    if (!viewerRole) {
      viewerRole = await this.roleRepository.save({
        name: 'Viewer',
        description: 'Read-only access to organization resources',
        permissions: [...ROLE_PERMISSIONS.Viewer],
      });
      console.log('Created missing global Viewer role');
    }

    return { ownerRole, adminRole, viewerRole };
  }

  private async ensureChildOrg(parentOrg: Organization): Promise<Organization> {
    // Normalize levels
    await this.organizationRepository.createQueryBuilder()
      .update(Organization)
      .set({ level: 1 })
      .where('parentId IS NULL AND (level IS NULL OR level != :lvl)', { lvl: 1 })
      .execute();

    await this.organizationRepository.createQueryBuilder()
      .update(Organization)
      .set({ level: 2 })
      .where('parentId IS NOT NULL AND (level IS NULL OR level != :lvl)', { lvl: 2 })
      .execute();

    // Ensure child org exists
    let childOrg = await this.organizationRepository.findOne({ where: { name: 'Engineering Team' } });
    if (!childOrg) {
      childOrg = await this.organizationRepository.save({
        name: 'Engineering Team',
        description: 'Engineering department',
        parentId: parentOrg.id,
        isActive: true,
        level: 2,
      });
      console.log('Created missing child org Engineering Team');
    }

    return childOrg;
  }

  private async ensureUsers(parentOrg: Organization): Promise<void> {
    const { ownerRole, adminRole, viewerRole } = await this.ensureGlobalRoles();
    const childOrg = await this.ensureChildOrg(parentOrg);
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    const ensureUser = async (email: string, firstName: string, lastName: string, role: Role, org: Organization) => {
      const existingUser = await this.userRepository.findOne({ where: { email } });
      if (!existingUser) {
        await this.userRepository.save({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          organizationId: org.id,
          roleId: role.id,
          isActive: true,
        });
        console.log(`Created missing user ${email} with role ${role.name} in org ${org.name}`);
      }
    };

    // Parent org users
    await ensureUser('owner@test.com', 'Nabin', 'Dhital', ownerRole, parentOrg);
    await ensureUser('admin@test.com', 'Nab', 'Dhital', adminRole, parentOrg);
    await ensureUser('viewer@test.com', 'Bob', 'Wilson', viewerRole, parentOrg);
    
    // Child org users
    await ensureUser('eng.owner@test.com', 'David', 'Smith', ownerRole, childOrg);
    await ensureUser('eng.admin@test.com', 'Alice', 'Johnson', adminRole, childOrg);
    await ensureUser('eng.viewer@test.com', 'Charlie', 'Brown', viewerRole, childOrg);
  }

  private async freshSeed(): Promise<void> {
    // Create organizations
    const rootOrg = await this.organizationRepository.save({
      name: 'Secure TMS',
      description: 'Root organization for the Task Management System',
      isActive: true,
      level: 1,
    });

    const childOrg = await this.organizationRepository.save({
      name: 'Engineering Team',
      description: 'Engineering department',
      parentId: rootOrg.id,
      isActive: true,
      level: 2,
    });

    // Create global roles (one set for all organizations)
    const ownerRole = await this.roleRepository.save({
      name: 'Owner',
      description: 'Full access to organization and its resources',
      permissions: [...ROLE_PERMISSIONS.Owner],
    });
    const adminRole = await this.roleRepository.save({
      name: 'Admin',
      description: 'Administrative access to organization resources',
      permissions: [...ROLE_PERMISSIONS.Admin],
    });
    const viewerRole = await this.roleRepository.save({
      name: 'Viewer',
      description: 'Read-only access to organization resources',
      permissions: [...ROLE_PERMISSIONS.Viewer],
    });

    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create users with global roles in different organizations
    await this.userRepository.save({
      email: 'owner@test.com',
      password: hashedPassword,
      firstName: 'Nabin',
      lastName: 'Dhital',
      organizationId: rootOrg.id,
      roleId: ownerRole.id,
      isActive: true,
    });
    await this.userRepository.save({
      email: 'admin@test.com',
      password: hashedPassword,
      firstName: 'Nab',
      lastName: 'Dhital',
      organizationId: rootOrg.id,
      roleId: adminRole.id,
      isActive: true,
    });
    await this.userRepository.save({
      email: 'viewer@test.com',
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Wilson',
      organizationId: rootOrg.id,
      roleId: viewerRole.id,
      isActive: true,
    });
    await this.userRepository.save({
      email: 'eng.owner@test.com',
      password: hashedPassword,
      firstName: 'David',
      lastName: 'Smith',
      organizationId: childOrg.id,
      roleId: ownerRole.id,
      isActive: true,
    });
    await this.userRepository.save({
      email: 'eng.admin@test.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Johnson',
      organizationId: childOrg.id,
      roleId: adminRole.id,
      isActive: true,
    });
    await this.userRepository.save({
      email: 'eng.viewer@test.com',
      password: hashedPassword,
      firstName: 'Charlie',
      lastName: 'Brown',
      organizationId: childOrg.id,
      roleId: viewerRole.id,
      isActive: true,
    });

    console.log('Database seeding completed (fresh).');
  }
}
