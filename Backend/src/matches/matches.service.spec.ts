// =============================================================================
// Matches Service Tests | Backend
// Archivo: src/matches/matches.service.spec.ts
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchesService } from './matches.service';
import { Match } from './entities/match.entity';

function makeCreateMatchDto(overrides: Partial<{
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

describe('MatchesService.create()', () => {
    let service: MatchesService;
    let repoMock: jest.Mocked<Repository<Match>>;

    beforeEach(async () => {
        repoMock = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MatchesService,
                { provide: getRepositoryToken(Match), useValue: repoMock },
            ],
        }).compile();

        service = module.get<MatchesService>(MatchesService);
    });

    // -------------------------------------------------------------------------
    // [CB1] Crear un match con datos válidos
    // -------------------------------------------------------------------------
    it('[CB1] create() con datos válidos → retorna match creado', async () => {
        const dto = makeCreateMatchDto();
        const entity = makeMatchEntity();
        repoMock.create.mockReturnValue(entity);
        repoMock.save.mockResolvedValue(entity as any);

        const result = await service.create(dto);

        expect(repoMock.create).toHaveBeenCalledWith(dto);
        expect(repoMock.save).toHaveBeenCalledWith(entity);
        expect(result).toEqual(entity);
    });

    // -------------------------------------------------------------------------
    // [CB2] Crear match con vacante y postulante específicos
    // -------------------------------------------------------------------------
    it('[CB2] create() con vacante y postulante específicos → match con relaciones correctas', async () => {
        const dto = makeCreateMatchDto({
            vacante: { id_vacante: 'vacante-especifica' },
            postulante: { id: 'postulante-especifico' },
        });
        const entity = makeMatchEntity({
            vacante: { id_vacante: 'vacante-especifica' },
            postulante: { id: 'postulante-especifico' },
        });
        repoMock.create.mockReturnValue(entity);
        repoMock.save.mockResolvedValue(entity as any);

        const result = await service.create(dto);

        expect(repoMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                vacante: { id_vacante: 'vacante-especifica' },
                postulante: { id: 'postulante-especifico' },
            })
        );
        expect(result.postulante).toEqual({ id: 'postulante-especifico' });
    });

    // -------------------------------------------------------------------------
    // [CB3] Verificar que create() llama a matchRepository.create()
    // -------------------------------------------------------------------------
    it('[CB3] create() → llama a matchRepository.create() con el DTO', async () => {
        const dto = makeCreateMatchDto();
        const entity = makeMatchEntity();
        repoMock.create.mockReturnValue(entity);
        repoMock.save.mockResolvedValue(entity as any);

        await service.create(dto);

        expect(repoMock.create).toHaveBeenCalledTimes(1);
        expect(repoMock.create).toHaveBeenCalledWith(dto);
    });

    // -------------------------------------------------------------------------
    // [CB4] Verificar que create() llama a matchRepository.save()
    // -------------------------------------------------------------------------
    it('[CB4] create() → llama a matchRepository.save() con la entidad creada', async () => {
        const dto = makeCreateMatchDto();
        const entity = makeMatchEntity();
        repoMock.create.mockReturnValue(entity);
        repoMock.save.mockResolvedValue(entity as any);

        await service.create(dto);

        expect(repoMock.save).toHaveBeenCalledTimes(1);
        expect(repoMock.save).toHaveBeenCalledWith(entity);
    });

    // -------------------------------------------------------------------------
    // [CB5] create() retorna el match creado (no el resultado de save())
    // -------------------------------------------------------------------------
    it('[CB5] create() → retorna el match creado (retorna el objeto de create(), no el de save())', async () => {
        const dto = makeCreateMatchDto();
        // El entity que create() retorna
        const createdEntity = makeMatchEntity();
        
        repoMock.create.mockReturnValue(createdEntity);
        repoMock.save.mockResolvedValue({ ...createdEntity, id_match: 'nuevo-match-id' } as any);

        const result = await service.create(dto);

        // El servicio retorna el resultado de create(), no de save()
        expect(result).toEqual(createdEntity);
        expect(result.id_match).toBe('match-uuid-1');
    });
});

describe('MatchesService.findAll()', () => {
    let service: MatchesService;
    let repoMock: jest.Mocked<Repository<Match>>;

    beforeEach(async () => {
        repoMock = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MatchesService,
                { provide: getRepositoryToken(Match), useValue: repoMock },
            ],
        }).compile();

        service = module.get<MatchesService>(MatchesService);
    });

    it('[CB1] findAll() → retorna todos los matches con relaciones postulante y vacante', async () => {
        const matches = [
            makeMatchEntity({ id_match: 'match-1' }),
            makeMatchEntity({ id_match: 'match-2' }),
        ];
        repoMock.find.mockResolvedValue(matches as any);

        const result = await service.findAll();

        expect(repoMock.find).toHaveBeenCalledWith({ relations: ['postulante', 'vacante'] });
        expect(result).toEqual(matches);
        expect(result).toHaveLength(2);
    });

    it('[CB2] findAll() → retorna array vacío cuando no hay matches', async () => {
        repoMock.find.mockResolvedValue([]);

        const result = await service.findAll();

        expect(repoMock.find).toHaveBeenCalledWith({ relations: ['postulante', 'vacante'] });
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
    });

    it('[CB3] findAll() → verifica que se incluyan las relaciones postulante y vacante', async () => {
        const matches = [makeMatchEntity({ id_match: 'match-1' })];
        repoMock.find.mockResolvedValue(matches as any);

        await service.findAll();

        expect(repoMock.find).toHaveBeenCalledWith(
            expect.objectContaining({
                relations: expect.arrayContaining(['postulante', 'vacante']),
            })
        );
    });

    it('[CB4] findAll() → retorna matches con datos completos de vacante y postulante', async () => {
        const matches = [
            makeMatchEntity({
                id_match: 'match-1',
                vacante: { id_vacante: 'v-1', titulo: 'Frontend Dev' },
                postulante: { id: 'p-1', name: 'Carlos', lastname: 'Smith' },
            }),
        ];
        repoMock.find.mockResolvedValue(matches as any);

        const result = await service.findAll();

        expect(result[0].vacante.titulo).toBe('Frontend Dev');
        expect(result[0].postulante.name).toBe('Carlos');
    });
});

describe('MatchesService.findOne()', () => {
    let service: MatchesService;
    let repoMock: jest.Mocked<Repository<Match>>;

    beforeEach(async () => {
        repoMock = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MatchesService,
                { provide: getRepositoryToken(Match), useValue: repoMock },
            ],
        }).compile();

        service = module.get<MatchesService>(MatchesService);
    });

    it('[CB1] findOne() con ID válido → retorna mensaje con el ID', async () => {
        const result = await service.findOne(1);

        expect(result).toBe('This action returns a #1 match');
    });

    it('[CB2] findOne() con diferentes IDs → retorna mensajes correctos', async () => {
        const result1 = await service.findOne(5);
        const result2 = await service.findOne(10);

        expect(result1).toBe('This action returns a #5 match');
        expect(result2).toBe('This action returns a #10 match');
    });
});

describe('MatchesService.update()', () => {
    let service: MatchesService;
    let repoMock: jest.Mocked<Repository<Match>>;

    beforeEach(async () => {
        repoMock = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MatchesService,
                { provide: getRepositoryToken(Match), useValue: repoMock },
            ],
        }).compile();

        service = module.get<MatchesService>(MatchesService);
    });

    it('[CB1] update() con ID válido → retorna mensaje con el ID', async () => {
        const result = await service.update(1, {});

        expect(result).toBe('This action updates a #1 match');
    });

    it('[CB2] update() con diferentes IDs → retorna mensajes correctos', async () => {
        const result1 = await service.update(3, {});
        const result2 = await service.update(7, {});

        expect(result1).toBe('This action updates a #3 match');
        expect(result2).toBe('This action updates a #7 match');
    });
});

describe('MatchesService.remove()', () => {
    let service: MatchesService;
    let repoMock: jest.Mocked<Repository<Match>>;

    beforeEach(async () => {
        repoMock = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MatchesService,
                { provide: getRepositoryToken(Match), useValue: repoMock },
            ],
        }).compile();

        service = module.get<MatchesService>(MatchesService);
    });

    it('[CB1] remove() con ID válido → retorna mensaje con el ID', async () => {
        const result = await service.remove(1);

        expect(result).toBe('This action removes a #1 match');
    });

    it('[CB2] remove() con diferentes IDs → retorna mensajes correctos', async () => {
        const result1 = await service.remove(2);
        const result2 = await service.remove(8);

        expect(result1).toBe('This action removes a #2 match');
        expect(result2).toBe('This action removes a #8 match');
    });
});

