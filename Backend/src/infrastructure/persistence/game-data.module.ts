import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClassMongooseEntity, ClassSchema, ClassSchemaName } from './class.schema';
import { BackgroundMongooseEntity, BackgroundSchema, BackgroundSchemaName } from './background.schema';
import { OriginMongooseEntity, OriginSchema, OriginSchemaName } from './origin.schema';
import { GameDataSeeder } from './game-data.seeder';
import { GameDataController } from '../../presentation/controllers/game-data.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClassSchemaName, schema: ClassSchema },
      { name: BackgroundSchemaName, schema: BackgroundSchema },
      { name: OriginSchemaName, schema: OriginSchema },
    ]),
  ],
  controllers: [GameDataController],
  providers: [GameDataSeeder],
  exports: [MongooseModule],
})
export class GameDataModule {}
