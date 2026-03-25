import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmpresaService } from './empresa.service';
import { Empresa } from './entities/empresa.entity';
import { User } from 'src/user/entities/user.entity';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

describe('EmpresaService', () => {
  let service: EmpresaService;
  let empresaRepository: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    merge: jest.Mock;
  };
  let usuarioRepository: {
    findOne: jest.Mock;
  };

  function buildCreateEmpresaDto(
    overrides: Partial<CreateEmpresaDto> = {},
  ): CreateEmpresaDto {
    return {
      id_perfil: 'user-1',
      name_empresa: 'Empresa Demo',
      descripcion: 'Descripcion base',
      ubicacion: 'Bogota',
      sector: 'Tecnologia',
      foto: 'empresa.png',
      NIT: '900123456',
      ...overrides,
    };
  }

  function buildEmpresa(overrides: Partial<Empresa> = {}): Empresa {
    return {
      id: 'emp-1',
      name_empresa: 'Empresa Demo',
      descripcion: 'Descripcion base',
      ubicacion: 'Bogota',
      sector: 'Tecnologia',
      foto: 'empresa.png',
      NIT: '900123456',
      user: { id: 'user-1' } as User,
      detallesCertificados: [],
      vacantes: [],
      ...overrides,
    } as Empresa;
  }

  beforeEach(async () => {
    empresaRepository = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
    };
    usuarioRepository = {
      findOne: jest.fn(),
    };

    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmpresaService,
        { provide: getRepositoryToken(Empresa), useValue: empresaRepository },
        { provide: getRepositoryToken(User), useValue: usuarioRepository },
      ],
    }).compile();

    service = module.get<EmpresaService>(EmpresaService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all empresas with the user relation', () => {
    const empresas = [
      buildEmpresa({ id: 'emp-1', user: { id: 'user-1' } as User }),
      buildEmpresa({ id: 'emp-2', user: { id: 'user-2' } as User }),
    ];
    empresaRepository.find.mockReturnValue(empresas);

    const result = service.findAll();

    expect(empresaRepository.find).toHaveBeenCalledTimes(1);
    expect(empresaRepository.find).toHaveBeenCalledWith({
      relations: ['user'],
    });
    expect(result).toBe(empresas);
  });

  it('should throw NotFoundException when the associated user does not exist', async () => {
    const dto = buildCreateEmpresaDto({ id_perfil: 'user-inexistente' });
    usuarioRepository.findOne.mockResolvedValue(null);

    const result = service.createEmpresa(dto);

    await expect(result).rejects.toThrow(NotFoundException);
    await expect(result).rejects.toThrow(
      'No se encontró el perfil de usuario asociado.',
    );
    expect(usuarioRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'user-inexistente' },
    });
    expect(empresaRepository.create).not.toHaveBeenCalled();
    expect(empresaRepository.save).not.toHaveBeenCalled();
  });

  it('should create and save the empresa when the associated user exists', async () => {
    const dto = buildCreateEmpresaDto();
    const user = { id: 'user-1' } as User;
    const empresa = buildEmpresa({ user });
    usuarioRepository.findOne.mockResolvedValue(user);
    empresaRepository.create.mockReturnValue(empresa);
    empresaRepository.save.mockResolvedValue(empresa);

    const result = await service.createEmpresa(dto);

    expect(usuarioRepository.findOne).toHaveBeenCalledTimes(1);
    expect(usuarioRepository.findOne).toHaveBeenCalledWith({
      where: { id: dto.id_perfil },
    });
    expect(empresaRepository.create).toHaveBeenCalledTimes(1);
    expect(empresaRepository.create).toHaveBeenCalledWith({
      ...dto,
      user,
    });
    expect(empresaRepository.save).toHaveBeenCalledTimes(1);
    expect(empresaRepository.save).toHaveBeenCalledWith(empresa);
    expect(result).toEqual({
      message: 'Empresa registrada con éxito',
      empresa,
    });
  });

  it('should return the empresa when getEmpresaById finds a match', async () => {
    const empresa = buildEmpresa({ user: { id: 'user-1' } as User });
    empresaRepository.findOne.mockResolvedValue(empresa);

    const result = await service.getEmpresaById('user-1');

    expect(empresaRepository.findOne).toHaveBeenCalledTimes(1);
    expect(empresaRepository.findOne).toHaveBeenCalledWith({
      where: { user: { id: 'user-1' } },
    });
    expect(result).toBe(empresa);
  });

  it('should return null when getEmpresaById does not find a match', async () => {
    empresaRepository.findOne.mockResolvedValue(null);

    const result = await service.getEmpresaById('user-inexistente');

    expect(empresaRepository.findOne).toHaveBeenCalledWith({
      where: { user: { id: 'user-inexistente' } },
    });
    expect(result).toBeNull();
  });

  it('should return true when isEmpresa finds a related empresa', async () => {
    empresaRepository.findOne.mockResolvedValue(buildEmpresa());

    const result = await service.isEmpresa('user-1');

    expect(empresaRepository.findOne).toHaveBeenCalledWith({
      where: { user: { id: 'user-1' } },
    });
    expect(result).toBe(true);
  });

  it('should return false when isEmpresa does not find a related empresa', async () => {
    empresaRepository.findOne.mockResolvedValue(null);

    const result = await service.isEmpresa('user-inexistente');

    expect(empresaRepository.findOne).toHaveBeenCalledWith({
      where: { user: { id: 'user-inexistente' } },
    });
    expect(result).toBe(false);
  });

  it('should merge and save the empresa when update finds an existing record', async () => {
    const empresa = buildEmpresa({ id: 'emp-1' });
    const updateEmpresaDto: UpdateEmpresaDto = {
      name_empresa: 'Empresa Actualizada',
      ubicacion: 'Medellin',
    };
    const empresaActualizada = buildEmpresa({
      ...empresa,
      ...updateEmpresaDto,
    });
    empresaRepository.findOne.mockResolvedValue(empresa);
    empresaRepository.merge.mockReturnValue(empresaActualizada);
    empresaRepository.save.mockResolvedValue(empresaActualizada);

    const result = await service.update('user-1', updateEmpresaDto);

    expect(empresaRepository.findOne).toHaveBeenCalledWith({
      where: { user: { id: 'user-1' } },
    });
    expect(empresaRepository.merge).toHaveBeenCalledTimes(1);
    expect(empresaRepository.merge).toHaveBeenCalledWith(
      empresa,
      updateEmpresaDto,
    );
    expect(empresaRepository.save).toHaveBeenCalledTimes(1);
    expect(empresaRepository.save).toHaveBeenCalledWith(empresaActualizada);
    expect(result).toBe(empresaActualizada);
  });

  it('should throw NotFoundException when update does not find an empresa', async () => {
    const updateEmpresaDto: UpdateEmpresaDto = {
      name_empresa: 'Empresa Inexistente',
    };
    empresaRepository.findOne.mockResolvedValue(null);

    const result = service.update('user-inexistente', updateEmpresaDto);

    await expect(result).rejects.toThrow(NotFoundException);
    await expect(result).rejects.toThrow('Empresa no encontrada');
    expect(empresaRepository.findOne).toHaveBeenCalledWith({
      where: { user: { id: 'user-inexistente' } },
    });
    expect(empresaRepository.merge).not.toHaveBeenCalled();
    expect(empresaRepository.save).not.toHaveBeenCalled();
  });
});