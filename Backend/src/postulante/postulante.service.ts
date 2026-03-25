import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostulanteDto } from './dto/create-postulante.dto';
import { Postulante } from './entities/postulante.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { In, Not, Repository } from 'typeorm';
import { InteraccionesService } from 'src/interacciones/interacciones.service';

@Injectable()
export class PostulanteService {
  constructor(
    @InjectRepository(Postulante)
    private readonly postulanteRepository: Repository<Postulante>,
    @InjectRepository(User)
    private readonly usuarioRepository: Repository<User>,
    private readonly interaccionesService: InteraccionesService,
  ) {}

  async createPostulante(dto: CreatePostulanteDto) {
    const user = await this.usuarioRepository.findOne({ where: { id: dto.id_perfil } });
    if (!user) throw new NotFoundException('No se encontró el perfil de usuario asociado.');

    const postulante = this.postulanteRepository.create({ ...dto, user });
    const registroPostulante = await this.postulanteRepository.save(postulante);
    return { message: 'Postulante registrado con éxito', postulante: registroPostulante };
  }

  async getPostulanteById(id: string) {
    const postulante = await this.postulanteRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!postulante) throw new NotFoundException('Usuario no encontrado');
    return { name: postulante.name, lastname: postulante.lastname };
  }

  findAll() {
    return this.postulanteRepository.find({ relations: ['user'] });
  }

  async getPostulantes(vacanteId: string) {
  const excluidos = await this.interaccionesService.isFilteredPostulantes(vacanteId);

  return this.postulanteRepository.find({
    where: excluidos?.length > 0
      ? { id: Not(In(excluidos)) }
      : {},
    relations: [
      'postulanteHabilidades',
      'postulanteHabilidades.habilidades',
      'postulanteIdiomas',
      'postulanteIdiomas.idioma',
    ],
    take: 5,
  }).then(resultado => this.formatearPostulantes(resultado));
}

  async updatePostulante(idUsuario: string, dto: any) {
    const postulante = await this.postulanteRepository.findOne({ where: { id: idUsuario } });
    if (!postulante) throw new NotFoundException('Postulante no encontrado');

    this.aplicarCambios(postulante, dto);
    return await this.postulanteRepository.save(postulante);
  }

  async getPerfilCompleto(idPostulante: string) {
    return this.postulanteRepository
      .createQueryBuilder('postulante')
      .leftJoinAndSelect('postulante.postulanteHabilidades', 'postulanteHabilidades')
      .leftJoinAndSelect('postulanteHabilidades.habilidades', 'habilidades')
      .leftJoinAndSelect('postulante.postulanteIdiomas', 'postulanteIdiomas')
      .leftJoinAndSelect('postulanteIdiomas.idioma', 'idioma')
      .leftJoinAndSelect('postulante.postulanteEstudios', 'postulanteEstudios')
      .leftJoinAndSelect('postulanteEstudios.estudio', 'estudio')
      .where('postulante.id = :id', { id: idPostulante })
      .getOne();
  }

  async limpiarPerfilPostulante(idPostulante: string) {
    try {
      await this.eliminarRelaciones(idPostulante);
      return { message: 'Perfil limpiado' };
    } catch (error) {
      console.error('Error al limpiar:', error);
      return { message: 'Sin registros previos' };
    }
  }

  private buildPostulanteQuery() {
    return this.postulanteRepository
      .createQueryBuilder('postulante')
      .leftJoinAndSelect('postulante.postulanteHabilidades', 'postulanteHabilidades')
      .leftJoinAndSelect('postulanteHabilidades.habilidades', 'habilidades')
      .leftJoinAndSelect('postulante.postulanteIdiomas', 'postulanteIdiomas')
      .leftJoinAndSelect('postulanteIdiomas.idioma', 'idioma')
      .limit(5);
  }

  private formatearPostulantes(postulantes: Postulante[]) {
    return postulantes.map(({ postulanteHabilidades, postulanteIdiomas, ...p }) => ({
      ...p,
      idiomas: postulanteIdiomas?.map(pi => pi.idioma.nombre) ?? [],
      habilidades: postulanteHabilidades?.map(ph => ph.habilidades.nombre_habilidad) ?? [],
    }));
  }

  private aplicarCambios(postulante: Postulante, dto: any) {
    if (dto.experiencia !== undefined) postulante.años_experiencia = dto.experiencia;
    if (dto.cv !== undefined) postulante.curriculum = dto.cv;
  }

  private async eliminarRelaciones(idPostulante: string) {
    await this.postulanteRepository
    .createQueryBuilder()
    .delete()
    .from('postulante_habilidades')
    .where('id_postulante = :id', { id: idPostulante })
    .execute();
  }
}