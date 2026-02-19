import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
  JoinTable,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { DetallesCertificado } from 'src/detalles_certificados/entities/detalles_certificado.entity';
import { Vacante } from 'src/vacantes/entities/vacante.entity';
import { Match } from 'src/matches/entities/match.entity';

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'varchar' })
  name_empresa: string;
  @Column({ type: 'varchar', nullable: true })
  descripcion: string;
  @Column({ type: 'varchar', nullable: true })
  ubicacion: string
  @Column({ type: 'varchar', nullable: true })
  sector: string;
  @Column({ type: 'varchar', nullable: true })
  foto: string;
  @Column({ type: 'varchar' })
  NIT: string;

  @OneToOne(() => User, (user) => user.empresa)
  @JoinColumn({ name: 'id_perfil' })
  user: User;

  @OneToMany(() => DetallesCertificado, (dc) => dc.empresa)
  @JoinTable()
  detallesCertificados: DetallesCertificado[];

  @OneToMany(() => Vacante, (vacante) => vacante.empresa)
  vacantes: Vacante[];

  /*@OneToMany(() => Match, (match) => match.empresa) 
  match: Match[];*/
}
