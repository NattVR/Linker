import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PostulanteService } from './postulante.service';
import { CreatePostulanteDto } from './dto/create-postulante.dto';
import { UpdatePostulanteDto } from './dto/update-postulante.dto';

@ApiTags('Postulante')
@Controller('postulante')
export class PostulanteController {
  constructor(private readonly postulanteService: PostulanteService) {}

  @Post('registro')
  @ApiOperation({ summary: 'Registrar postulante' })
  @ApiBody({ type: CreatePostulanteDto })
  @ApiOkResponse({
    description: 'Postulante registrado',
    schema: {
      example: {
        message: 'Postulante registrado con éxito',
        postulante: {
          id: '74e62d07-a20d-4be3-95f5-8d46db9e8f9a',
          name: 'Camila',
          lastname: 'Gomez',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'No se encontró el perfil de usuario asociado' })
  register(@Body() dto: CreatePostulanteDto) {
    return this.postulanteService.createPostulante(dto);
  }

  @Get('perfil-completo/:id')
  @ApiOperation({ summary: 'Consultar perfil completo de postulante' })
  @ApiParam({ name: 'id', description: 'ID del postulante' })
  @ApiOkResponse({
    description: 'Perfil completo',
    schema: {
      nullable: true,
      example: {
        id: '74e62d07-a20d-4be3-95f5-8d46db9e8f9a',
        postulanteHabilidades: [],
        postulanteIdiomas: [],
        postulanteEstudios: [],
      },
    },
  })
  getPerfilCompleto(@Param('id') id: string) {
    return this.postulanteService.getPerfilCompleto(id);
  }

  @Delete('limpiar/:id')
  @ApiOperation({ summary: 'Limpiar relaciones del perfil postulante' })
  @ApiParam({ name: 'id', description: 'ID del postulante' })
  @ApiOkResponse({
    description: 'Resultado de limpieza',
    schema: { example: { message: 'Perfil limpiado' } },
  })
  limpiarPerfil(@Param('id') id: string) {
    return this.postulanteService.limpiarPerfilPostulante(id);
  }

  @Get('postulantes/:id')
  @ApiOperation({ summary: 'Listar postulantes sugeridos para una vacante' })
  @ApiParam({ name: 'id', description: 'ID de la vacante' })
  @ApiOkResponse({
    description: 'Postulantes filtrados',
    schema: {
      example: [
        {
          id: '74e62d07-a20d-4be3-95f5-8d46db9e8f9a',
          name: 'Camila',
          idiomas: ['Ingles'],
          habilidades: ['Testing'],
        },
      ],
    },
  })
  getPostulantesForEmpresa(@Param('id') vacanteId: string) {
    return this.postulanteService.getPostulantes(vacanteId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar nombre del postulante por ID' })
  @ApiParam({ name: 'id', description: 'ID del postulante' })
  @ApiOkResponse({
    description: 'Nombre del postulante',
    schema: { example: { name: 'Camila', lastname: 'Gomez' } },
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  getPostulante(@Param('id') id: string) {
    return this.postulanteService.getPostulanteById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar postulantes' })
  @ApiOkResponse({
    description: 'Lista de postulantes',
    schema: {
      example: [
        {
          id: '74e62d07-a20d-4be3-95f5-8d46db9e8f9a',
          name: 'Camila',
          lastname: 'Gomez',
        },
      ],
    },
  })
  findAll() {
    return this.postulanteService.findAll();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar postulante' })
  @ApiParam({ name: 'id', description: 'ID del postulante' })
  @ApiBody({ type: UpdatePostulanteDto })
  @ApiOkResponse({
    description: 'Postulante actualizado',
    schema: {
      example: {
        id: '74e62d07-a20d-4be3-95f5-8d46db9e8f9a',
        curriculum: 'cv-camila.pdf',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Postulante no encontrado' })
  updatePostulante(@Param('id') id: string, @Body() dto: UpdatePostulanteDto) {
    return this.postulanteService.updatePostulante(id, dto);
  }
}
