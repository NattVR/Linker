import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { Vacante, TipoTrabajo, TipoModalidad } from '../../src/vacantes/entities/vacante.entity';
import { Empresa } from '../../src/empresa/entities/empresa.entity';
import { User } from '../../src/user/entities/user.entity';

describe('Vacantes API Regression (e2e)', () => {
  let app: INestApplication;
  let vacanteRepository: Repository<Vacante>;
  let empresaRepository: Repository<Empresa>;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    vacanteRepository = moduleFixture.get(getRepositoryToken(Vacante));
    empresaRepository = moduleFixture.get(getRepositoryToken(Empresa));
    userRepository = moduleFixture.get(getRepositoryToken(User));
  });

  const truncateAll = async (repo: Repository<any>) => {
    await repo.query('TRUNCATE TABLE matches CASCADE');
    await repo.query('TRUNCATE TABLE interacciones CASCADE');
    await repo.query('TRUNCATE TABLE vacante_habilidades CASCADE');
    await repo.query('TRUNCATE TABLE vacante_idiomas CASCADE');
    await repo.query('TRUNCATE TABLE vacantes CASCADE');
    await repo.query('TRUNCATE TABLE postulantes CASCADE');
    await repo.query('TRUNCATE TABLE empresas CASCADE');
    await repo.query('TRUNCATE TABLE users CASCADE');
  };

  beforeEach(async () => {
    if (!vacanteRepository) return;
    await truncateAll(vacanteRepository);
  });

  afterEach(async () => {
    if (!vacanteRepository) return;
    await truncateAll(vacanteRepository);
  });

  afterAll(async () => {
    if (!app) return;
    await app.close();
  });

  const crearEmpresa = async (nit = '900000001-1', email = 'empresa@test.com') => {
    const user = await userRepository.save({
      email,
      password: 'hashed_password',
    });
    return empresaRepository.save({
      name_empresa: 'Empresa Test',
      NIT: nit,
      user,
    });
  };

  const dtoBase = (empresaId: string): object => ({
    titulo: 'Desarrollador Backend',
    tipo_trabajo: TipoTrabajo.FULL_TIME,
    tipo_modalidad: TipoModalidad.REMOTO,
    salario: 3500000,
    ubicacion: 'Medellín',
    empresa: empresaId,
  });

  const crearVacante = async (empresaId: string, titulo = 'Desarrollador Backend') => {
    const res = await request(app.getHttpServer())
      .post('/vacantes')
      .send({ ...dtoBase(empresaId), titulo })
      .expect(201);
    return res.body.id_vacante as string;
  };

  it('POST /vacantes -> 201 y vacante creada sin habilidades ni idiomas', async () => {
    const empresa = await crearEmpresa();

    const response = await request(app.getHttpServer())
      .post('/vacantes')
      .send(dtoBase(empresa.id))
      .expect(201);

    expect(response.body).toHaveProperty('id_vacante');
    expect(response.body.titulo).toBe('Desarrollador Backend');
    expect(response.body.salario).toBe(3500000);
    expect(response.body.tipo_trabajo).toBe(TipoTrabajo.FULL_TIME);
    expect(response.body.modalidad).toBe(TipoModalidad.REMOTO);

    const saved = await vacanteRepository.findOne({
      where: { id_vacante: response.body.id_vacante },
      relations: ['empresa'],
    });
    expect(saved).toBeDefined();
    expect(saved?.empresa.id).toBe(empresa.id);
  });

  it('POST /vacantes -> 201 con arrays de habilidades e idiomas vacíos', async () => {
    const empresa = await crearEmpresa('900000002-2', 'e2@test.com');

    const response = await request(app.getHttpServer())
      .post('/vacantes')
      .send({ ...dtoBase(empresa.id), vacanteHabilidades: [], vacantesIdiomas: [] })
      .expect(201);

    expect(response.body).toHaveProperty('id_vacante');
    expect(response.body.vacanteHabilidades).toEqual([]);
    expect(response.body.vacantesIdiomas).toEqual([]);
  });

  it('GET /vacantes -> 200 y lista de vacantes', async () => {
    const empresa = await crearEmpresa('900000003-3', 'e3@test.com');
    await crearVacante(empresa.id, 'Backend Dev');
    await crearVacante(empresa.id, 'Frontend Dev');

    const response = await request(app.getHttpServer())
      .get('/vacantes')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('empresa');
    expect(response.body[0].empresa.id).toBe(empresa.id);
  });

  it('GET /vacantes -> 200 y lista vacía si no hay vacantes', async () => {
    const response = await request(app.getHttpServer())
      .get('/vacantes')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  it('GET /vacantes/empresaId/:empresa -> 200 y solo las vacantes de esa empresa', async () => {
    const empresa1 = await crearEmpresa('900000004-4', 'e4@test.com');
    const empresa2 = await crearEmpresa('900000005-5', 'e5@test.com');

    await crearVacante(empresa1.id, 'Dev A');
    await crearVacante(empresa1.id, 'Dev B');
    await crearVacante(empresa2.id, 'Dev C');

    const response = await request(app.getHttpServer())
      .get(`/vacantes/empresaId/${empresa1.id}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
    response.body.forEach((v: any) => {
      expect(v.empresa.id).toBe(empresa1.id);
    });
  });

  it('GET /vacantes/empresaId/:empresa -> 200 y lista vacía si la empresa no tiene vacantes', async () => {
    const empresa = await crearEmpresa('900000006-6', 'e6@test.com');

    const response = await request(app.getHttpServer())
      .get(`/vacantes/empresaId/${empresa.id}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  it('GET /vacantes/empresaId/:empresa -> 200 y lista vacía con id inexistente', async () => {
    const response = await request(app.getHttpServer())
      .get('/vacantes/empresaId/00000000-0000-0000-0000-000000000000')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  it('GET /vacantes/vacantes/:id -> 200 y retorna vacantes formateadas', async () => {
    const empresa = await crearEmpresa('900000007-7', 'e7@test.com');
    await crearVacante(empresa.id, 'Vacante visible');

    const fakePostulanteId = '00000000-0000-0000-0000-000000000001';

    const response = await request(app.getHttpServer())
      .get(`/vacantes/vacantes/${fakePostulanteId}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('idiomas');
    expect(response.body[0]).toHaveProperty('habilidades');
    expect(Array.isArray(response.body[0].idiomas)).toBe(true);
    expect(Array.isArray(response.body[0].habilidades)).toBe(true);
  });

  it('GET /vacantes/vacantes/:id -> 200 y lista vacía si no hay vacantes', async () => {
    const fakePostulanteId = '00000000-0000-0000-0000-000000000002';

    const response = await request(app.getHttpServer())
      .get(`/vacantes/vacantes/${fakePostulanteId}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  it('PUT /vacantes/:id -> 200 y actualiza titulo y salario', async () => {
    const empresa = await crearEmpresa('900000008-8', 'e8@test.com');
    const vacanteId = await crearVacante(empresa.id);

    const response = await request(app.getHttpServer())
      .put(`/vacantes/${vacanteId}`)
      .send({ titulo: 'Tech Lead', salario: 8000000 })
      .expect(200);

    expect(response.body.titulo).toBe('Tech Lead');
    expect(response.body.salario).toBe(8000000);
  });

  it('PUT /vacantes/:id -> 500 si la vacante no existe', async () => {
    await request(app.getHttpServer())
      .put('/vacantes/00000000-0000-0000-0000-000000000000')
      .send({ titulo: 'Inexistente' })
      .expect(500);
  });
});