import request from 'supertest';
import {
  closeRegressionContext,
  createCertificado,
  createRegressionContext,
  RegressionContext,
  resetRegressionDatabase,
  snapshotHttpResponse,
} from './regresion-test.helpers';

describe('Certificados API Regression (e2e)', () => {
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

  it('GET /certificados mantiene lista vacia cuando no hay registros', async () => {
    const response = await request(context.app.getHttpServer())
      .get('/certificados')
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('POST /certificados mantiene la respuesta de creacion', async () => {
    const response = await request(context.app.getHttpServer())
      .post('/certificados')
      .send({
        entidad_emisora: 'Platzi',
        nombre_certificado: 'Node Advanced',
      })
      .expect(201);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /certificados mantiene la lista de certificados', async () => {
    await createCertificado(context, {
      entidad_emisora: 'Coursera',
      nombre_certificado: 'Backend Testing',
    });
    await createCertificado(context, {
      entidad_emisora: 'Udemy',
      nombre_certificado: 'CI Pipelines',
    });

    const response = await request(context.app.getHttpServer())
      .get('/certificados')
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });
});

