import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClassMongooseEntity, ClassSchemaName } from '../../infrastructure/persistence/class.schema';
import { BackgroundMongooseEntity, BackgroundSchemaName } from '../../infrastructure/persistence/background.schema';
import { OriginMongooseEntity, OriginSchemaName } from '../../infrastructure/persistence/origin.schema';

@ApiTags('Game Data')
@Controller('game-data')
export class GameDataController {
  constructor(
    @InjectModel(ClassSchemaName) private readonly classModel: Model<ClassMongooseEntity>,
    @InjectModel(BackgroundSchemaName) private readonly backgroundModel: Model<BackgroundMongooseEntity>,
    @InjectModel(OriginSchemaName) private readonly originModel: Model<OriginMongooseEntity>,
  ) {}

  @Get('classes')
  @ApiOperation({ summary: 'Obtener todas las clases de D&D' })
  @ApiResponse({ status: 200, description: 'Lista de clases recuperada con éxito.' })
  async getClasses() {
    return this.classModel.find().collation({ locale: 'es', strength: 1 }).sort({ name: 1 }).exec();
  }

  @Get('backgrounds')
  @ApiOperation({ summary: 'Obtener todos los trasfondos de D&D' })
  @ApiResponse({ status: 200, description: 'Lista de trasfondos recuperada con éxito.' })
  async getBackgrounds() {
    return this.backgroundModel.find().collation({ locale: 'es', strength: 1 }).sort({ name: 1 }).exec();
  }

  @Get('origins')
  @ApiOperation({ summary: 'Obtener todos los orígenes de D&D' })
  @ApiResponse({ status: 200, description: 'Lista de orígenes recuperada con éxito.' })
  async getOrigins() {
    return this.originModel.find().collation({ locale: 'es', strength: 1 }).sort({ name: 1 }).exec();
  }
}
