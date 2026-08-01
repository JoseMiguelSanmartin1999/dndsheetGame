import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../domain/models/user.model';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserDocument, UserMongooseEntity } from './user.schema';

@Injectable()
export class MongoUserRepository implements IUserRepository {
  constructor(
    @InjectModel(UserMongooseEntity.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(user: User): Promise<User> {
    const createdUser = new this.userModel({
      email: user.email,
      username: user.username,
      dateOfBirth: user.dateOfBirth,
      passwordHash: user.passwordHash,
      hasPlayedBefore: user.hasPlayedBefore,
      role: user.role || 'user',
      failedLoginAttempts: user.failedLoginAttempts || 0,
      lockUntil: user.lockUntil,
    });
    const saved = await createdUser.save();
    return this.toDomain(saved);
  }

  async findByEmail(email: string): Promise<User | null> {
    const userDoc = await this.userModel.findOne({ email }).exec();
    return userDoc ? this.toDomain(userDoc) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const userDoc = await this.userModel.findOne({ username }).exec();
    return userDoc ? this.toDomain(userDoc) : null;
  }

  async update(user: User): Promise<User> {
    const updated = await this.userModel.findByIdAndUpdate(
      user.id,
      {
        email: user.email,
        username: user.username,
        dateOfBirth: user.dateOfBirth,
        passwordHash: user.passwordHash,
        hasPlayedBefore: user.hasPlayedBefore,
        role: user.role,
        failedLoginAttempts: user.failedLoginAttempts,
        lockUntil: user.lockUntil,
      },
      { new: true }
    ).exec();
    if (!updated) {
      throw new Error('Usuario no encontrado para actualizar.');
    }
    return this.toDomain(updated);
  }

  private toDomain(doc: UserDocument): User {
    return {
      id: doc._id.toString(),
      email: doc.email,
      username: doc.username,
      dateOfBirth: doc.dateOfBirth,
      passwordHash: doc.passwordHash,
      hasPlayedBefore: doc.hasPlayedBefore,
      role: doc.role,
      failedLoginAttempts: doc.failedLoginAttempts,
      lockUntil: doc.lockUntil,
      createdAt: (doc as any).createdAt,
    };
  }
}
