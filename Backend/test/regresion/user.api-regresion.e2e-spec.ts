import request from 'supertest';
import {
  closeRegressionContext,
  createEmpresa,
  createPostulante,
  createRegressionContext,
  RegressionContext,
  resetRegressionDatabase,
  snapshotHttpResponse,
} from './regresion-test.helpers';

describe('User API Regression (e2e)', () => {
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

  it('POST /user/registro mantiene la respuesta del alta', async () => {
    const response = await request(context.app.getHttpServer())
      .post('/user/registro')
      .send({
        email: 'register.user@test.com',
        password: 'Password123!',
        estado_verificacion: 'pendiente',
      })
      .expect(201);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('POST /user/login mantiene la forma del token y del payload', async () => {
    await request(context.app.getHttpServer()).post('/user/registro').send({
      email: 'login.user@test.com',
      password: 'Password123!',
    });

    const response = await request(context.app.getHttpServer())
      .post('/user/login')
      .send({
        email: 'login.user@test.com',
        password: 'Password123!',
      })
      .expect(201);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('POST /user/login mantiene el error cuando la clave es invalida', async () => {
    await request(context.app.getHttpServer()).post('/user/registro').send({
      email: 'invalid.pass@test.com',
      password: 'Password123!',
    });

    const response = await request(context.app.getHttpServer())
      .post('/user/login')
      .send({
        email: 'invalid.pass@test.com',
        password: 'wrong-password',
      })
      .expect(400);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /user/perfil/:id mantiene vacio cuando no existe perfil asociado', async () => {
    const user = await context.repositories.user.save({
      email: 'perfil.vacio@test.com',
      password: 'hashed_password',
    });

    const response = await request(context.app.getHttpServer())
      .get(`/user/perfil/${user.id}`)
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /user/perfil/:id mantiene la forma del perfil postulante', async () => {
    const postulante = await createPostulante(context, {
      name: 'Alice',
      lastname: 'Walker',
    });

    const response = await request(context.app.getHttpServer())
      .get(`/user/perfil/${postulante.user.id}`)
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /user/perfil/:id mantiene la forma del perfil empresa', async () => {
    const empresa = await createEmpresa(context, {
      name_empresa: 'Snapshot Corp',
      NIT: '900777777-7',
    });

    const response = await request(context.app.getHttpServer())
      .get(`/user/perfil/${empresa.user.id}`)
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });
});

