import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/user/entities/user.entity';

describe('User API Regression (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
  });

  beforeEach(async () => {
    if (!userRepository) return;
    await userRepository.query('TRUNCATE TABLE postulantes CASCADE');
    await userRepository.query('TRUNCATE TABLE empresas CASCADE');
    await userRepository.query('TRUNCATE TABLE users CASCADE');
  });

  afterEach(async () => {
    if (!userRepository) return;
    await userRepository.query('TRUNCATE TABLE postulantes CASCADE');
    await userRepository.query('TRUNCATE TABLE empresas CASCADE');
    await userRepository.query('TRUNCATE TABLE users CASCADE');
  });

  afterAll(async () => {
    if (!app) return;
    await app.close();
  });

  it('POST /user/registro -> 201 y usuario creado', async () => {
    const dto = {
      email: 'test@correo.com',
      password: 'password123',
    };

    const response = await request(app.getHttpServer())
      .post('/user/registro')
      .send(dto)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.user).toHaveProperty('id');

    const savedUser = await userRepository.findOne({
      where: { email: dto.email },
    });

    expect(savedUser).toBeDefined();
    expect(savedUser?.password).not.toBe(dto.password);
  });

  it('POST /user/registro -> 201 con estado_verificacion opcional', async () => {
    const dto = {
      email: 'verificado@correo.com',
      password: 'password123',
      estado_verificacion: 'pendiente',
    };

    const response = await request(app.getHttpServer())
      .post('/user/registro')
      .send(dto)
      .expect(201);

    expect(response.body.success).toBe(true);

    const savedUser = await userRepository.findOne({
      where: { email: dto.email },
    });

    expect(savedUser?.estado_verificacion).toBe('pendiente');
  });

  it('POST /user/login -> 201 y token JWT', async () => {
    const dto = {
      email: 'login@correo.com',
      password: 'password123',
    };

    await request(app.getHttpServer())
      .post('/user/registro')
      .send(dto)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/user/login')
      .send(dto)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty('token');
    expect(typeof response.body.token).toBe('string');
    expect(response.body.user).toHaveProperty('id');
  });

  it('POST /user/login -> 400 con contraseña incorrecta', async () => {
    const dto = {
      email: 'incorrecto@correo.com',
      password: 'password123',
    };

    await request(app.getHttpServer())
      .post('/user/registro')
      .send(dto)
      .expect(201);

    await request(app.getHttpServer())
      .post('/user/login')
      .send({ email: dto.email, password: 'wrong_password' })
      .expect(400);
  });

  it('POST /user/login -> 400 con email inexistente', async () => {
    await request(app.getHttpServer())
      .post('/user/login')
      .send({ email: 'noexiste@correo.com', password: 'password123' })
      .expect(400);
  });

  it('GET /user/perfil/:idUser -> 200 y perfil null si no tiene postulante ni empresa', async () => {
    const user = await userRepository.save({
      email: 'sinperfil@correo.com',
      password: 'hashed_password',
    });

    const response = await request(app.getHttpServer())
      .get(`/user/perfil/${user.id}`)
      .expect(200);

    expect(response.text).toBe('');
  });

  it('GET /user/perfil/:idUser -> 200 con un id inexistente retorna null', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.getHttpServer())
      .get(`/user/perfil/${fakeId}`)
      .expect(200);

    expect(response.text).toBe('');
  });
});