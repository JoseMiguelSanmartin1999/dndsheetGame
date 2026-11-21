import { Injectable } from '@nestjs/common';
import type { User as UserRow } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../../../domain/models/user.model';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: User): Promise<User> {
    const row = await this.prisma.user.create({
      data: {
        email: user.email.toLowerCase(),
        username: user.username,
        dateOfBirth: user.dateOfBirth,
        passwordHash: user.passwordHash,
        hasPlayedBefore: user.hasPlayedBefore,
        role: user.role === 'admin' ? 'ADMIN' : 'USER',
      },
    });
    return this.toDomain(row);
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    return row ? this.toDomain(row) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({ where: { username: { equals: username, mode: 'insensitive' } } });
    return row ? this.toDomain(row) : null;
  }

  async update(user: User): Promise<User> {
    const row = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: user.failedLoginAttempts,
        lockUntil: user.lockUntil ?? null,
      },
    });
    return this.toDomain(row);
  }

  private toDomain(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      dateOfBirth: row.dateOfBirth,
      passwordHash: row.passwordHash,
      hasPlayedBefore: row.hasPlayedBefore,
      role: row.role === 'ADMIN' ? 'admin' : 'user',
      status: row.status === 'SUSPENDED' ? 'suspended' : 'active',
      maxCharacters: row.maxCharacters,
      failedLoginAttempts: row.failedLoginAttempts,
      lockUntil: row.lockUntil ?? undefined,
      createdAt: row.createdAt,
    };
  }
}
