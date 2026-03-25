import { Habilidades } from 'src/habilidades/entities/habilidades.entity';
import { Postulante } from 'src/postulante/entities/postulante.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('postulante_habilidades')
export class PostulanteHabilidades {
  @PrimaryGeneratedColumn('uuid')
  id_postulante_habilidad: string;

  @Column({ type: 'varchar' })
  certificado: string;

  @ManyToOne(
    () => Postulante,
    (postulante) => postulante.postulanteHabilidades,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'id_postulante' })
  postulante: Postulante;

  @ManyToOne(
    () => Habilidades,
    (habilidades) => habilidades.postulanteHabilidades,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'id_habilidad' })
  habilidades: Habilidades;
}
