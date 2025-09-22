import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Find all users in a specific organization
   * @param organizationId The organization ID
   * @returns Array of users with basic info (id, firstName, lastName, email, role)
   */
  async findAllInOrganization(organizationId: string) {
    const users = await this.userRepository.find({
      where: { organizationId },
      relations: ['role'],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        roleId: true,
        role: {
          id: true,
          name: true,
        }
      }
    });

    return users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleName: user.role.name,
    }));
  }
}
