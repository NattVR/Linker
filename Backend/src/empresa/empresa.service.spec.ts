import { EmpresaService } from './empresa.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Empresa } from './entities/empresa.entity';
import { User } from 'src/user/entities/user.entity';
import { NotFoundException } from '@nestjs/common';

describe('EmpresaService - createEmpresa()', () => {
  let empresaService: EmpresaService;
  let empresaRepository: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let usuarioRepository: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    empresaRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };
    usuarioRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmpresaService,
        { provide: getRepositoryToken(Empresa), useValue: empresaRepository },
        { provide: getRepositoryToken(User), useValue: usuarioRepository },
      ],
    }).compile();

    empresaService = module.get<EmpresaService>(EmpresaService);
  });

  it('[C1] Camino 1,2,3,4,F - id_perfil no existe -> throw NotFoundException', async () => {
    const dto = {
      id_perfil: '00000000-0000-0000-0000-000000000000',
      name_empresa: 'Empresa Fantasma',
      NIT: '000000000',
    } as any;

    usuarioRepository.findOne.mockResolvedValue(null);

    await expect(empresaService.createEmpresa(dto)).rejects.toThrow(NotFoundException);
    await expect(empresaService.createEmpresa(dto)).rejects.toThrow(
      'No se encontr\u00f3 el perfil de usuario asociado.',
    );
  });

  it('[C2] Camino 1,2,3,5,6,7,8,9,F - id_perfil existe -> crea empresa -> retorna mensaje y empresa', async () => {
    const userIdExistente = 'user-1';
    const user = { id: userIdExistente } as any;
    const dto = {
      id_perfil: userIdExistente,
      name_empresa: 'Empresa de Prueba SA',
      NIT: '123456789',
    } as any;
    const empresaCreada = { id: 'emp-1', ...dto, user } as any;

    usuarioRepository.findOne.mockResolvedValue(user);
    empresaRepository.create.mockReturnValue(empresaCreada);
    empresaRepository.save.mockResolvedValue(empresaCreada);

    const result = await empresaService.createEmpresa(dto);

    expect(result.message).toBe('Empresa registrada con \u00e9xito');
    expect(result.empresa).toBeDefined();
    expect(result.empresa.NIT).toBe('123456789');
    expect(empresaRepository.create).toHaveBeenCalledWith({
      ...dto,
      user,
    });
    expect(empresaRepository.save).toHaveBeenCalledWith(empresaCreada);
  });

  it('createEmpresa() - el NIT se guarda exactamente como se envio', async () => {
    const user = { id: 'user-2' } as any;
    const dto = {
      id_perfil: user.id,
      name_empresa: 'NIT Test',
      NIT: '987654321',
    } as any;
    const empresaCreada = { id: 'emp-2', ...dto, user } as any;

    usuarioRepository.findOne.mockResolvedValue(user);
    empresaRepository.create.mockReturnValue(empresaCreada);
    empresaRepository.save.mockResolvedValue(empresaCreada);

    const result = await empresaService.createEmpresa(dto);

    expect(result.empresa.NIT).toBe('987654321');
  });

  it('createEmpresa() - el nombre de empresa se guarda exactamente como se envio', async () => {
    const user = { id: 'user-3' } as any;
    const dto = {
      id_perfil: user.id,
      name_empresa: 'Mi Empresa S.A.S',
      NIT: '111222333',
    } as any;
    const empresaCreada = { id: 'emp-3', ...dto, user } as any;

    usuarioRepository.findOne.mockResolvedValue(user);
    empresaRepository.create.mockReturnValue(empresaCreada);
    empresaRepository.save.mockResolvedValue(empresaCreada);

    const result = await empresaService.createEmpresa(dto);

    expect(result.empresa.name_empresa).toBe('Mi Empresa S.A.S');
  });

  it('createEmpresa() - id_perfil inexistente tambien lanza NotFoundException', async () => {
    usuarioRepository.findOne.mockResolvedValue(null);

    await expect(
      empresaService.createEmpresa({
        id_perfil: 'no-existe-este-id',
        name_empresa: 'X',
        NIT: '0',
      } as any),
    ).rejects.toThrow(NotFoundException);
  });
});
//Nat update
describe('EmpresaService update()', () => {
  let empresaService: EmpresaService;
  let empresaRepository: {
    findOne: jest.Mock;
    merge: jest.Mock;
    save: jest.Mock;
  };
  let usuarioRepository: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    empresaRepository = {
      findOne: jest.fn(),
      merge: jest.fn(),
      save: jest.fn(),
    };
    usuarioRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmpresaService,
        { provide: getRepositoryToken(Empresa), useValue: empresaRepository },
        { provide: getRepositoryToken(User), useValue: usuarioRepository },
      ],
    }).compile();

    empresaService = module.get<EmpresaService>(EmpresaService);
  });

  it('empresa no encontrada NotFoundException', async () => {
    empresaRepository.findOne.mockResolvedValue(null);

    await expect(
      empresaService.update('id-inexistente', { name_empresa: 'Nuevo Nombre' } as any),
    ).rejects.toThrow(NotFoundException);
    await expect(
      empresaService.update('id-inexistente', { name_empresa: 'Nuevo Nombre' } as any),
    ).rejects.toThrow('Empresa no encontrada');

    expect(empresaRepository.findOne).toHaveBeenCalledWith({
      where: { user: { id: 'id-inexistente' } },
    });
    expect(empresaRepository.merge).not.toHaveBeenCalled();
    expect(empresaRepository.save).not.toHaveBeenCalled();
  });

  it('update con dto completo merge y save', async () => {
    const empresaBase = {
      id: 'emp-1',
      name_empresa: 'Base',
      descripcion: 'desc',
      ubicacion: 'Bogota',
      sector: 'Tech',
      foto: 'a.png',
      NIT: '111',
    } as any;
    const dto = {
      name_empresa: 'Empresa Actualizada S.A.S',
      descripcion: 'Nueva descripcion',
      ubicacion: 'Medellin',
      sector: 'Finanzas',
      foto: 'foto-nueva.png',
      NIT: '999888777',
    };
    const merged = { ...empresaBase, ...dto };

    empresaRepository.findOne.mockResolvedValue(empresaBase);
    empresaRepository.merge.mockReturnValue(merged);
    empresaRepository.save.mockResolvedValue(merged);

    const result = await empresaService.update('user-1', dto as any);

    expect(empresaRepository.merge).toHaveBeenCalledWith(empresaBase, dto);
    expect(empresaRepository.save).toHaveBeenCalledWith(merged);
    expect(result).toEqual(merged);
  });

  it('update parcial preserva campos no enviados', async () => {
    const empresaBase = {
      id: 'emp-2',
      name_empresa: 'Empresa Base',
      descripcion: 'Descripcion base',
      ubicacion: 'Bogota',
      sector: 'Tecnologia',
      foto: 'base.png',
      NIT: '555555555',
    } as any;
    const dto = { ubicacion: 'Cali' };
    const merged = { ...empresaBase, ...dto };

    empresaRepository.findOne.mockResolvedValue(empresaBase);
    empresaRepository.merge.mockImplementation((entidad, cambios) => ({ ...entidad, ...cambios }));
    empresaRepository.save.mockResolvedValue(merged);

    const result = await empresaService.update('emp-2', dto as any);

    expect(result.ubicacion).toBe('Cali');
    expect(result.name_empresa).toBe('Empresa Base');
    expect(result.NIT).toBe('555555555');
    expect(result.descripcion).toBe('Descripcion base');
    expect(result.sector).toBe('Tecnologia');
    expect(result.foto).toBe('base.png');
  });

  it('update() llama merge() y save() una vez cuando existe empresa', async () => {
    const empresaBase = { id: 'emp-3', descripcion: 'anterior' } as any;
    const dto = { descripcion: 'Descripcion por merge/save' };
    const merged = { ...empresaBase, ...dto };

    empresaRepository.findOne.mockResolvedValue(empresaBase);
    empresaRepository.merge.mockReturnValue(merged);
    empresaRepository.save.mockResolvedValue(merged);

    const result = await empresaService.update('user-3', dto as any);

    expect(empresaRepository.merge).toHaveBeenCalledTimes(1);
    expect(empresaRepository.save).toHaveBeenCalledTimes(1);
    expect(result.descripcion).toBe('Descripcion por merge/save');
  });
});
