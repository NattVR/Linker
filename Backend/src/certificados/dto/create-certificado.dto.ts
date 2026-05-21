import { ApiProperty } from '@nestjs/swagger';

export class CreateCertificadoDto {
  @ApiProperty({
    example: 'Camara de Comercio',
    description: 'Entidad que emite el certificado',
  })
  entidad_emisora: string;

  @ApiProperty({
    example: 'Certificado de Calidad',
    description: 'Nombre del certificado',
  })
  nombre_certificado: string;
}
