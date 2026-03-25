import { Injectable } from '@nestjs/common';
import { CreateDetalleEstudioDto } from './dto/create-detalle_estudio.dto';
import { UpdateDetalleEstudioDto } from './dto/update-detalle_estudio.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DetalleEstudio } from './entities/detalle_estudio.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DetalleEstudiosService {
  constructor(
    @InjectRepository(DetalleEstudio)
    private readonly detalleEstudioRepository: Repository<DetalleEstudio>,
  ) {}
  
  async create(createDetalleEstudioDto: CreateDetalleEstudioDto): Promise<DetalleEstudio> {
    const postulanteData = createDetalleEstudioDto.postulante as any;
    const estudioData = createDetalleEstudioDto.estudio as any;
    
    const postulanteId = postulanteData?.id_postulante || postulanteData?.id;
    const estudioId = estudioData?.id_estudio || estudioData?.id;
    
    const result = await this.detalleEstudioRepository.query(
      `INSERT INTO detalles_estudios (id_postulante, id_estudio, certificado) 
      VALUES ($1, $2, $3) 
      RETURNING *`,
      [postulanteId, estudioId, createDetalleEstudioDto.certificado]
    );
    
    return result[0];
  }

  findAll() {
    return this.detalleEstudioRepository.find({
      relations: ['postulante', 'estudio'],
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} detalleEstudio`;
  }

  update(id: number, updateDetalleEstudioDto: UpdateDetalleEstudioDto) {
    return `This action updates a #${id} detalleEstudio`;
  }

  remove(id: number) {
    return `This action removes a #${id} detalleEstudio`;
  }
}
