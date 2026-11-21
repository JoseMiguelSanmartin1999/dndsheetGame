import { Module } from '@nestjs/common';
import { GameDataController } from '../../presentation/controllers/game-data.controller';
import { ContentController } from '../../presentation/controllers/content.controller';
import { ContentLookupService } from './prisma/content-lookup.service';

@Module({
  controllers: [GameDataController, ContentController],
  providers: [ContentLookupService],
  exports: [ContentLookupService],
})
export class GameDataModule {}
