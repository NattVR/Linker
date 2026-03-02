import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDetallesCertificadoDto } from './dto/create-detalles_certificado.dto';
import { UpdateDetallesCertificadoDto } from './dto/update-detalles_certificado.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DetallesCertificado } from './entities/detalles_certificado.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DetallesCertificadosService {
  constructor(
    @InjectRepository(DetallesCertificado)
    private detallesCertificadoRepository: Repository<DetallesCertificado>,
  ) {}

  async create(createDetallesCertificadoDto: CreateDetallesCertificadoDto) {
    const entity = this.detallesCertificadoRepository.create(
      createDetallesCertificadoDto,
    );
    return await this.detallesCertificadoRepository.save(entity);
  }

  findAll() {
    return this.detallesCertificadoRepository.find({
      relations: ['empresa', 'certificado'],
    });
  }

  async findAllByEmpresa(id_empresa: string) {
    return await this.detallesCertificadoRepository.find({
      where: { empresa: { id: id_empresa } },
      relations: ['certificado'],
    });
  }

  async update(id: string, updateDetallesCertificadoDto: UpdateDetallesCertificadoDto) {
    const detalle = await this.detallesCertificadoRepository.findOne({ // 2
      where: { id_detalles_certificados: id },
      relations: ['certificado'],
    });

    if (!detalle) { // 3
      throw new NotFoundException(`Certificado con id ${id} no encontrado`); // 4
    }

    Object.assign(detalle, updateDetallesCertificadoDto); // 5
    return await this.detallesCertificadoRepository.save(detalle); // 6
  }

  async remove(id: string) {
    const detalle = await this.detallesCertificadoRepository.findOne({
      where: { id_detalles_certificados: id },
    });

    if (!detalle) {
      throw new NotFoundException(`Certificado con id ${id} no encontrado`);
    }

    await this.detallesCertificadoRepository.remove(detalle);
    return { message: `Certificado ${id} eliminado correctamente` };
  }
}