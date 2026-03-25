import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToOne,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { DetalleEstudio } from 'src/detalles_estudios/entities/detalle_estudio.entity';
import { PostulanteHabilidades } from 'src/postulante_habilidades/entities/postulante_habilidades.entity';
import { PostulanteIdioma } from 'src/postulante_idiomas/entities/postulante_idioma.entity';
import { Match } from 'src/matches/entities/match.entity';
import { Interaccion } from 'src/interacciones/entities/interacciones.entity';

@Entity('postulantes')
export class Postulante {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'varchar' })
  name: string;
  @Column({ type: 'varchar' })
  lastname: string;
  @Column({ type: 'int', nullable: true })
  años_experiencia: number;
  @Column({ type: 'varchar', nullable: true })
  curriculum: string;
  @Column({ type: 'varchar', nullable: true })
  foto: string;
  @Column({ type: 'varchar', nullable: true })
  ubicacion: string;

  @OneToOne(() => User, (user) => user.postulante)
  @JoinColumn({ name: 'id_perfil' })
  user: User;

  @OneToMany(
    () => DetalleEstudio,
    (detalleEstudio) => detalleEstudio.postulante,
  )
  @JoinTable()
  postulanteEstudios: DetalleEstudio[];

  @OneToMany(() => PostulanteHabilidades, (ph) => ph.postulante)
  @JoinTable()
  postulanteHabilidades: PostulanteHabilidades[];

  @OneToMany(() => PostulanteIdioma, (pi) => pi.postulante)
  @JoinTable()
  postulanteIdiomas: PostulanteIdioma[];

  @OneToMany(() => Match, (match) => match.postulante)
  match: Match[];

  @OneToMany(()=>Interaccion,(interaccion)=>interaccion.postulante)
  interacciones:Interaccion[];
}
