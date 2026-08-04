import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './infrastructure/security/auth.module';
import { GameDataModule } from './infrastructure/persistence/game-data.module';
import { CharacterModule } from './infrastructure/persistence/character.module';
import { GameRulesController } from './presentation/controllers/game-rules.controller';
import { GameRulesService } from './application/services/game-rules.service';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/dnd_db'),
    AuthModule,
    GameDataModule,
    CharacterModule,
  ],
  controllers: [AppController, GameRulesController],
  providers: [AppService, GameRulesService],
})
export class AppModule {}
