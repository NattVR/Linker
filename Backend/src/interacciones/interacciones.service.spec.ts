import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InteraccionesService } from './interacciones.service';
import { Interaccion } from './entities/interacciones.entity';
import { MatchesService } from 'src/matches/matches.service';

describe('InteraccionesService', () => {
  let service: InteraccionesService;
  let repository: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InteraccionesService,
        {
          provide: getRepositoryToken(Interaccion),
          useValue: repository,
        },
        {
          provide: MatchesService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<InteraccionesService>(InteraccionesService);
  });

  it('findOne should query repository by vacante and postulante ids with loadRelationIds', async () => {
    const vacanteId = 'vac-1';
    const postulanteId = 'post-1';
    const interaccion = {
      id_interaccion: 'int-1',
      accionEmpresa: 'like',
      accionPostulante: 'no_interaccion',
      vacante: 'vac-1',
      postulante: 'post-1',
    } as any;

    repository.findOne.mockResolvedValue(interaccion);

    const result = await service.findOne(vacanteId, postulanteId);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: {
        vacante: { id_vacante: vacanteId },
        postulante: { id: postulanteId },
      },
      loadRelationIds: true,
    });
    expect(result).toEqual(interaccion);
  });

  it('findOne should return null when interaction does not exist', async () => {
    repository.findOne.mockResolvedValue(null);

    const result = await service.findOne('vac-2', 'post-2');

    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });
});
