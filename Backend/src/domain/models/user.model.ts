export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended';

export class User {
  id?: string;
  email: string;
  username: string;
  dateOfBirth: Date;
  passwordHash: string;
  hasPlayedBefore: boolean;
  role: UserRole;
  status?: UserStatus;
  maxCharacters?: number;
  failedLoginAttempts: number;
  lockUntil?: Date;
  createdAt?: Date;
}
