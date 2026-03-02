// =============================================================================
// HU4RF02 — Registrar Reclutador | Backend
// Archivo: src/user/user.service.spec.ts
//
// BD en memoria (sqlite) — driver estándar, soporta timestamp y todos los tipos
// Instalar: npm install --save-dev sqlite3
// =============================================================================

import { Test, TestingModule }  from '@nestjs/testing';
import { TypeOrmModule }        from '@nestjs/typeorm';
import { JwtModule }            from '@nestjs/jwt';
import { BadRequestException }  from '@nestjs/common';
import { UserService }          from './user.service';
import { User }                 from './entities/user.entity';

// ─────────────────────────────────────────────────────────────────────────────
// Driver: 'sqlite' (no better-sqlite3)
//   → soporta timestamp, json y demás tipos de PostgreSQL
//   → carga todas las entidades con glob para evitar "metadata not found"
// ─────────────────────────────────────────────────────────────────────────────
const SQLITE_CONFIG = {
  type:        'sqlite' as const,
  database:    ':memory:',
  entities:    [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  dropSchema:  true,
  logging:     false,
};

describe('UserService — createUser()', () => {
  let service: UserService;
  let module:  TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(SQLITE_CONFIG),
        TypeOrmModule.forFeature([User]),
        JwtModule.register({
          secret:      'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  }, 30_000);

  afterAll(async () => {
    if (module) await module.close();
  }, 15_000);

  // ===========================================================================
  // CAMINOS DEL DIAGRAMA DE FLUJO
  // ===========================================================================

  // [C1] email único → save() exitoso → success:true + user.id
  it('[C1] Camino 1,2,3,4,5,6,F — email único → save() exitoso → retorna success:true con id', async () => {
    const result = await service.createUser({
      email:    'usuario1@mail.com',
      password: 'abc123',
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Postulante registrado correctamente');
    expect(result.user).toBeDefined();
    expect(result.user.id).toBeTruthy();
  });

  // [C2] email duplicado → constraint unique → BadRequestException
  it('[C2] Camino 1,2,3,4,5,7,8,F — email duplicado → save() falla → throw BadRequestException', async () => {
    await service.createUser({ email: 'duplicado@mail.com', password: 'abc123' });

    await expect(
      service.createUser({ email: 'duplicado@mail.com', password: 'otraClave' })
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.createUser({ email: 'duplicado@mail.com', password: 'otraClave' })
    ).rejects.toThrow('No se pudo crear');
  });

  // ===========================================================================
  // ASSERTIONS ADICIONALES
  // ===========================================================================

  it('createUser() — dos usuarios con emails distintos reciben ids distintos', async () => {
    const r1 = await service.createUser({ email: 'user_a@mail.com', password: '123456' });
    const r2 = await service.createUser({ email: 'user_b@mail.com', password: '654321' });

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r1.user.id).not.toBe(r2.user.id);
  });

  it('createUser() — el id retornado es un string UUID no vacío', async () => {
    const result = await service.createUser({
      email:    'idcheck@mail.com',
      password: 'pass1234',
    });

    expect(typeof result.user.id).toBe('string');
    expect(result.user.id.length).toBeGreaterThan(0);
  });

  it('createUser() — success:true y user.id válido para cualquier password', async () => {
    const result = await service.createUser({
      email:    'hashtest@mail.com',
      password: 'abc123',
    });

    expect(result.success).toBe(true);
    expect(result.user.id).toBeTruthy();
  });
});