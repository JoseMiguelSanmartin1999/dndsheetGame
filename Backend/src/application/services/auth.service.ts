import { Injectable, ConflictException, Inject, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '../../domain/models/user.model';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';

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

    // 4. Crear la entidad de dominio con rol por defecto y contadores de bloqueo
    const newUser: User = {
      email: dto.email,
      username: dto.username,
      dateOfBirth: new Date(dto.dateOfBirth),
      passwordHash,
      hasPlayedBefore: dto.hasPlayedBefore,
      role: 'user',
      failedLoginAttempts: 0,
      lockUntil: undefined,
    };

    // 5. Guardar en base de datos
    const savedUser = await this.userRepository.create(newUser);

    // 6. Retornar los datos del usuario excluyendo el hash de la contraseña por seguridad
    const { passwordHash: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async login(dto: LoginUserDto): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    // 1. Buscar usuario por email
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    // 2. Verificar si la cuenta está bloqueada temporalmente
    if (user.lockUntil) {
      const lockTime = new Date(user.lockUntil);
      const now = new Date();
      if (lockTime > now) {
        const remainingMs = lockTime.getTime() - now.getTime();
        const remainingMin = Math.ceil(remainingMs / (60 * 1000));
        throw new ForbiddenException(
          `La cuenta está bloqueada temporalmente por exceso de intentos fallidos. Inténtalo de nuevo en ${remainingMin} minutos.`
        );
      } else {
        // El tiempo de bloqueo ya expiró, reseteamos contadores
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
      }
    }

    // 3. Verificar contraseña
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= 4) {
        // Bloquear por 10 minutos (10 * 60 * 1000 ms)
        user.lockUntil = new Date(Date.now() + 10 * 60 * 1000);
        await this.userRepository.update(user);
        throw new ForbiddenException(
          'La cuenta ha sido bloqueada temporalmente durante 10 minutos debido a 4 intentos de inicio de sesión fallidos.'
        );
      } else {
        await this.userRepository.update(user);
        const remainingAttempts = 4 - user.failedLoginAttempts;
        throw new UnauthorizedException(
          `Credenciales incorrectas. Te quedan ${remainingAttempts} intentos antes de que tu cuenta sea bloqueada por 10 minutos.`
        );
      }
    }

    // 4. Si todo es correcto, limpiar intentos fallidos
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await this.userRepository.update(user);

    // 5. Generar token de sesión (simulado con firma básica por cuestiones de portabilidad)
    const token = `adventure-session-token-${user.id}-${Date.now()}`;

    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
    };
  }
}
