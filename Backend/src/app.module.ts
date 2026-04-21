import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { EmpresaModule } from './empresa/empresa.module';
import { PostulanteModule } from './postulante/postulante.module';
import { EstudiosModule } from './estudios/estudios.module';
import { DetalleEstudiosModule } from './detalles_estudios/detalle_estudios.module';
import { HabilidadesModule } from './habilidades/habilidades.module';
import { PostulanteHabilidadesModule } from './postulante_habilidades/postulante_habilidades.module';
import { IdiomasModule } from './idiomas/idiomas.module';
import { PostulanteIdiomasModule } from './postulante_idiomas/postulante_idiomas.module';
import { CertificadosModule } from './certificados/certificados.module';
import { DetallesCertificadosModule } from './detalles_certificados/detalles_certificados.module';
import { VacantesModule } from './vacantes/vacantes.module';
import { VacantesIdiomasModule } from './vacantes_idiomas/vacantes_idiomas.module';
import { VacanteHabilidadesModule } from './vacante_habilidades/vacante_habilidades.module';
import { MatchesModule } from './matches/matches.module';
import { InteraccionesModule } from './interacciones/interacciones.module';
import { winstonTransports } from './logger/winston.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRoot({ transports: winstonTransports }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
      // ssl: {
      //   rejectUnauthorized: false
      // }
    }),
    AuthModule,
    UserModule,
    EmpresaModule,
    PostulanteModule,
    EstudiosModule,
    DetalleEstudiosModule,
    HabilidadesModule,
    PostulanteHabilidadesModule,
    IdiomasModule,
    PostulanteIdiomasModule,
    CertificadosModule,
    DetallesCertificadosModule,
    VacantesModule,
    VacantesIdiomasModule,
    VacanteHabilidadesModule,
    MatchesModule,
    InteraccionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
