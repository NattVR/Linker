import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostulanteService } from './postulante.service';
import { Postulante } from './entities/postulante.entity';
import { User } from 'src/user/entities/user.entity';
import { InteraccionesService } from 'src/interacciones/interacciones.service';
import { CreatePostulanteDto } from './dto/create-postulante.dto';

describe('PostulanteService', () => {
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

  it('createPostulante should throw NotFoundException when user profile does not exist', async () => {
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

  it('createPostulante should create and save postulante when user profile exists', async () => {
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
});
