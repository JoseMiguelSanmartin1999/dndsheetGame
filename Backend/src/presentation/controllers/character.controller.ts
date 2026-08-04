import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CharacterService } from '../../application/services/character.service';
import { Character } from '../../domain/models/character.model';

@ApiTags('personajes')
@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo personaje' })
  @ApiResponse({ status: 201, description: 'Personaje creado con éxito.' })
  @ApiResponse({ status: 400, description: 'El límite de personajes ha sido superado o datos inválidos.' })
  async create(@Body() character: Character) {
    return this.characterService.create(character);
  }

  @Get()
  @ApiOperation({ summary: 'Listar personajes de un usuario' })
  @ApiQuery({ name: 'userId', required: true, description: 'ID del usuario dueño de los personajes' })
  @ApiResponse({ status: 200, description: 'Lista de personajes recuperada con éxito.' })
  async findByUserId(@Query('userId') userId: string) {
    return this.characterService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un personaje por su ID' })
  @ApiResponse({ status: 200, description: 'Personaje encontrado con éxito.' })
  @ApiResponse({ status: 404, description: 'Personaje no encontrado.' })
  async findById(@Param('id') id: string) {
    return this.characterService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un personaje existente' })
  @ApiResponse({ status: 200, description: 'Personaje actualizado con éxito.' })
  @ApiResponse({ status: 404, description: 'Personaje no encontrado.' })
  async update(@Param('id') id: string, @Body() character: Partial<Character>) {
    return this.characterService.update(id, character);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un personaje' })
  @ApiResponse({ status: 200, description: 'Personaje eliminado con éxito.' })
  @ApiResponse({ status: 404, description: 'Personaje no encontrado.' })
  async delete(@Param('id') id: string) {
    const success = await this.characterService.delete(id);
    return { success };
  }
}
