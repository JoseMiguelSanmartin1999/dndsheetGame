export class User {
  id?: string;
  email: string;
  username: string;
  dateOfBirth: Date;
  passwordHash: string;
  hasPlayedBefore: boolean;
  createdAt?: Date;
}
