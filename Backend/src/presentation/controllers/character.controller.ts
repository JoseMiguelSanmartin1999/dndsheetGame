import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CharacterService } from '../../application/services/character.service';
import type { Character } from '../../domain/models/character.model';
import { CurrentUser } from '../../infrastructure/security/auth.decorators';
import type { AuthUser } from '../../infrastructure/security/auth.decorators';

@ApiTags('personajes')
@ApiBearerAuth()
@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un personaje para el usuario de la sesión' })
  @ApiResponse({ status: 400, description: 'Límite de personajes superado o datos inválidos.' })
  async create(@Body() character: Partial<Character>, @CurrentUser() user: AuthUser) {
    return this.characterService.create(character, user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar los personajes del usuario de la sesión' })
  async findMine(@CurrentUser() user: AuthUser) {
    return this.characterService.listMine(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener uno de tus personajes' })
  @ApiResponse({ status: 404, description: 'No existe o no es tuyo.' })
  async findById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.characterService.getOwned(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar uno de tus personajes' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() changes: Partial<Character>, @CurrentUser() user: AuthUser) {
    return this.characterService.update(id, changes, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar uno de tus personajes' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return { success: await this.characterService.delete(id, user) };
  }
}
