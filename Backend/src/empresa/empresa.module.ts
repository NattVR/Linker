import { Module } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { EmpresaController } from './empresa.controller';
import { Empresa } from './entities/empresa.entity';
import { User } from 'src/user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetallesCertificado } from 'src/detalles_certificados/entities/detalles_certificado.entity';
import { Vacante } from 'src/vacantes/entities/vacante.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Empresa, User, DetallesCertificado, Vacante]),
  ],
  controllers: [EmpresaController],
  providers: [EmpresaService],
})
export class EmpresaModule {}
