import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { Postulante } from '../../src/postulante/entities/postulante.entity';
import { User } from '../../src/user/entities/user.entity';

describe('Postulante API Regression (e2e)', () => {
  let app: INestApplication;
  let postulanteRepository: Repository<Postulante>;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    postulanteRepository = moduleFixture.get(getRepositoryToken(Postulante));
    userRepository = moduleFixture.get(getRepositoryToken(User));
  });

  const truncateAll = async (repo: Repository<any>) => {
    await repo.query('TRUNCATE TABLE matches CASCADE');
    await repo.query('TRUNCATE TABLE interacciones CASCADE');
    await repo.query('TRUNCATE TABLE postulante_habilidades CASCADE');
    await repo.query('TRUNCATE TABLE postulante_idiomas CASCADE');
    await repo.query('TRUNCATE TABLE detalles_estudios CASCADE');
    await repo.query('TRUNCATE TABLE postulantes CASCADE');
    await repo.query('TRUNCATE TABLE empresas CASCADE');
    await repo.query('TRUNCATE TABLE users CASCADE');
  };

  beforeEach(async () => {
    if (!postulanteRepository) return;
    await truncateAll(postulanteRepository);
  });

  afterEach(async () => {
    if (!postulanteRepository) return;
    await truncateAll(postulanteRepository);
  });

  afterAll(async () => {
    if (!app) return;
    await app.close();
  });

  const crearUser = (email = 'user@test.com') =>
    userRepository.save({ email, password: 'hashed_password' });

  const registrarPostulante = async (
    email = 'postulante@test.com',
    extras: Partial<{ name: string; lastname: string }> = {},
  ) => {
    const user = await crearUser(email);

    const dto = {
      name: extras.name ?? 'Juan',
      lastname: extras.lastname ?? 'Pérez',
      id_perfil: user.id,
    };

    const res = await request(app.getHttpServer())
      .post('/postulante/registro')
      .send(dto)
      .expect(201);

    return { userId: user.id, postulanteId: res.body.postulante.id as string };
  };

  it('POST /postulante/registro -> 201 y postulante creado', async () => {
    const user = await crearUser();

    const dto = {
      name: 'Ana',
      lastname: 'García',
      años_experiencia: 3,
      ubicacion: 'Bogotá',
      id_perfil: user.id,
    };

    const response = await request(app.getHttpServer())
      .post('/postulante/registro')
      .send(dto)
      .expect(201);

    expect(response.body.message).toBe('Postulante registrado con éxito');
    expect(response.body.postulante).toHaveProperty('id');
    expect(response.body.postulante.name).toBe(dto.name);
    expect(response.body.postulante.lastname).toBe(dto.lastname);

    const saved = await postulanteRepository.findOne({
      where: { id: response.body.postulante.id },
      relations: ['user'],
    });

    expect(saved).toBeDefined();
    expect(saved?.user.id).toBe(user.id);
  });

  it('POST /postulante/registro -> 404 si el id_perfil no existe', async () => {
    const dto = {
      name: 'Carlos',
      lastname: 'Lopez',
      id_perfil: '00000000-0000-0000-0000-000000000000',
    };

    await request(app.getHttpServer())
      .post('/postulante/registro')
      .send(dto)
      .expect(404);
  });

  it('GET /postulante -> 200 y lista de postulantes', async () => {
    await registrarPostulante('a@test.com', { name: 'Ana', lastname: 'Uno' });
    await registrarPostulante('b@test.com', { name: 'Luis', lastname: 'Dos' });

    const response = await request(app.getHttpServer())
      .get('/postulante')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
  });

  it('GET /postulante -> 200 y lista vacía si no hay postulantes', async () => {
    const response = await request(app.getHttpServer())
      .get('/postulante')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  it('GET /postulante/:id -> 200 y retorna name y lastname', async () => {
    const { postulanteId } = await registrarPostulante('c@test.com', {
      name: 'María',
      lastname: 'Rodríguez',
    });

    const response = await request(app.getHttpServer())
      .get(`/postulante/${postulanteId}`)
      .expect(200);

    expect(response.body.name).toBe('María');
    expect(response.body.lastname).toBe('Rodríguez');
    expect(response.body).not.toHaveProperty('password');
  });

  it('GET /postulante/:id -> 404 si el postulante no existe', async () => {
    await request(app.getHttpServer())
      .get('/postulante/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });

  it('GET /postulante/perfil-completo/:id -> 200 con postulante existente', async () => {
    const { postulanteId } = await registrarPostulante('d@test.com');

    const response = await request(app.getHttpServer())
      .get(`/postulante/perfil-completo/${postulanteId}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', postulanteId);
    expect(response.body).toHaveProperty('postulanteHabilidades');
    expect(response.body).toHaveProperty('postulanteIdiomas');
    expect(response.body).toHaveProperty('postulanteEstudios');
  });

  it('GET /postulante/perfil-completo/:id -> null si el id no existe', async () => {
    const response = await request(app.getHttpServer())
      .get('/postulante/perfil-completo/00000000-0000-0000-0000-000000000000')
      .expect(200);

    expect(response.text).toBe('');
  });

  it('PATCH /postulante/:id -> 200 y actualiza experiencia y cv', async () => {
    const { postulanteId } = await registrarPostulante('e@test.com');

    const response = await request(app.getHttpServer())
      .patch(`/postulante/${postulanteId}`)
      .send({ experiencia: 5, cv: 'https://cv.example.com/juan.pdf' })
      .expect(200);

    expect(response.body.años_experiencia).toBe(5);
    expect(response.body.curriculum).toBe('https://cv.example.com/juan.pdf');
  });

  it('PATCH /postulante/:id -> 404 si el postulante no existe', async () => {
    await request(app.getHttpServer())
      .patch('/postulante/00000000-0000-0000-0000-000000000000')
      .send({ experiencia: 2 })
      .expect(404);
  });

  it('DELETE /postulante/limpiar/:id -> 200 y limpia relaciones del postulante', async () => {
    const { postulanteId } = await registrarPostulante('f@test.com');

    const response = await request(app.getHttpServer())
      .delete(`/postulante/limpiar/${postulanteId}`)
      .expect(200);

    expect(response.body.message).toBeDefined();
  });
});