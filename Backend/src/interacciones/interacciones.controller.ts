import {
  Controller,
  Get,
  Post,
  Body,
  Param
} from '@nestjs/common';
import { InteraccionesService } from './interacciones.service';
import { CreateInteraccioneDto } from './dto/create-interaccione.dto';

@Controller('interacciones')
export class InteraccionesController {
  constructor(private readonly interaccionesService: InteraccionesService) { }

  @Post()
  create(@Body() createInteraccioneDto: CreateInteraccioneDto) {
    return this.interaccionesService.createInteraction(createInteraccioneDto);
  }

  @Get('filter/vacantes/:id')
  findVacantesExcluidos(@Param('id') postulanteId: string) {
    return this.interaccionesService.isFilteredVacantes(postulanteId);
  }

  @Get('filter/postulantes/:id')
  findPostulantesExcluidos(@Param('id') vacanteId: string) {
    return this.interaccionesService.isFilteredPostulantes(vacanteId);
  }

  @Get('check-match/:postulanteId/:vacanteId')
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
