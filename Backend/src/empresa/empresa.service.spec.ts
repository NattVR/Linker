// =============================================================================
// HU4RF02 — Registrar Reclutador | Backend
// Archivo: src/empresa/empresa.service.spec.ts
//
// BD en memoria (sqlite) — driver estándar, soporta timestamp y todos los tipos
// Instalar: npm install --save-dev sqlite3
// =============================================================================

import { UserService } from "src/user/user.service";
import { EmpresaService } from "./empresa.service";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { Empresa } from "./entities/empresa.entity";
import { User } from "src/user/entities/user.entity";
import { NotFoundException } from "@nestjs/common";



// ─────────────────────────────────────────────────────────────────────────────
// Driver: 'sqlite' (no better-sqlite3)
//   → soporta timestamp y todos los tipos usados en las entidades del proyecto
//   → carga todas las entidades con glob para resolver la cadena de relaciones
// ─────────────────────────────────────────────────────────────────────────────
//const SQLITE_CONFIG = {
  //type:        'sqlite' as const,
  //database:    ':memory:',
  //entities:    [__dirname + '/../**/*.entity{.ts,.js}'],
  //synchronize: true,
  //dropSchema:  true,
  //logging:     false,
//};

describe('EmpresaService — createEmpresa()', () => {
  let empresaService:  EmpresaService;
  let userService:     UserService;
  let dataSource:      DataSource;
  let module:          TestingModule;
  let userIdExistente: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        //TypeOrmModule.forRoot(SQLITE_CONFIG),
        //ypeOrmModule.forFeature([User, Empresa]),
        //JwtModule.register({
         // secret:      'test-secret',
          //signOptions: { expiresIn: '1h' },
       // }),
      ],
      providers: [EmpresaService, UserService],
    }).compile();

    empresaService = module.get<EmpresaService>(EmpresaService);
    userService    = module.get<UserService>(UserService);
    dataSource     = module.get<DataSource>(DataSource);

    // Crear usuario real en la BD en memoria para los tests que lo necesitan
    const resultado = await userService.createUser({
      email:    'empresa_base@mail.com',
      password: 'abc123',
    });
    userIdExistente = resultado.user.id;
  }, 30_000);

  afterAll(async () => {
    if (module) await module.close();
  }, 15_000);

  // ===========================================================================
  // CAMINOS DEL DIAGRAMA DE FLUJO
  // ===========================================================================

  // [C1] id_perfil no existe → NotFoundException
  it('[C1] Camino 1,2,3,4,F — id_perfil no existe → throw NotFoundException', async () => {
    const dto = {
      id_perfil:    '00000000-0000-0000-0000-000000000000',
      name_empresa: 'Empresa Fantasma',
      NIT:          '000000000',
    } as any;

    await expect(empresaService.createEmpresa(dto)).rejects.toThrow(NotFoundException);
    await expect(empresaService.createEmpresa(dto)).rejects.toThrow(
      'No se encontró el perfil de usuario asociado.'
    );
  });

  // [C2] id_perfil existe → create() + save() → { message, empresa }
  it('[C2] Camino 1,2,3,5,6,7,8,9,F — id_perfil existe → crea empresa → retorna mensaje y empresa', async () => {
    const dto = {
      id_perfil:    userIdExistente,
      name_empresa: 'Empresa de Prueba SA',
      NIT:          '123456789',
    } as any;

    const result = await empresaService.createEmpresa(dto);

    expect(result.message).toBe('Empresa registrada con éxito');
    expect(result.empresa).toBeDefined();
    expect(result.empresa.NIT).toBe('123456789');

    // Verificar que realmente quedó en la BD en memoria
    const empresaEnBD = await dataSource
      .getRepository(Empresa)
      .findOne({
        where:     { user: { id: userIdExistente } },
        relations: ['user'],
      });

    expect(empresaEnBD).not.toBeNull();
    expect(empresaEnBD!.name_empresa).toBe('Empresa de Prueba SA');
    expect(empresaEnBD!.user.id).toBe(userIdExistente);
  });

  // ===========================================================================
  // ASSERTIONS ADICIONALES
  // ===========================================================================

  it('createEmpresa() — el NIT se guarda exactamente como se envió', async () => {
    const r = await userService.createUser({
      email: 'nit_test@mail.com', password: 'abc123',
    });

    const result = await empresaService.createEmpresa({
      id_perfil: r.user.id, name_empresa: 'NIT Test', NIT: '987654321',
    } as any);

    expect(result.empresa.NIT).toBe('987654321');
  });

  it('createEmpresa() — el nombre de empresa se guarda exactamente como se envió', async () => {
    const r = await userService.createUser({
      email: 'nombre_test@mail.com', password: 'abc123',
    });

    const result = await empresaService.createEmpresa({
      id_perfil: r.user.id, name_empresa: 'Mi Empresa S.A.S', NIT: '111222333',
    } as any);

    expect(result.empresa.name_empresa).toBe('Mi Empresa S.A.S');
  });

  it('createEmpresa() — id_perfil inexistente también lanza NotFoundException', async () => {
    await expect(
      empresaService.createEmpresa({
        id_perfil: 'no-existe-este-id', name_empresa: 'X', NIT: '0',
      } as any)
    ).rejects.toThrow(NotFoundException);
  });




  //Nat update 
});
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

  it(' empresa no encontrada NotFoundException', async () => {
    empresaRepository.findOne.mockResolvedValue(null);

    await expect(
      empresaService.update('id-inexistente', { name_empresa: 'Nuevo Nombre' } as any),
    ).rejects.toThrow(NotFoundException);
    await expect(
      empresaService.update('id-inexistente', { name_empresa: 'Nuevo Nombre' } as any),
    ).rejects.toThrow('Empresa no encontrada');

    expect(empresaRepository.findOne).toHaveBeenCalledWith({
      where: { user: { id: 'null' } },
    });
    expect(empresaRepository.merge).not.toHaveBeenCalled();
    expect(empresaRepository.save).not.toHaveBeenCalled();
  });

  it('[update con dto completo merge y save', async () => {
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

  it(' update parcial preserva campos no enviados', async () => {
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

  it('[update() llama merge() y save() una vez cuando existe empresa', async () => {
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
