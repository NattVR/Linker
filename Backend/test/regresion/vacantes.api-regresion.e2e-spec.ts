import request from 'supertest';
import { TipoInteraccion } from '../../src/interacciones/entities/interacciones.entity';
import {
  closeRegressionContext,
  createEmpresa,
  createHabilidad,
  createIdioma,
  createInteraccion,
  createPostulante,
  createRegressionContext,
  createVacante,
  linkVacanteHabilidad,
  linkVacanteIdioma,
  RegressionContext,
  resetRegressionDatabase,
  snapshotHttpResponse,
} from './regresion-test.helpers';

describe('Vacantes API Regression (e2e)', () => {
  let context: RegressionContext;

  beforeAll(async () => {
    context = await createRegressionContext();
  });

  beforeEach(async () => {
    await resetRegressionDatabase(context);
  });

  afterEach(async () => {
    await resetRegressionDatabase(context);
  });

  afterAll(async () => {
    await closeRegressionContext(context);
  });

  it('POST /vacantes mantiene la estructura de la vacante creada', async () => {
    const empresa = await createEmpresa(context, {
      NIT: '900200200-1',
    });

    const response = await request(context.app.getHttpServer())
      .post('/vacantes')
      .send({
        titulo: 'Platform Engineer',
        tipo_trabajo: 'Full-time',
        tipo_modalidad: 'Remoto',
        salario: 7000000,
        ubicacion: 'Bogota',
        empresa: empresa.id,
      })
      .expect(201);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /vacantes mantiene la lista con empresa relacionada', async () => {
    const empresa = await createEmpresa(context, {
      NIT: '900200200-2',
    });
    await createVacante(context, { empresa, titulo: 'Backend I' });
    await createVacante(context, { empresa, titulo: 'Backend II' });

    const response = await request(context.app.getHttpServer())
      .get('/vacantes')
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /vacantes/empresaId/:empresa mantiene el formato enriquecido', async () => {
    const empresa = await createEmpresa(context, {
      NIT: '900200200-3',
    });
    const vacante = await createVacante(context, {
      empresa,
      titulo: 'Snapshot Vacante',
    });
    const idioma = await createIdioma(context, 'English');
    const habilidad = await createHabilidad(context, 'TypeScript');

    await linkVacanteIdioma(context, vacante, idioma);
    await linkVacanteHabilidad(context, vacante, habilidad);

    const response = await request(context.app.getHttpServer())
      .get(`/vacantes/empresaId/${empresa.id}`)
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /vacantes/vacantes/:id mantiene el filtrado de vacantes excluidas', async () => {
    const postulante = await createPostulante(context, {
      name: 'Viewer',
      lastname: 'Candidate',
    });
    const visibleVacante = await createVacante(context, {
      titulo: 'Visible Vacante',
    });
    const hiddenVacante = await createVacante(context, {
      empresa: await createEmpresa(context, {
        NIT: '900200200-4',
        user: undefined,
      }),
      titulo: 'Hidden Vacante',
    });

    await createInteraccion(context, {
      vacante: hiddenVacante,
      postulante,
      accionEmpresa: TipoInteraccion.NO_INTERACCION,
      accionPostulante: TipoInteraccion.DISLIKE,
    });

    const response = await request(context.app.getHttpServer())
      .get(`/vacantes/vacantes/${postulante.id}`)
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
    expect(response.body).toHaveLength(1);
    expect(response.body[0].titulo).toBe(visibleVacante.titulo);
  });

  it('PUT /vacantes/:id mantiene la forma de la vacante actualizada', async () => {
    const vacante = await createVacante(context, {
      titulo: 'Old Title',
      salario: 3500000,
    });

    const response = await request(context.app.getHttpServer())
      .put(`/vacantes/${vacante.id_vacante}`)
      .send({
        titulo: 'New Title',
        salario: 9100000,
      })
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('PUT /vacantes/:id mantiene el error de vacante inexistente', async () => {
    const response = await request(context.app.getHttpServer())
      .put('/vacantes/00000000-0000-0000-0000-000000000000')
      .send({ titulo: 'Ghost' })
      .expect(500);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });
});
