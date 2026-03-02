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
    private vacanteRepository: Repository<Vacante>,

    private interaccionService: InteraccionesService,
  ) {}

  /*async create(createVacanteDto: CreateVacanteDto) {
    const vacanteEntity = this.vacanteRepository.create({
      ...createVacanteDto,
      empresa: { id: createVacanteDto.empresa.id },
    });
    await this.vacanteRepository.save(vacanteEntity);
    return vacanteEntity;
  }*/

  async create(createVacanteDto: CreateVacanteDto) {
    const { vacantesIdiomas, vacanteHabilidades, empresa, ...vacanteData } =
      createVacanteDto; //  2
    console.log('habilidades',vacanteHabilidades,'idiomas',vacantesIdiomas,'data',vacanteData); // 3

    const nuevaVacante = this.vacanteRepository.create({
      ...vacanteData,
      empresa: { id: empresa },
    }); // 4

    if (vacantesIdiomas && vacantesIdiomas.length > 0) { // 5
      nuevaVacante.vacantesIdiomas = vacantesIdiomas.map( // 6
        (id_idioma) =>
          ({
            idioma: { id_idioma },
          }) as any,
      );
    }

    if (vacanteHabilidades && vacanteHabilidades.length > 0) { // 7
      nuevaVacante.vacanteHabilidades = vacanteHabilidades.map( // 8
        (id_habilidad) =>
          ({
            habilidades: { id_habilidad },
          }) as any,
      );
    }

    return await this.vacanteRepository.save(nuevaVacante); // 9
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
    const vacantesFormateadas = vacantesReslt.map(
      ({ vacantesIdiomas, vacanteHabilidades, ...v }) => ({
        ...v,
        idiomas: vacantesIdiomas?.map((vi) => vi.idioma.nombre) ?? [],
        habilidades:
          vacanteHabilidades?.map((vh) => vh.habilidades.nombre_habilidad) ??[],
      }),
    );
    return vacantesFormateadas;
  }

  async getVacantes(postulanteId: string) {
    const vacantesExcluidas =
      await this.interaccionService.isFilteredVacantes(postulanteId);
    console.log('desde vacante', vacantesExcluidas);
    const vacantes = this.vacanteRepository
      .createQueryBuilder('vacante')
      .leftJoinAndSelect('vacante.empresa', 'empresa')
      .leftJoinAndSelect('vacante.vacanteHabilidades', 'vacanteHabilidades')
      .leftJoinAndSelect('vacanteHabilidades.habilidades', 'habilidades')
      .leftJoinAndSelect('vacante.vacantesIdiomas', 'vacantesIdiomas')
      .leftJoinAndSelect('vacantesIdiomas.idioma', 'idioma')
      .limit(5);
    if (vacantesExcluidas?.length > 0) {
      vacantes.andWhere('vacante.id_vacante NOT IN (:...excluidas)', {
        excluidas: vacantesExcluidas,
      });
    }

    const vacantesResult = await vacantes.getMany();

    const vacantesFormateadas = vacantesResult.map(
      ({ vacantesIdiomas, vacanteHabilidades, ...v }) => ({
        ...v,
        idiomas: vacantesIdiomas?.map((vi) => vi.idioma.nombre) ?? [],
        habilidades:
          vacanteHabilidades?.map((vh) => vh.habilidades.nombre_habilidad) ??
          [],
      }),
    );

    console.log(
      'Vacantes obtenidas:',
      vacantesResult,
      'Vacantes formateadas:',
      vacantesFormateadas,
    );
    return vacantesFormateadas;
  }

  /*sync getEmpresaOfVacante(vacanteId: string){
    return this.vacanteRepository.findOne({
      select:{empresa:{id:true}},
      where:{
        id_vacante:vacanteId
      },
      relations: ['empresa'],
    })
  }*/

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
        (id_habilidad) =>
          ({
            habilidades: { id_habilidad },
          }) as any
      );
    }
    if (vacantesIdiomas) {
      vacante.vacantesIdiomas = vacantesIdiomas.map(
        (id_idioma) =>
          ({
            idioma: { id_idioma },
          }) as any
      );
    }

    return await this.vacanteRepository.save(vacante);
  }

  remove(id: number) {
    return `This action removes a #${id} vacante`;
  }
}
