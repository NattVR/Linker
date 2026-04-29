import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { Interaccion, TipoInteraccion } from '../../src/interacciones/entities/interacciones.entity';
import { Vacante, TipoTrabajo, TipoModalidad } from '../../src/vacantes/entities/vacante.entity';
import { Postulante } from '../../src/postulante/entities/postulante.entity';
import { Empresa } from '../../src/empresa/entities/empresa.entity';
import { User } from '../../src/user/entities/user.entity';

describe('Interacciones API Regression (e2e)', () => {
    let app: INestApplication;
    let interaccionRepository: Repository<Interaccion>;
    let vacanteRepository: Repository<Vacante>;
    let postulanteRepository: Repository<Postulante>;
    let empresaRepository: Repository<Empresa>;
    let userRepository: Repository<User>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        interaccionRepository = moduleFixture.get(getRepositoryToken(Interaccion));
        vacanteRepository = moduleFixture.get(getRepositoryToken(Vacante));
        postulanteRepository = moduleFixture.get(getRepositoryToken(Postulante));
        empresaRepository = moduleFixture.get(getRepositoryToken(Empresa));
        userRepository = moduleFixture.get(getRepositoryToken(User));
    });

    const truncateAll = async () => {
        await interaccionRepository.query('TRUNCATE TABLE matches CASCADE');
        await interaccionRepository.query('TRUNCATE TABLE interacciones CASCADE');
        await interaccionRepository.query('TRUNCATE TABLE vacante_habilidades CASCADE');
        await interaccionRepository.query('TRUNCATE TABLE vacante_idiomas CASCADE');
        await interaccionRepository.query('TRUNCATE TABLE vacantes CASCADE');
        await interaccionRepository.query('TRUNCATE TABLE postulantes CASCADE');
        await interaccionRepository.query('TRUNCATE TABLE empresas CASCADE');
        await interaccionRepository.query('TRUNCATE TABLE users CASCADE');
    };

    beforeEach(async () => {
        if (!interaccionRepository) return;
        await truncateAll();
    });

    afterEach(async () => {
        if (!interaccionRepository) return;
        await truncateAll();
    });

    afterAll(async () => {
        if (!app) return;
        await app.close();
    });

    const crearUser = async (email: string) =>
        userRepository.save({ email, password: 'hashed_password' });

    const crearEmpresa = async (nit: string, email: string) => {
        const user = await crearUser(email);
        return empresaRepository.save({ name_empresa: 'Empresa Test', NIT: nit, user });
    };

    const crearPostulante = async (email: string) => {
        const user = await crearUser(email);
        return postulanteRepository.save({ name: 'Postulante', lastname: 'Test', user });
    };

    const crearVacante = async (empresaId: string) => {
        const res = await request(app.getHttpServer())
            .post('/vacantes')
            .send({
                titulo: 'Vacante Test',
                tipo_trabajo: TipoTrabajo.FULL_TIME,
                tipo_modalidad: TipoModalidad.REMOTO,
                salario: 3500000,
                ubicacion: 'Medellín',
                empresa: empresaId,
            })
            .expect(201);
        return res.body.id_vacante as string;
    };

    const crearInteraccion = async (
        vacanteId: string,
        postulanteId: string,
        accionEmpresa: TipoInteraccion,
        accionPostulante: TipoInteraccion,
    ) => {
        const res = await request(app.getHttpServer())
            .post('/interacciones')
            .send({
                vacante: vacanteId,
                postulante: postulanteId,
                empresa: 'empresa-id-irrelevante',
                accion_empresa: accionEmpresa,
                accion_postulante: accionPostulante,
            });
        return res;
    };

    it('POST /interacciones -> 201 crea nueva interaccion con NO_INTERACCION por defecto', async () => {
        const empresa = await crearEmpresa('900000001-1', 'e1@test.com');
        const postulante = await crearPostulante('p1@test.com');
        const vacanteId = await crearVacante(empresa.id);

        const res = await crearInteraccion(
            vacanteId,
            postulante.id,
            TipoInteraccion.NO_INTERACCION,
            TipoInteraccion.NO_INTERACCION,
        );

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('accionEmpresa', TipoInteraccion.NO_INTERACCION);
        expect(res.body).toHaveProperty('accionPostulante', TipoInteraccion.NO_INTERACCION);
    });

    it('POST /interacciones -> 201 crea interaccion con accion_empresa LIKE', async () => {
        const empresa = await crearEmpresa('900000002-2', 'e2@test.com');
        const postulante = await crearPostulante('p2@test.com');
        const vacanteId = await crearVacante(empresa.id);

        const res = await crearInteraccion(
            vacanteId,
            postulante.id,
            TipoInteraccion.LIKE,
            TipoInteraccion.NO_INTERACCION,
        );

        expect(res.status).toBe(201);
        expect(res.body.accionEmpresa).toBe(TipoInteraccion.LIKE);
        expect(res.body.accionPostulante).toBe(TipoInteraccion.NO_INTERACCION);
    });

    it('POST /interacciones -> 201 actualiza interaccion existente', async () => {
        const empresa = await crearEmpresa('900000003-3', 'e3@test.com');
        const postulante = await crearPostulante('p3@test.com');
        const vacanteId = await crearVacante(empresa.id);

        await crearInteraccion(
            vacanteId,
            postulante.id,
            TipoInteraccion.LIKE,
            TipoInteraccion.NO_INTERACCION,
        );

        const res = await crearInteraccion(
            vacanteId,
            postulante.id,
            TipoInteraccion.LIKE,
            TipoInteraccion.LIKE,
        );

        expect(res.status).toBe(201);
        expect(res.body.accionEmpresa).toBe(TipoInteraccion.LIKE);
        expect(res.body.accionPostulante).toBe(TipoInteraccion.LIKE);
    });

    it('POST /interacciones -> 201 crea match cuando ambos tienen LIKE', async () => {
        const empresa = await crearEmpresa('900000004-4', 'e4@test.com');
        const postulante = await crearPostulante('p4@test.com');
        const vacanteId = await crearVacante(empresa.id);

        await crearInteraccion(
            vacanteId,
            postulante.id,
            TipoInteraccion.LIKE,
            TipoInteraccion.NO_INTERACCION,
        );

        const res = await crearInteraccion(
            vacanteId,
            postulante.id,
            TipoInteraccion.LIKE,
            TipoInteraccion.LIKE,
        );

        expect(res.status).toBe(201);

        const matches = await interaccionRepository.query(
            `SELECT * FROM matches WHERE id_vacante = $1 AND id_postulante = $2`,
            [vacanteId, postulante.id],
        );
        expect(matches.length).toBeGreaterThan(0);
    });

    it('POST /interacciones -> NO crea match cuando solo empresa tiene LIKE', async () => {
        const empresa = await crearEmpresa('900000005-5', 'e5@test.com');
        const postulante = await crearPostulante('p5@test.com');
        const vacanteId = await crearVacante(empresa.id);

        await crearInteraccion(
            vacanteId,
            postulante.id,
            TipoInteraccion.LIKE,
            TipoInteraccion.DISLIKE,
        );

        const matches = await interaccionRepository.query(
            `SELECT * FROM matches WHERE id_vacante = $1 AND id_postulante = $2`,
            [vacanteId, postulante.id],
        );
        expect(matches.length).toBe(0);
    });

    it('GET /filter/vacantes/:id -> 200 retorna array de IDs de vacantes excluidas', async () => {
        const empresa = await crearEmpresa('900000006-6', 'e6@test.com');
        const postulante = await crearPostulante('p6@test.com');
        const vacanteId = await crearVacante(empresa.id);

        await crearInteraccion(
            vacanteId,
            postulante.id,
            TipoInteraccion.LIKE,
            TipoInteraccion.LIKE,
        );

        const res = await request(app.getHttpServer())
            .get(`/interacciones/filter/vacantes/${postulante.id}`)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toContain(vacanteId);
    });

    it('GET /filter/vacantes/:id -> 200 retorna array vacío si no hay interacciones', async () => {
        const postulante = await crearPostulante('p7@test.com');

        const res = await request(app.getHttpServer())
            .get(`/interacciones/filter/vacantes/${postulante.id}`)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
    });

    it('GET /filter/vacantes/:id -> NO excluye vacantes con NO_INTERACCION de ambos', async () => {
        const empresa = await crearEmpresa('900000007-7', 'e7@test.com');
        const postulante = await crearPostulante('p8@test.com');
        const vacanteId = await crearVacante(empresa.id);

        await crearInteraccion(
            vacanteId,
            postulante.id,
            TipoInteraccion.NO_INTERACCION,
            TipoInteraccion.NO_INTERACCION,
        );

        const res = await request(app.getHttpServer())
            .get(`/interacciones/filter/vacantes/${postulante.id}`)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).not.toContain(vacanteId);
    });

    it('GET /filter/postulantes/:id -> 200 retorna array de IDs de postulantes excluidos', async () => {
        const empresa = await crearEmpresa('900000008-8', 'e8@test.com');
        const postulante = await crearPostulante('p9@test.com');
        const vacanteId = await crearVacante(empresa.id);

        await crearInteraccion(
            vacanteId,
            postulante.id,
            TipoInteraccion.LIKE,
            TipoInteraccion.LIKE,
        );

        const res = await request(app.getHttpServer())
            .get(`/interacciones/filter/postulantes/${vacanteId}`)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toContain(postulante.id);
    });

    it('GET /filter/postulantes/:id -> 200 retorna array vacío si no hay interacciones', async () => {
        const empresa = await crearEmpresa('900000009-9', 'e9@test.com');
        const vacanteId = await crearVacante(empresa.id);

        const res = await request(app.getHttpServer())
            .get(`/interacciones/filter/postulantes/${vacanteId}`)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
    });

    it('GET /filter/postulantes/:id -> excluye postulante con DISLIKE de empresa', async () => {
        const empresa = await crearEmpresa('900000010-0', 'e10@test.com');
        const postulante = await crearPostulante('p10@test.com');
        const vacanteId = await crearVacante(empresa.id);

        await crearInteraccion(
            vacanteId,
            postulante.id,
            TipoInteraccion.DISLIKE,
            TipoInteraccion.NO_INTERACCION,
        );

        const res = await request(app.getHttpServer())
            .get(`/interacciones/filter/postulantes/${vacanteId}`)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toContain(postulante.id);
    });

    it('GET /check-match/:postulanteId/:vacanteId -> 200 retorna interaccion existente', async () => {
        const empresa = await crearEmpresa('900000011-1', 'e11@test.com');
        const postulante = await crearPostulante('p11@test.com');
        const vacanteId = await crearVacante(empresa.id);

        await crearInteraccion(
            vacanteId,
            postulante.id,
            TipoInteraccion.LIKE,
            TipoInteraccion.NO_INTERACCION,
        );

        const res = await request(app.getHttpServer())
            .get(`/interacciones/check-match/${postulante.id}/${vacanteId}`)
            .expect(200);

        expect(res.body).toHaveProperty('accionEmpresa', TipoInteraccion.LIKE);
        expect(res.body).toHaveProperty('accionPostulante', TipoInteraccion.NO_INTERACCION);
    });

    it('GET /check-match/:postulanteId/:vacanteId -> 200 retorna null si no existe interaccion', async () => {
        const empresa = await crearEmpresa('900000012-2', 'e12@test.com');
        const postulante = await crearPostulante('p12@test.com');
        const vacanteId = await crearVacante(empresa.id);

        const res = await request(app.getHttpServer())
            .get(`/interacciones/check-match/${postulante.id}/${vacanteId}`)
            .expect(200);

        expect(res.body === null || Object.keys(res.body).length === 0).toBe(true);
    });

    it('GET /check-match/:postulanteId/:vacanteId -> refleja la ultima actualizacion', async () => {
        const empresa = await crearEmpresa('900000013-3', 'e13@test.com');
        const postulante = await crearPostulante('p13@test.com');
        const vacanteId = await crearVacante(empresa.id);

        await crearInteraccion(
            vacanteId,
            postulante.id,
            TipoInteraccion.NO_INTERACCION,
            TipoInteraccion.LIKE,
        );

        await crearInteraccion(
            vacanteId,
            postulante.id,
            TipoInteraccion.LIKE,
            TipoInteraccion.LIKE,
        );

        const res = await request(app.getHttpServer())
            .get(`/interacciones/check-match/${postulante.id}/${vacanteId}`)
            .expect(200);

        expect(res.body.accionEmpresa).toBe(TipoInteraccion.LIKE);
        expect(res.body.accionPostulante).toBe(TipoInteraccion.LIKE);
    });
});
