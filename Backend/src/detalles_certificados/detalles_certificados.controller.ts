import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { DetallesCertificadosService } from './detalles_certificados.service';
import { CreateDetallesCertificadoDto } from './dto/create-detalles_certificado.dto';
import { UpdateDetallesCertificadoDto } from './dto/update-detalles_certificado.dto';

@ApiTags('Detalles Certificados')
@Controller('detalles-certificados')
export class DetallesCertificadosController {
  constructor(
    private readonly detallesCertificadosService: DetallesCertificadosService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Agregar certificado a una empresa' })
  @ApiBody({ type: CreateDetallesCertificadoDto })
  @ApiOkResponse({
    description: 'Detalle de certificado creado',
    schema: {
      example: {
        id_detalles_certificados: '95cc8683-9ec2-43a0-84e8-8c3e4f3ac1dc',
        fecha_emision: '2025-01-01',
        fecha_caducidad: '2027-01-01',
      },
    },
  })
  create(@Body() createDetallesCertificadoDto: CreateDetallesCertificadoDto) {
    return this.detallesCertificadosService.create(createDetallesCertificadoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los detalles de certificados' })
  @ApiOkResponse({
    description: 'Detalles encontrados',
    schema: {
      example: [
        {
          id_detalles_certificados: '95cc8683-9ec2-43a0-84e8-8c3e4f3ac1dc',
          fecha_emision: '2025-01-01',
          fecha_caducidad: '2027-01-01',
        },
      ],
    },
  })
  findAll() {
    return this.detallesCertificadosService.findAll();
  }

  @Get('empresa/:id')
  @ApiOperation({ summary: 'Listar certificados de una empresa' })
  @ApiParam({ name: 'id', description: 'ID de la empresa' })
  @ApiOkResponse({
    description: 'Certificados asociados a la empresa',
    schema: {
      example: [
        {
          id_detalles_certificados: '95cc8683-9ec2-43a0-84e8-8c3e4f3ac1dc',
          certificado: {
            id_certificado: 'e4d2cda3-8247-4f74-a71b-1403f5bd0f4b',
            nombre_certificado: 'Certificado de Calidad',
          },
          fecha_emision: '2025-01-01',
          fecha_caducidad: '2027-01-01',
        },
      ],
    },
  })
  findCertificadosForEmpresa(@Param('id') id: string) {
    return this.detallesCertificadosService.findAllByEmpresa(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar detalle de certificado' })
  @ApiParam({ name: 'id', description: 'ID del detalle de certificado' })
  @ApiBody({ type: UpdateDetallesCertificadoDto })
  @ApiOkResponse({
    description: 'Detalle actualizado',
    schema: {
      example: {
        id_detalles_certificados: '95cc8683-9ec2-43a0-84e8-8c3e4f3ac1dc',
        fecha_caducidad: '2028-01-01',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Certificado no encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateDetallesCertificadoDto: UpdateDetallesCertificadoDto,
  ) {
    return this.detallesCertificadosService.update(id, updateDetallesCertificadoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar detalle de certificado' })
  @ApiParam({ name: 'id', description: 'ID del detalle de certificado' })
  @ApiOkResponse({
    description: 'Confirmación de eliminación',
    schema: { example: { message: 'Certificado {id} eliminado correctamente' } },
  })
  @ApiNotFoundResponse({ description: 'Certificado no encontrado' })
  remove(@Param('id') id: string) {
    return this.detallesCertificadosService.remove(id);
  }
}
