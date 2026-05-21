import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmpresaDto {
  @ApiProperty({ example: 'Linker S.A.S.', description: 'Nombre de la empresa' })
  name_empresa: string;

  @ApiPropertyOptional({
    example: 'Plataforma de reclutamiento',
    description: 'Descripción de la empresa',
  })
  descripcion?: string;

  @ApiPropertyOptional({ example: 'Bogota', description: 'Ubicación de la empresa' })
  ubicacion?: string;

  @ApiPropertyOptional({ example: 'Tecnologia', description: 'Sector de la empresa' })
  sector?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.linker.com/logo.png',
    description: 'URL de la foto o logo',
  })
  foto?: string;

  @ApiProperty({ example: '900123456-7', description: 'NIT de la empresa' })
  NIT: string;

  @ApiPropertyOptional({
    example: '8fcf7d2b-2836-4f73-9d74-76630411768b',
    description: 'ID de usuario asociado al perfil',
  })
  id_perfil?: string;
}
