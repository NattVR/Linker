import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PostulanteService } from './postulante.service';
import { CreatePostulanteDto } from './dto/create-postulante.dto';

@Controller('postulante')
export class PostulanteController {
  constructor(private readonly postulanteService: PostulanteService) {}

  @Post('registro')
  register(@Body() dto: CreatePostulanteDto) {
    return this.postulanteService.createPostulante(dto);
  }

  @Get('perfil-completo/:id')
  getPerfilCompleto(@Param('id') id: string) {
    return this.postulanteService.getPerfilCompleto(id);
  }

  @Delete('limpiar/:id')
  limpiarPerfil(@Param('id') id: string) {
    return this.postulanteService.limpiarPerfilPostulante(id);
  }

  @Get('postulantes/:id')
  getPostulantesForEmpresa(@Param('id') vacanteId: string) {
    return this.postulanteService.getPostulantes(vacanteId);
  }

  @Get(':id')
  getPostulante(@Param('id') id: string) {
    return this.postulanteService.getPostulanteById(id);
  }

  @Get()
  findAll() {
    return this.postulanteService.findAll();
  }

  @Patch(':id')
  updatePostulante(@Param('id') id: string, @Body() dto: CreatePostulanteDto) {
    return this.postulanteService.updatePostulante(id, dto);
  }
}