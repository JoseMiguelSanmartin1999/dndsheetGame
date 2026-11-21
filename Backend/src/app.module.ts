import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './infrastructure/security/auth.module';
import { GameDataModule } from './infrastructure/persistence/game-data.module';
import { CharacterModule } from './infrastructure/persistence/character.module';
import { AdminModule } from './infrastructure/admin.module';
import { GameRulesController } from './presentation/controllers/game-rules.controller';
import { GameRulesService } from './application/services/game-rules.service';

@Module({
  imports: [PrismaModule, AuthModule, GameDataModule, CharacterModule, AdminModule],
  controllers: [AppController, GameRulesController],
  providers: [AppService, GameRulesService],
})
export class AppModule {}
