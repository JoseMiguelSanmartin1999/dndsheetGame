import { Injectable, ConflictException, Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '../../domain/models/user.model';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { RegisterUserDto } from '../dto/register-user.dto';

export const USER_REPOSITORY_TOKEN = 'IUserRepository';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async register(dto: RegisterUserDto): Promise<Omit<User, 'passwordHash'>> {
    // 1. Verificar si el email ya está en uso
    const existingEmail = await this.userRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    // 2. Verificar si el nombre de usuario ya está ocupado
    const existingUser = await this.userRepository.findByUsername(dto.username);
    if (existingUser) {
      throw new ConflictException('El nombre de usuario ya está en uso.');
    }

    // 3. Hashear la contraseña usando bcryptjs de manera segura
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // 4. Crear la entidad de dominio
    const newUser: User = {
      email: dto.email,
      username: dto.username,
      dateOfBirth: new Date(dto.dateOfBirth),
      passwordHash,
      hasPlayedBefore: dto.hasPlayedBefore,
    };

    // 5. Guardar en base de datos
    const savedUser = await this.userRepository.create(newUser);

    // 6. Retornar los datos del usuario excluyendo el hash de la contraseña por seguridad
    const { passwordHash: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }
}
