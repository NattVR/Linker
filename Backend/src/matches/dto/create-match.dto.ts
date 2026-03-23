import { Postulante } from 'src/postulante/entities/postulante.entity';
import { Vacante } from 'src/vacantes/entities/vacante.entity';

export class CreateMatchDto {
  vacante: Partial<Vacante>;
  postulante: Partial<Postulante>
}

