import { Injectable } from '@nestjs/common';
import { CreatePostulanteHabilidadeDto } from './dto/create-postulante_habilidade.dto';
import { UpdatePostulanteHabilidadeDto } from './dto/update-postulante_habilidade.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PostulanteHabilidades } from './entities/postulante_habilidades.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PostulanteHabilidadesService {
  constructor(
    @InjectRepository(PostulanteHabilidades)
    private readonly postulanteHabilidadesRepository: Repository<PostulanteHabilidades>,
  ) {}

  async create(createPostulanteHabilidadeDto: CreatePostulanteHabilidadeDto) {
    const postulanteData = createPostulanteHabilidadeDto.postulante as any;
    const habilidadData = createPostulanteHabilidadeDto.habilidades as any;
    
    const postulanteId = postulanteData?.id_postulante || postulanteData?.id;
    const habilidadId = habilidadData?.id_habilidad || habilidadData?.id;
    
    const result = await this.postulanteHabilidadesRepository.query(
      `INSERT INTO postulante_habilidades (id_postulante, id_habilidad, certificado) 
      VALUES ($1, $2, $3) 
      RETURNING *`,
      [postulanteId, habilidadId, createPostulanteHabilidadeDto.certificado]
    );
    
    return result[0];
  }

  findAll() {
    return this.postulanteHabilidadesRepository.find({
      relations: ['postulante', 'habilidades'],
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} postulanteHabilidade`;
  }

  update(
    id: number,
    updatePostulanteHabilidadeDto: UpdatePostulanteHabilidadeDto,
  ) {
    return `This action updates a #${id} postulanteHabilidade`;
  }

  remove(id: number) {
    return `This action removes a #${id} postulanteHabilidade`;
  }
}
