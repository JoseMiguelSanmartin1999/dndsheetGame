import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GameRulesService } from '../../application/services/game-rules.service';

@ApiTags('Game Rules')
@Controller('game-rules')
export class GameRulesController {
  constructor(private readonly gameRulesService: GameRulesService) {}

  @Get('sizes')
  @ApiOperation({ summary: 'Obtener información de tamaño y límites de altura según la raza' })
  @ApiQuery({ name: 'raceName', required: true, description: 'Nombre de la raza/origen' })
  @ApiResponse({ status: 200, description: 'Información de tamaño devuelta con éxito.' })
  getRaceSizeInfo(@Query('raceName') raceName: string) {
    return this.gameRulesService.getRaceSizeInfo(raceName);
  }

  @Post('carrying-capacity')
  @ApiOperation({ summary: 'Calcular capacidad de carga (kg/lb) según fuerza, tamaño y rasgos' })
  @ApiResponse({ status: 201, description: 'Capacidad de carga calculada con éxito.' })
  calculateCarryingCapacity(
    @Body() body: { strength: number; sizeClass: string; isGoliath: boolean }
  ) {
    return this.gameRulesService.calculateCarryingCapacity(
      body.strength,
      body.sizeClass,
      body.isGoliath
    );
  }

  @Post('roll-dice')
  @ApiOperation({ summary: 'Lanzar 4d6 descartando el menor para generar una característica' })
  @ApiResponse({ status: 201, description: 'Lanzamiento realizado con éxito.' })
  rollDice() {
    return this.gameRulesService.rollSingleStat();
  }
}
