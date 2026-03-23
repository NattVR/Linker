import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { VacantesService } from './vacantes.service';
import { CreateVacanteDto } from './dto/create-vacante.dto';
import { UpdateVacanteDto } from './dto/update-vacante.dto';

@Controller('vacantes')
export class VacantesController {
  constructor(private readonly vacantesService: VacantesService) {}

  @Post()
  create(@Body() dto: CreateVacanteDto) {
    return this.vacantesService.create(dto);
  }

  @Get()
  findAll() {
    return this.vacantesService.findAll();
  }

  @Get('empresaId/:empresa')
  findVacantesOfEmpresa(@Param('empresa') empresaId: string) {
    return this.vacantesService.findAllVacantesofEmpresa(empresaId);
  }

  @Get('vacantes/:id')
  getVacantes(@Param('id') postulanteId: string) {
    return this.vacantesService.getVacantes(postulanteId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVacanteDto) {
    return this.vacantesService.update(id, dto);
  }
}