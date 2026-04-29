import request from 'supertest';
import {
  closeRegressionContext,
  createPostulante,
  createRegressionContext,
  createVacante,
  RegressionContext,
  resetRegressionDatabase,
  snapshotHttpResponse,
} from './regresion-test.helpers';

describe('Matches API Regression (e2e)', () => {
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

  it('POST /matches mantiene la estructura del match creado', async () => {
    const vacante = await createVacante(context, {
      titulo: 'Create Match',
    });
    const postulante = await createPostulante(context, {
      name: 'Match',
      lastname: 'Creator',
    });

    const response = await request(context.app.getHttpServer())
      .post('/matches')
      .send({
        vacante: { id_vacante: vacante.id_vacante },
        postulante: { id: postulante.id },
      })
      .expect(201);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /matches mantiene la lista con relaciones', async () => {
    const vacante = await createVacante(context, {
      titulo: 'List Match',
    });
    const postulante = await createPostulante(context, {
      name: 'List',
      lastname: 'Match',
    });

    await context.repositories.match.save({
      vacante,
      postulante,
    });

    const response = await request(context.app.getHttpServer())
      .get('/matches')
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /matches/:id mantiene el mensaje actual del endpoint stub', async () => {
    const response = await request(context.app.getHttpServer())
      .get('/matches/7')
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('PATCH /matches/:id mantiene el mensaje actual del endpoint stub', async () => {
    const response = await request(context.app.getHttpServer())
      .patch('/matches/8')
      .send({})
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('DELETE /matches/:id mantiene el mensaje actual del endpoint stub', async () => {
    const response = await request(context.app.getHttpServer())
      .delete('/matches/9')
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });
});

