import { Certificado } from 'src/certificados/entities/certificado.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDetallesCertificadoDto {
  empresa: Empresa;
  certificado: Certificado;
  @IsDate()
  @Type(() => Date)
  fecha_emision: Date;
  @IsDate()
  @Type(() => Date)
  fecha_caducidad: Date;
}
