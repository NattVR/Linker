import { Injectable } from '@nestjs/common';
import { CreatePostulanteIdiomaDto } from './dto/create-postulante_idioma.dto';
import { UpdatePostulanteIdiomaDto } from './dto/update-postulante_idioma.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Postulante } from 'src/postulante/entities/postulante.entity';
import { Repository } from 'typeorm';
import { Idioma } from 'src/idiomas/entities/idioma.entity';
import { PostulanteIdioma } from './entities/postulante_idioma.entity';

@Injectable()
export class PostulanteIdiomasService {
  constructor(
    @InjectRepository(Postulante)
    private readonly postulanteRepository: Repository<Postulante>,
    @InjectRepository(Idioma)
    private readonly idiomaRepository: Repository<Idioma>,
    @InjectRepository(PostulanteIdioma)
    private readonly postulanteIdiomaRepository: Repository<PostulanteIdioma>,
  ) {}

  async create(createPostulanteIdiomaDto: CreatePostulanteIdiomaDto) {
    const postulanteData = createPostulanteIdiomaDto.postulante as any;
    const idiomaData = createPostulanteIdiomaDto.idioma as any;
    
    const postulanteId = postulanteData?.id_postulante || postulanteData?.id;
    const idiomaId = idiomaData?.id_idioma || idiomaData?.id;
    
    const result = await this.postulanteIdiomaRepository.query(
      `INSERT INTO postulante_idiomas (id_postulante, id_idioma, certificado) 
      VALUES ($1, $2, $3) 
      RETURNING *`,
      [postulanteId, idiomaId, createPostulanteIdiomaDto.certificado]
    );
    
    return result[0];
  }

  findAll() {
    return this.postulanteIdiomaRepository.find({
      relations: ['postulante', 'idioma'],
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} postulanteIdioma`;
  }

  update(id: number, updatePostulanteIdiomaDto: UpdatePostulanteIdiomaDto) {
    return `This action updates a #${id} postulanteIdioma`;
  }

  remove(id: number) {
    return `This action removes a #${id} postulanteIdioma`;
  }
}
