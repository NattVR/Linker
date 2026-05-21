import {
  Controller,
  Get,
  Post,
  Body,
  Param
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { InteraccionesService } from './interacciones.service';
import { CreateInteraccioneDto } from './dto/create-interaccione.dto';

@ApiTags('Interacciones')
@Controller('interacciones')
export class InteraccionesController {
  constructor(private readonly interaccionesService: InteraccionesService) { }

  @Post()
  @ApiOperation({ summary: 'Crear o actualizar interacción' })
  @ApiBody({ type: CreateInteraccioneDto })
  @ApiOkResponse({
    description: 'Interacción registrada',
    schema: {
      example: {
        id_interaccion: '3ff300f8-0902-4db9-bc75-f5d8a92fe158',
        accionEmpresa: 'like',
        accionPostulante: 'no_interaccion',
      },
    },
  })
  create(@Body() createInteraccioneDto: CreateInteraccioneDto) {
    return this.interaccionesService.createInteraction(createInteraccioneDto);
  }

  @Get('filter/vacantes/:id')
  @ApiOperation({ summary: 'Listar vacantes excluidas para postulante' })
  @ApiParam({ name: 'id', description: 'ID del postulante' })
  @ApiOkResponse({
    description: 'IDs de vacantes excluidas',
    schema: { example: ['7d8a8fe6-71c6-4b17-9e13-0058c30117cb'] },
  })
  findVacantesExcluidos(@Param('id') postulanteId: string) {
    return this.interaccionesService.isFilteredVacantes(postulanteId);
  }

  @Get('filter/postulantes/:id')
  @ApiOperation({ summary: 'Listar postulantes excluidos para vacante' })
  @ApiParam({ name: 'id', description: 'ID de la vacante' })
  @ApiOkResponse({
    description: 'IDs de postulantes excluidos',
    schema: { example: ['74e62d07-a20d-4be3-95f5-8d46db9e8f9a'] },
  })
  findPostulantesExcluidos(@Param('id') vacanteId: string) {
    return this.interaccionesService.isFilteredPostulantes(vacanteId);
  }

  @Get('check-match/:postulanteId/:vacanteId')
  @ApiOperation({ summary: 'Consultar interacción puntual (vacante-postulante)' })
  @ApiParam({ name: 'postulanteId', description: 'ID del postulante' })
  @ApiParam({ name: 'vacanteId', description: 'ID de la vacante' })
  @ApiOkResponse({
    description: 'Interacción encontrada o null',
    schema: {
      nullable: true,
      example: {
        id_interaccion: '3ff300f8-0902-4db9-bc75-f5d8a92fe158',
        accionEmpresa: 'like',
        accionPostulante: 'like',
      },
    },
  })
  checkMatch(
    @Param('postulanteId') postulanteId: string,
    @Param('vacanteId') vacanteId: string,
  ) {

    return this.interaccionesService.findOne(
      vacanteId,
      postulanteId,
    );
  }
}
