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

    // Check if already seeded
    const existingOrg = await this.organizationRepository.findOne({
      where: { name: 'Secure TMS' }
    });

    if (existingOrg) {
      console.log('Database already seeded');
      return;
    }

    // Create root organization
    const rootOrg = await this.organizationRepository.save({
      name: 'Secure TMS',
      description: 'Root organization for demo',
      isActive: true,
    });

    // Create child organization
    const childOrg = await this.organizationRepository.save({
      name: 'Engineering Team',
      description: 'Engineering department',
      parentId: rootOrg.id,
      isActive: true,
    });

    // Create roles for root org
    const ownerRole = await this.roleRepository.save({
      name: 'Owner',
      description: 'Full access to organization',
      permissions: [...ROLE_PERMISSIONS.Owner],
      organizationId: rootOrg.id,
    });

    const adminRole = await this.roleRepository.save({
      name: 'Admin',
      description: 'Administrative access',
      permissions: [...ROLE_PERMISSIONS.Admin],
      organizationId: rootOrg.id,
    });

    const viewerRole = await this.roleRepository.save({
      name: 'Viewer',
      description: 'Read-only access',
      permissions: [...ROLE_PERMISSIONS.Viewer],
      organizationId: rootOrg.id,
    });

    // Create roles for child org
    const childAdminRole = await this.roleRepository.save({
      name: 'Admin',
      description: 'Administrative access',
      permissions: [...ROLE_PERMISSIONS.Admin],
      organizationId: childOrg.id,
    });

    const childViewerRole = await this.roleRepository.save({
      name: 'Viewer',
      description: 'Read-only access',
      permissions: [...ROLE_PERMISSIONS.Viewer],
      organizationId: childOrg.id,
    });

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Root org users
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

    // Child org users
    await this.userRepository.save({
      email: 'eng.admin@test.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Johnson',
      organizationId: childOrg.id,
      roleId: childAdminRole.id,
      isActive: true,
    });

    await this.userRepository.save({
      email: 'eng.viewer@test.com',
      password: hashedPassword,
      firstName: 'Charlie',
      lastName: 'Brown',
      organizationId: childOrg.id,
      roleId: childViewerRole.id,
      isActive: true,
    });

    console.log('Database seeding completed!');
    console.log('Test accounts:');
    console.log('- owner@test.com / password123 (Owner)');
    console.log('- admin@test.com / password123 (Admin)');
    console.log('- viewer@test.com / password123 (Viewer)');
    console.log('- eng.admin@test.com / password123 (Admin - Engineering)');
    console.log('- eng.viewer@test.com / password123 (Viewer - Engineering)');
  }
}
