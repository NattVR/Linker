import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { CreateInteraccioneDto } from './dto/create-interaccione.dto';
import { Interaccion, TipoInteraccion } from './entities/interacciones.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchesService } from 'src/matches/matches.service';
import { CreateMatchDto } from 'src/matches/dto/create-match.dto';
import { Logger } from 'winston';

@Injectable()
export class InteraccionesService {
  /* istanbul ignore next */
  constructor(
    @InjectRepository(Interaccion)
    private readonly interaccionRepository: Repository<Interaccion>,
    private readonly matchService: MatchesService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  async createInteraction(
    createInteraccioneDto: CreateInteraccioneDto,
  ): Promise<Interaccion> {
    const { postulante, vacante, accion_empresa, accion_postulante, empresa } =
      createInteraccioneDto; // 1

    const interaccionExistente = await this.findOne(vacante, postulante); //2 

    if (!interaccionExistente) { // 3
      return this.crearNuevaInteraccion( // 4
        vacante,
        postulante,
        accion_empresa,
        accion_postulante,
      );
    }

    return this.actualizarInteraccionExistente( // 5
      interaccionExistente,
      accion_empresa,
      accion_postulante,
      empresa,
      vacante,
      postulante,
    );
  }

  private async crearNuevaInteraccion(
    vacanteId: string,
    postulanteId: string,
    accionEmpresa: TipoInteraccion,
    accionPostulante: TipoInteraccion,
  ): Promise<Interaccion> {
    const interaccion = this.interaccionRepository.create({ // 1
      accionEmpresa,
      accionPostulante,
      vacante: { id_vacante: vacanteId },
      postulante: { id: postulanteId },
    });

    await this.interaccionRepository.save(interaccion); // 2
    return interaccion; // 3
  }

  private async actualizarInteraccionExistente(
    interaccion: Interaccion,
    accionEmpresa: TipoInteraccion | undefined,
    accionPostulante: TipoInteraccion | undefined,
    empresaId: string,
    vacanteId: string,
    postulanteId: string,
  ): Promise<Interaccion> {
    this.aplicarAcciones(interaccion, accionEmpresa, accionPostulante); // 1

    await this.interaccionRepository.save(interaccion); // 2
    await this.isMatch(vacanteId, postulanteId); // 3

    return interaccion; // 4
  }

  private aplicarAcciones(
    interaccion: Interaccion,
    accionEmpresa: TipoInteraccion | undefined,
    accionPostulante: TipoInteraccion | undefined,
  ): void {
    if (accionEmpresa != null) { // 1
      interaccion.accionEmpresa = accionEmpresa; // 2
    }
    if (accionPostulante != null) { // 3
      interaccion.accionPostulante = accionPostulante; // 4
    }
  }

  async isMatch(vacanteId: string, postulanteId: string): Promise<void> {
    const interaccionExistente = await this.findOne(vacanteId, postulanteId);

    if (interaccionExistente) {
      if (
        interaccionExistente.accionEmpresa === TipoInteraccion.LIKE &&
        interaccionExistente.accionPostulante === TipoInteraccion.LIKE
      ) {
        const match: CreateMatchDto = {
          vacante: { id_vacante: vacanteId },
          postulante: { id: postulanteId },
        };
        await this.matchService.create(match);
        this.logger.info('Se ha creado un match');
      }
    } else {
      this.logger.info('No se ha creado un match');
    }
  }

  async findOne(vacanteId: string, postulanteId: string): Promise<Interaccion | null> {
    const interaccion = await this.interaccionRepository.findOne({
      where: {
        vacante: { id_vacante: vacanteId },
        postulante: { id: postulanteId },
      },
      loadRelationIds: true,
    });
    this.logger.info(`Buscando interacción para vacante ${vacanteId} y postulante ${postulanteId}`);
    return interaccion;
  }

  async isFilteredVacantes(postulanteId: string): Promise<string[]> {
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
      new Set(filter.map(i => i.vacante.id_vacante)),
    );
    this.logger.info(`Vacantes excluidas para postulante ${postulanteId}: ${vacantesExcluidas.join(', ')}`);
    return vacantesExcluidas;
  }

  async isFilteredPostulantes(vacanteId: string): Promise<string[]> {
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

    return Array.from(
      new Set(filter.map(i => i.postulante.id)),
    );
  }
}
