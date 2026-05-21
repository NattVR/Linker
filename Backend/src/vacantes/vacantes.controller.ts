import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { VacantesService } from './vacantes.service';
import { CreateVacanteDto } from './dto/create-vacante.dto';
import { UpdateVacanteDto } from './dto/update-vacante.dto';

@ApiTags('Vacantes')
@Controller('vacantes')
export class VacantesController {
  constructor(private readonly vacantesService: VacantesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear vacante' })
  @ApiBody({ type: CreateVacanteDto })
  @ApiOkResponse({
    description: 'Vacante creada',
    schema: {
      example: {
        id_vacante: '7d8a8fe6-71c6-4b17-9e13-0058c30117cb',
        titulo: 'QA Automation Engineer',
        salario: 4500000,
      },
    },
  })
  create(@Body() dto: CreateVacanteDto) {
    return this.vacantesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vacantes' })
  @ApiOkResponse({
    description: 'Lista de vacantes',
    schema: {
      example: [
        {
          id_vacante: '7d8a8fe6-71c6-4b17-9e13-0058c30117cb',
          titulo: 'QA Automation Engineer',
          empresa: { id: 'f4f9bdf3-80a8-4f04-9f9a-e6e5c99f43b8' },
        },
      ],
    },
  })
  findAll() {
    return this.vacantesService.findAll();
  }

  @Get('empresaId/:empresa')
  @ApiOperation({ summary: 'Listar vacantes por empresa' })
  @ApiParam({ name: 'empresa', description: 'ID de la empresa' })
  @ApiOkResponse({
    description: 'Vacantes formateadas de la empresa',
    schema: {
      example: [
        {
          id_vacante: '7d8a8fe6-71c6-4b17-9e13-0058c30117cb',
          titulo: 'QA Automation Engineer',
          idiomas: ['Ingles'],
          habilidades: ['Testing'],
        },
      ],
    },
  })
  findVacantesOfEmpresa(@Param('empresa') empresaId: string) {
    return this.vacantesService.findAllVacantesofEmpresa(empresaId);
  }

  @Get('vacantes/:id')
  @ApiOperation({ summary: 'Listar vacantes sugeridas para postulante' })
  @ApiParam({ name: 'id', description: 'ID del postulante' })
  @ApiOkResponse({
    description: 'Vacantes filtradas',
    schema: {
      example: [
        {
          id_vacante: '7d8a8fe6-71c6-4b17-9e13-0058c30117cb',
          titulo: 'QA Automation Engineer',
          idiomas: ['Ingles'],
          habilidades: ['Testing'],
        },
      ],
    },
  })
  getVacantes(@Param('id') postulanteId: string) {
    return this.vacantesService.getVacantes(postulanteId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar vacante' })
  @ApiParam({ name: 'id', description: 'ID de la vacante' })
  @ApiBody({ type: UpdateVacanteDto })
  @ApiOkResponse({
    description: 'Vacante actualizada',
    schema: {
      example: {
        id_vacante: '7d8a8fe6-71c6-4b17-9e13-0058c30117cb',
        titulo: 'QA Automation Senior',
      },
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateVacanteDto) {
    return this.vacantesService.update(id, dto);
  }
}
