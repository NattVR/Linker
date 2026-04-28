import { Injectable } from '@nestjs/common';
import { CreateCertificadoDto } from './dto/create-certificado.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Certificado } from './entities/certificado.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CertificadosService {
  constructor(
    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,
  ) {}

  async create(createCertificadoDto: CreateCertificadoDto) {
    const certificadoEntity =
      this.certificadoRepository.create(createCertificadoDto);
    const saved = await this.certificadoRepository.save(certificadoEntity);
    return saved;
  }

  findAll() {
    return this.certificadoRepository.find();
  }
}
