import { Injectable, ConflictException, Inject, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '../../domain/models/user.model';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { RegisterUserDto } from '../dto/register-user.dto';
import { signJwt } from '../../infrastructure/security/jwt';

/** Duración de la sesión: 7 días. */
const SESSION_SECONDS = 7 * 24 * 60 * 60;
import { LoginUserDto } from '../dto/login-user.dto';

export const USER_REPOSITORY_TOKEN = 'IUserRepository';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async register(dto: RegisterUserDto) {
    // 1. Verificar si el email ya está en uso
    const existingEmail = await this.userRepository.findByEmail(dto.email.toLowerCase());
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
      email: dto.email.toLowerCase(),
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
    return this.publicUser(savedUser);
  }

  async login(dto: LoginUserDto) {
    // 1. Buscar usuario por email
    const user = await this.userRepository.findByEmail(dto.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }
    if (user.status === 'suspended') {
      throw new ForbiddenException('Tu cuenta está suspendida. Contacta con el administrador.');
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

    // 5. Generar token de sesión firmado (JWT HS256)
    const token = signJwt(
      { sub: user.id!, role: user.role, username: user.username },
      process.env.JWT_SECRET ?? '',
      SESSION_SECONDS,
    );

    return {
      user: this.publicUser(user),
      token,
    };
  }

  async me(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedException('La cuenta ya no existe.');
    return this.publicUser(user);
  }

  /** Datos del usuario que se pueden enviar al navegador. */
  private publicUser(user: User) {
    const { passwordHash: _, failedLoginAttempts: __, lockUntil: ___, ...rest } = user;
    return rest;
  }
}
