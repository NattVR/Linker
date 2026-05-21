import { PartialType } from '@nestjs/swagger';
import { CreateDetallesCertificadoDto } from './create-detalles_certificado.dto';

export class UpdateDetallesCertificadoDto extends PartialType(CreateDetallesCertificadoDto) {}
