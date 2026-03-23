import { Injectable } from '@nestjs/common';
import { CreateVacanteDto } from './dto/create-vacante.dto';
import { UpdateVacanteDto } from './dto/update-vacante.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Vacante } from './entities/vacante.entity';
import { In, Not, Repository } from 'typeorm';
import { InteraccionesService } from 'src/interacciones/interacciones.service';
import { VacantesIdioma } from 'src/vacantes_idiomas/entities/vacantes_idioma.entity';
import { VacanteHabilidade } from 'src/vacante_habilidades/entities/vacante_habilidade.entity';

@Injectable()
export class VacantesService {
  constructor(
    @InjectRepository(Vacante)
    private readonly vacanteRepository: Repository<Vacante>,

    private readonly interaccionService: InteraccionesService,
  ) { }

  async create(createVacanteDto: CreateVacanteDto): Promise<Vacante> {
    const { vacantesIdiomas, vacanteHabilidades, empresa, ...vacanteData } = createVacanteDto; // 2

    const nuevaVacante = this.vacanteRepository.create({ // 3
      ...vacanteData,
      empresa: { id: empresa },
    });

    nuevaVacante.vacantesIdiomas = this.mapearIdiomas(vacantesIdiomas); // 4
    nuevaVacante.vacanteHabilidades = this.mapearHabilidades(vacanteHabilidades); // 5

    return this.vacanteRepository.save(nuevaVacante); // 6
  }

  private mapearIdiomas(ids: string[] | undefined): VacantesIdioma[] {
    if (!ids || ids.length === 0) {
      return [];
    }
    return ids.map(id_idioma => ({ idioma: { id_idioma } } as VacantesIdioma));
  }

  private mapearHabilidades(ids: string[] | undefined): VacanteHabilidade[] {
    if (!ids || ids.length === 0) {
      return [];
    }
    return ids.map(id_habilidad => ({ habilidades: { id_habilidad } } as VacanteHabilidade));
  }

  findAll() {
    return this.vacanteRepository.find({
      relations: ['empresa'],
    });
  }

  async findAllVacantesofEmpresa(empresaid: string) {
    const vacantesReslt = await this.vacanteRepository.find({
      where: {
        empresa: { id: empresaid },
      },
      relations: [
        'empresa',
        'vacanteHabilidades',
        'vacanteHabilidades.habilidades',
        'vacantesIdiomas',
        'vacantesIdiomas.idioma',
      ],
    });
    return vacantesReslt.map(
      ({ vacantesIdiomas, vacanteHabilidades, ...v }) => ({
        ...v,
        idiomas: vacantesIdiomas?.map(vi => vi.idioma.nombre) ?? [],
        habilidades:
          vacanteHabilidades?.map(vh => vh.habilidades.nombre_habilidad) ?? [],
      }),
    );

  }

  async getVacantes(postulanteId: string) {
    const vacantesExcluidas =
      await this.interaccionService.isFilteredVacantes(postulanteId);
    const LIMITE = 5;
    const vacantes = this.vacanteRepository
      .createQueryBuilder('vacante')
      .leftJoinAndSelect('vacante.empresa', 'empresa')
      .leftJoinAndSelect('vacante.vacanteHabilidades', 'vacanteHabilidades')
      .leftJoinAndSelect('vacanteHabilidades.habilidades', 'habilidades')
      .leftJoinAndSelect('vacante.vacantesIdiomas', 'vacantesIdiomas')
      .leftJoinAndSelect('vacantesIdiomas.idioma', 'idioma')
      .limit(LIMITE);
    if (vacantesExcluidas?.length > 0) {
      vacantes.andWhere('vacante.id_vacante NOT IN (:...excluidas)', {
        excluidas: vacantesExcluidas,
      });
    }

    const vacantesResult = await vacantes.getMany();

    return vacantesResult.map(
      ({ vacantesIdiomas, vacanteHabilidades, ...v }) => ({
        ...v,
        idiomas: vacantesIdiomas?.map(vi => vi.idioma.nombre) ?? [],
        habilidades:
          vacanteHabilidades?.map(vh => vh.habilidades.nombre_habilidad) ??
          [],
      }),
    );
  }

  async update(id: string, updateVacanteDto: UpdateVacanteDto) {

    const vacante = await this.vacanteRepository.findOne({
      where: { id_vacante: id },
      relations: ['vacanteHabilidades', 'vacantesIdiomas'],
    });

    if (!vacante) {
      throw new Error('Vacante no encontrada');
    }

    const { vacantesIdiomas, vacanteHabilidades, ...vacanteData } = updateVacanteDto;
    Object.assign(vacante, vacanteData);
    if (vacanteHabilidades) {
      vacante.vacanteHabilidades = vacanteHabilidades.map(
        id_habilidad =>
          ({
            habilidades: { id_habilidad },
          }) as any
      );
    }
    if (vacantesIdiomas) {
      vacante.vacantesIdiomas = vacantesIdiomas.map(
        id_idioma =>
          ({
            idioma: { id_idioma },
          }) as any
      );
    }

    return this.vacanteRepository.save(vacante);
  }

  remove(id: number) {
    return `This action removes a #${id} vacante`;
  }
}
