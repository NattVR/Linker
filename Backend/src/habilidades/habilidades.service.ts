import { Injectable } from '@nestjs/common';
import { CreateHabilidadeDto } from './dto/create-habilidade.dto';
import { UpdateHabilidadeDto } from './dto/update-habilidade.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Habilidades } from './entities/habilidades.entity';
import { Repository } from 'typeorm';

@Injectable()
export class HabilidadesService {
  constructor(
    @InjectRepository(Habilidades)
    private readonly habilidadesRepository: Repository<Habilidades>,
  ) {}

  create(createHabilidadeDto: CreateHabilidadeDto) {
    const habilidadEntity =
      this.habilidadesRepository.create(createHabilidadeDto);

    this.habilidadesRepository.save(habilidadEntity);

    return habilidadEntity;
  }

  findAll() {
    return this.habilidadesRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} habilidade`;
  }

  update(id: number, updateHabilidadeDto: UpdateHabilidadeDto) {
    return `This action updates a #${id} habilidade`;
  }

  remove(id: number) {
    return `This action removes a #${id} habilidade`;
  }
}
