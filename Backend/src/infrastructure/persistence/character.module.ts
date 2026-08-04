import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CharacterController } from '../../presentation/controllers/character.controller';
import { CharacterService, CHARACTER_REPOSITORY_TOKEN } from '../../application/services/character.service';
import { MongoCharacterRepository } from './mongo-character.repository';
import { CharacterMongooseEntity, CharacterSchema } from './character.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CharacterMongooseEntity.name, schema: CharacterSchema },
    ]),
  ],
  controllers: [CharacterController],
  providers: [
    CharacterService,
    {
      provide: CHARACTER_REPOSITORY_TOKEN,
      useClass: MongoCharacterRepository,
    },
  ],
  exports: [CharacterService],
})
export class CharacterModule {}
