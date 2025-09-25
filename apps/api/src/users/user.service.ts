import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, Role, AuditLog } from '../entities';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, UserResponse } from '@secure-tms/data';
import { AuthContext } from '@secure-tms/auth';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Find all users in a specific organization
   * @param organizationId The organization ID
   * @returns Array of users with basic info (id, firstName, lastName, email, role)
   */
  async findAllInOrganization(organizationId: string): Promise<UserResponse[]> {
    const users = await this.userRepository.find({
      where: { organizationId },
      relations: ['role', 'organization'],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        roleId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        organizationId: true,
        role: {
          id: true,
          name: true,
          description: true,
        },
        organization: {
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
      roleId: user.roleId,
      roleName: user.role.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      organizationId: user.organizationId,
      role: user.role,
      organization: user.organization,
    }));
  }

  /**
   * Find a user by ID within the same organization
   */
  async findOne(id: string, organizationId: string): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id, organizationId },
      relations: ['role', 'organization'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      organizationId: user.organizationId,
      role: user.role,
      organization: user.organization,
    };
  }

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto, createdByUser: AuthContext['user']): Promise<UserResponse> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Verify the role exists and belongs to the same organization
    const role = await this.roleRepository.findOne({
      where: { id: createUserDto.roleId, organizationId: createUserDto.organizationId }
    });

    if (!role) {
      throw new BadRequestException('Invalid role');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    // Create the user
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Log the creation
    await this.auditLogRepository.save({
      userId: createdByUser.id,
      action: 'USER_CREATE',
      resource: 'User',
      resourceId: savedUser.id,
      organizationId: createdByUser.organizationId,
      metadata: {
        createdUserEmail: savedUser.email,
        roleName: role.name,
      },
      timestamp: new Date(),
    });

    return this.findOne(savedUser.id, savedUser.organizationId);
  }

  /**
   * Update a user
   */
  async update(id: string, updateUserDto: UpdateUserDto, updatedByUser: AuthContext['user']): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id, organizationId: updatedByUser.organizationId },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If updating role, verify it exists and belongs to the same organization
    if (updateUserDto.roleId) {
      const role = await this.roleRepository.findOne({
        where: { id: updateUserDto.roleId, organizationId: updatedByUser.organizationId }
      });

      if (!role) {
        throw new BadRequestException('Invalid role');
      }
    }

    // Check if email is being changed and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email }
      });

      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Update the user
    await this.userRepository.update(id, {
      ...updateUserDto,
      updatedAt: new Date(),
    });

    // Log the update
    await this.auditLogRepository.save({
      userId: updatedByUser.id,
      action: 'USER_UPDATE',
      resource: 'User',
      resourceId: id,
      organizationId: updatedByUser.organizationId,
      metadata: {
        updatedFields: Object.keys(updateUserDto),
        targetUserEmail: user.email,
      },
      timestamp: new Date(),
    });

    return this.findOne(id, updatedByUser.organizationId);
  }

  /**
   * Delete (deactivate) a user
   */
  async remove(id: string, deletedByUser: AuthContext['user']): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id, organizationId: deletedByUser.organizationId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent self-deletion
    if (user.id === deletedByUser.id) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    // Soft delete by deactivating
    await this.userRepository.update(id, {
      isActive: false,
      updatedAt: new Date(),
    });

    // Log the deletion
    await this.auditLogRepository.save({
      userId: deletedByUser.id,
      action: 'USER_DELETE',
      resource: 'User',
      resourceId: id,
      organizationId: deletedByUser.organizationId,
      metadata: {
        deletedUserEmail: user.email,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Change user password
   */
  async changePassword(id: string, changePasswordDto: ChangePasswordDto, requestingUser: AuthContext['user']): Promise<void> {
    // Only allow users to change their own password or admins to change others
    if (id !== requestingUser.id && !['Owner', 'Admin'].includes(requestingUser.roleName)) {
      throw new ForbiddenException('Insufficient permissions to change password');
    }

    const user = await this.userRepository.findOne({
      where: { id, organizationId: requestingUser.organizationId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If changing own password, verify current password
    if (id === requestingUser.id) {
      const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);

    // Update password
    await this.userRepository.update(id, {
      password: hashedNewPassword,
      updatedAt: new Date(),
    });

    // Log password change
    await this.auditLogRepository.save({
      userId: requestingUser.id,
      action: 'PASSWORD_CHANGE',
      resource: 'User',
      resourceId: id,
      organizationId: requestingUser.organizationId,
      metadata: {
        changedByOwnUser: id === requestingUser.id,
        targetUserEmail: user.email,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Get user profile (own profile)
   */
  async getProfile(userId: string, organizationId: string): Promise<UserResponse> {
    return this.findOne(userId, organizationId);
  }

  /**
   * Update user profile (own profile with limited fields)
   */
  async updateProfile(userId: string, updateData: Pick<UpdateUserDto, 'firstName' | 'lastName' | 'email'>, organizationId: string): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateData.email }
      });

      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Update profile
    await this.userRepository.update(userId, {
      ...updateData,
      updatedAt: new Date(),
    });

    // Log the profile update
    await this.auditLogRepository.save({
      userId: userId,
      action: 'PROFILE_UPDATE',
      resource: 'User',
      resourceId: userId,
      organizationId: organizationId,
      metadata: {
        updatedFields: Object.keys(updateData),
      },
      timestamp: new Date(),
    });

    return this.findOne(userId, organizationId);
  }
}
