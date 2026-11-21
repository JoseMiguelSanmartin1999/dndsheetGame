import { User } from '../models/user.model';

export interface IUserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  /** Solo actualiza el estado de inicio de sesión (intentos fallidos y bloqueo). */
  update(user: User): Promise<User>;
}
