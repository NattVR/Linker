import { Injectable } from '@nestjs/common';
import { CreateInteraccioneDto } from './dto/create-interaccione.dto';
import { Interaccion, TipoInteraccion } from './entities/interacciones.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchesService } from 'src/matches/matches.service';
import { CreateMatchDto } from 'src/matches/dto/create-match.dto';

@Injectable()
export class InteraccionesService {
  constructor(
    @InjectRepository(Interaccion)
    private readonly interaccionRepository: Repository<Interaccion>,
    //private readonly vacantesService : VacantesService,
    private readonly matchService: MatchesService,
  ) {}

  async createInteraction(createInteraccioneDto: CreateInteraccioneDto) {
    const { postulante, vacante, accion_empresa, accion_postulante, empresa } =
      createInteraccioneDto;

    const interaccionExistente = await this.findOne(vacante, postulante);

    if (!interaccionExistente) {
      const interaccion = this.interaccionRepository.create({
        accionEmpresa: accion_empresa,
        accionPostulante: accion_postulante,
        vacante: { id_vacante: vacante },
        postulante: { id: postulante },
      });

      await this.interaccionRepository.save(interaccion);
      //await this.isMatch(empresa, vacante, postulante);
      return interaccion;

    } else {
      // 2. Aplicar la nueva acción SOLO si está definida en el DTO (es decir, fue enviada)
      if (accion_empresa !== null) {
        interaccionExistente.accionEmpresa = accion_empresa;
      }

      if (accion_postulante !== null) {
        interaccionExistente.accionPostulante = accion_postulante;
      }

      await this.interaccionRepository.save(interaccionExistente);
      await this.isMatch(empresa, vacante, postulante);
      return;
    }
  }

  async isMatch(empresaId: string, vacanteId: string, postulanteId: string) {
    const interaccionExistente = await this.findOne(vacanteId, postulanteId);

    if (interaccionExistente) {
      if (
        interaccionExistente.accionEmpresa === 'like' &&
        interaccionExistente.accionPostulante === 'like'
      ) {
        const match: CreateMatchDto = {
          //empresa: { id: empresaId },
          vacante: { id_vacante: vacanteId },
          postulante: { id: postulanteId },
        };
        await this.matchService.create(match);
        console.log('es un match', match);
      }
    }else{
    console.log('no hay match');
    }
  }

  async findOne(vacanteId: string, postulanteId: string) {
    const interaccion = await this.interaccionRepository.findOne({
      //select:{postulante:{id:true}, vacante:{id_vacante:true}},
      where: {
        vacante: { id_vacante: vacanteId },
        postulante: { id: postulanteId },
      },
      //relations:['vacante', 'postulante']
      loadRelationIds: true,
    });
    console.log(interaccion);
    if (!interaccion) {
      console.log('no existe');
    } else {
      console.log('hay relacion');
    }
    return interaccion;
  }

  async isFilteredVacantes(postulanteId: string) {
    const filter = await this.interaccionRepository.find({
      where: [
        {
          accionEmpresa: TipoInteraccion.LIKE,
          accionPostulante: TipoInteraccion.LIKE,
          postulante: { id: postulanteId },
        },
        {
          accionEmpresa: TipoInteraccion.DISLIKE,
          accionPostulante: TipoInteraccion.DISLIKE,
          postulante: { id: postulanteId },
        },
        {
          accionEmpresa: TipoInteraccion.LIKE,
          accionPostulante: TipoInteraccion.DISLIKE,
          postulante: { id: postulanteId },
        },
        {
          accionEmpresa: TipoInteraccion.DISLIKE,
          accionPostulante: TipoInteraccion.LIKE,
          postulante: { id: postulanteId },
        },
        {
          accionEmpresa: TipoInteraccion.NO_INTERACCION,
          accionPostulante: TipoInteraccion.DISLIKE,
          postulante: { id: postulanteId },
        },
        {
          accionEmpresa: TipoInteraccion.NO_INTERACCION,
          accionPostulante: TipoInteraccion.LIKE,
          postulante: { id: postulanteId },
        },
      ],
      relations: ['vacante', 'postulante'],
    });
    const vacantesExcluidas = Array.from(
      new Set(filter.map((i) => i.vacante.id_vacante)),
    );
    console.log(vacantesExcluidas);
    return vacantesExcluidas;
  }

  async isFilteredPostulantes(vacanteId: string) {
    const filter = await this.interaccionRepository.find({
      where: [
        {
          accionEmpresa: TipoInteraccion.LIKE,
          accionPostulante: TipoInteraccion.LIKE,
          vacante: { id_vacante: vacanteId },
        },
        {
          accionEmpresa: TipoInteraccion.DISLIKE,
          accionPostulante: TipoInteraccion.DISLIKE,
          vacante: { id_vacante: vacanteId },
        },
        {
          accionEmpresa: TipoInteraccion.LIKE,
          accionPostulante: TipoInteraccion.DISLIKE,
          vacante: { id_vacante: vacanteId },
        },
        {
          accionEmpresa: TipoInteraccion.DISLIKE,
          accionPostulante: TipoInteraccion.LIKE,
          vacante: { id_vacante: vacanteId },
        },
        {
          accionEmpresa: TipoInteraccion.DISLIKE,
          accionPostulante: TipoInteraccion.NO_INTERACCION,
          vacante: { id_vacante: vacanteId },
        },
        {
          accionEmpresa: TipoInteraccion.LIKE,
          accionPostulante: TipoInteraccion.NO_INTERACCION,
          vacante: { id_vacante: vacanteId },
        },
      ],
      relations: ['vacante', 'postulante'],
    });

    const postulantesExcluidos = Array.from(
      new Set(filter.map((i) => i.postulante.id)),
    );
    return postulantesExcluidos;
  }
}
