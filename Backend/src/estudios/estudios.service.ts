import { Injectable } from '@nestjs/common';
import { CreateEstudioDto } from './dto/create-estudio.dto';
import { UpdateEstudioDto } from './dto/update-estudio.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Estudio } from './entities/estudio.entity';

@Injectable()
export class EstudiosService {
  constructor(
    @InjectRepository(Estudio)
    private readonly estudiosRepository: Repository<Estudio>,
  ) {}

  async create(createEstudioDto: CreateEstudioDto) {
    const estudiosEntity = this.estudiosRepository.create(createEstudioDto);

    await this.estudiosRepository.save(estudiosEntity);

    return estudiosEntity;
  }

  findAll() {
    return this.estudiosRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} estudio`;
  }

  update(id: number, updateEstudioDto: UpdateEstudioDto) {
    return `This action updates a #${id} estudio`;
  }

  remove(id: number) {
    return `This action removes a #${id} estudio`;
  }
}
