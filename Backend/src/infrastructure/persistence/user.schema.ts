import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = UserMongooseEntity & Document;

@Schema({ collection: 'users', timestamps: true })
export class UserMongooseEntity {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true, unique: true, index: true })
  username: string;

  @Prop({ required: true })
  dateOfBirth: Date;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, default: false })
  hasPlayedBefore: boolean;

  @Prop({ required: true, default: 'user' })
  role: string;

  @Prop({ required: true, default: 0 })
  failedLoginAttempts: number;

  @Prop({ required: false })
  lockUntil?: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserMongooseEntity);
export const UserSchemaName = UserMongooseEntity.name;
