import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VacantesService } from './vacantes.service';
import { Vacante } from './entities/vacante.entity';
import { InteraccionesService } from '../interacciones/interacciones.service';

function makeDto(
    overrides: Partial<{
        titulo: string;
        salario: string;
        ubicacion: string;
        modalidad: string;
        tipo_trabajo: string;
        empresa: string;
        vacantesIdiomas: string[];
        vacanteHabilidades: string[];
    }> = {},
) {
    return {
        titulo: overrides.titulo ?? 'Dev Angular',
        salario: overrides.salario ?? '3000000',
        ubicacion: overrides.ubicacion ?? 'Bogotá',
        modalidad: overrides.modalidad ?? 'Remoto',
        tipo_trabajo: overrides.tipo_trabajo ?? 'Full-time',
        empresa: overrides.empresa ?? 'uuid-emp',
        vacantesIdiomas: overrides.vacantesIdiomas ?? [],
        vacanteHabilidades: overrides.vacanteHabilidades ?? [],
    };
}

function makeVacanteEntity(overrides: any = {}): any {
    return {
        id_vacante: overrides.id_vacante ?? 'v-uuid-1',
        titulo: overrides.titulo ?? 'Dev Angular',
        vacantesIdiomas: overrides.vacantesIdiomas ?? [],
        vacanteHabilidades: overrides.vacanteHabilidades ?? [],
        empresa: overrides.empresa ?? { id: 'emp-uuid' },
        ...overrides,
    };
}

function makeQbMock() {
    const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
    };
    return qb;
}

describe('HU8RF9 — Publicar Vacante | VacantesService.create()', () => {
    let service: VacantesService;
    let repoMock: jest.Mocked<Repository<Vacante>>;

    beforeEach(async () => {
        repoMock = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(makeQbMock()),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VacantesService,
                { provide: getRepositoryToken(Vacante), useValue: repoMock },
                {
                    provide: InteraccionesService,
                    useValue: { isFilteredVacantes: jest.fn().mockResolvedValue([]) },
                },
            ],
        }).compile();

        service = module.get<VacantesService>(VacantesService);
    });

    it('[CB1] Camino 1,2,3,4,5,7,9,F — sin idiomas ni habilidades → save() sin asignar relaciones', async () => {
        const dto = makeDto();
        const entity = { titulo: dto.titulo, empresa: { id: dto.empresa } } as any;
        repoMock.create.mockReturnValue(entity);
        repoMock.save.mockResolvedValue({ ...entity, id_vacante: 'uuid-1' } as any);

        const result = await service.create(dto as any);

        expect(repoMock.create).toHaveBeenCalledWith(
            expect.objectContaining({ empresa: { id: 'uuid-emp' } }),
        );
        expect(entity.vacantesIdiomas).toBeUndefined();
        expect(entity.vacanteHabilidades).toBeUndefined();
        expect(repoMock.save).toHaveBeenCalledWith(entity);
        expect(result).toEqual(expect.objectContaining({ id_vacante: 'uuid-1' }));
    });

    it('[CB2] Camino 1,2,3,4,5,6,7,9,F — con idiomas, sin habilidades → idiomas mapeados', async () => {
        const dto = makeDto({ vacantesIdiomas: ['id-1'] });
        const entity = { titulo: dto.titulo, empresa: { id: dto.empresa } } as any;
        repoMock.create.mockReturnValue(entity);
        repoMock.save.mockResolvedValue({ ...entity, id_vacante: 'uuid-2' } as any);

        await service.create(dto as any);

        expect(entity.vacantesIdiomas).toEqual([{ idioma: { id_idioma: 'id-1' } }]);
        expect(entity.vacanteHabilidades).toBeUndefined();
        expect(repoMock.save).toHaveBeenCalledWith(entity);
    });

    it('[CB3] Camino 1,2,3,4,5,7,8,9,F — sin idiomas, con habilidades → habilidades mapeadas', async () => {
        const dto = makeDto({ vacanteHabilidades: ['hab-1'] });
        const entity = { titulo: dto.titulo, empresa: { id: dto.empresa } } as any;
        repoMock.create.mockReturnValue(entity);
        repoMock.save.mockResolvedValue({ ...entity, id_vacante: 'uuid-3' } as any);

        await service.create(dto as any);

        expect(entity.vacantesIdiomas).toBeUndefined();
        expect(entity.vacanteHabilidades).toEqual([
            { habilidades: { id_habilidad: 'hab-1' } },
        ]);
        expect(repoMock.save).toHaveBeenCalledWith(entity);
    });

    it('[CB4] Camino 1,2,3,4,5,6,7,8,9,F — con idiomas y habilidades → ambas relaciones mapeadas', async () => {
        const dto = makeDto({
            vacantesIdiomas: ['id-1'],
            vacanteHabilidades: ['hab-1'],
        });
        const entity = { titulo: dto.titulo, empresa: { id: dto.empresa } } as any;
        repoMock.create.mockReturnValue(entity);
        repoMock.save.mockResolvedValue({ ...entity, id_vacante: 'uuid-4' } as any);

        await service.create(dto as any);

        expect(entity.vacantesIdiomas).toEqual([{ idioma: { id_idioma: 'id-1' } }]);
        expect(entity.vacanteHabilidades).toEqual([
            { habilidades: { id_habilidad: 'hab-1' } },
        ]);
        expect(repoMock.save).toHaveBeenCalledWith(entity);
    });

    it('create() — empresa se convierte en relación { id }', async () => {
        const dto = makeDto({ empresa: 'mi-empresa-id' });
        const entity = {} as any;
        repoMock.create.mockReturnValue(entity);
        repoMock.save.mockResolvedValue(entity);

        await service.create(dto as any);

        const callArg = repoMock.create.mock.calls[0][0] as any;
        expect(typeof callArg.empresa).toBe('object');
        expect(callArg.empresa.id).toBe('mi-empresa-id');
    });

    it('create() — múltiples idiomas se mapean todos correctamente', async () => {
        const dto = makeDto({ vacantesIdiomas: ['id-1', 'id-2', 'id-3'] });
        const entity = {} as any;
        repoMock.create.mockReturnValue(entity);
        repoMock.save.mockResolvedValue(entity);

        await service.create(dto as any);

        expect(entity.vacantesIdiomas).toHaveLength(3);
        expect(entity.vacantesIdiomas[0]).toEqual({
            idioma: { id_idioma: 'id-1' },
        });
        expect(entity.vacantesIdiomas[1]).toEqual({
            idioma: { id_idioma: 'id-2' },
        });
        expect(entity.vacantesIdiomas[2]).toEqual({
            idioma: { id_idioma: 'id-3' },
        });
    });

    it('create() — múltiples habilidades se mapean todas correctamente', async () => {
        const dto = makeDto({ vacanteHabilidades: ['hab-1', 'hab-2'] });
        const entity = {} as any;
        repoMock.create.mockReturnValue(entity);
        repoMock.save.mockResolvedValue(entity);

        await service.create(dto as any);

        expect(entity.vacanteHabilidades).toHaveLength(2);
        expect(entity.vacanteHabilidades[0]).toEqual({
            habilidades: { id_habilidad: 'hab-1' },
        });
        expect(entity.vacanteHabilidades[1]).toEqual({
            habilidades: { id_habilidad: 'hab-2' },
        });
    });

    it('create() — retorna el resultado de vacanteRepository.save()', async () => {
        const dto = makeDto();
        const entity = {} as any;
        const savedValue = { ...entity, id_vacante: 'saved-uuid' } as any;
        repoMock.create.mockReturnValue(entity);
        repoMock.save.mockResolvedValue(savedValue);

        const result = await service.create(dto as any);

        expect(result).toBe(savedValue);
    });
});

// =============================================================================
// Suite 2 — VacantesService.getVacantes()
// =============================================================================
describe('Seleccionar Vacante | VacantesService.getVacantes()', () => {
    let service: VacantesService;
    let repoMock: any;
    let interaccionMock: { isFilteredVacantes: jest.Mock };
    let qbMock: any;

    beforeEach(async () => {
        qbMock = makeQbMock();
        repoMock = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(qbMock),
        };

        interaccionMock = { isFilteredVacantes: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VacantesService,
                { provide: getRepositoryToken(Vacante), useValue: repoMock },
                { provide: InteraccionesService, useValue: interaccionMock },
            ],
        }).compile();

        service = module.get<VacantesService>(VacantesService);
    });

    // -------------------------------------------------------------------------
    // [CB1] vacantesExcluidas=[ids] → andWhere aplicado
    // -------------------------------------------------------------------------
    it('[CB1] Camino 1,2,3,4,5,6,7,F — vacantesExcluidas=[ids] → andWhere() aplicado → retorna vacantes filtradas', async () => {
        const excluidas = ['v-excluida-1', 'v-excluida-2'];
        interaccionMock.isFilteredVacantes.mockResolvedValue(excluidas);

        const vacanteEntity = makeVacanteEntity({
            id_vacante: 'v-nueva',
            vacantesIdiomas: [{ idioma: { nombre: 'Inglés' } }],
            vacanteHabilidades: [{ habilidades: { nombre_habilidad: 'React' } }],
        });
        qbMock.getMany.mockResolvedValue([vacanteEntity]);

        const result = await service.getVacantes('postulante-uuid');

        // Nodo 1: isFilteredVacantes llamado con postulanteId
        expect(interaccionMock.isFilteredVacantes).toHaveBeenCalledWith(
            'postulante-uuid',
        );

        // Nodo 3→Sí → Nodo 4: andWhere con exclusiones
        expect(qbMock.andWhere).toHaveBeenCalledWith(
            'vacante.id_vacante NOT IN (:...excluidas)',
            { excluidas },
        );

        // Nodo 5: getMany() ejecutado
        expect(qbMock.getMany).toHaveBeenCalled();

        // Nodo 6: map formatea idiomas y habilidades correctamente
        expect(result[0].idiomas).toEqual(['Inglés']);
        expect(result[0].habilidades).toEqual(['React']);

        // Nodo 7: retorna vacantesFormateadas
        expect(result).toHaveLength(1);
        expect(result[0].id_vacante).toBe('v-nueva');
    });

    // -------------------------------------------------------------------------
    // [CB2] vacantesExcluidas=[] → andWhere NO aplicado
    // -------------------------------------------------------------------------
    it('[CB2] Camino 1,2,3,5,6,7,F — vacantesExcluidas=[] → andWhere() NO aplicado → retorna todas las vacantes', async () => {
        interaccionMock.isFilteredVacantes.mockResolvedValue([]);

        const vacantes = [
            makeVacanteEntity({ id_vacante: 'v-1' }),
            makeVacanteEntity({ id_vacante: 'v-2' }),
        ];
        qbMock.getMany.mockResolvedValue(vacantes);

        const result = await service.getVacantes('postulante-nuevo-uuid');

        // Nodo 3→No: andWhere NO llamado
        expect(qbMock.andWhere).not.toHaveBeenCalled();

        // Nodo 5: getMany sin filtro adicional
        expect(qbMock.getMany).toHaveBeenCalled();

        // Nodo 7: retorna todas
        expect(result).toHaveLength(2);
        expect(result[0].id_vacante).toBe('v-1');
        expect(result[1].id_vacante).toBe('v-2');
    });

    // -------------------------------------------------------------------------
    // Assertions adicionales getVacantes()
    // -------------------------------------------------------------------------
    it('getVacantes() — el queryBuilder aplica limit(5)', async () => {
        interaccionMock.isFilteredVacantes.mockResolvedValue([]);
        qbMock.getMany.mockResolvedValue([]);

        await service.getVacantes('p-uuid');

        expect(qbMock.limit).toHaveBeenCalledWith(5);
    });

    it('getVacantes() — el queryBuilder hace join con empresa, habilidades e idiomas', async () => {
        interaccionMock.isFilteredVacantes.mockResolvedValue([]);
        qbMock.getMany.mockResolvedValue([]);

        await service.getVacantes('p-uuid');

        const joins = qbMock.leftJoinAndSelect.mock.calls.map((c: any[]) => c[1]);
        expect(joins).toContain('empresa');
        expect(joins).toContain('vacanteHabilidades');
        expect(joins).toContain('habilidades');
        expect(joins).toContain('vacantesIdiomas');
        expect(joins).toContain('idioma');
    });

    it('getVacantes() — map() extrae nombres de idiomas y habilidades correctamente', async () => {
        interaccionMock.isFilteredVacantes.mockResolvedValue([]);

        qbMock.getMany.mockResolvedValue([
            makeVacanteEntity({
                vacantesIdiomas: [
                    { idioma: { nombre: 'Español' } },
                    { idioma: { nombre: 'Inglés' } },
                ],
                vacanteHabilidades: [
                    { habilidades: { nombre_habilidad: 'Angular' } },
                    { habilidades: { nombre_habilidad: 'TypeScript' } },
                ],
            }),
        ]);

        const result = await service.getVacantes('p-uuid');

        expect(result[0].idiomas).toEqual(['Español', 'Inglés']);
        expect(result[0].habilidades).toEqual(['Angular', 'TypeScript']);
    });

    it('getVacantes() — vacante sin idiomas ni habilidades retorna arrays vacíos en el formato', async () => {
        interaccionMock.isFilteredVacantes.mockResolvedValue([]);
        qbMock.getMany.mockResolvedValue([
            makeVacanteEntity({ vacantesIdiomas: [], vacanteHabilidades: [] }),
        ]);

        const result = await service.getVacantes('p-uuid');

        expect(result[0].idiomas).toEqual([]);
        expect(result[0].habilidades).toEqual([]);
    });

    it('getVacantes() — retorna array vacío cuando no hay vacantes disponibles', async () => {
        interaccionMock.isFilteredVacantes.mockResolvedValue([]);
        qbMock.getMany.mockResolvedValue([]);

        const result = await service.getVacantes('p-uuid');

        expect(result).toEqual([]);
    });

    it('getVacantes() — los campos base de la vacante (título, empresa) se preservan en el formato', async () => {
        interaccionMock.isFilteredVacantes.mockResolvedValue([]);
        qbMock.getMany.mockResolvedValue([
            makeVacanteEntity({
                id_vacante: 'v-check',
                titulo: 'Backend NestJS',
                empresa: { id: 'emp-123' },
            }),
        ]);

        const result = await service.getVacantes('p-uuid');

        expect(result[0].id_vacante).toBe('v-check');
        expect(result[0].titulo).toBe('Backend NestJS');
        expect(result[0].empresa).toEqual({ id: 'emp-123' });
    });
});

//NAT

describe('VacantesService', () => {
    let service: VacantesService;
    let vacanteRepository: {
        find: jest.Mock;
    };

    beforeEach(async () => {
        vacanteRepository = {
            find: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VacantesService,
                {
                    provide: getRepositoryToken(Vacante),
                    useValue: vacanteRepository,
                },
                {
                    provide: InteraccionesService,
                    useValue: { isFilteredVacantes: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<VacantesService>(VacantesService);
    });

    it('findAllVacantesofEmpresa should query by empresa id and format idiomas/habilidades', async () => {
        const empresaId = 'empresa-1';
        const repoResult = [
            {
                id_vacante: 'vac-1',
                titulo: 'Backend Developer',
                empresa: { id: empresaId },
                vacantesIdiomas: [
                    { idioma: { nombre: 'Ingles' } },
                    { idioma: { nombre: 'Espanol' } },
                ],
                vacanteHabilidades: [
                    { habilidades: { nombre_habilidad: 'NestJS' } },
                    { habilidades: { nombre_habilidad: 'TypeScript' } },
                ],
            },
            {
                id_vacante: 'vac-2',
                titulo: 'Frontend Developer',
                empresa: { id: empresaId },
                vacantesIdiomas: undefined,
                vacanteHabilidades: undefined,
            },
        ];

        vacanteRepository.find.mockResolvedValue(repoResult);

        const result = await service.findAllVacantesofEmpresa(empresaId);

        expect(vacanteRepository.find).toHaveBeenCalledWith({
            where: {
                empresa: { id: empresaId },
            },
            relations: [
                'empresa',
                'vacanteHabilidades',
                'vacanteHabilidades.habilidades',
                'vacantesIdiomas',
                'vacantesIdiomas.idioma',
            ],
        });
        expect(result).toEqual([
            {
                id_vacante: 'vac-1',
                titulo: 'Backend Developer',
                empresa: { id: empresaId },
                idiomas: ['Ingles', 'Espanol'],
                habilidades: ['NestJS', 'TypeScript'],
            },
            {
                id_vacante: 'vac-2',
                titulo: 'Frontend Developer',
                empresa: { id: empresaId },
                idiomas: [],
                habilidades: [],
            },
        ]);
    });

    it('findAllVacantesofEmpresa should return empty array when repository returns no vacantes', async () => {
        vacanteRepository.find.mockResolvedValue([]);

        const result = await service.findAllVacantesofEmpresa('empresa-2');

        expect(result).toEqual([]);
    });
});

//Casos de pruebas editar vacante

describe('VacantesService — update()', () => {
  let service: VacantesService;
  let repoMock: jest.Mocked<Repository<Vacante>>;

  const VACANTE_BASE = {
    id_vacante:          'v-1',
    titulo:              'Dev Angular',
    salario:             '3000000',
    ubicacion:           'Bogotá',
    modalidad:           'Remoto',
    tipo_trabajo:        'Full-time',
    vacanteHabilidades:  [],
    vacantesIdiomas:     [],
    empresa:             { id: 'emp-1' },
  } as any;

  beforeEach(async () => {
    repoMock = {
      create:              jest.fn(),
      save:                jest.fn(),
      find:                jest.fn(),
      findOne:             jest.fn(),
      createQueryBuilder:  jest.fn().mockReturnValue(makeQbMock()),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VacantesService,
        { provide: getRepositoryToken(Vacante), useValue: repoMock },
        {
          provide: InteraccionesService,
          useValue: { isFilteredVacantes: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();

    service = module.get<VacantesService>(VacantesService);
  });

  it('[C-001] Camino 1,2,3,11,F — vacante no encontrada → throw Error("Vacante no encontrada")', async () => {
    repoMock.findOne.mockResolvedValue(null);

    await expect(
      service.update('id-inexistente', {} as any)
    ).rejects.toThrow('Vacante no encontrada');

    expect(repoMock.save).not.toHaveBeenCalled();
  });

  it('[C-002] Camino 1,2,3,4,5,6,7,8,9,10,F — dto completo → save con habilidades e idiomas mapeados', async () => {
    const vacante = { ...VACANTE_BASE };
    repoMock.findOne.mockResolvedValue(vacante);
    repoMock.save.mockResolvedValue(vacante);

    await service.update('v-1', {
      titulo:             'Dev NestJS',
      vacanteHabilidades: ['habilidad_1'],
      vacantesIdiomas:    ['español'],
    } as any);

    expect(vacante.vacanteHabilidades).toEqual([
      { habilidades: { id_habilidad: 'habilidad_1' } },
    ]);
    expect(vacante.vacantesIdiomas).toEqual([
      { idioma: { id_idioma: 'español' } },
    ]);
    expect(repoMock.save).toHaveBeenCalledWith(vacante);
  });

  it('[C-003] Camino 1,2,3,4,5,6,7,8,10,F — habilidad definida, idioma undefined → save solo habilidades', async () => {
    const vacante = { ...VACANTE_BASE };
    repoMock.findOne.mockResolvedValue(vacante);
    repoMock.save.mockResolvedValue(vacante);

    await service.update('v-1', {
      vacanteHabilidades: ['habilidad_1'],
    } as any);

    expect(vacante.vacanteHabilidades).toEqual([
      { habilidades: { id_habilidad: 'habilidad_1' } },
    ]);
    expect(vacante.vacantesIdiomas).toEqual([]);
    expect(repoMock.save).toHaveBeenCalledWith(vacante);
  });

  it('[C-004] Camino 1,2,3,4,5,6,8,9,10,F — idioma definido, habilidad undefined → save solo idiomas', async () => {
    const vacante = { ...VACANTE_BASE };
    repoMock.findOne.mockResolvedValue(vacante);
    repoMock.save.mockResolvedValue(vacante);

    await service.update('v-1', {
      vacantesIdiomas: ['español'],
    } as any);

    expect(vacante.vacantesIdiomas).toEqual([
      { idioma: { id_idioma: 'español' } },
    ]);
    expect(vacante.vacanteHabilidades).toEqual([]);
    expect(repoMock.save).toHaveBeenCalledWith(vacante);
  });

  it('[C-005] Camino 1,2,3,4,5,6,8,10,F — dto vacío → save sin cambios en relaciones', async () => {
    const vacante = { ...VACANTE_BASE };
    repoMock.findOne.mockResolvedValue(vacante);
    repoMock.save.mockResolvedValue(vacante);

    await service.update('v-1', {} as any);

    expect(vacante.vacanteHabilidades).toEqual([]);
    expect(vacante.vacantesIdiomas).toEqual([]);
    expect(repoMock.save).toHaveBeenCalledWith(vacante);
  });
});
