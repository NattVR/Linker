import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { Certificado } from '../../src/certificados/entities/certificado.entity';
import { DetallesCertificado } from '../../src/detalles_certificados/entities/detalles_certificado.entity';
import { Empresa } from '../../src/empresa/entities/empresa.entity';
import { User } from '../../src/user/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

describe('Detalles Certificados API Regression (e2e)', () => {
  let app: INestApplication;
  let detallesRepository: Repository<DetallesCertificado>;
  let certificadoRepository: Repository<Certificado>;
  let empresaRepository: Repository<Empresa>;
  let userRepository: Repository<User>;


  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    detallesRepository = moduleFixture.get(getRepositoryToken(DetallesCertificado));
    certificadoRepository = moduleFixture.get(getRepositoryToken(Certificado));
    empresaRepository = moduleFixture.get(getRepositoryToken(Empresa));
    userRepository = moduleFixture.get(getRepositoryToken(User));
  });

  beforeEach(async () => {
    if (!detallesRepository) return;
     
    await detallesRepository.query('TRUNCATE TABLE detalles_certificados CASCADE');
    await certificadoRepository.query('TRUNCATE TABLE certificados CASCADE');
    await empresaRepository.query('TRUNCATE TABLE empresas CASCADE');
    await userRepository.query('TRUNCATE TABLE users CASCADE');

  });

  afterEach(async () => {
    if (!detallesRepository) return;
    await detallesRepository.query('TRUNCATE TABLE detalles_certificados CASCADE');
    await certificadoRepository.query('TRUNCATE TABLE certificados CASCADE');
    await empresaRepository.query('TRUNCATE TABLE empresas CASCADE');
    await userRepository.query('TRUNCATE TABLE users CASCADE');

  });

  afterAll(async () => {
    if (!app) return;
    await app.close();
  });

  const createUserAndEmpresa = async () => {
    const user = await userRepository.save({
      email: `empresa.${Date.now()}@test.com`,
      password: 'Password123!',
      estado_verificacion: 'verificado',
    });

    const empresa = await empresaRepository.save({
      name_empresa: 'Linker QA',
      descripcion: 'Empresa de prueba',
      ubicacion: 'Bogota',
      sector: 'Tech',
      foto: 'https://example.com/logo.png',
      NIT: `NIT-${Date.now()}`,
      user,
    });

    return { user, empresa };
  };

  const createCertificado = async () => {
    return certificadoRepository.save({
      entidad_emisora: 'Coursera',
      nombre_certificado: `Cert-${Date.now()}`,
    });
  };

  it('GET /detalles-certificados -> 200 y lista', async () => {
    const { empresa } = await createUserAndEmpresa();
    const certificado = await createCertificado();

    await detallesRepository.save({
      empresa: empresa,
      certificado: certificado,
      fecha_emision: new Date('2026-01-10'),
      fecha_caducidad: new Date('2027-01-10'),
    });

    const response = await request(app.getHttpServer())
      .get('/detalles-certificados')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].empresa.id).toBe(empresa.id);
  });

  it('GET /detalles-certificados/empresa/:id -> 200 y lista filtrada', async () => {
    const { empresa } = await createUserAndEmpresa();
    const certificado = await createCertificado();

    await detallesRepository.save({
      empresa,
      certificado,
      fecha_emision: new Date('2026-01-10'),
      fecha_caducidad: new Date('2027-01-10'),
    });

    const response = await request(app.getHttpServer())
      .get(`/detalles-certificados/empresa/${empresa.id}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].certificado.id_certificado).toBe(certificado.id_certificado);
  });

  it('POST /detalles-certificados -> 201 y detalle creado', async () => {
    const { empresa } = await createUserAndEmpresa();
    const certificado = await createCertificado();

    const dto = {
      empresa: { id: empresa.id },
      certificado: { id_certificado: certificado.id_certificado },
      fecha_emision: '2026-01-10',
      fecha_caducidad: '2027-01-10',
    };

    const response = await request(app.getHttpServer())
      .post('/detalles-certificados')
      .send(dto)
      .expect(201);

    expect(response.body.empresa.id).toBe(empresa.id);
    expect(response.body.certificado.id_certificado).toBe(certificado.id_certificado);

    const saved = await detallesRepository.findOne({
      where: { id_detalles_certificados: response.body.id_detalles_certificados },
      relations: ['empresa', 'certificado'],
    });

    expect(saved).toBeDefined();
  });

  it('PATCH /detalles-certificados/:id -> 200 y detalle actualizado', async () => {
    const { empresa } = await createUserAndEmpresa();
    const certificado = await createCertificado();

    const detalle = await detallesRepository.save({
      empresa,
      certificado,
      fecha_emision: new Date('2026-01-10'),
      fecha_caducidad: new Date('2027-01-10'),
    });

    const response = await request(app.getHttpServer())
      .patch(`/detalles-certificados/${detalle.id_detalles_certificados}`)
      .send({ fecha_caducidad: '2028-01-10' })
      .expect(200);

    expect(response.body.id_detalles_certificados).toBe(detalle.id_detalles_certificados);
    expect(response.body.fecha_caducidad).toContain('2028-01-10');
  });

  it('PATCH /detalles-certificados/:id -> 404 cuando no existe', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/detalles-certificados/${uuidv4()}`)
      .send({ fecha_caducidad: '2028-01-10' })
      .expect(404);

    expect(response.body.message).toContain('no encontrado');
  });

  it('DELETE /detalles-certificados/:id -> 200 y mensaje de eliminacion', async () => {
    const { empresa } = await createUserAndEmpresa();
    const certificado = await createCertificado();

    const detalle = await detallesRepository.save({
      empresa,
      certificado,
      fecha_emision: new Date('2026-01-10'),
      fecha_caducidad: new Date('2027-01-10'),
    });

    const response = await request(app.getHttpServer())
      .delete(`/detalles-certificados/${detalle.id_detalles_certificados}`)
      .expect(200);

    expect(response.body.message).toContain('eliminado');

    const deleted = await detallesRepository.findOne({
      where: { id_detalles_certificados: detalle.id_detalles_certificados },
    });

    expect(deleted).toBeNull();
  });

  it('DELETE /detalles-certificados/:id -> 404 cuando no existe', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/detalles-certificados/${uuidv4()}`)
      .expect(404);

    expect(response.body.message).toContain('no encontrado');
  });
});
