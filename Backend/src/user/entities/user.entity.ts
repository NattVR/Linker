import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
} from 'typeorm';
import { Postulante } from 'src/postulante/entities/postulante.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'varchar' })
  email: string;
  @Column({ type: 'varchar' })
  password: string;
  @Column({ type: 'varchar', nullable: true })
  estado_verificacion: string;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_registro: Date;

  @OneToOne(() => Postulante, (postulante) => postulante.user)
  postulante: Postulante;

  @OneToOne(() => Empresa, (empresa) => empresa.user)
  empresa: Empresa;
}
