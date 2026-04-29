import request from 'supertest';
import { TipoInteraccion } from '../../src/interacciones/entities/interacciones.entity';
import {
  closeRegressionContext,
  createEmpresa,
  createInteraccion,
  createPostulante,
  createRegressionContext,
  createVacante,
  RegressionContext,
  resetRegressionDatabase,
  snapshotHttpResponse,
} from './regresion-test.helpers';

describe('Interacciones API Regression (e2e)', () => {
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

  it('POST /interacciones mantiene la estructura al crear una interaccion nueva', async () => {
    const empresa = await createEmpresa(context, {
      NIT: '900300300-1',
    });
    const vacante = await createVacante(context, {
      empresa,
      titulo: 'Interaction Vacante',
    });
    const postulante = await createPostulante(context, {
      name: 'Nora',
      lastname: 'Fields',
    });

    const response = await request(context.app.getHttpServer())
      .post('/interacciones')
      .send({
        empresa: empresa.id,
        vacante: vacante.id_vacante,
        postulante: postulante.id,
        accion_empresa: TipoInteraccion.LIKE,
        accion_postulante: TipoInteraccion.NO_INTERACCION,
      })
      .expect(201);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('POST /interacciones mantiene la actualizacion y dispara match con doble like', async () => {
    const empresa = await createEmpresa(context, {
      NIT: '900300300-2',
    });
    const vacante = await createVacante(context, {
      empresa,
      titulo: 'Match Vacante',
    });
    const postulante = await createPostulante(context, {
      name: 'Paula',
      lastname: 'King',
    });

    await createInteraccion(context, {
      vacante,
      postulante,
      accionEmpresa: TipoInteraccion.NO_INTERACCION,
      accionPostulante: TipoInteraccion.LIKE,
    });

    const response = await request(context.app.getHttpServer())
      .post('/interacciones')
      .send({
        empresa: empresa.id,
        vacante: vacante.id_vacante,
        postulante: postulante.id,
        accion_empresa: TipoInteraccion.LIKE,
        accion_postulante: TipoInteraccion.LIKE,
      })
      .expect(201);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
    expect(await context.repositories.match.count()).toBe(1);
  });

  it('GET /interacciones/filter/vacantes/:id mantiene los ids excluidos del postulante', async () => {
    const postulante = await createPostulante(context, {
      name: 'Filter',
      lastname: 'Vacantes',
    });
    const vacante = await createVacante(context, {
      titulo: 'Blocked Vacante',
    });

    await createInteraccion(context, {
      vacante,
      postulante,
      accionEmpresa: TipoInteraccion.DISLIKE,
      accionPostulante: TipoInteraccion.LIKE,
    });

    const response = await request(context.app.getHttpServer())
      .get(`/interacciones/filter/vacantes/${postulante.id}`)
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /interacciones/filter/postulantes/:id mantiene los ids excluidos de la vacante', async () => {
    const vacante = await createVacante(context, {
      titulo: 'Filter Postulantes',
    });
    const postulante = await createPostulante(context, {
      name: 'Blocked',
      lastname: 'Person',
    });

    await createInteraccion(context, {
      vacante,
      postulante,
      accionEmpresa: TipoInteraccion.LIKE,
      accionPostulante: TipoInteraccion.DISLIKE,
    });

    const response = await request(context.app.getHttpServer())
      .get(`/interacciones/filter/postulantes/${vacante.id_vacante}`)
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /interacciones/check-match/:postulanteId/:vacanteId mantiene la consulta puntual', async () => {
    const vacante = await createVacante(context, {
      titulo: 'Check Match',
    });
    const postulante = await createPostulante(context, {
      name: 'Check',
      lastname: 'Target',
    });

    await createInteraccion(context, {
      vacante,
      postulante,
      accionEmpresa: TipoInteraccion.LIKE,
      accionPostulante: TipoInteraccion.LIKE,
    });

    const response = await request(context.app.getHttpServer())
      .get(
        `/interacciones/check-match/${postulante.id}/${vacante.id_vacante}`,
      )
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });
});

