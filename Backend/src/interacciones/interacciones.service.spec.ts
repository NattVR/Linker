// =============================================================================
// Interacciones Service Tests | Backend
// Archivo: src/interacciones/interacciones.service.spec.ts
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InteraccionesService } from './interacciones.service';
import { Interaccion, TipoInteraccion } from './entities/interacciones.entity';
import { MatchesService } from 'src/matches/matches.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const makeLoggerMock = () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
});

const makeDto = (
    overrides: Partial<{
        postulante: string;
        vacante: string;
        accion_empresa: TipoInteraccion | null;
        accion_postulante: TipoInteraccion | null;
        empresa: string;
    }> = {},
) => ({
    postulante: overrides.postulante ?? 'uuid-p',
    vacante: overrides.vacante ?? 'uuid-v',
    accion_empresa:
        overrides.accion_empresa !== undefined
            ? overrides.accion_empresa
            : TipoInteraccion.LIKE,
    accion_postulante:
        overrides.accion_postulante !== undefined
            ? overrides.accion_postulante
            : TipoInteraccion.LIKE,
    empresa: overrides.empresa ?? 'uuid-e',
});

const makeInteraccion = (
    overrides: Partial<{
        accionEmpresa: TipoInteraccion;
        accionPostulante: TipoInteraccion;
        vacanteId: string;
        postulanteId: string;
    }> = {},
) => ({
    accionEmpresa: overrides.accionEmpresa ?? TipoInteraccion.LIKE,
    accionPostulante: overrides.accionPostulante ?? TipoInteraccion.LIKE,
    vacante: { id_vacante: overrides.vacanteId ?? 'uuid-v' },
    postulante: { id: overrides.postulanteId ?? 'uuid-p' },
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — findOne()
// ─────────────────────────────────────────────────────────────────────────────

describe('InteraccionesService — findOne()', () => {
    let service: InteraccionesService;
    let repoMock: { findOne: jest.Mock };
    let loggerMock: ReturnType<typeof makeLoggerMock>;

    beforeEach(async () => {
        repoMock = { findOne: jest.fn() };
        loggerMock = makeLoggerMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InteraccionesService,
                { provide: getRepositoryToken(Interaccion), useValue: repoMock },
                { provide: MatchesService, useValue: { create: jest.fn() } },
                { provide: WINSTON_MODULE_PROVIDER, useValue: loggerMock },
            ],
        }).compile();

        service = module.get<InteraccionesService>(InteraccionesService);
    });

    afterEach(() => jest.restoreAllMocks());

    it('F-01 — llama al repositorio con los parámetros correctos y devuelve la interacción', async () => {
        // Arrange
        const vacanteId = 'vac-1';
        const postulanteId = 'post-1';
        const interaccionEsperada = makeInteraccion() as any;
        repoMock.findOne.mockResolvedValue(interaccionEsperada);

        // Act
        const result = await service.findOne(vacanteId, postulanteId);

        // Assert
        expect(repoMock.findOne).toHaveBeenCalledTimes(1);
        expect(repoMock.findOne).toHaveBeenCalledWith({
            where: {
                vacante: { id_vacante: vacanteId },
                postulante: { id: postulanteId },
            },
            loadRelationIds: true,
        });
        expect(result).toEqual(interaccionEsperada);
    });

    it('F-02 — devuelve null cuando no existe la interacción', async () => {
        // Arrange
        repoMock.findOne.mockResolvedValue(null);

        // Act
        const result = await service.findOne('vac-2', 'post-2');

        // Assert
        expect(repoMock.findOne).toHaveBeenCalledTimes(1);
        expect(result).toBeNull();
    });

    it('F-03 — propaga el error cuando el repositorio lanza una excepción', async () => {
        // Arrange
        repoMock.findOne.mockRejectedValue(new Error('DB connection lost'));

        // Act & Assert
        await expect(service.findOne('vac-err', 'post-err')).rejects.toThrow(
            'DB connection lost',
        );
        expect(repoMock.findOne).toHaveBeenCalledTimes(1);
    });

    it('F-04 — loguea la búsqueda con los ids correctos', async () => {
        // Arrange
        repoMock.findOne.mockResolvedValue(null);

        // Act
        await service.findOne('vac-log', 'post-log');

        // Assert
        expect(loggerMock.info).toHaveBeenCalledWith(
            expect.stringContaining('vac-log'),
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — createInteraction()
// ─────────────────────────────────────────────────────────────────────────────

describe('InteraccionesService — createInteraction()', () => {
    let service: InteraccionesService;
    let repoMock: jest.Mocked<Repository<Interaccion>>;
    let matchServiceMock: jest.Mocked<MatchesService>;
    let loggerMock: ReturnType<typeof makeLoggerMock>;

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

        loggerMock = makeLoggerMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InteraccionesService,
                { provide: getRepositoryToken(Interaccion), useValue: repoMock },
                { provide: MatchesService, useValue: matchServiceMock },
                { provide: WINSTON_MODULE_PROVIDER, useValue: loggerMock },
            ],
        }).compile();

        service = module.get<InteraccionesService>(InteraccionesService);
    });

    afterEach(() => jest.restoreAllMocks());

    it('CI-01 — interacción inexistente → delega a crearNuevaInteraccion(), retorna entidad', async () => {
        // Arrange
        const dto = makeDto();
        const entidadNueva = makeInteraccion() as any;
        repoMock.findOne.mockResolvedValue(null);
        repoMock.create.mockReturnValue(entidadNueva);
        repoMock.save.mockResolvedValue(entidadNueva);

        // Act
        const result = await service.createInteraction(dto as any);

        // Assert
        expect(repoMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                accionEmpresa: TipoInteraccion.LIKE,
                accionPostulante: TipoInteraccion.LIKE,
                vacante: { id_vacante: 'uuid-v' },
                postulante: { id: 'uuid-p' },
            }),
        );
        expect(repoMock.save).toHaveBeenCalledWith(entidadNueva);
        expect(result).toBe(entidadNueva);
        expect(matchServiceMock.create).not.toHaveBeenCalled();
    });

    it('CI-02 — interacción inexistente → save() solo se llama una vez', async () => {
        // Arrange
        const dto = makeDto();
        const entidad = makeInteraccion() as any;
        repoMock.findOne.mockResolvedValue(null);
        repoMock.create.mockReturnValue(entidad);
        repoMock.save.mockResolvedValue(entidad);

        // Act
        await service.createInteraction(dto as any);

        // Assert
        expect(repoMock.save).toHaveBeenCalledTimes(1);
    });

    it('CI-03 — interacción inexistente → create() recibe vacante y postulante como relaciones', async () => {
        // Arrange
        const dto = makeDto({ vacante: 'mi-v', postulante: 'mi-p' });
        const entidad = {} as any;
        repoMock.findOne.mockResolvedValue(null);
        repoMock.create.mockReturnValue(entidad);
        repoMock.save.mockResolvedValue(entidad);

        // Act
        await service.createInteraction(dto as any);

        // Assert
        const arg = repoMock.create.mock.calls[0][0] as any;
        expect(arg.vacante).toEqual({ id_vacante: 'mi-v' });
        expect(arg.postulante).toEqual({ id: 'mi-p' });
    });

    it('CI-04 — interacción inexistente → matchService.create() no es invocado', async () => {
        // Arrange
        const dto = makeDto();
        const entidad = makeInteraccion() as any;
        repoMock.findOne.mockResolvedValue(null);
        repoMock.create.mockReturnValue(entidad);
        repoMock.save.mockResolvedValue(entidad);

        // Act
        await service.createInteraction(dto as any);

        // Assert
        expect(matchServiceMock.create).not.toHaveBeenCalled();
    });

    it('CI-05 — interacción existente, ambas acciones definidas → actualiza ambas y retorna entidad', async () => {
        // Arrange
        const dto = makeDto({
            accion_empresa: TipoInteraccion.LIKE,
            accion_postulante: TipoInteraccion.LIKE,
        });
        const interaccionExistente = makeInteraccion({
            accionEmpresa: TipoInteraccion.DISLIKE,
            accionPostulante: TipoInteraccion.DISLIKE,
        }) as any;
        const interaccionLike = makeInteraccion() as any;

        repoMock.findOne
            .mockResolvedValueOnce(interaccionExistente)
            .mockResolvedValueOnce(interaccionLike);
        repoMock.save.mockResolvedValue(interaccionExistente);

        // Act
        const result = await service.createInteraction(dto as any);

        // Assert
        expect(interaccionExistente.accionEmpresa).toBe(TipoInteraccion.LIKE);
        expect(interaccionExistente.accionPostulante).toBe(TipoInteraccion.LIKE);
        expect(repoMock.save).toHaveBeenCalledWith(interaccionExistente);
        expect(result).toBe(interaccionExistente);
    });

    it('CI-06 — interacción existente, doble like → matchService.create() es invocado', async () => {
        // Arrange
        const dto = makeDto({
            accion_empresa: TipoInteraccion.LIKE,
            accion_postulante: TipoInteraccion.LIKE,
        });
        const interaccionExistente = makeInteraccion({
            accionEmpresa: TipoInteraccion.DISLIKE,
            accionPostulante: TipoInteraccion.DISLIKE,
        }) as any;
        const interaccionLike = makeInteraccion() as any;

        repoMock.findOne
            .mockResolvedValueOnce(interaccionExistente)
            .mockResolvedValueOnce(interaccionLike);
        repoMock.save.mockResolvedValue(interaccionExistente);

        // Act
        await service.createInteraction(dto as any);

        // Assert
        expect(matchServiceMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                vacante: { id_vacante: 'uuid-v' },
                postulante: { id: 'uuid-p' },
            }),
        );
    });

    it('CI-07 — interacción existente, accion_empresa null → solo postulante es actualizado', async () => {
        // Arrange
        const dto = makeDto({
            accion_empresa: null,
            accion_postulante: TipoInteraccion.LIKE,
        });
        const interaccionExistente = makeInteraccion({
            accionEmpresa: TipoInteraccion.DISLIKE,
            accionPostulante: TipoInteraccion.DISLIKE,
        }) as any;

        repoMock.findOne
            .mockResolvedValueOnce(interaccionExistente)
            .mockResolvedValueOnce(interaccionExistente);
        repoMock.save.mockResolvedValue(interaccionExistente);

        // Act
        await service.createInteraction(dto as any);

        // Assert
        expect(interaccionExistente.accionEmpresa).toBe(TipoInteraccion.DISLIKE);
        expect(interaccionExistente.accionPostulante).toBe(TipoInteraccion.LIKE);
    });

    it('CI-08 — interacción existente, accion_postulante null → solo empresa es actualizada', async () => {
        // Arrange
        const dto = makeDto({
            accion_empresa: TipoInteraccion.DISLIKE,
            accion_postulante: null,
        });
        const interaccionExistente = makeInteraccion({
            accionEmpresa: TipoInteraccion.LIKE,
            accionPostulante: TipoInteraccion.LIKE,
        }) as any;

        repoMock.findOne
            .mockResolvedValueOnce(interaccionExistente)
            .mockResolvedValueOnce(interaccionExistente);
        repoMock.save.mockResolvedValue(interaccionExistente);

        // Act
        await service.createInteraction(dto as any);

        // Assert
        expect(interaccionExistente.accionEmpresa).toBe(TipoInteraccion.DISLIKE);
        expect(interaccionExistente.accionPostulante).toBe(TipoInteraccion.LIKE);
    });

    it('CI-09 — interacción existente, ambas acciones null → ningún campo modificado', async () => {
        // Arrange
        const dto = makeDto({
            accion_empresa: null,
            accion_postulante: null,
        });
        const interaccionExistente = makeInteraccion({
            accionEmpresa: TipoInteraccion.DISLIKE,
            accionPostulante: TipoInteraccion.DISLIKE,
        }) as any;

        repoMock.findOne
            .mockResolvedValueOnce(interaccionExistente)
            .mockResolvedValueOnce(interaccionExistente);
        repoMock.save.mockResolvedValue(interaccionExistente);

        // Act
        await service.createInteraction(dto as any);

        // Assert
        expect(interaccionExistente.accionEmpresa).toBe(TipoInteraccion.DISLIKE);
        expect(interaccionExistente.accionPostulante).toBe(TipoInteraccion.DISLIKE);
    });

    it('CI-10 — interacción existente → retorna la entidad actualizada, no undefined', async () => {
        // Arrange
        const dto = makeDto();
        const interaccionExistente = makeInteraccion() as any;

        repoMock.findOne
            .mockResolvedValueOnce(interaccionExistente)
            .mockResolvedValueOnce(interaccionExistente);
        repoMock.save.mockResolvedValue(interaccionExistente);

        // Act
        const result = await service.createInteraction(dto as any);

        // Assert
        expect(result).toBeDefined();
        expect(result).toBe(interaccionExistente);
    });

    it('CI-11 — interacción existente → save() se llama exactamente una vez', async () => {
        // Arrange
        const dto = makeDto();
        const interaccionExistente = makeInteraccion() as any;

        repoMock.findOne
            .mockResolvedValueOnce(interaccionExistente)
            .mockResolvedValueOnce(interaccionExistente);
        repoMock.save.mockResolvedValue(interaccionExistente);

        // Act
        await service.createInteraction(dto as any);

        // Assert
        expect(repoMock.save).toHaveBeenCalledTimes(1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3 — isMatch() — firma actualizada: (vacanteId, postulanteId)
// ─────────────────────────────────────────────────────────────────────────────

describe('InteraccionesService — isMatch()', () => {
    let service: InteraccionesService;
    let repoMock: jest.Mocked<Repository<Interaccion>>;
    let matchServiceMock: jest.Mocked<MatchesService>;
    let loggerMock: ReturnType<typeof makeLoggerMock>;

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

        loggerMock = makeLoggerMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InteraccionesService,
                { provide: getRepositoryToken(Interaccion), useValue: repoMock },
                { provide: MatchesService, useValue: matchServiceMock },
                { provide: WINSTON_MODULE_PROVIDER, useValue: loggerMock },
            ],
        }).compile();

        service = module.get<InteraccionesService>(InteraccionesService);
    });

    afterEach(() => jest.restoreAllMocks());

    it('IM-01 — findOne=null → entra en rama else y loguea "No se ha creado un match"', async () => {
        // Arrange
        repoMock.findOne.mockResolvedValue(null);

        // Act
        await service.isMatch('uuid-v', 'uuid-p');

        // Assert
        expect(loggerMock.info).toHaveBeenCalledWith('No se ha creado un match');
        expect(matchServiceMock.create).not.toHaveBeenCalled();
    });

    it('IM-02 — interacción existe con dislike/like → no crea match', async () => {
        // Arrange
        const interaccion = makeInteraccion({
            accionEmpresa: TipoInteraccion.DISLIKE,
            accionPostulante: TipoInteraccion.LIKE,
        }) as any;
        repoMock.findOne.mockResolvedValue(interaccion);

        // Act
        await service.isMatch('uuid-v', 'uuid-p');

        // Assert
        expect(matchServiceMock.create).not.toHaveBeenCalled();
        expect(loggerMock.info).not.toHaveBeenCalledWith('No se ha creado un match');
    });

    it('IM-03 — doble like → matchService.create() y loguea "Se ha creado un match"', async () => {
        // Arrange
        const interaccion = makeInteraccion({
            accionEmpresa: TipoInteraccion.LIKE,
            accionPostulante: TipoInteraccion.LIKE,
        }) as any;
        repoMock.findOne.mockResolvedValue(interaccion);

        // Act
        await service.isMatch('uuid-v', 'uuid-p');

        // Assert
        expect(matchServiceMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                vacante: { id_vacante: 'uuid-v' },
                postulante: { id: 'uuid-p' },
            }),
        );
        expect(loggerMock.info).toHaveBeenCalledWith('Se ha creado un match');
    });

    it('IM-04 — findOne es invocado con los ids correctos', async () => {
        // Arrange
        repoMock.findOne.mockResolvedValue(null);

        // Act
        await service.isMatch('v-id', 'p-id');

        // Assert
        expect(repoMock.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    vacante: { id_vacante: 'v-id' },
                    postulante: { id: 'p-id' },
                },
            }),
        );
    });

    it('IM-05 — empresa=like, postulante=dislike → no crea match', async () => {
        // Arrange
        const interaccion = makeInteraccion({
            accionEmpresa: TipoInteraccion.LIKE,
            accionPostulante: TipoInteraccion.DISLIKE,
        }) as any;
        repoMock.findOne.mockResolvedValue(interaccion);

        // Act
        await service.isMatch('uuid-v', 'uuid-p');

        // Assert
        expect(matchServiceMock.create).not.toHaveBeenCalled();
    });

    it('IM-06 — empresa=dislike, postulante=dislike → no crea match', async () => {
        // Arrange
        const interaccion = makeInteraccion({
            accionEmpresa: TipoInteraccion.DISLIKE,
            accionPostulante: TipoInteraccion.DISLIKE,
        }) as any;
        repoMock.findOne.mockResolvedValue(interaccion);

        // Act
        await service.isMatch('uuid-v', 'uuid-p');

        // Assert
        expect(matchServiceMock.create).not.toHaveBeenCalled();
    });

    it('IM-07 — el DTO de match no incluye empresa (campo eliminado)', async () => {
        // Arrange
        const interaccion = makeInteraccion({
            accionEmpresa: TipoInteraccion.LIKE,
            accionPostulante: TipoInteraccion.LIKE,
        }) as any;
        repoMock.findOne.mockResolvedValue(interaccion);

        // Act
        await service.isMatch('uuid-v', 'uuid-p');

        // Assert
        const matchArg = matchServiceMock.create.mock.calls[0][0] as any;
        expect(matchArg.empresa).toBeUndefined();
        expect(matchArg.vacante).toEqual({ id_vacante: 'uuid-v' });
        expect(matchArg.postulante).toEqual({ id: 'uuid-p' });
    });

    it('IM-08 — matchService.create() solo se llama una vez por doble like', async () => {
        // Arrange
        const interaccion = makeInteraccion({
            accionEmpresa: TipoInteraccion.LIKE,
            accionPostulante: TipoInteraccion.LIKE,
        }) as any;
        repoMock.findOne.mockResolvedValue(interaccion);

        // Act
        await service.isMatch('uuid-v', 'uuid-p');

        // Assert
        expect(matchServiceMock.create).toHaveBeenCalledTimes(1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4 — isFilteredVacantes()
// ─────────────────────────────────────────────────────────────────────────────

describe('InteraccionesService — isFilteredVacantes()', () => {
    let service: InteraccionesService;
    let repoMock: jest.Mocked<Repository<Interaccion>>;
    let loggerMock: ReturnType<typeof makeLoggerMock>;

    beforeEach(async () => {
        repoMock = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
        } as any;

        loggerMock = makeLoggerMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InteraccionesService,
                { provide: getRepositoryToken(Interaccion), useValue: repoMock },
                { provide: MatchesService, useValue: { create: jest.fn() } },
                { provide: WINSTON_MODULE_PROVIDER, useValue: loggerMock },
            ],
        }).compile();

        service = module.get<InteraccionesService>(InteraccionesService);
    });

    afterEach(() => jest.restoreAllMocks());

    it('IFV-01 — devuelve array vacío cuando no hay interacciones', async () => {
        // Arrange
        repoMock.find.mockResolvedValue([]);

        // Act
        const result = await service.isFilteredVacantes('post-1');

        // Assert
        expect(result).toEqual([]);
        expect(repoMock.find).toHaveBeenCalledTimes(1);
    });

    it('IFV-02 — con resultados reales ejecuta Array.from+Set y devuelve ids únicos de vacantes', async () => {
        // Arrange
        const interacciones = [
            {
                vacante: { id_vacante: 'vac-A' },
                postulante: { id: 'post-1' },
                accionEmpresa: TipoInteraccion.LIKE,
                accionPostulante: TipoInteraccion.LIKE,
            },
            {
                vacante: { id_vacante: 'vac-A' },
                postulante: { id: 'post-1' },
                accionEmpresa: TipoInteraccion.DISLIKE,
                accionPostulante: TipoInteraccion.LIKE,
            },
            {
                vacante: { id_vacante: 'vac-B' },
                postulante: { id: 'post-1' },
                accionEmpresa: TipoInteraccion.DISLIKE,
                accionPostulante: TipoInteraccion.DISLIKE,
            },
        ] as any[];
        repoMock.find.mockResolvedValue(interacciones);

        // Act
        const result = await service.isFilteredVacantes('post-1');

        // Assert
        expect(result).toEqual(['vac-A', 'vac-B']);
        expect(result).toHaveLength(2);
    });

    it('IFV-03 — loguea las vacantes excluidas tras construirlas', async () => {
        // Arrange
        const interacciones = [
            {
                vacante: { id_vacante: 'vac-X' },
                postulante: { id: 'post-1' },
                accionEmpresa: TipoInteraccion.LIKE,
                accionPostulante: TipoInteraccion.LIKE,
            },
        ] as any[];
        repoMock.find.mockResolvedValue(interacciones);

        // Act
        await service.isFilteredVacantes('post-1');

        // Assert
        expect(loggerMock.info).toHaveBeenCalledWith(
            expect.stringContaining('vac-X'),
        );
    });

    it('IFV-04 — llama a find() con las 6 condiciones where para el postulanteId', async () => {
        // Arrange
        repoMock.find.mockResolvedValue([]);

        // Act
        await service.isFilteredVacantes('post-xyz');

        // Assert
        const callArg = repoMock.find.mock.calls[0][0] as any;
        expect(callArg.where).toHaveLength(6);
        callArg.where.forEach((condicion: any) => {
            expect(condicion.postulante).toEqual({ id: 'post-xyz' });
        });
    });

    it('IFV-05 — incluye relaciones de vacante y postulante en la consulta', async () => {
        // Arrange
        repoMock.find.mockResolvedValue([]);

        // Act
        await service.isFilteredVacantes('post-1');

        // Assert
        const callArg = repoMock.find.mock.calls[0][0] as any;
        expect(callArg.relations).toContain('vacante');
        expect(callArg.relations).toContain('postulante');
    });

    it('IFV-06 — cubre condición NO_INTERACCION + DISLIKE', async () => {
        // Arrange
        const interacciones = [
            {
                vacante: { id_vacante: 'vac-C' },
                postulante: { id: 'post-1' },
                accionEmpresa: TipoInteraccion.NO_INTERACCION,
                accionPostulante: TipoInteraccion.DISLIKE,
            },
        ] as any[];
        repoMock.find.mockResolvedValue(interacciones);

        // Act
        const result = await service.isFilteredVacantes('post-1');

        // Assert
        expect(result).toContain('vac-C');
    });

    it('IFV-07 — cubre condición NO_INTERACCION + LIKE', async () => {
        // Arrange
        const interacciones = [
            {
                vacante: { id_vacante: 'vac-D' },
                postulante: { id: 'post-1' },
                accionEmpresa: TipoInteraccion.NO_INTERACCION,
                accionPostulante: TipoInteraccion.LIKE,
            },
        ] as any[];
        repoMock.find.mockResolvedValue(interacciones);

        // Act
        const result = await service.isFilteredVacantes('post-1');

        // Assert
        expect(result).toContain('vac-D');
    });

    it('IFV-08 — propaga el error si el repositorio falla', async () => {
        // Arrange
        repoMock.find.mockRejectedValue(new Error('DB timeout'));

        // Act & Assert
        await expect(service.isFilteredVacantes('post-1')).rejects.toThrow(
            'DB timeout',
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5 — isFilteredPostulantes()
// ─────────────────────────────────────────────────────────────────────────────

describe('InteraccionesService — isFilteredPostulantes()', () => {
    let service: InteraccionesService;
    let repoMock: jest.Mocked<Repository<Interaccion>>;
    let loggerMock: ReturnType<typeof makeLoggerMock>;

    beforeEach(async () => {
        repoMock = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
        } as any;

        loggerMock = makeLoggerMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InteraccionesService,
                { provide: getRepositoryToken(Interaccion), useValue: repoMock },
                { provide: MatchesService, useValue: { create: jest.fn() } },
                { provide: WINSTON_MODULE_PROVIDER, useValue: loggerMock },
            ],
        }).compile();

        service = module.get<InteraccionesService>(InteraccionesService);
    });

    afterEach(() => jest.restoreAllMocks());

    it('IFP-01 — devuelve array vacío cuando no hay interacciones para la vacante', async () => {
        // Arrange
        repoMock.find.mockResolvedValue([]);

        // Act
        const result = await service.isFilteredPostulantes('vac-1');

        // Assert
        expect(result).toEqual([]);
        expect(repoMock.find).toHaveBeenCalledTimes(1);
    });

    it('IFP-02 — con resultados reales ejecuta Array.from+Set y devuelve ids únicos de postulantes', async () => {
        // Arrange
        const interacciones = [
            {
                vacante: { id_vacante: 'vac-1' },
                postulante: { id: 'post-A' },
                accionEmpresa: TipoInteraccion.LIKE,
                accionPostulante: TipoInteraccion.LIKE,
            },
            {
                vacante: { id_vacante: 'vac-1' },
                postulante: { id: 'post-A' },
                accionEmpresa: TipoInteraccion.DISLIKE,
                accionPostulante: TipoInteraccion.LIKE,
            },
            {
                vacante: { id_vacante: 'vac-1' },
                postulante: { id: 'post-B' },
                accionEmpresa: TipoInteraccion.DISLIKE,
                accionPostulante: TipoInteraccion.DISLIKE,
            },
        ] as any[];
        repoMock.find.mockResolvedValue(interacciones);

        // Act
        const result = await service.isFilteredPostulantes('vac-1');

        // Assert
        expect(result).toEqual(['post-A', 'post-B']);
        expect(result).toHaveLength(2);
    });

    it('IFP-03 — llama a find() con las 6 condiciones where para el vacanteId', async () => {
        // Arrange
        repoMock.find.mockResolvedValue([]);

        // Act
        await service.isFilteredPostulantes('vac-xyz');

        // Assert
        const callArg = repoMock.find.mock.calls[0][0] as any;
        expect(callArg.where).toHaveLength(6);
        callArg.where.forEach((condicion: any) => {
            expect(condicion.vacante).toEqual({ id_vacante: 'vac-xyz' });
        });
    });

    it('IFP-04 — incluye relaciones de vacante y postulante en la consulta', async () => {
        // Arrange
        repoMock.find.mockResolvedValue([]);

        // Act
        await service.isFilteredPostulantes('vac-1');

        // Assert
        const callArg = repoMock.find.mock.calls[0][0] as any;
        expect(callArg.relations).toContain('vacante');
        expect(callArg.relations).toContain('postulante');
    });

    it('IFP-05 — cubre condición DISLIKE empresa + NO_INTERACCION postulante', async () => {
        // Arrange
        const interacciones = [
            {
                vacante: { id_vacante: 'vac-1' },
                postulante: { id: 'post-C' },
                accionEmpresa: TipoInteraccion.DISLIKE,
                accionPostulante: TipoInteraccion.NO_INTERACCION,
            },
        ] as any[];
        repoMock.find.mockResolvedValue(interacciones);

        // Act
        const result = await service.isFilteredPostulantes('vac-1');

        // Assert
        expect(result).toContain('post-C');
    });

    it('IFP-06 — cubre condición LIKE empresa + NO_INTERACCION postulante', async () => {
        // Arrange
        const interacciones = [
            {
                vacante: { id_vacante: 'vac-1' },
                postulante: { id: 'post-D' },
                accionEmpresa: TipoInteraccion.LIKE,
                accionPostulante: TipoInteraccion.NO_INTERACCION,
            },
        ] as any[];
        repoMock.find.mockResolvedValue(interacciones);

        // Act
        const result = await service.isFilteredPostulantes('vac-1');

        // Assert
        expect(result).toContain('post-D');
    });

    it('IFP-07 — propaga el error si el repositorio falla', async () => {
        // Arrange
        repoMock.find.mockRejectedValue(new Error('Query failed'));

        // Act & Assert
        await expect(service.isFilteredPostulantes('vac-1')).rejects.toThrow(
            'Query failed',
        );
    });

    it('IFP-08 — múltiples postulantes distintos son retornados correctamente', async () => {
        // Arrange
        const interacciones = [
            {
                vacante: { id_vacante: 'vac-1' },
                postulante: { id: 'post-X' },
                accionEmpresa: TipoInteraccion.LIKE,
                accionPostulante: TipoInteraccion.LIKE,
            },
            {
                vacante: { id_vacante: 'vac-1' },
                postulante: { id: 'post-Y' },
                accionEmpresa: TipoInteraccion.DISLIKE,
                accionPostulante: TipoInteraccion.DISLIKE,
            },
            {
                vacante: { id_vacante: 'vac-1' },
                postulante: { id: 'post-Z' },
                accionEmpresa: TipoInteraccion.LIKE,
                accionPostulante: TipoInteraccion.NO_INTERACCION,
            },
        ] as any[];
        repoMock.find.mockResolvedValue(interacciones);

        // Act
        const result = await service.isFilteredPostulantes('vac-1');

        // Assert
        expect(result).toHaveLength(3);
        expect(result).toContain('post-X');
        expect(result).toContain('post-Y');
        expect(result).toContain('post-Z');
    });
});