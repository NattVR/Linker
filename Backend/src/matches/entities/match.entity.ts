import { Postulante } from 'src/postulante/entities/postulante.entity';
import { Vacante } from 'src/vacantes/entities/vacante.entity';

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id_match: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @ManyToOne(()=> Vacante, vacante=>vacante.match, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'id_vacante' })
  vacante: Vacante;

  @ManyToOne(()=> Postulante, postulante=>postulante.match ,{
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'id_postulante' })
  postulante: Postulante;
}
