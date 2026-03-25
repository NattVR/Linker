import { Injectable } from '@nestjs/common';
import { CreateVacantesIdiomaDto } from './dto/create-vacantes_idioma.dto';
import { UpdateVacantesIdiomaDto } from './dto/update-vacantes_idioma.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { VacantesIdioma } from './entities/vacantes_idioma.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VacantesIdiomasService {
  constructor(
    @InjectRepository(VacantesIdioma)
    private readonly vacantesIdiomaRepository: Repository<VacantesIdioma>,
  ) {}

  async create(createVacantesIdiomaDto: CreateVacantesIdiomaDto) {
    const vacanteIdiomaEntity = this.vacantesIdiomaRepository.create(
      createVacantesIdiomaDto,
    );
    await this.vacantesIdiomaRepository.save(vacanteIdiomaEntity);
    return vacanteIdiomaEntity;
  }

  findAll() {
    return this.vacantesIdiomaRepository.find({
      relations: ['idioma', 'vacante'],
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} vacantesIdioma`;
  }

  update(id: number, updateVacantesIdiomaDto: UpdateVacantesIdiomaDto) {
    return `This action updates a #${id} vacantesIdioma`;
  }

  remove(id: number) {
    return `This action removes a #${id} vacantesIdioma`;
  }
}
