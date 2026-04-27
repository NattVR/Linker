import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { Certificado } from '../../src/certificados/entities/certificado.entity';


describe('Certificados API Regression (e2e)', () => {
  let app: INestApplication;
  let certificadosRepository: Repository<Certificado>;
  

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    certificadosRepository = moduleFixture.get(getRepositoryToken(Certificado));
  });

  beforeEach(async () => {
    if (!certificadosRepository) return;
    await certificadosRepository.query('TRUNCATE TABLE detalles_certificados CASCADE');
    await certificadosRepository.query('TRUNCATE TABLE certificados CASCADE');
  });

  afterEach(async () => {
    if (!certificadosRepository) return;
    await certificadosRepository.query('TRUNCATE TABLE detalles_certificados CASCADE');
    await certificadosRepository.query('TRUNCATE TABLE certificados CASCADE');
  });

  afterAll(async () => {
    if (!app) return;
    await app.close();
  });

  it('GET /certificados -> 200 y lista de certificados', async () => {
    await certificadosRepository.save({
      entidad_emisora: 'Coursera',
      nombre_certificado: 'Angular Avanzado',
    });

    const response = await request(app.getHttpServer()).get('/certificados').expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].nombre_certificado).toBe('Angular Avanzado');
  });

  it('POST /certificados -> 201 y certificado creado', async () => {
    const dto = {
      entidad_emisora: 'Platzi',
      nombre_certificado: 'NestJS Profesional',
    };

    const response = await request(app.getHttpServer())
      .post('/certificados')
      .send(dto)
      .expect(201);

    expect(response.body.entidad_emisora).toBe(dto.entidad_emisora);
    expect(response.body.nombre_certificado).toBe(dto.nombre_certificado);

    const savedCertificado = await certificadosRepository.findOne({
      where: { nombre_certificado: dto.nombre_certificado },
    });

    expect(savedCertificado).toBeDefined();
    expect(savedCertificado?.entidad_emisora).toBe(dto.entidad_emisora);
  });
});
