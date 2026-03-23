import { Postulante } from 'src/postulante/entities/postulante.entity';
import { Vacante } from 'src/vacantes/entities/vacante.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum TipoInteraccion {
  LIKE = 'like',
  DISLIKE = 'dislike',
  NO_INTERACCION = "no_interaccion"
}

@Entity('interacciones')
export class Interaccion {
  @PrimaryGeneratedColumn('uuid')
  id_interaccion: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_registro: Date;

  /*@Column({ type: 'enum', enum: TipoInteraccion })
  interaccion: TipoInteraccion;*/

  @Column({ type: 'enum', enum: TipoInteraccion, default: TipoInteraccion.NO_INTERACCION})
  accionEmpresa: TipoInteraccion

  @Column({  type: 'enum', enum: TipoInteraccion, default: TipoInteraccion.NO_INTERACCION })
  accionPostulante: TipoInteraccion

  @ManyToOne(() => Vacante, vacante => vacante.interacciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vacante_id' })
  vacante: Vacante;

  @ManyToOne(() => Postulante, postulante => postulante.interacciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'postulante_id' })
  postulante: Postulante;
}
