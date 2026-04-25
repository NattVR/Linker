import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/user/entities/user.entity';

describe('Security (e2e)', () => {
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

  const registrarYLoguear = async (email = 'seg@test.com', password = 'password123') => {
    await request(app.getHttpServer())
      .post('/user/registro')
      .send({ email, password });

    const res = await request(app.getHttpServer())
      .post('/user/login')
      .send({ email, password });

    return res.body.token as string;
  };

  it('SEC-01: la contraseña nunca se devuelve en la respuesta del registro', async () => {
    const res = await request(app.getHttpServer())
      .post('/user/registro')
      .send({ email: 'sec01@test.com', password: 'password123' })
      .expect(201);

    expect(JSON.stringify(res.body)).not.toContain('password123');
  });

  it('SEC-02: la contraseña nunca se devuelve en la respuesta del login', async () => {
    await request(app.getHttpServer())
      .post('/user/registro')
      .send({ email: 'sec02@test.com', password: 'password123' });

    const res = await request(app.getHttpServer())
      .post('/user/login')
      .send({ email: 'sec02@test.com', password: 'password123' })
      .expect(201);

    expect(JSON.stringify(res.body)).not.toContain('password123');
  });

  it('SEC-03: la contraseña se almacena hasheada en la base de datos', async () => {
    const password = 'password123';

    await request(app.getHttpServer())
      .post('/user/registro')
      .send({ email: 'sec03@test.com', password });

    const user = await userRepository.findOne({
      where: { email: 'sec03@test.com' },
    });

    expect(user?.password).not.toBe(password);
    expect(user?.password).toMatch(/^\$2[ab]\$\d+\$/);
  });

  it('SEC-04: login con email inexistente es rechazado con 400', async () => {
    await request(app.getHttpServer())
      .post('/user/login')
      .send({ email: 'noexiste@test.com', password: 'password123' })
      .expect(400);
  });

  it('SEC-05: login con contraseña incorrecta es rechazado con 400', async () => {
    await request(app.getHttpServer())
      .post('/user/registro')
      .send({ email: 'sec05@test.com', password: 'password123' });

    await request(app.getHttpServer())
      .post('/user/login')
      .send({ email: 'sec05@test.com', password: 'password_incorrecta' })
      .expect(400);
  });

  it('SEC-06: login con password vacío es rechazado con 400', async () => {
    await request(app.getHttpServer())
      .post('/user/registro')
      .send({ email: 'sec06@test.com', password: 'password123' });

    await request(app.getHttpServer())
      .post('/user/login')
      .send({ email: 'sec06@test.com', password: '' })
      .expect(400);
  });

  it('SEC-07: el token JWT tiene estructura válida (tres partes separadas por puntos)', async () => {
    const token = await registrarYLoguear('sec07@test.com');

    expect(typeof token).toBe('string');
    const partes = token.split('.');
    expect(partes.length).toBe(3);
  });

  it('SEC-08: el payload del token contiene el id y email del usuario', async () => {
    const email = 'sec08@test.com';
    const token = await registrarYLoguear(email);

    // Decodificar el payload (parte central del JWT, en base64)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString('utf8'),
    );

    expect(payload).toHaveProperty('sub');
    expect(payload).toHaveProperty('email', email);
  });

  it('SEC-09: el payload del token no contiene la contraseña', async () => {
    const password = 'password123';
    const token = await registrarYLoguear('sec09@test.com', password);

    const payloadRaw = Buffer.from(token.split('.')[1], 'base64').toString('utf8');

    expect(payloadRaw).not.toContain(password);
  });

  it('SEC-10: caracteres especiales en email no rompen la app', async () => {
    const res = await request(app.getHttpServer())
      .post('/user/login')
      .send({ email: "' OR '1'='1", password: 'cualquiera' });

    expect(res.status).not.toBe(500);
  });

  it('SEC-11: payload muy largo no rompe la app', async () => {
    const emailLargo = 'a'.repeat(5000) + '@test.com';

    const res = await request(app.getHttpServer())
      .post('/user/login')
      .send({ email: emailLargo, password: 'password123' });

    expect(res.status).not.toBe(500);
  });

  it('SEC-12: campos nulos en login no rompen la app', async () => {
    const res = await request(app.getHttpServer())
      .post('/user/login')
      .send({ email: null, password: null });

    expect(res.status).not.toBe(500);
  });
});