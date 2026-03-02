import { Controller, Get, Post, Body, Param, Query, Put } from '@nestjs/common';
import { VacantesService } from './vacantes.service';
import { CreateVacanteDto } from './dto/create-vacante.dto';
import { UpdateVacanteDto } from './dto/update-vacante.dto';

@Controller('vacantes')
export class VacantesController {
  constructor(private readonly vacantesService: VacantesService) { }

  @Post()
  create(@Body() createVacanteDto: CreateVacanteDto) {
    return this.vacantesService.create(createVacanteDto);
  }

  @Get()
  findAll() {
    return this.vacantesService.findAll();
  }

  @Get('empresaId/:empresa')
  findVacantesOfEmpresa(@Param('empresa') empresaId: string) {
    return this.vacantesService.findAllVacantesofEmpresa(empresaId);
  }

  /*@Get('vacante/:vacante')
  findEmpresaOfVacante(@Param('vacante') vacanteId :string) {
    return this.vacantesService.getEmpresaOfVacante(vacanteId);
  }*/

  @Get('vacantes/:id')
  getVacantes(@Param('id') postulanteId: string) {
    return this.vacantesService.getVacantes(postulanteId);
  }

  @Put(':id')
  update(@Param('id') id: string,
    @Body() updateVacanteDto: UpdateVacanteDto,) {
    return this.vacantesService.update(id, updateVacanteDto);
  }
}
