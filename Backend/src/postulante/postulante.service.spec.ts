import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PostulanteService } from './postulante.service';
import { Postulante } from './entities/postulante.entity';
import { User } from 'src/user/entities/user.entity';
import { InteraccionesService } from 'src/interacciones/interacciones.service';
import { CreatePostulanteDto } from './dto/create-postulante.dto';

describe('PostulanteService — createPostulante()', () => {
  let service: PostulanteService;
  let postulanteRepository: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let usuarioRepository: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    postulanteRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    usuarioRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostulanteService,
        {
          provide: getRepositoryToken(Postulante),
          useValue: postulanteRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usuarioRepository,
        },
        {
          provide: InteraccionesService,
          useValue: { isFilteredPostulantes: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PostulanteService>(PostulanteService);
  });

  it('createPostulante  throw NotFoundException user no existe', async () => {
    const dto: CreatePostulanteDto = {
      name: 'Ana',
      lastname: 'Perez',
      id_perfil: 'user-1',
    };
    usuarioRepository.findOne.mockResolvedValue(null);

    await expect(service.createPostulante(dto)).rejects.toThrow(
      new NotFoundException('No se encontró el perfil de usuario asociado.')
    );
    expect(postulanteRepository.create).not.toHaveBeenCalled();
    expect(postulanteRepository.save).not.toHaveBeenCalled();
  });

  it('createPostulante create y save postulante  cuando user existe', async () => {
    const dto: CreatePostulanteDto = {
      name: 'Carlos',
      lastname: 'Gomez',
      id_perfil: 'user-2',
    };

    const user = { id: 'user-2' } as User;
    const createdPostulante = {
      id: 'post-1',
      name: dto.name,
      lastname: dto.lastname,
      user,
    } as Postulante;

    usuarioRepository.findOne.mockResolvedValue(user);
    postulanteRepository.create.mockReturnValue(createdPostulante);
    postulanteRepository.save.mockResolvedValue(createdPostulante);

    const result = await service.createPostulante(dto);

    expect(usuarioRepository.findOne).toHaveBeenCalledWith({
      where: { id: dto.id_perfil },
    });
    expect(postulanteRepository.create).toHaveBeenCalledWith({
      ...dto,
      user,
    });
    expect(postulanteRepository.save).toHaveBeenCalledWith(createdPostulante);
    expect(result).toEqual({
      message: 'Postulante registrado con éxito',
      postulante: createdPostulante,
    });
  });


  it('createPostulante()  el nombre se guarda exactamente como se envió', async () => {
    const dto: CreatePostulanteDto = {
      name: 'Nombre Exacto',
      lastname: 'Apellido Base',
      id_perfil: 'user-3',
    };
    const user = { id: 'user-3' } as User;
    const createdPostulante = { id: 'post-3', ...dto, user } as Postulante;

    usuarioRepository.findOne.mockResolvedValue(user);
    postulanteRepository.create.mockReturnValue(createdPostulante);
    postulanteRepository.save.mockResolvedValue(createdPostulante);

    const result = await service.createPostulante(dto);

    expect(result.postulante.name).toBe('Nombre Exacto');
    expect(postulanteRepository.create).toHaveBeenCalledWith({
      ...dto,
      user,
    });
  });

  it('createPostulante()  el apellido se guarda exactamente como se envió', async () => {
    const dto: CreatePostulanteDto = {
      name: 'Nombre Base',
      lastname: 'Apellido Exacto',
      id_perfil: 'user-4',
    };
    const user = { id: 'user-4' } as User;
    const createdPostulante = { id: 'post-4', ...dto, user } as Postulante;

    usuarioRepository.findOne.mockResolvedValue(user);
    postulanteRepository.create.mockReturnValue(createdPostulante);
    postulanteRepository.save.mockResolvedValue(createdPostulante);

    const result = await service.createPostulante(dto);

    expect(result.postulante.lastname).toBe('Apellido Exacto');
    expect(postulanteRepository.create).toHaveBeenCalledWith({
      ...dto,
      user,
    });
  });

});


describe('PostulanteService — updatePostulante()', () => {
  let service: PostulanteService;
  let postulanteRepo: { findOne: jest.Mock; save: jest.Mock };
  let usuarioRepo:    { findOne: jest.Mock };

  const POSTULANTE_BASE = {
    id:               'post-1',
    años_experiencia: 0,
    curriculum:       '',
  } as Postulante;

  beforeEach(async () => {
    postulanteRepo = { findOne: jest.fn(), save: jest.fn() };
    usuarioRepo    = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostulanteService,
        { provide: getRepositoryToken(Postulante), useValue: postulanteRepo },
        { provide: getRepositoryToken(User),       useValue: usuarioRepo    },
        { provide: InteraccionesService,           useValue: {}             },
      ],
    }).compile();

    service = module.get<PostulanteService>(PostulanteService);
  });


//Casos de prueba editar perfil postulante

  it('[C-001] Camino 1,2,3,9,F — postulante no encontrado → NotFoundException("Postulante no encontrado")', async () => {
    postulanteRepo.findOne.mockResolvedValue(null);

    await expect(
      service.updatePostulante('id-inexistente', { experiencia: 5, cv: 'cv.pdf' })
    ).rejects.toThrow(new NotFoundException('Postulante no encontrado'));

    expect(postulanteRepo.save).not.toHaveBeenCalled();
  });

  it('[C-002] Camino 1,2,3,4,5,6,7,8,F — dto completo → save con experiencia y curriculum', async () => {
    const postulante = { ...POSTULANTE_BASE };
    postulanteRepo.findOne.mockResolvedValue(postulante);
    postulanteRepo.save.mockResolvedValue({ ...postulante, años_experiencia: 5, curriculum: 'cv.pdf' });

    await service.updatePostulante('post-1', { experiencia: 5, cv: 'cv.pdf' });

    expect(postulanteRepo.save).toHaveBeenCalledWith(
      jasmine.objectContaining({ años_experiencia: 5, curriculum: 'cv.pdf' })
    );
  });

  it('[C-003] Camino 1,2,3,4,5,6,8,F — solo experiencia → save actualiza solo años_experiencia', async () => {
    const postulante = { ...POSTULANTE_BASE, curriculum: 'anterior.pdf' };
    postulanteRepo.findOne.mockResolvedValue(postulante);
    postulanteRepo.save.mockResolvedValue({ ...postulante, años_experiencia: 3 });

    await service.updatePostulante('post-1', { experiencia: 3 });

    expect(postulanteRepo.save).toHaveBeenCalledWith(
      jasmine.objectContaining({ años_experiencia: 3, curriculum: 'anterior.pdf' })
    );
  });

  it('[C-004] Camino 1,2,3,4,6,7,8,F — solo cv → save actualiza solo curriculum', async () => {
    const postulante = { ...POSTULANTE_BASE, años_experiencia: 2 };
    postulanteRepo.findOne.mockResolvedValue(postulante);
    postulanteRepo.save.mockResolvedValue({ ...postulante, curriculum: 'nuevo.pdf' });

    await service.updatePostulante('post-1', { cv: 'nuevo.pdf' });

    expect(postulanteRepo.save).toHaveBeenCalledWith(
      jasmine.objectContaining({ años_experiencia: 2, curriculum: 'nuevo.pdf' })
    );
  });

  it('[C-005] Camino 1,2,3,4,6,8,F — dto vacío → save sin cambios en entidad', async () => {
    const postulante = { ...POSTULANTE_BASE, años_experiencia: 1, curriculum: 'viejo.pdf' };
    postulanteRepo.findOne.mockResolvedValue(postulante);
    postulanteRepo.save.mockResolvedValue(postulante);

    await service.updatePostulante('post-1', {});

    expect(postulanteRepo.save).toHaveBeenCalledWith(
      jasmine.objectContaining({ años_experiencia: 1, curriculum: 'viejo.pdf' })
    );
  });
});

describe('PostulanteService — getPostulanteById()', () => {
  let service: PostulanteService;
  let postulanteRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    postulanteRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostulanteService,
        { provide: getRepositoryToken(Postulante), useValue: postulanteRepo },
        { provide: getRepositoryToken(User), useValue: { findOne: jest.fn() } },
        { provide: InteraccionesService, useValue: {} },
      ],
    }).compile();

    service = module.get<PostulanteService>(PostulanteService);
  });

  it('[C-001] postulante existe -> retorna name y lastname', async () => {
    postulanteRepo.findOne.mockResolvedValue({ name: 'Juan', lastname: 'Perez' });

    const result = await service.getPostulanteById('post-1');

    expect(postulanteRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      relations: ['user'],
    });
    expect(result).toEqual({ name: 'Juan', lastname: 'Perez' });
  });

  it('[C-002] postulante no existe -> NotFoundException', async () => {
    postulanteRepo.findOne.mockResolvedValue(null);

    await expect(service.getPostulanteById('no-existe'))
      .rejects.toThrow(new NotFoundException('Usuario no encontrado'));
  });
});

describe('PostulanteService — findAll()', () => {
  let service: PostulanteService;
  let postulanteRepo: { find: jest.Mock };

  beforeEach(async () => {
    postulanteRepo = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostulanteService,
        { provide: getRepositoryToken(Postulante), useValue: postulanteRepo },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: InteraccionesService, useValue: {} },
      ],
    }).compile();

    service = module.get<PostulanteService>(PostulanteService);
  });

  it('[C-001] findAll() -> retorna todos los postulantes con relación user', async () => {
    const postulantes = [{ id: 'p-1' }, { id: 'p-2' }];
    postulanteRepo.find.mockResolvedValue(postulantes);

    const result = await service.findAll();

    expect(postulanteRepo.find).toHaveBeenCalledWith({ relations: ['user'] });
    expect(result).toEqual(postulantes);
  });

  it('[C-002] findAll() -> retorna [] cuando no hay postulantes', async () => {
    postulanteRepo.find.mockResolvedValue([]);

    const result = await service.findAll();

    expect(result).toEqual([]);
  });
});

describe('PostulanteService — getPostulantes()', () => {
  let service: PostulanteService;
  let postulanteRepo: { createQueryBuilder: jest.Mock };
  let interaccionesSvc: { isFilteredPostulantes: jest.Mock };
  let qbMock: any;

  beforeEach(async () => {
    qbMock = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    postulanteRepo = { createQueryBuilder: jest.fn().mockReturnValue(qbMock) };
    interaccionesSvc = { isFilteredPostulantes: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostulanteService,
        { provide: getRepositoryToken(Postulante), useValue: postulanteRepo },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: InteraccionesService, useValue: interaccionesSvc },
      ],
    }).compile();

    service = module.get<PostulanteService>(PostulanteService);
  });

  it('[C-001] con excluidos -> andWhere aplicado + formatea resultado', async () => {
    interaccionesSvc.isFilteredPostulantes.mockResolvedValue(['p-excluido']);
    qbMock.getMany.mockResolvedValue([{
      id: 'p-1', name: 'Juan',
      postulanteHabilidades: [{ habilidades: { nombre_habilidad: 'Angular' } }],
      postulanteIdiomas: [{ idioma: { nombre: 'Inglés' } }],
    }]);

    const result = await service.getPostulantes('v-uuid');

    expect(qbMock.andWhere).toHaveBeenCalledWith(
      'postulante.id NOT IN (:...excluidos)',
      { excluidos: ['p-excluido'] }
    );
    expect(result[0].habilidades).toEqual(['Angular']);
    expect(result[0].idiomas).toEqual(['Inglés']);
  });

  it('[C-002] sin excluidos -> andWhere NO aplicado', async () => {
    interaccionesSvc.isFilteredPostulantes.mockResolvedValue([]);
    qbMock.getMany.mockResolvedValue([]);

    await service.getPostulantes('v-uuid');

    expect(qbMock.andWhere).not.toHaveBeenCalled();
  });

  it('[C-003] postulante sin habilidades ni idiomas -> arrays vacíos en resultado', async () => {
    interaccionesSvc.isFilteredPostulantes.mockResolvedValue([]);
    qbMock.getMany.mockResolvedValue([{
      id: 'p-1',
      postulanteHabilidades: [],
      postulanteIdiomas: [],
    }]);

    const result = await service.getPostulantes('v-uuid');

    expect(result[0].habilidades).toEqual([]);
    expect(result[0].idiomas).toEqual([]);
  });
});

describe('PostulanteService — limpiarPerfilPostulante()', () => {
  let service: PostulanteService;
  let managerMock: { query: jest.Mock };
  let postulanteRepo: any;

  beforeEach(async () => {
    managerMock = { query: jest.fn() };
    postulanteRepo = { manager: managerMock };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostulanteService,
        { provide: getRepositoryToken(Postulante), useValue: postulanteRepo },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: InteraccionesService, useValue: {} },
      ],
    }).compile();

    service = module.get<PostulanteService>(PostulanteService);
  });

  it('[C-001] queries exitosas -> retorna { message: "Perfil limpiado" }', async () => {
    managerMock.query.mockResolvedValue(undefined);

    const result = await service.limpiarPerfilPostulante('post-1');

    expect(managerMock.query).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ message: 'Perfil limpiado' });
  });

  it('[C-002] query falla -> retorna { message: "Sin registros previos" }', async () => {
    managerMock.query.mockRejectedValue(new Error('db error'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await service.limpiarPerfilPostulante('post-1');

    expect(result).toEqual({ message: 'Sin registros previos' });
    expect(console.error).toHaveBeenCalled();
  });

  it('[C-003] se ejecutan las 3 queries con el id correcto', async () => {
    managerMock.query.mockResolvedValue(undefined);
    const id = 'post-uuid-check';

    await service.limpiarPerfilPostulante(id);

    const calls = managerMock.query.mock.calls;
    expect(calls[0][1]).toEqual([id]);
    expect(calls[1][1]).toEqual([id]);
    expect(calls[2][1]).toEqual([id]);
  });
});
