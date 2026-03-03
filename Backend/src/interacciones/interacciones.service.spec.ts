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

  it('findOne query repository con vacante and postulante ids con loadRelationIds', async () => {
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
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(result).toEqual(interaccion);
  });

  it('findOne return null cuando interaccion no existe', async () => {
    repository.findOne.mockResolvedValue(null);

    const result = await service.findOne('vac-2', 'post-2');

    expect(repository.findOne).toHaveBeenCalledWith({
      where: {
        vacante: { id_vacante: 'vac-2' },
        postulante: { id: 'post-2' },
      },
      loadRelationIds: true,
    });
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  it('findOne propaga el error cuando falla el repositorio', async () => {
    repository.findOne.mockRejectedValue(new Error('fallo repo findOne'));

    await expect(service.findOne('vac-error', 'post-error')).rejects.toThrow('fallo repo findOne');
    expect(repository.findOne).toHaveBeenCalledTimes(1);
  });
});

const makeDto = (overrides: Partial<{
    postulante: string;
    vacante: string;
    accion_empresa: string | null;
    accion_postulante: string | null;
    empresa: string;
}> = {}) => ({
    postulante: overrides.postulante ?? 'uuid-p',
    vacante: overrides.vacante ?? 'uuid-v',
    accion_empresa: overrides.accion_empresa !== undefined ? overrides.accion_empresa : 'like',
    accion_postulante: overrides.accion_postulante !== undefined ? overrides.accion_postulante : 'like',
    empresa: overrides.empresa ?? 'uuid-e',
});

const makeInteraccion = (overrides: Partial<{
    accionEmpresa: string;
    accionPostulante: string;
}> = {}) => ({
    accionEmpresa: overrides.accionEmpresa ?? 'like',
    accionPostulante: overrides.accionPostulante ?? 'like',
    vacante: { id_vacante: 'uuid-v' },
    postulante: { id: 'uuid-p' },
});

describe('HU — Hacer Match Reclutador | InteraccionesService.createInteraction()', () => {
    let service: InteraccionesService;
    let repoMock: jest.Mocked<Repository<Interaccion>>;
    let matchServiceMock: jest.Mocked<MatchesService>;

    beforeEach(async () => {
        repoMock = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
        } as any;

        matchServiceMock = {
            create: jest.fn().mockResolvedValue({}),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InteraccionesService,
                { provide: getRepositoryToken(Interaccion), useValue: repoMock },
                { provide: MatchesService, useValue: matchServiceMock },
            ],
        }).compile();

        service = module.get<InteraccionesService>(InteraccionesService);
    });

    // ---------------------------------------------------------------------------
    // [C3] Camino 1,2,3,4,5,6,F
    // findOne() → null → interaccionExistente NO existe → crear + save() + return interaccion nueva
    // ---------------------------------------------------------------------------
    it('[C3] Camino 1,2,3,4,5,6,F — findOne=null → interaccionExistente no existe → create+save+return interaccion', async () => {
        const dto = makeDto();
        const entidad = { accionEmpresa: 'like', accionPostulante: 'like' } as any;

        repoMock.findOne.mockResolvedValue(null);
        repoMock.create.mockReturnValue(entidad);
        repoMock.save.mockResolvedValue(entidad);

        const result = await service.createInteraction(dto as any);

        expect(repoMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                accionEmpresa: 'like',
                accionPostulante: 'like',
                vacante: { id_vacante: 'uuid-v' },
                postulante: { id: 'uuid-p' },
            })
        );
        expect(repoMock.save).toHaveBeenCalledWith(entidad);
        expect(result).toBe(entidad);
        expect(matchServiceMock.create).not.toHaveBeenCalled();
    });

    // ---------------------------------------------------------------------------
    // [C4] Camino 1,2,3,7,8,9,10,11,12,13,F
    // findOne() → interaccion existente, accion_empresa='like' (!= null), accion_postulante='like' (!= null)
    // → ambas acciones actualizadas, save(), isMatch() invocado
    // ---------------------------------------------------------------------------
    it('[C4] Camino 1,2,3,7,8,9,10,11,12,13,F — interacción existente, ambas acciones != null → ambas actualizadas + save + isMatch', async () => {
        const dto = makeDto({ accion_empresa: 'like', accion_postulante: 'like' });
        const interaccionExistente = makeInteraccion({ accionEmpresa: 'dislike', accionPostulante: 'dislike' }) as any;

        const interaccionLike = makeInteraccion({ accionEmpresa: 'like', accionPostulante: 'like' }) as any;
        repoMock.findOne
            .mockResolvedValueOnce(interaccionExistente)
            .mockResolvedValueOnce(interaccionLike);
        repoMock.save.mockResolvedValue(interaccionExistente);

        await service.createInteraction(dto as any);

        expect(interaccionExistente.accionEmpresa).toBe('like');
        expect(interaccionExistente.accionPostulante).toBe('like');
        expect(repoMock.save).toHaveBeenCalledWith(interaccionExistente);
        expect(matchServiceMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                vacante: { id_vacante: 'uuid-v' },
                postulante: { id: 'uuid-p' },
            })
        );
    });

    // ---------------------------------------------------------------------------
    // [C5] Camino 1,2,3,7,8,9,11,12,13,F
    // findOne() → interaccion existente, accion_empresa='dislike' (!= null), accion_postulante = null
    // → solo accionEmpresa actualizada, save(), isMatch() invocado
    // ---------------------------------------------------------------------------
    it('[C5] Camino 1,2,3,7,8,9,11,12,13,F — interacción existente, accion_empresa!= null, accion_postulante=null → solo empresa actualizada + save + isMatch', async () => {
        const dto = makeDto({ accion_empresa: 'dislike', accion_postulante: null });
        const interaccionExistente = makeInteraccion({ accionEmpresa: 'like', accionPostulante: 'like' }) as any;

        const interaccionActualizada = { ...interaccionExistente, accionEmpresa: 'dislike' } as any;
        repoMock.findOne
            .mockResolvedValueOnce(interaccionExistente)
            .mockResolvedValueOnce(interaccionActualizada);
        repoMock.save.mockResolvedValue(interaccionExistente);

        await service.createInteraction(dto as any);

        expect(interaccionExistente.accionEmpresa).toBe('dislike');
        expect(interaccionExistente.accionPostulante).toBe('like');
        expect(repoMock.save).toHaveBeenCalled();
        expect(matchServiceMock.create).not.toHaveBeenCalled();
    });

    // ---------------------------------------------------------------------------
    // [C6] Camino 1,2,3,7,9,10,11,12,13,F
    // findOne() → interaccion existente, accion_empresa = null, accion_postulante = 'like' (!= null)
    // → solo accionPostulante actualizada, save(), isMatch() invocado
    // ---------------------------------------------------------------------------
    it('[C6] Camino 1,2,3,7,9,10,11,12,13,F — interacción existente, accion_empresa=null, accion_postulante!=null → solo postulante actualizada + save + isMatch', async () => {
        const dto = makeDto({ accion_empresa: null, accion_postulante: 'like' });
        const interaccionExistente = makeInteraccion({ accionEmpresa: 'dislike', accionPostulante: 'dislike' }) as any;

        const interaccionActualizada = { ...interaccionExistente, accionPostulante: 'like' } as any;
        repoMock.findOne
            .mockResolvedValueOnce(interaccionExistente)
            .mockResolvedValueOnce(interaccionActualizada);
        repoMock.save.mockResolvedValue(interaccionExistente);

        await service.createInteraction(dto as any);

        expect(interaccionExistente.accionEmpresa).toBe('dislike');
        expect(interaccionExistente.accionPostulante).toBe('like');
        expect(repoMock.save).toHaveBeenCalled();
        expect(matchServiceMock.create).not.toHaveBeenCalled();
    });

    it('createInteraction() — create() recibe vacante y postulante como relaciones (objetos con id)', async () => {
        repoMock.findOne.mockResolvedValue(null);
        const entidad = {} as any;
        repoMock.create.mockReturnValue(entidad);
        repoMock.save.mockResolvedValue(entidad);

        await service.createInteraction(makeDto({ vacante: 'mi-v', postulante: 'mi-p' }) as any);

        const arg = repoMock.create.mock.calls[0][0] as any;
        expect(arg.vacante).toEqual({ id_vacante: 'mi-v' });
        expect(arg.postulante).toEqual({ id: 'mi-p' });
    });

    it('createInteraction() — interaccion existente con ambas acciones null → ninguna es actualizada', async () => {
        const dto = makeDto({ accion_empresa: null, accion_postulante: null });
        const interaccionExistente = makeInteraccion({ accionEmpresa: 'dislike', accionPostulante: 'dislike' }) as any;

        repoMock.findOne
            .mockResolvedValueOnce(interaccionExistente)
            .mockResolvedValueOnce(interaccionExistente);
        repoMock.save.mockResolvedValue(interaccionExistente);

        await service.createInteraction(dto as any);

        expect(interaccionExistente.accionEmpresa).toBe('dislike');
        expect(interaccionExistente.accionPostulante).toBe('dislike');
    });
});


describe('HU — Hacer Match Reclutador | InteraccionesService.isMatch()', () => {
    let service: InteraccionesService;
    let repoMock: jest.Mocked<Repository<Interaccion>>;
    let matchServiceMock: jest.Mocked<MatchesService>;
    let consoleSpy: jest.SpyInstance;

    beforeEach(async () => {
        repoMock = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
        } as any;

        matchServiceMock = {
            create: jest.fn().mockResolvedValue({ id: 'match-uuid' }),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InteraccionesService,
                { provide: getRepositoryToken(Interaccion), useValue: repoMock },
                { provide: MatchesService, useValue: matchServiceMock },
            ],
        }).compile();

        service = module.get<InteraccionesService>(InteraccionesService);
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterEach(() => consoleSpy.mockRestore());

    // ---------------------------------------------------------------------------
    // [C7] Camino 1,2,7,F
    // findOne() → null → interaccionExistente NO existe → console.log('no hay match')
    // ---------------------------------------------------------------------------
    it('[C7] Camino 1,2,7,F — findOne=null → interaccionExistente no existe → console.log("no hay match")', async () => {
        repoMock.findOne.mockResolvedValue(null);

        await service.isMatch('uuid-e', 'uuid-v', 'uuid-p');

        expect(matchServiceMock.create).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('no hay match');
    });

    // ---------------------------------------------------------------------------
    // [C8] Camino 1,2,3,F
    // findOne() → interaccion existente, accionEmpresa='dislike' o accionPostulante='dislike'
    // → doble like = false → NO crea match, fin silencioso
    // ---------------------------------------------------------------------------
    it('[C8] Camino 1,2,3,F — interacción existe, doble like = false → no crea match, fin silencioso', async () => {
        const interaccion = makeInteraccion({ accionEmpresa: 'dislike', accionPostulante: 'like' }) as any;
        repoMock.findOne.mockResolvedValue(interaccion);

        await service.isMatch('uuid-e', 'uuid-v', 'uuid-p');

        expect(matchServiceMock.create).not.toHaveBeenCalled();
        // No se llamó con 'no hay match' (interaccion existe pero no hay match)
        expect(consoleSpy).not.toHaveBeenCalledWith('no hay match');
        // No se llamó con 'es un match'
        expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('es un match'));
    });

    // ---------------------------------------------------------------------------
    // [C9] Camino 1,2,3,4,5,6,F
    // findOne() → interaccion existente, accionEmpresa='like', accionPostulante='like'
    // → doble like = true → matchService.create() + console.log('es un match', match)
    // ---------------------------------------------------------------------------
    it('[C9] Camino 1,2,3,4,5,6,F — interacción existe, doble like=true → matchService.create + console.log("es un match")', async () => {
        const interaccion = makeInteraccion({ accionEmpresa: 'like', accionPostulante: 'like' }) as any;
        repoMock.findOne.mockResolvedValue(interaccion);

        await service.isMatch('uuid-e', 'uuid-v', 'uuid-p');

        expect(matchServiceMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                vacante: { id_vacante: 'uuid-v' },
                postulante: { id: 'uuid-p' },
            })
        );
        expect(consoleSpy).toHaveBeenCalledWith(
            'es un match',
            expect.objectContaining({
                vacante: { id_vacante: 'uuid-v' },
                postulante: { id: 'uuid-p' },
            })
        );
    });

    it('isMatch() — findOne se llama con vacanteId y postulanteId correctos', async () => {
        repoMock.findOne.mockResolvedValue(null);

        await service.isMatch('e-id', 'v-id', 'p-id');

        expect(repoMock.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    vacante: { id_vacante: 'v-id' },
                    postulante: { id: 'p-id' },
                },
            })
        );
    });

    it('isMatch() — empresa=like, postulante=dislike → no crea match', async () => {
        const interaccion = makeInteraccion({ accionEmpresa: 'like', accionPostulante: 'dislike' }) as any;
        repoMock.findOne.mockResolvedValue(interaccion);

        await service.isMatch('uuid-e', 'uuid-v', 'uuid-p');

        expect(matchServiceMock.create).not.toHaveBeenCalled();
    });

    it('isMatch() — empresa=dislike, postulante=dislike → no crea match', async () => {
        const interaccion = makeInteraccion({ accionEmpresa: 'dislike', accionPostulante: 'dislike' }) as any;
        repoMock.findOne.mockResolvedValue(interaccion);

        await service.isMatch('uuid-e', 'uuid-v', 'uuid-p');

        expect(matchServiceMock.create).not.toHaveBeenCalled();
    });

    it('isMatch() — el match dto contiene id_vacante (no empresa) conforme al código actual', async () => {
        const interaccion = makeInteraccion({ accionEmpresa: 'like', accionPostulante: 'like' }) as any;
        repoMock.findOne.mockResolvedValue(interaccion);

        await service.isMatch('uuid-e', 'uuid-v', 'uuid-p');

        const matchArg = matchServiceMock.create.mock.calls[0][0] as any;
        expect(matchArg.empresa).toBeUndefined();
        expect(matchArg.vacante).toEqual({ id_vacante: 'uuid-v' });
        expect(matchArg.postulante).toEqual({ id: 'uuid-p' });
    });
});
