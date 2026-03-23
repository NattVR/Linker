import { Module } from '@nestjs/common';
import { PostulanteService } from './postulante.service';
import { PostulanteController } from './postulante.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Postulante } from './entities/postulante.entity';
import { User } from 'src/user/entities/user.entity';
import { Estudio } from 'src/estudios/entities/estudio.entity';
import { DetalleEstudio } from 'src/detalles_estudios/entities/detalle_estudio.entity';
import { PostulanteHabilidades } from 'src/postulante_habilidades/entities/postulante_habilidades.entity';
import { PostulanteIdioma } from 'src/postulante_idiomas/entities/postulante_idioma.entity';
import { InteraccionesModule } from 'src/interacciones/interacciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Postulante,
      Estudio,
      DetalleEstudio,
      PostulanteHabilidades,
      PostulanteIdioma,
    ]),
    InteraccionesModule,
  ],
  controllers: [PostulanteController],
  providers: [PostulanteService],
  exports: [TypeOrmModule], 
})
export class PostulanteModule {}
