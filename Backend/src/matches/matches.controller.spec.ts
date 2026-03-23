// =============================================================================
// Matches Controller Tests | Backend
// Archivo: src/matches/matches.controller.spec.ts
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

// ---------------------------------------------------------------------------
// Factories de datos de prueba
// ---------------------------------------------------------------------------
function makeCreateMatchDto(overrides: Partial<{
    vacante: any;
    postulante: any;
}> = {}) {
    return {
        vacante: overrides.vacante ?? { id_vacante: 'vacante-uuid-1' },
        postulante: overrides.postulante ?? { id: 'postulante-uuid-1' },
    };
}

function makeUpdateMatchDto(overrides: Partial<{
    vacante: any;
    postulante: any;
}> = {}) {
    return {
        vacante: overrides.vacante ?? { id_vacante: 'vacante-uuid-1' },
        postulante: overrides.postulante ?? { id: 'postulante-uuid-1' },
    };
}

function makeMatchEntity(overrides: any = {}): any {
    return {
        id_match: overrides.id_match ?? 'match-uuid-1',
        fecha: overrides.fecha ?? new Date('2024-01-01'),
        vacante: overrides.vacante ?? { id_vacante: 'vacante-uuid-1', titulo: 'Desarrollador' },
        postulante: overrides.postulante ?? { id: 'postulante-uuid-1', name: 'Juan', lastname: 'Perez' },
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Mock del servicio (centralizado)
// ---------------------------------------------------------------------------
function makeServiceMock(): jest.Mocked<MatchesService> {
    return {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    } as any;
}

// =============================================================================
// Suite: create()
// =============================================================================
describe('MatchesController.create()', () => {
    let controller: MatchesController;
    let serviceMock: jest.Mocked<MatchesService>;

    beforeEach(async () => {
        serviceMock = makeServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [MatchesController],
            providers: [{ provide: MatchesService, useValue: serviceMock }],
        }).compile();

        controller = module.get<MatchesController>(MatchesController);
    });

    // [CB1] Happy path básico
    it('[CB1] create() con DTO válido → retorna el match creado por el service', async () => {
        // Arrange
        const dto = makeCreateMatchDto();
        const expectedMatch = makeMatchEntity();
        serviceMock.create.mockResolvedValue(expectedMatch);

        // Act
        const result = await controller.create(dto as any);

        // Assert
        expect(serviceMock.create).toHaveBeenCalledTimes(1);
        expect(serviceMock.create).toHaveBeenCalledWith(dto);
        expect(result).toEqual(expectedMatch);
    });

    // [CB2] Delegación: el controller no transforma la respuesta
    it('[CB2] create() → retorna exactamente lo que el service devuelve', async () => {
        // Arrange
        const dto = makeCreateMatchDto();
        const serviceResponse = makeMatchEntity({ id_match: 'nuevo-uuid' });
        serviceMock.create.mockResolvedValue(serviceResponse);

        // Act
        const result = await controller.create(dto as any);

        // Assert
        expect(result).toBe(serviceResponse);
    });

    // [CB3] Propagación de errores
    it('[CB3] create() → propaga el error si el service lanza una excepción', async () => {
        // Arrange
        const dto = makeCreateMatchDto();
        serviceMock.create.mockRejectedValue(new Error('DB error'));

        // Act & Assert
        await expect(controller.create(dto as any)).rejects.toThrow('DB error');
    });

    // [CB4] DTO con datos específicos llega correctamente al service
    it('[CB4] create() → pasa el DTO completo al service sin modificarlo', async () => {
        // Arrange
        const dto = makeCreateMatchDto({
            vacante: { id_vacante: 'vacante-especifica' },
            postulante: { id: 'postulante-especifico' },
        });
        serviceMock.create.mockResolvedValue(makeMatchEntity());

        // Act
        await controller.create(dto as any);

        // Assert
        expect(serviceMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                vacante: { id_vacante: 'vacante-especifica' },
                postulante: { id: 'postulante-especifico' },
            })
        );
    });
});

// =============================================================================
// Suite: findAll()
// =============================================================================
describe('MatchesController.findAll()', () => {
    let controller: MatchesController;
    let serviceMock: jest.Mocked<MatchesService>;

    beforeEach(async () => {
        serviceMock = makeServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [MatchesController],
            providers: [{ provide: MatchesService, useValue: serviceMock }],
        }).compile();

        controller = module.get<MatchesController>(MatchesController);
    });

    // [CB1] Retorna lista de matches
    it('[CB1] findAll() → retorna todos los matches del service', async () => {
        // Arrange
        const matches = [
            makeMatchEntity({ id_match: 'match-1' }),
            makeMatchEntity({ id_match: 'match-2' }),
        ];
        serviceMock.findAll.mockResolvedValue(matches);

        // Act
        const result = await controller.findAll();

        // Assert
        expect(serviceMock.findAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual(matches);
        expect(result).toHaveLength(2);
    });

    // [CB2] Lista vacía
    it('[CB2] findAll() → retorna array vacío cuando no hay matches', async () => {
        // Arrange
        serviceMock.findAll.mockResolvedValue([]);

        // Act
        const result = await controller.findAll();

        // Assert
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
    });

    // [CB3] Delegación pura
    it('[CB3] findAll() → delega al service sin argumentos adicionales', async () => {
        // Arrange
        serviceMock.findAll.mockResolvedValue([]);

        // Act
        await controller.findAll();

        // Assert
        expect(serviceMock.findAll).toHaveBeenCalledWith();
    });

    // [CB4] Propagación de errores
    it('[CB4] findAll() → propaga el error si el service lanza una excepción', async () => {
        // Arrange
        serviceMock.findAll.mockRejectedValue(new Error('Connection lost'));

        // Act & Assert
        await expect(controller.findAll()).rejects.toThrow('Connection lost');
    });
});

// =============================================================================
// Suite: findOne()
// =============================================================================
describe('MatchesController.findOne()', () => {
    let controller: MatchesController;
    let serviceMock: jest.Mocked<MatchesService>;

    beforeEach(async () => {
        serviceMock = makeServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [MatchesController],
            providers: [{ provide: MatchesService, useValue: serviceMock }],
        }).compile();

        controller = module.get<MatchesController>(MatchesController);
    });

    // [CB1] Conversión de string a número
    it('[CB1] findOne() → convierte el id string a número antes de llamar al service', async () => {
        // Arrange
        serviceMock.findOne.mockReturnValue('This action returns a #1 match' as any);

        // Act
        controller.findOne('1');

        // Assert
        expect(serviceMock.findOne).toHaveBeenCalledWith(1);
        expect(serviceMock.findOne).not.toHaveBeenCalledWith('1');
    });

    // [CB2] Retorna lo que el service devuelve
    it('[CB2] findOne() → retorna el resultado del service', () => {
        // Arrange
        const expected = 'This action returns a #5 match';
        serviceMock.findOne.mockReturnValue(expected as any);

        // Act
        const result = controller.findOne('5');

        // Assert
        expect(result).toBe(expected);
    });

    // [CB3] Diferentes IDs se convierten correctamente
    it('[CB3] findOne() → convierte correctamente IDs distintos', () => {
        // Arrange
        serviceMock.findOne.mockReturnValue('' as any);

        // Act
        controller.findOne('42');
        controller.findOne('100');

        // Assert
        expect(serviceMock.findOne).toHaveBeenNthCalledWith(1, 42);
        expect(serviceMock.findOne).toHaveBeenNthCalledWith(2, 100);
    });
});

// =============================================================================
// Suite: update()
// =============================================================================
describe('MatchesController.update()', () => {
    let controller: MatchesController;
    let serviceMock: jest.Mocked<MatchesService>;

    beforeEach(async () => {
        serviceMock = makeServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [MatchesController],
            providers: [{ provide: MatchesService, useValue: serviceMock }],
        }).compile();

        controller = module.get<MatchesController>(MatchesController);
    });

    // [CB1] Convierte id y delega DTO al service
    it('[CB1] update() → convierte el id y pasa el DTO al service', () => {
        // Arrange
        const dto = makeUpdateMatchDto();
        const expected = 'This action updates a #1 match';
        serviceMock.update.mockReturnValue(expected as any);

        // Act
        const result = controller.update('1', dto as any);

        // Assert
        expect(serviceMock.update).toHaveBeenCalledWith(1, dto);
        expect(result).toBe(expected);
    });

    // [CB2] El id llega como número al service
    it('[CB2] update() → convierte string a número en el id', () => {
        // Arrange
        const dto = makeUpdateMatchDto();
        serviceMock.update.mockReturnValue('' as any);

        // Act
        controller.update('7', dto as any);

        // Assert
        expect(serviceMock.update).toHaveBeenCalledWith(7, expect.anything());
        expect(serviceMock.update).not.toHaveBeenCalledWith('7', expect.anything());
    });

    // [CB3] Propagación de errores
    it('[CB3] update() → propaga el error si el service lanza una excepción', () => {
        // Arrange
        const dto = makeUpdateMatchDto();
        serviceMock.update.mockImplementation(() => { throw new Error('Not found'); });

        // Act & Assert
        expect(() => controller.update('1', dto as any)).toThrow('Not found');
    });
});

// =============================================================================
// Suite: remove()
// =============================================================================
describe('MatchesController.remove()', () => {
    let controller: MatchesController;
    let serviceMock: jest.Mocked<MatchesService>;

    beforeEach(async () => {
        serviceMock = makeServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [MatchesController],
            providers: [{ provide: MatchesService, useValue: serviceMock }],
        }).compile();

        controller = module.get<MatchesController>(MatchesController);
    });

    // [CB1] Convierte id y delega al service
    it('[CB1] remove() → convierte el id y llama al service', () => {
        // Arrange
        const expected = 'This action removes a #1 match';
        serviceMock.remove.mockReturnValue(expected as any);

        // Act
        const result = controller.remove('1');

        // Assert
        expect(serviceMock.remove).toHaveBeenCalledWith(1);
        expect(result).toBe(expected);
    });

    // [CB2] El id string se convierte a número
    it('[CB2] remove() → convierte correctamente el id de string a número', () => {
        // Arrange
        serviceMock.remove.mockReturnValue('' as any);

        // Act
        controller.remove('99');

        // Assert
        expect(serviceMock.remove).toHaveBeenCalledWith(99);
        expect(serviceMock.remove).not.toHaveBeenCalledWith('99');
    });

    // [CB3] Propagación de errores
    it('[CB3] remove() → propaga el error si el service lanza una excepción', () => {
        // Arrange
        serviceMock.remove.mockImplementation(() => { throw new Error('Cannot delete'); });

        // Act & Assert
        expect(() => controller.remove('1')).toThrow('Cannot delete');
    });
});