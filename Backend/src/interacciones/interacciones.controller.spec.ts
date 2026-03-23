// =============================================================================
// Interacciones Controller Tests | Backend
// Archivo: src/interacciones/interacciones.controller.spec.ts
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { InteraccionesController } from './interacciones.controller';
import { InteraccionesService } from './interacciones.service';
import { TipoInteraccion } from './entities/interacciones.entity';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — factories centralizadas
// ─────────────────────────────────────────────────────────────────────────────

function makeCreateDto(overrides: Partial<{
    postulante: string;
    vacante: string;
    accion_empresa: TipoInteraccion | null;
    accion_postulante: TipoInteraccion | null;
    empresa: string;
}> = {}) {
    return {
        postulante: overrides.postulante ?? 'uuid-p',
        vacante: overrides.vacante ?? 'uuid-v',
        accion_empresa: overrides.accion_empresa !== undefined ? overrides.accion_empresa : TipoInteraccion.LIKE,
        accion_postulante: overrides.accion_postulante !== undefined ? overrides.accion_postulante : TipoInteraccion.LIKE,
        empresa: overrides.empresa ?? 'uuid-e',
    };
}

function makeInteraccion(overrides: any = {}): any {
    return {
        accionEmpresa: overrides.accionEmpresa ?? TipoInteraccion.LIKE,
        accionPostulante: overrides.accionPostulante ?? TipoInteraccion.LIKE,
        vacante: { id_vacante: overrides.vacanteId ?? 'uuid-v' },
        postulante: { id: overrides.postulanteId ?? 'uuid-p' },
        ...overrides,
    };
}

function makeServiceMock(): jest.Mocked<InteraccionesService> {
    return {
        createInteraction: jest.fn(),
        isFilteredVacantes: jest.fn(),
        isFilteredPostulantes: jest.fn(),
        findOne: jest.fn(),
        isMatch: jest.fn(),
    } as any;
}

// =============================================================================
// SUITE 1 — create()
// =============================================================================

describe('InteraccionesController.create()', () => {
    let controller: InteraccionesController;
    let serviceMock: jest.Mocked<InteraccionesService>;

    beforeEach(async () => {
        serviceMock = makeServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [InteraccionesController],
            providers: [{ provide: InteraccionesService, useValue: serviceMock }],
        }).compile();

        controller = module.get<InteraccionesController>(InteraccionesController);
    });

    afterEach(() => jest.restoreAllMocks());

    it('IC-01 — delega el DTO al service y retorna la entidad creada', async () => {
        // Arrange
        const dto = makeCreateDto();
        const entidadCreada = makeInteraccion();
        serviceMock.createInteraction.mockResolvedValue(entidadCreada);

        // Act
        const result = await controller.create(dto as any);

        // Assert
        expect(serviceMock.createInteraction).toHaveBeenCalledTimes(1);
        expect(serviceMock.createInteraction).toHaveBeenCalledWith(dto);
        expect(result).toBe(entidadCreada);
    });

    it('IC-02 — retorna exactamente lo que el service devuelve sin transformarlo', async () => {
        // Arrange
        const dto = makeCreateDto();
        const entidadCreada = makeInteraccion({ accionEmpresa: TipoInteraccion.DISLIKE });
        serviceMock.createInteraction.mockResolvedValue(entidadCreada);

        // Act
        const result = await controller.create(dto as any);

        // Assert
        expect(result).toBe(entidadCreada);
    });

    it('IC-03 — pasa el DTO completo al service sin modificarlo', async () => {
        // Arrange
        const dto = makeCreateDto({
            vacante: 'vac-especifica',
            postulante: 'post-especifico',
            accion_empresa: TipoInteraccion.DISLIKE,
        });
        serviceMock.createInteraction.mockResolvedValue(makeInteraccion());

        // Act
        await controller.create(dto as any);

        // Assert
        expect(serviceMock.createInteraction).toHaveBeenCalledWith(
            expect.objectContaining({
                vacante: 'vac-especifica',
                postulante: 'post-especifico',
                accion_empresa: TipoInteraccion.DISLIKE,
            }),
        );
    });

    it('IC-04 — propaga el error si el service lanza una excepción', async () => {
        // Arrange
        const dto = makeCreateDto();
        serviceMock.createInteraction.mockRejectedValue(new Error('DB error'));

        // Act & Assert
        await expect(controller.create(dto as any)).rejects.toThrow('DB error');
    });
});

// =============================================================================
// SUITE 2 — findVacantesExcluidos()
// =============================================================================

describe('InteraccionesController.findVacantesExcluidos()', () => {
    let controller: InteraccionesController;
    let serviceMock: jest.Mocked<InteraccionesService>;

    beforeEach(async () => {
        serviceMock = makeServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [InteraccionesController],
            providers: [{ provide: InteraccionesService, useValue: serviceMock }],
        }).compile();

        controller = module.get<InteraccionesController>(InteraccionesController);
    });

    afterEach(() => jest.restoreAllMocks());

    it('IFV-01 — delega el postulanteId al service y retorna las vacantes excluidas', async () => {
        // Arrange
        const postulanteId = 'post-1';
        const vacantesExcluidas = ['vac-A', 'vac-B'];
        serviceMock.isFilteredVacantes.mockResolvedValue(vacantesExcluidas);

        // Act
        const result = await controller.findVacantesExcluidos(postulanteId);

        // Assert
        expect(serviceMock.isFilteredVacantes).toHaveBeenCalledTimes(1);
        expect(serviceMock.isFilteredVacantes).toHaveBeenCalledWith(postulanteId);
        expect(result).toBe(vacantesExcluidas);
    });

    it('IFV-02 — retorna array vacío cuando no hay vacantes excluidas', async () => {
        // Arrange
        serviceMock.isFilteredVacantes.mockResolvedValue([]);

        // Act
        const result = await controller.findVacantesExcluidos('post-sin-interacciones');

        // Assert
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
    });

    it('IFV-03 — pasa el id correcto al service sin modificarlo', async () => {
        // Arrange
        serviceMock.isFilteredVacantes.mockResolvedValue([]);

        // Act
        await controller.findVacantesExcluidos('mi-postulante-id');

        // Assert
        expect(serviceMock.isFilteredVacantes).toHaveBeenCalledWith('mi-postulante-id');
    });

    it('IFV-04 — propaga el error si el service lanza una excepción', async () => {
        // Arrange
        serviceMock.isFilteredVacantes.mockRejectedValue(new Error('Filtro fallido'));

        // Act & Assert
        await expect(
            controller.findVacantesExcluidos('post-err'),
        ).rejects.toThrow('Filtro fallido');
    });
});

// =============================================================================
// SUITE 3 — findPostulantesExcluidos()
// =============================================================================

describe('InteraccionesController.findPostulantesExcluidos()', () => {
    let controller: InteraccionesController;
    let serviceMock: jest.Mocked<InteraccionesService>;

    beforeEach(async () => {
        serviceMock = makeServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [InteraccionesController],
            providers: [{ provide: InteraccionesService, useValue: serviceMock }],
        }).compile();

        controller = module.get<InteraccionesController>(InteraccionesController);
    });

    afterEach(() => jest.restoreAllMocks());

    it('IFP-01 — delega el vacanteId al service y retorna los postulantes excluidos', async () => {
        // Arrange
        const vacanteId = 'vac-1';
        const postulantesExcluidos = ['post-A', 'post-B'];
        serviceMock.isFilteredPostulantes.mockResolvedValue(postulantesExcluidos);

        // Act
        const result = await controller.findPostulantesExcluidos(vacanteId);

        // Assert
        expect(serviceMock.isFilteredPostulantes).toHaveBeenCalledTimes(1);
        expect(serviceMock.isFilteredPostulantes).toHaveBeenCalledWith(vacanteId);
        expect(result).toBe(postulantesExcluidos);
    });

    it('IFP-02 — retorna array vacío cuando no hay postulantes excluidos', async () => {
        // Arrange
        serviceMock.isFilteredPostulantes.mockResolvedValue([]);

        // Act
        const result = await controller.findPostulantesExcluidos('vac-sin-interacciones');

        // Assert
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
    });

    it('IFP-03 — pasa el id correcto al service sin modificarlo', async () => {
        // Arrange
        serviceMock.isFilteredPostulantes.mockResolvedValue([]);

        // Act
        await controller.findPostulantesExcluidos('mi-vacante-id');

        // Assert
        expect(serviceMock.isFilteredPostulantes).toHaveBeenCalledWith('mi-vacante-id');
    });

    it('IFP-04 — propaga el error si el service lanza una excepción', async () => {
        // Arrange
        serviceMock.isFilteredPostulantes.mockRejectedValue(new Error('Filtro fallido'));

        // Act & Assert
        await expect(
            controller.findPostulantesExcluidos('vac-err'),
        ).rejects.toThrow('Filtro fallido');
    });
});

// =============================================================================
// SUITE 4 — checkMatch()
// =============================================================================

describe('InteraccionesController.checkMatch()', () => {
    let controller: InteraccionesController;
    let serviceMock: jest.Mocked<InteraccionesService>;

    beforeEach(async () => {
        serviceMock = makeServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [InteraccionesController],
            providers: [{ provide: InteraccionesService, useValue: serviceMock }],
        }).compile();

        controller = module.get<InteraccionesController>(InteraccionesController);
    });

    afterEach(() => jest.restoreAllMocks());

    it('CM-01 — delega postulanteId y vacanteId al service y retorna la interacción', async () => {
        // Arrange
        const postulanteId = 'post-1';
        const vacanteId = 'vac-1';
        const interaccion = makeInteraccion();
        serviceMock.findOne.mockResolvedValue(interaccion);

        // Act
        const result = await controller.checkMatch(postulanteId, vacanteId);

        // Assert
        expect(serviceMock.findOne).toHaveBeenCalledTimes(1);
        // El controller llama findOne(vacanteId, postulanteId) — vacante primero
        expect(serviceMock.findOne).toHaveBeenCalledWith(vacanteId, postulanteId);
        expect(result).toBe(interaccion);
    });

    it('CM-02 — retorna null cuando no existe la interacción', async () => {
        // Arrange
        serviceMock.findOne.mockResolvedValue(null);

        // Act
        const result = await controller.checkMatch('post-1', 'vac-1');

        // Assert
        expect(result).toBeNull();
    });

    it('CM-03 — el controller invierte el orden: pasa vacanteId primero y postulanteId segundo', async () => {
        // Arrange
        serviceMock.findOne.mockResolvedValue(null);

        // Act
        await controller.checkMatch('mi-postulante', 'mi-vacante');

        // Assert — el controller llama findOne(vacanteId, postulanteId)
        expect(serviceMock.findOne).toHaveBeenCalledWith('mi-vacante', 'mi-postulante');
        expect(serviceMock.findOne).not.toHaveBeenCalledWith('mi-postulante', 'mi-vacante');
    });

    it('CM-04 — retorna exactamente lo que el service devuelve sin transformarlo', async () => {
        // Arrange
        const interaccion = makeInteraccion({ accionEmpresa: TipoInteraccion.DISLIKE });
        serviceMock.findOne.mockResolvedValue(interaccion);

        // Act
        const result = await controller.checkMatch('post-1', 'vac-1');

        // Assert
        expect(result).toBe(interaccion);
    });

    it('CM-05 — propaga el error si el service lanza una excepción', async () => {
        // Arrange
        serviceMock.findOne.mockRejectedValue(new Error('DB error'));

        // Act & Assert
        await expect(
            controller.checkMatch('post-err', 'vac-err'),
        ).rejects.toThrow('DB error');
    });
});