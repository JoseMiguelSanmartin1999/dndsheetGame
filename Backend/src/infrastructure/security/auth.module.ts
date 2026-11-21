import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from '../../presentation/controllers/auth.controller';
import { AuthService, USER_REPOSITORY_TOKEN } from '../../application/services/auth.service';
import { PrismaUserRepository } from '../persistence/prisma/prisma-user.repository';
import { AuthGuard } from './auth.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: USER_REPOSITORY_TOKEN, useClass: PrismaUserRepository },
    // Todas las rutas quedan protegidas por defecto.
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AuthService, USER_REPOSITORY_TOKEN],
})
export class AuthModule {}
