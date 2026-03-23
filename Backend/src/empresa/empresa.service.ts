import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { Empresa } from './entities/empresa.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@Injectable()
export class EmpresaService {
  // 1
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,

    @InjectRepository(User)
    private readonly usuarioRepository: Repository<User>,
  ) {}

  findAll() {
    return this.empresaRepository.find({
      relations: ['user'],
    });
  }

  async createEmpresa(dto: CreateEmpresaDto) {
    const user = await this.usuarioRepository.findOne({ // 2
      where: { id: dto.id_perfil },
    });

    if (!user) { // 3
      throw new NotFoundException( // 4
        'No se encontró el perfil de usuario asociado.',
      );
    }

    console.log('DTO recibido:', dto); // 5
    console.log('Usuario encontrado:', user?.id); // 6

    const empresa = this.empresaRepository.create({ // 7
      ...dto,
      user,
    });

    const registroEmpresa = await this.empresaRepository.save(empresa); // 8
    return { // 9
      message: 'Empresa registrada con éxito',
      empresa: registroEmpresa,
    };
  }

  async getEmpresaById(id: string) {
    const empresa = await this.empresaRepository.findOne({
      where: { user: { id } },
    });
    if (empresa) {
    return empresa}
    else{
      return null;
    }
  }

  async isEmpresa(id: string) {
    const empresa = await this.empresaRepository.findOne({
      where: { user: { id } },
    });
    return !!empresa;
  }


  async update(id: string, updateEmpresaDto: UpdateEmpresaDto) {
    const empresa = await this.getEmpresaById(id);
    if (empresa) {
      const updatedEmpresa = this.empresaRepository.merge(empresa, updateEmpresaDto);
      console.log('Empresa actualizada:', updatedEmpresa);
      return this.empresaRepository.save(updatedEmpresa);
    } else {
      throw new NotFoundException('Empresa no encontrada');
    }
}
}
