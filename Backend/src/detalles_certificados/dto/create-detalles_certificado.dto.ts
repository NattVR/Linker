import { Certificado } from 'src/certificados/entities/certificado.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class EmpresaRefDto {
  @ApiProperty({
    example: 'f4f9bdf3-80a8-4f04-9f9a-e6e5c99f43b8',
    description: 'ID de la empresa',
  })
  id: string;
}

class CertificadoRefDto {
  @ApiProperty({
    example: 'e4d2cda3-8247-4f74-a71b-1403f5bd0f4b',
    description: 'ID del certificado',
  })
  id_certificado: string;
}

export class CreateDetallesCertificadoDto {
  @ApiProperty({
    type: EmpresaRefDto,
    description: 'Referencia a la empresa',
  })
  empresa: Empresa;

  @ApiProperty({
    type: CertificadoRefDto,
    description: 'Referencia al certificado',
  })
  certificado: Certificado;

  @ApiProperty({
    example: '2025-01-01',
    type: String,
    format: 'date',
    description: 'Fecha de emisión',
  })
  @IsDate()
  @Type(() => Date)
  fecha_emision: Date;

  @ApiProperty({
    example: '2027-01-01',
    type: String,
    format: 'date',
    description: 'Fecha de caducidad',
  })
  @IsDate()
  @Type(() => Date)
  fecha_caducidad: Date;
}
