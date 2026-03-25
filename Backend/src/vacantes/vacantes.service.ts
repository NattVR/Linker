import { Injectable } from '@nestjs/common';
import { CreateVacanteDto } from './dto/create-vacante.dto';
import { UpdateVacanteDto } from './dto/update-vacante.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Vacante } from './entities/vacante.entity';
import { In, Not, Repository } from 'typeorm';
import { InteraccionesService } from 'src/interacciones/interacciones.service';

@Injectable()
export class VacantesService {
  constructor(
    @InjectRepository(Vacante)
    private readonly vacanteRepository: Repository<Vacante>,
    private readonly interaccionService: InteraccionesService,
  ) { }

  async create(dto: CreateVacanteDto) {
    const { vacantesIdiomas, vacanteHabilidades, empresa, ...vacanteData } = dto;
    const nuevaVacante = this.vacanteRepository.create({ ...vacanteData, empresa: { id: empresa } });

    this.asignarIdiomas(nuevaVacante, vacantesIdiomas);
    this.asignarHabilidades(nuevaVacante, vacanteHabilidades);

    return await this.vacanteRepository.save(nuevaVacante);
  }

  findAll() {
    return this.vacanteRepository.find({ relations: ['empresa'] });
  }

  async findAllVacantesofEmpresa(empresaid: string) {
    const vacantes = await this.vacanteRepository.find({
      where: { empresa: { id: empresaid } },
      relations: [
        'empresa',
        'vacanteHabilidades', 'vacanteHabilidades.habilidades',
        'vacantesIdiomas', 'vacantesIdiomas.idioma',
      ],
    });
    return vacantes.map(v => this.formatearVacante(v));
  }

  async getVacantes(postulanteId: string) {
    const excluidas = await this.interaccionService.isFilteredVacantes(postulanteId);

    const vacantes = await this.vacanteRepository.find({
      where: excluidas?.length > 0
        ? { id_vacante: Not(In(excluidas)) }
        : {},
      relations: [
        'empresa',
        'vacanteHabilidades',
        'vacanteHabilidades.habilidades',
        'vacantesIdiomas',
        'vacantesIdiomas.idioma',
      ],
      take: 5,
    });

    return vacantes.map(v => this.formatearVacante(v));
  }

  async update(id: string, dto: UpdateVacanteDto) {
    const vacante = await this.vacanteRepository.findOne({
      where: { id_vacante: id },
      relations: ['vacanteHabilidades', 'vacantesIdiomas'],
    });
    if (!vacante) throw new Error('Vacante no encontrada');

    const { vacantesIdiomas, vacanteHabilidades, ...vacanteData } = dto;
    Object.assign(vacante, vacanteData);

    this.asignarIdiomas(vacante, vacantesIdiomas);
    this.asignarHabilidades(vacante, vacanteHabilidades);

    return await this.vacanteRepository.save(vacante);
  }

  remove(id: number) {
    return `This action removes a #${id} vacante`;
  }

  private buildVacanteQuery() {
    return this.vacanteRepository
      .createQueryBuilder('vacante')
      .leftJoinAndSelect('vacante.empresa', 'empresa')
      .leftJoinAndSelect('vacante.vacanteHabilidades', 'vacanteHabilidades')
      .leftJoinAndSelect('vacanteHabilidades.habilidades', 'habilidades')
      .leftJoinAndSelect('vacante.vacantesIdiomas', 'vacantesIdiomas')
      .leftJoinAndSelect('vacantesIdiomas.idioma', 'idioma')
      .limit(5);
  }

  private formatearVacante({ vacantesIdiomas, vacanteHabilidades, ...v }: Vacante) {
    return {
      ...v,
      idiomas: vacantesIdiomas?.map(vi => vi.idioma.nombre) ?? [],
      habilidades: vacanteHabilidades?.map(vh => vh.habilidades.nombre_habilidad) ?? [],
    };
  }

  private asignarIdiomas(vacante: Vacante, ids?: string[]) {
    vacante.vacantesIdiomas = ids?.length
      ? ids.map(id_idioma => ({ idioma: { id_idioma } }) as any)
      : [];
  }

  private asignarHabilidades(vacante: Vacante, ids?: string[]) {
    vacante.vacanteHabilidades = ids?.length
      ? ids.map(id_habilidad => ({ habilidades: { id_habilidad } }) as any)
      : [];
  }
}