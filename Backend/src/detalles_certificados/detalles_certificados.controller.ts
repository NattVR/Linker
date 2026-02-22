import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DetallesCertificadosService } from './detalles_certificados.service';
import { CreateDetallesCertificadoDto } from './dto/create-detalles_certificado.dto';
import { UpdateDetallesCertificadoDto } from './dto/update-detalles_certificado.dto';

@Controller('detalles-certificados')
export class DetallesCertificadosController {
  constructor(
    private readonly detallesCertificadosService: DetallesCertificadosService,
  ) {}

  @Post()
  create(@Body() createDetallesCertificadoDto: CreateDetallesCertificadoDto) {
    return this.detallesCertificadosService.create(createDetallesCertificadoDto);
  }

  @Get()
  findAll() {
    return this.detallesCertificadosService.findAll();
  }

  @Get('empresa/:id')
  findCertificadosForEmpresa(@Param('id') id: string) {
    return this.detallesCertificadosService.findAllByEmpresa(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDetallesCertificadoDto: UpdateDetallesCertificadoDto,
  ) {
    return this.detallesCertificadosService.update(id, updateDetallesCertificadoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.detallesCertificadosService.remove(id);
  }
}