import { TipoModalidad, TipoTrabajo } from '../entities/vacante.entity';

export class CreateVacanteDto {
  titulo: string;
  tipo_trabajo: TipoTrabajo;
  tipo_modalidad: TipoModalidad;
  salario: number;
  ubicacion: string;
  empresa: string;
  vacanteHabilidades?: string[];
  vacantesIdiomas?: string[];
}
