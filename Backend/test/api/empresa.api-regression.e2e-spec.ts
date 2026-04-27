import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { Empresa } from '../../src/empresa/entities/empresa.entity';
import { User } from '../../src/user/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

describe('Empresa API Regression (e2e)', () => {
  let app: INestApplication;
  let empresaRepository: Repository<Empresa>;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    empresaRepository = moduleFixture.get(getRepositoryToken(Empresa));
    userRepository = moduleFixture.get(getRepositoryToken(User));
  });

  beforeEach(async () => {
    if (!empresaRepository) return;
    await empresaRepository.query(
      'TRUNCATE TABLE detalles_certificados, empresas, users RESTART IDENTITY CASCADE',
    );
  });

  afterEach(async () => {
    if (!empresaRepository) return;
    await empresaRepository.query(
      'TRUNCATE TABLE detalles_certificados, empresas, users RESTART IDENTITY CASCADE',
    );
  });

  afterAll(async () => {
    if (!app) return;
    await app.close();
  });

  const createUser = async (suffix: string) => {
    return userRepository.save({
      email: `empresa.${suffix}@test.com`,
      password: 'Password123!',
      estado_verificacion: 'verificado',
    });
  };

  it('GET /empresa -> 200 y lista de empresas', async () => {
    const user = await createUser('list');

    await empresaRepository.save({
      name_empresa: 'Linker',
      descripcion: 'Test Empresa',
      ubicacion: 'Bogota',
      sector: 'Tech',
      foto: 'https://example.com/logo.png',
      NIT: '900123123-1',
      user,
    });

    const response = await request(app.getHttpServer()).get('/empresa').expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].name_empresa).toBe('Linker');
  });

  it('POST /empresa/registro -> 201 y empresa creada', async () => {
    const user = await createUser('register');

    const dto = {
      name_empresa: 'Linker',
      descripcion: 'desc',
      ubicacion: 'Bogota',
      sector: 'Tech',
      foto: 'https://example.com/logo.png',
      NIT: '900123123-2',
      id_perfil: user.id,
    };

    const response = await request(app.getHttpServer())
      .post('/empresa/registro')
      .send(dto)
      .expect(201);

    expect(response.body.message).toContain('Empresa registrada');
    expect(response.body.empresa.name_empresa).toBe(dto.name_empresa);

    const savedEmpresa = await empresaRepository.findOne({
      where: { NIT: dto.NIT },
      relations: ['user'],
    });

    expect(savedEmpresa).toBeDefined();
    expect(savedEmpresa?.name_empresa).toBe(dto.name_empresa);
    expect(savedEmpresa?.user.id).toBe(user.id);
  });

  it('GET /empresa/:id -> 200 y empresa', async () => {
    const user = await createUser('byid');

    await empresaRepository.save({
      name_empresa: 'Linker',
      descripcion: 'Test',
      ubicacion: 'Bogota',
      sector: 'Tech',
      foto: 'https://example.com/logo.png',
      NIT: '900123123-3',
      user,
    });

    const response = await request(app.getHttpServer())
      .get(`/empresa/${user.id}`)
      .expect(200);

    expect(response.body.name_empresa).toBe('Linker');
  });

  it('GET /empresa/isEmpresa/:id -> 200 y true cuando existe', async () => {
    const user = await createUser('true');

    await empresaRepository.save({
      name_empresa: 'Linker',
      descripcion: 'Test',
      ubicacion: 'Bogota',
      sector: 'Tech',
      foto: 'https://example.com/logo.png',
      NIT: '900123123-4',
      user,
    });

    const response = await request(app.getHttpServer())
      .get(`/empresa/isEmpresa/${user.id}`)
      .expect(200);

    expect(response.text).toBe('true');
  });

  it('GET /empresa/isEmpresa/:id -> 200 y false cuando no existe', async () => {
    const response = await request(app.getHttpServer())
      .get(`/empresa/isEmpresa/${uuidv4()}`)
      .expect(200);

    expect(response.text).toBe('false');
  });

  it('PATCH /empresa/:id -> 200 y empresa actualizada', async () => {
    const user = await createUser('patch');

    await empresaRepository.save({
      name_empresa: 'Linker',
      descripcion: 'Old Desc',
      ubicacion: 'Bogota',
      sector: 'Tech',
      foto: 'https://example.com/logo.png',
      NIT: '900123123-5',
      user,
    });

    const dto = { descripcion: 'Actualizada', ubicacion: 'Medellin' };

    const response = await request(app.getHttpServer())
      .patch(`/empresa/${user.id}`)
      .send(dto)
      .expect(200);

    expect(response.body.descripcion).toBe(dto.descripcion);
    expect(response.body.ubicacion).toBe(dto.ubicacion);

    const updated = await empresaRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['user'],
    });

    expect(updated?.descripcion).toBe(dto.descripcion);
  });

  it('PATCH /empresa/:id -> 404 cuando no existe', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/empresa/${uuidv4()}`)
      .send({ descripcion: 'x' })
      .expect(404);

    expect(response.body.message).toContain('Empresa no encontrada');
  });
});
