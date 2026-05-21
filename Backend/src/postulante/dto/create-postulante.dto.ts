import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostulanteDto {
  @ApiProperty({ example: 'Camila', description: 'Nombre del postulante' })
  name: string;

  @ApiProperty({ example: 'Gomez', description: 'Apellido del postulante' })
  lastname: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Anos de experiencia del postulante',
  })
  años_experiencia?: number;

  @ApiPropertyOptional({
    example: 'cv-camila.pdf',
    description: 'Nombre o URL del curriculum',
  })
  curriculum?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.linker.com/foto-postulante.png',
    description: 'URL de foto de perfil',
  })
  foto?: string;

  @ApiPropertyOptional({ example: 'Medellin', description: 'Ubicacion del postulante' })
  ubicacion?: string;

  @ApiPropertyOptional({
    example: '8fcf7d2b-2836-4f73-9d74-76630411768b',
    description: 'ID de usuario asociado al perfil',
  })
  id_perfil?: string;
}
