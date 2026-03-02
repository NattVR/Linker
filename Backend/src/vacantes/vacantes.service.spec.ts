import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VacantesService } from './vacantes.service';
import { Vacante } from './entities/vacante.entity';
import { InteraccionesService } from 'src/interacciones/interacciones.service';

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
