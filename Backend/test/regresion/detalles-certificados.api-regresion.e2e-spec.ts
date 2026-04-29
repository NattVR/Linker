import request from 'supertest';
import {
  closeRegressionContext,
  createCertificado,
  createDetalleCertificado,
  createEmpresa,
  createRegressionContext,
  RegressionContext,
  resetRegressionDatabase,
  snapshotHttpResponse,
} from './regresion-test.helpers';

describe('Detalles Certificados API Regression (e2e)', () => {
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

  it('GET /detalles-certificados mantiene la lista general', async () => {
    await createDetalleCertificado(context);

    const response = await request(context.app.getHttpServer())
      .get('/detalles-certificados')
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /detalles-certificados/empresa/:id mantiene el filtrado por empresa', async () => {
    const empresa = await createEmpresa(context, {
      NIT: '900500500-1',
    });
    await createDetalleCertificado(context, { empresa });

    const response = await request(context.app.getHttpServer())
      .get(`/detalles-certificados/empresa/${empresa.id}`)
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('POST /detalles-certificados mantiene la respuesta de creacion', async () => {
    const empresa = await createEmpresa(context, {
      NIT: '900500500-2',
    });
    const certificado = await createCertificado(context, {
      nombre_certificado: 'Post Detail',
    });

    const response = await request(context.app.getHttpServer())
      .post('/detalles-certificados')
      .send({
        empresa: { id: empresa.id },
        certificado: { id_certificado: certificado.id_certificado },
        fecha_emision: '2026-04-01',
        fecha_caducidad: '2027-04-01',
      })
      .expect(201);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('PATCH /detalles-certificados/:id mantiene la respuesta de actualizacion', async () => {
    const detalle = await createDetalleCertificado(context, {
      fecha_emision: new Date('2026-03-01'),
      fecha_caducidad: new Date('2027-03-01'),
    });

    const response = await request(context.app.getHttpServer())
      .patch(`/detalles-certificados/${detalle.id_detalles_certificados}`)
      .send({
        fecha_caducidad: '2028-03-01',
      })
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('PATCH /detalles-certificados/:id mantiene el error cuando no existe', async () => {
    const response = await request(context.app.getHttpServer())
      .patch('/detalles-certificados/00000000-0000-0000-0000-000000000000')
      .send({ fecha_caducidad: '2029-01-01' })
      .expect(404);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('DELETE /detalles-certificados/:id mantiene el mensaje de eliminacion', async () => {
    const detalle = await createDetalleCertificado(context);

    const response = await request(context.app.getHttpServer())
      .delete(`/detalles-certificados/${detalle.id_detalles_certificados}`)
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('DELETE /detalles-certificados/:id mantiene el error cuando no existe', async () => {
    const response = await request(context.app.getHttpServer())
      .delete('/detalles-certificados/00000000-0000-0000-0000-000000000000')
      .expect(404);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });
});
