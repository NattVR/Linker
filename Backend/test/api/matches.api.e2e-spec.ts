import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { Match } from '../../src/matches/entities/match.entity';
import { Vacante, TipoTrabajo, TipoModalidad } from '../../src/vacantes/entities/vacante.entity';
import { Postulante } from '../../src/postulante/entities/postulante.entity';
import { Empresa } from '../../src/empresa/entities/empresa.entity';
import { User } from '../../src/user/entities/user.entity';

describe('Matches API Regression (e2e)', () => {
    let app: INestApplication;
    let matchRepository: Repository<Match>;
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

        matchRepository = moduleFixture.get(getRepositoryToken(Match));
        vacanteRepository = moduleFixture.get(getRepositoryToken(Vacante));
        postulanteRepository = moduleFixture.get(getRepositoryToken(Postulante));
        empresaRepository = moduleFixture.get(getRepositoryToken(Empresa));
        userRepository = moduleFixture.get(getRepositoryToken(User));
    });

    const truncateAll = async () => {
        await matchRepository.query('TRUNCATE TABLE matches CASCADE');
        await matchRepository.query('TRUNCATE TABLE interacciones CASCADE');
        await matchRepository.query('TRUNCATE TABLE vacante_habilidades CASCADE');
        await matchRepository.query('TRUNCATE TABLE vacante_idiomas CASCADE');
        await matchRepository.query('TRUNCATE TABLE vacantes CASCADE');
        await matchRepository.query('TRUNCATE TABLE postulantes CASCADE');
        await matchRepository.query('TRUNCATE TABLE empresas CASCADE');
        await matchRepository.query('TRUNCATE TABLE users CASCADE');
    };

    beforeEach(async () => {
        if (!matchRepository) return;
        await truncateAll();
    });

    afterEach(async () => {
        if (!matchRepository) return;
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

    const crearVacante = async (empresaId: string): Promise<string> => {
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

    const crearMatch = async (vacanteId: string, postulanteId: string) =>
        request(app.getHttpServer())
            .post('/matches')
            .send({
                vacante: { id_vacante: vacanteId },
                postulante: { id: postulanteId },
            });

    describe('POST /matches', () => {

        it('debe crear un match y retornar 201', async () => {
            const empresa = await crearEmpresa('800000001-1', 'e1@match.com');
            const postulante = await crearPostulante('p1@match.com');
            const vacanteId = await crearVacante(empresa.id);

            const res = await crearMatch(vacanteId, postulante.id);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id_match');
            expect(res.body).toHaveProperty('fecha');
        });

        it('debe persistir el match en la base de datos', async () => {
            const empresa = await crearEmpresa('800000002-2', 'e2@match.com');
            const postulante = await crearPostulante('p2@match.com');
            const vacanteId = await crearVacante(empresa.id);

            const res = await crearMatch(vacanteId, postulante.id);
            expect(res.status).toBe(201);

            const matchEnDB = await matchRepository.findOne({
                where: { id_match: res.body.id_match },
            });
            expect(matchEnDB).not.toBeNull();
        });

        it('debe asociar correctamente la vacante al match', async () => {
            const empresa = await crearEmpresa('800000003-3', 'e3@match.com');
            const postulante = await crearPostulante('p3@match.com');
            const vacanteId = await crearVacante(empresa.id);

            const res = await crearMatch(vacanteId, postulante.id);
            expect(res.status).toBe(201);

            const matchEnDB = await matchRepository.findOne({
                where: { id_match: res.body.id_match },
                relations: ['vacante'],
            });
            expect(matchEnDB?.vacante).toBeDefined();
        });

        it('debe asociar correctamente el postulante al match', async () => {
            const empresa = await crearEmpresa('800000004-4', 'e4@match.com');
            const postulante = await crearPostulante('p4@match.com');
            const vacanteId = await crearVacante(empresa.id);

            const res = await crearMatch(vacanteId, postulante.id);
            expect(res.status).toBe(201);

            const matchEnDB = await matchRepository.findOne({
                where: { id_match: res.body.id_match },
                relations: ['postulante'],
            });
            expect(matchEnDB?.postulante).toBeDefined();
        });

        it('debe asignar una fecha automáticamente', async () => {
            const empresa = await crearEmpresa('800000005-5', 'e5@match.com');
            const postulante = await crearPostulante('p5@match.com');
            const vacanteId = await crearVacante(empresa.id);

            const res = await crearMatch(vacanteId, postulante.id);

            expect(res.status).toBe(201);
            expect(res.body.fecha).toBeTruthy();
            expect(new Date(res.body.fecha).toString()).not.toBe('Invalid Date');
        });
    });

    describe('GET /matches', () => {

        it('debe retornar 200 y un array vacío si no hay matches', async () => {
            const res = await request(app.getHttpServer())
                .get('/matches')
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(0);
        });

        it('debe retornar todos los matches existentes', async () => {
            const empresa = await crearEmpresa('800000006-6', 'e6@match.com');
            const postulante1 = await crearPostulante('p6a@match.com');
            const postulante2 = await crearPostulante('p6b@match.com');
            const vacanteId = await crearVacante(empresa.id);

            await crearMatch(vacanteId, postulante1.id);
            await crearMatch(vacanteId, postulante2.id);

            const res = await request(app.getHttpServer())
                .get('/matches')
                .expect(200);

            expect(res.body.length).toBe(2);
        });

        it('debe retornar matches con relaciones de postulante y vacante', async () => {
            const empresa = await crearEmpresa('800000007-7', 'e7@match.com');
            const postulante = await crearPostulante('p7@match.com');
            const vacanteId = await crearVacante(empresa.id);

            await crearMatch(vacanteId, postulante.id);

            const res = await request(app.getHttpServer())
                .get('/matches')
                .expect(200);

            expect(res.body[0]).toHaveProperty('postulante');
            expect(res.body[0]).toHaveProperty('vacante');
        });

        it('debe retornar el match con su id_match correcto', async () => {
            const empresa = await crearEmpresa('800000008-8', 'e8@match.com');
            const postulante = await crearPostulante('p8@match.com');
            const vacanteId = await crearVacante(empresa.id);

            const created = await crearMatch(vacanteId, postulante.id);

            const res = await request(app.getHttpServer())
                .get('/matches')
                .expect(200);

            expect(res.body[0].id_match).toBe(created.body.id_match);
        });
    });

    describe('Cascada', () => {

        it('debe eliminar el match cuando se elimina la vacante', async () => {
            const empresa = await crearEmpresa('800000009-9', 'e9@match.com');
            const postulante = await crearPostulante('p9@match.com');
            const vacanteId = await crearVacante(empresa.id);

            const matchRes = await crearMatch(vacanteId, postulante.id);
            expect(matchRes.status).toBe(201);

            await vacanteRepository.delete(vacanteId);

            const matchEnDB = await matchRepository.findOne({
                where: { id_match: matchRes.body.id_match },
            });
            expect(matchEnDB).toBeNull();
        });

        it('debe eliminar el match cuando se elimina el postulante', async () => {
            const empresa = await crearEmpresa('800000010-0', 'e10@match.com');
            const postulante = await crearPostulante('p10@match.com');
            const vacanteId = await crearVacante(empresa.id);

            const matchRes = await crearMatch(vacanteId, postulante.id);
            expect(matchRes.status).toBe(201);

            await postulanteRepository.delete(postulante.id);

            const matchEnDB = await matchRepository.findOne({
                where: { id_match: matchRes.body.id_match },
            });
            expect(matchEnDB).toBeNull();
        });
    });
});
