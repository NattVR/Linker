import request from 'supertest';
import {
  closeRegressionContext,
  createEmpresa,
  createRegressionContext,
  createUser,
  RegressionContext,
  resetRegressionDatabase,
  snapshotHttpResponse,
} from './regresion-test.helpers';

describe('Empresa API Regression (e2e)', () => {
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

  it('GET /empresa mantiene la lista de empresas', async () => {
    await createEmpresa(context, {
      name_empresa: 'First Company',
      NIT: '900400400-1',
    });
    await createEmpresa(context, {
      name_empresa: 'Second Company',
      NIT: '900400400-2',
      user: await createUser(context, { email: 'empresa.second@test.com' }),
    });

    const response = await request(context.app.getHttpServer())
      .get('/empresa')
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('POST /empresa/registro mantiene la respuesta de creacion', async () => {
    const user = await createUser(context, {
      email: 'empresa.register@test.com',
    });

    const response = await request(context.app.getHttpServer())
      .post('/empresa/registro')
      .send({
        name_empresa: 'Snapshot Inc',
        descripcion: 'Empresa para regresion',
        ubicacion: 'Bogota',
        sector: 'Software',
        foto: 'https://example.com/snapshot.png',
        NIT: '900400400-3',
        id_perfil: user.id,
      })
      .expect(201);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /empresa/:id mantiene el perfil de empresa por usuario', async () => {
    const empresa = await createEmpresa(context, {
      name_empresa: 'By User Id',
      NIT: '900400400-4',
    });

    const response = await request(context.app.getHttpServer())
      .get(`/empresa/${empresa.user.id}`)
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /empresa/isEmpresa/:id mantiene true cuando hay empresa asociada', async () => {
    const empresa = await createEmpresa(context, {
      name_empresa: 'Boolean Company',
      NIT: '900400400-5',
    });

    const response = await request(context.app.getHttpServer())
      .get(`/empresa/isEmpresa/${empresa.user.id}`)
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /empresa/isEmpresa/:id mantiene false cuando no hay empresa asociada', async () => {
    const user = await createUser(context, {
      email: 'empresa.false@test.com',
    });

    const response = await request(context.app.getHttpServer())
      .get(`/empresa/isEmpresa/${user.id}`)
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('PATCH /empresa/:id mantiene la respuesta de actualizacion', async () => {
    const empresa = await createEmpresa(context, {
      name_empresa: 'Patch Company',
      NIT: '900400400-6',
    });

    const response = await request(context.app.getHttpServer())
      .patch(`/empresa/${empresa.user.id}`)
      .send({
        descripcion: 'Descripcion actualizada',
        ubicacion: 'Medellin',
      })
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('PATCH /empresa/:id mantiene el error de no encontrado', async () => {
    const response = await request(context.app.getHttpServer())
      .patch('/empresa/00000000-0000-0000-0000-000000000000')
      .send({ descripcion: 'Ghost company' })
      .expect(404);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });
});

