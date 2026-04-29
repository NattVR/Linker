import request from 'supertest';
import { TipoInteraccion } from '../../src/interacciones/entities/interacciones.entity';
import {
  closeRegressionContext,
  createHabilidad,
  createIdioma,
  createPostulante,
  createRegressionContext,
  createUser,
  createVacante,
  linkPostulanteHabilidad,
  linkPostulanteIdioma,
  createInteraccion,
  RegressionContext,
  resetRegressionDatabase,
  snapshotHttpResponse,
} from './regresion-test.helpers';

describe('Postulante API Regression (e2e)', () => {
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

  it('POST /postulante/registro mantiene la respuesta de creacion', async () => {
    const user = await createUser(context, {
      email: 'new.postulante@test.com',
    });

    const response = await request(context.app.getHttpServer())
      .post('/postulante/registro')
      .send({
        name: 'Maria',
        lastname: 'Stone',
        ['aÃ±os_experiencia']: 6,
        ubicacion: 'Cali',
        id_perfil: user.id,
      })
      .expect(201);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /postulante mantiene la lista completa de postulantes', async () => {
    await createPostulante(context, { name: 'Ana', lastname: 'One' });
    await createPostulante(context, {
      name: 'Luis',
      lastname: 'Two',
      user: await createUser(context, { email: 'postulante.two@test.com' }),
    });

    const response = await request(context.app.getHttpServer())
      .get('/postulante')
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /postulante/:id mantiene el perfil resumido', async () => {
    const postulante = await createPostulante(context, {
      name: 'Robert',
      lastname: 'Miles',
    });

    const response = await request(context.app.getHttpServer())
      .get(`/postulante/${postulante.id}`)
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /postulante/perfil-completo/:id mantiene relaciones de idiomas y habilidades', async () => {
    const postulante = await createPostulante(context, {
      name: 'Laura',
      lastname: 'Ray',
    });
    const idioma = await createIdioma(context, 'Spanish');
    const habilidad = await createHabilidad(context, 'NestJS');

    await linkPostulanteIdioma(context, postulante, idioma, 'spanish.pdf');
    await linkPostulanteHabilidad(context, postulante, habilidad, 'nestjs.pdf');

    const response = await request(context.app.getHttpServer())
      .get(`/postulante/perfil-completo/${postulante.id}`)
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('GET /postulante/postulantes/:id mantiene el filtrado por interacciones', async () => {
    const visible = await createPostulante(context, {
      name: 'Visible',
      lastname: 'Candidate',
    });
    const hidden = await createPostulante(context, {
      name: 'Hidden',
      lastname: 'Candidate',
      user: await createUser(context, { email: 'hidden.postulante@test.com' }),
    });
    const vacante = await createVacante(context, {
      titulo: 'QA Engineer',
    });

    await createInteraccion(context, {
      vacante,
      postulante: hidden,
      accionEmpresa: TipoInteraccion.DISLIKE,
      accionPostulante: TipoInteraccion.NO_INTERACCION,
    });

    const response = await request(context.app.getHttpServer())
      .get(`/postulante/postulantes/${vacante.id_vacante}`)
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe(visible.name);
  });

  it('PATCH /postulante/:id mantiene la respuesta de actualizacion', async () => {
    const postulante = await createPostulante(context, {
      name: 'Patch',
      lastname: 'Target',
    });

    const response = await request(context.app.getHttpServer())
      .patch(`/postulante/${postulante.id}`)
      .send({
        experiencia: 9,
        cv: 'https://example.com/cv-updated.pdf',
      })
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });

  it('DELETE /postulante/limpiar/:id mantiene el mensaje de limpieza', async () => {
    const postulante = await createPostulante(context, {
      name: 'Cleaner',
      lastname: 'Profile',
    });
    const habilidad = await createHabilidad(context, 'SQL');
    await linkPostulanteHabilidad(context, postulante, habilidad, 'sql.pdf');

    const response = await request(context.app.getHttpServer())
      .delete(`/postulante/limpiar/${postulante.id}`)
      .expect(200);

    expect(snapshotHttpResponse(response)).toMatchSnapshot();
  });
});
