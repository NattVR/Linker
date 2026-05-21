import { Controller, Get, Post, Body} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CertificadosService } from './certificados.service';
import { CreateCertificadoDto } from './dto/create-certificado.dto';

@ApiTags('Certificados')
@Controller('certificados')
export class CertificadosController {
  constructor(private readonly certificadosService: CertificadosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear certificado en catálogo' })
  @ApiBody({ type: CreateCertificadoDto })
  @ApiOkResponse({
    description: 'Certificado creado',
    schema: {
      example: {
        id_certificado: 'e4d2cda3-8247-4f74-a71b-1403f5bd0f4b',
        entidad_emisora: 'Camara de Comercio',
        nombre_certificado: 'Certificado de Calidad',
      },
    },
  })
  create(@Body() createCertificadoDto: CreateCertificadoDto) {
    return this.certificadosService.create(createCertificadoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar certificados del catálogo' })
  @ApiOkResponse({
    description: 'Certificados encontrados',
    schema: {
      example: [
        {
          id_certificado: 'e4d2cda3-8247-4f74-a71b-1403f5bd0f4b',
          entidad_emisora: 'Camara de Comercio',
          nombre_certificado: 'Certificado de Calidad',
        },
      ],
    },
  })
  findAll() {
    return this.certificadosService.findAll();
  }

}
