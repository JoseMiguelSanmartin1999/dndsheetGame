import { Module } from '@nestjs/common';
import { CharacterController } from '../../presentation/controllers/character.controller';
import { CharacterService, CHARACTER_REPOSITORY_TOKEN } from '../../application/services/character.service';
import { AuthModule } from '../security/auth.module';
import { GameDataModule } from './game-data.module';
import { PrismaCharacterRepository } from './prisma/prisma-character.repository';

@Module({
  imports: [AuthModule, GameDataModule],
  controllers: [CharacterController],
  providers: [
    CharacterService,
    { provide: CHARACTER_REPOSITORY_TOKEN, useClass: PrismaCharacterRepository },
  ],
  exports: [CharacterService],
})
export class CharacterModule {}
