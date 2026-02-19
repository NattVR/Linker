import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PostulanteService } from './postulante.service';
import { CreatePostulanteDto } from './dto/create-postulante.dto';
import { UpdatePostulanteDto } from './dto/update-postulante.dto';

@Controller('postulante')
export class PostulanteController {
  constructor(private readonly postulanteService: PostulanteService) { }

  @Post('registro')
  async register(@Body() dto: CreatePostulanteDto) {
    return this.postulanteService.createPostulante(dto);
  }

  @Get('perfil-completo/:id')
  async getPerfilCompleto(@Param('id') id: string) {
    return this.postulanteService.getPerfilCompleto(id);
  }

  @Delete('limpiar/:id')
  async limpiarPerfil(@Param('id') id: string) {
    return this.postulanteService.limpiarPerfilPostulante(id);
  }

  @Get(':id')
  async getPostulante(@Param('id') id: string) {
    return this.postulanteService.getPostulanteById(id);
  }

  @Get()
  findAll() {
    return this.postulanteService.findAll();
  }

  @Get('postulantes/:id')
  async getPostulantesForEmpresa(@Param('id') vacanteId: string) {
    return this.postulanteService.getPostulantes(vacanteId);
  }

  @Patch(':id')
  async updatePostulante(
    @Param('id') id: string,
    @Body() createPostulanteDto: CreatePostulanteDto,
  ) {
    return this.postulanteService.updatePostulante(id, createPostulanteDto);
  }

}
