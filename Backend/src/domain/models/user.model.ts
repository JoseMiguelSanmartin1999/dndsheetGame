export class User {
  id?: string;
  email: string;
  username: string;
  dateOfBirth: Date;
  passwordHash: string;
  hasPlayedBefore: boolean;
  role: string;
  failedLoginAttempts: number;
  lockUntil?: Date;
  createdAt?: Date;
}
