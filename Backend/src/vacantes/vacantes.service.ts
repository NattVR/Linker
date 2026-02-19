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

  const { vacantesIdiomas, vacanteHabilidades, empresa, ...vacanteData } = createVacanteDto; 
  console.log('habilidades', vacanteHabilidades, 'idiomas', vacantesIdiomas, 'data', vacanteData);


  const nuevaVacante = this.vacanteRepository.create({
      ...vacanteData,
      empresa: { id: empresa }, 
  });


  if (vacantesIdiomas && vacantesIdiomas.length > 0) {
  
    nuevaVacante.vacantesIdiomas = vacantesIdiomas.map((id_idioma) => ({
      idioma: { id_idioma }, 
    } as any)); 
  }

  if (vacanteHabilidades && vacanteHabilidades.length > 0) {
   
    nuevaVacante.vacanteHabilidades = vacanteHabilidades.map((id_habilidad) => ({
      habilidades: { id_habilidad }, 
    } as any));
  }

  return await this.vacanteRepository.save(nuevaVacante);
}


  findAll() {
    return this.vacanteRepository.find({
      relations: ['empresa'],
    });
  }

  findAllVacantesofEmpresa(empresaid: string) {
    return this.vacanteRepository.find({
      where: {
        empresa: { id: empresaid },
      },
      relations: ['empresa'],
    });
  }

  async getVacantes(postulanteId: string) {
    const vacantesExcluidas =
      await this.interaccionService.isFilteredVacantes(postulanteId);
    console.log('desde vacante', vacantesExcluidas);
    const vacantes = this.vacanteRepository.find({
      select:{ 
        empresa:{
          name_empresa:true,
          id:true
        }
      },
      where: {
        id_vacante: Not(In(vacantesExcluidas)),
      },
      relations:['empresa','vacanteHabilidades','vacantesIdiomas'],
      take:5
    });
    return vacantes;
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
    });
    if (!vacante) {
      throw new Error('Vacante no encontrada');
    }
    Object.assign(vacante, updateVacanteDto);
    return await this.vacanteRepository.save(vacante);
  }

  remove(id: number) {
    return `This action removes a #${id} vacante`;
  }
}
