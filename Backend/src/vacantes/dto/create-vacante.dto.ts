import { TipoModalidad, TipoTrabajo } from '../entities/vacante.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVacanteDto {
  @ApiProperty({ example: 'QA Automation Engineer', description: 'Titulo de la vacante' })
  titulo: string;

  @ApiProperty({
    enum: TipoTrabajo,
    example: TipoTrabajo.FULL_TIME,
    description: 'Tipo de trabajo',
  })
  tipo_trabajo: TipoTrabajo;

  @ApiProperty({
    enum: TipoModalidad,
    example: TipoModalidad.REMOTO,
    description: 'Modalidad de trabajo',
  })
  tipo_modalidad: TipoModalidad;

  @ApiProperty({ example: 4500000, description: 'Salario ofrecido' })
  salario: number;

  @ApiProperty({ example: 'Bogota', description: 'Ubicacion de la vacante' })
  ubicacion: string;

  @ApiProperty({
    example: 'a532711f-c4ec-45eb-a1d0-06a52ad66e4d',
    description: 'ID de la empresa',
  })
  empresa: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['id-habilidad-1', 'id-habilidad-2'],
    description: 'Lista de IDs de habilidades',
  })
  vacanteHabilidades?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['id-idioma-1', 'id-idioma-2'],
    description: 'Lista de IDs de idiomas',
  })
  vacantesIdiomas?: string[];
}
