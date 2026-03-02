import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './entities/empresa.entity';
import { User } from 'src/user/entities/user.entity';
import { EmpresaService } from './empresa.service';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { TypeOrmModule }       from '@nestjs/typeorm';
import { JwtModule }           from '@nestjs/jwt';
import { DataSource }          from 'typeorm';
import { UserService }         from '../user/user.service';

describe('EmpresaService', () => {
  let service: EmpresaService;
  let empresaRepository: {
    save: jest.Mock;
    merge: jest.Mock;
  };

  beforeEach(async () => {
    empresaRepository = {
      save: jest.fn(),
      merge: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmpresaService,
        {
          provide: getRepositoryToken(Empresa),
          useValue: empresaRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<EmpresaService>(EmpresaService);
  });

  it('update  throw NotFoundException cuando empresa no existe', async () => {
    const id = 'user-id-1';
    const dto: UpdateEmpresaDto = { name_empresa: 'Empresa Editada' };
    jest.spyOn(service, 'getEmpresaById').mockResolvedValue(null);

    await expect(service.update(id, dto)).rejects.toThrow(
      new NotFoundException('Empresa no encontrada')
    );
    expect(empresaRepository.merge).not.toHaveBeenCalled();
    expect(empresaRepository.save).not.toHaveBeenCalled();
  });

  it('update merge y save cuando empresa existe', async () => {
    const id = 'empresa-id-1';
    const dto: UpdateEmpresaDto = {
      name_empresa: 'Empresa Actualizada',
      sector: 'Tecnologia',
    };

    const existingEmpresa = {
      id: 'empresa-id-1',
      name_empresa: 'Empresa Inicial',
      sector: 'Software',
    } as Empresa;

    const mergedEmpresa = {
      ...existingEmpresa,
      ...dto,
    } as Empresa;

    jest.spyOn(service, 'getEmpresaById').mockResolvedValue(existingEmpresa);
    empresaRepository.merge.mockReturnValue(mergedEmpresa);
    empresaRepository.save.mockResolvedValue(mergedEmpresa);

    const result = await service.update(id, dto);

    expect(service.getEmpresaById).toHaveBeenCalledWith(id);
    expect(empresaRepository.merge).toHaveBeenCalledWith(existingEmpresa, dto);
    expect(empresaRepository.save).toHaveBeenCalledWith(mergedEmpresa);
    expect(result).toEqual(mergedEmpresa);
  });
});

// =============================================================================
// HU4RF02 — Registrar Reclutador | Backend
// Archivo: src/empresa/empresa.service.spec.ts
//
// BD en memoria (sqlite) — driver estándar, soporta timestamp y todos los tipos
// Instalar: npm install --save-dev sqlite3
// =============================================================================



// ─────────────────────────────────────────────────────────────────────────────
// Driver: 'sqlite' (no better-sqlite3)
//   → soporta timestamp y todos los tipos usados en las entidades del proyecto
//   → carga todas las entidades con glob para resolver la cadena de relaciones
// ─────────────────────────────────────────────────────────────────────────────
const SQLITE_CONFIG = {
  type:        'sqlite' as const,
  database:    ':memory:',
  entities:    [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  dropSchema:  true,
  logging:     false,
};

describe('EmpresaService — createEmpresa()', () => {
  let empresaService:  EmpresaService;
  let userService:     UserService;
  let dataSource:      DataSource;
  let module:          TestingModule;
  let userIdExistente: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(SQLITE_CONFIG),
        TypeOrmModule.forFeature([User, Empresa]),
        JwtModule.register({
          secret:      'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
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
});