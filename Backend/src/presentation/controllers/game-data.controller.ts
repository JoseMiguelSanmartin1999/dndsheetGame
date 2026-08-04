import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClassMongooseEntity, ClassSchemaName } from '../../infrastructure/persistence/class.schema';
import { BackgroundMongooseEntity, BackgroundSchemaName } from '../../infrastructure/persistence/background.schema';
import { OriginMongooseEntity, OriginSchemaName } from '../../infrastructure/persistence/origin.schema';
import { RaceMongooseEntity, RaceSchemaName } from '../../infrastructure/persistence/race.schema';

@ApiTags('Game Data')
@Controller('game-data')
export class GameDataController {
  constructor(
    @InjectModel(ClassSchemaName) private readonly classModel: Model<ClassMongooseEntity>,
    @InjectModel(BackgroundSchemaName) private readonly backgroundModel: Model<BackgroundMongooseEntity>,
    @InjectModel(OriginSchemaName) private readonly originModel: Model<OriginMongooseEntity>,
    @InjectModel(RaceSchemaName) private readonly raceModel: Model<RaceMongooseEntity>,
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
  @ApiOperation({ summary: 'Obtener todos los orígenes de D&D (redireccionado a colección de razas)' })
  @ApiResponse({ status: 200, description: 'Lista de orígenes recuperada con éxito.' })
  async getOrigins() {
    return this.raceModel.find().collation({ locale: 'es', strength: 1 }).sort({ name: 1 }).exec();
  }

  @Get('races')
  @ApiOperation({ summary: 'Obtener todas las razas en general' })
  @ApiResponse({ status: 200, description: 'Lista de razas recuperada con éxito.' })
  async getRaces() {
    return this.raceModel.find().collation({ locale: 'es', strength: 1 }).sort({ name: 1 }).exec();
  }

  @Put('races/:id')
  @ApiOperation({ summary: 'Editar una raza existente por ID' })
  @ApiResponse({ status: 200, description: 'Raza actualizada con éxito.' })
  @ApiResponse({ status: 404, description: 'Raza no encontrada.' })
  async updateRace(@Param('id') id: string, @Body() updateData: Partial<RaceMongooseEntity>) {
    return this.raceModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }
}
