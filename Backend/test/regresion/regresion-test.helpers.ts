import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { Certificado } from '../../src/certificados/entities/certificado.entity';
import { DetallesCertificado } from '../../src/detalles_certificados/entities/detalles_certificado.entity';
import { Empresa } from '../../src/empresa/entities/empresa.entity';
import { Habilidades } from '../../src/habilidades/entities/habilidades.entity';
import { Idioma } from '../../src/idiomas/entities/idioma.entity';
import {
  Interaccion,
  TipoInteraccion,
} from '../../src/interacciones/entities/interacciones.entity';
import { Match } from '../../src/matches/entities/match.entity';
import { Postulante } from '../../src/postulante/entities/postulante.entity';
import { PostulanteHabilidades } from '../../src/postulante_habilidades/entities/postulante_habilidades.entity';
import { PostulanteIdioma } from '../../src/postulante_idiomas/entities/postulante_idioma.entity';
import { User } from '../../src/user/entities/user.entity';
import {
  TipoModalidad,
  TipoTrabajo,
  Vacante,
} from '../../src/vacantes/entities/vacante.entity';
import { VacanteHabilidade } from '../../src/vacante_habilidades/entities/vacante_habilidade.entity';
import { VacantesIdioma } from '../../src/vacantes_idiomas/entities/vacantes_idioma.entity';

type SupertestResponse = Awaited<ReturnType<ReturnType<typeof request>['get']>>;

jest.setTimeout(120000);

const UUID_REGEX =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const JWT_REGEX = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const BCRYPT_REGEX = /^\$2[aby]\$\d{2}\$.+/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

export interface RegressionContext {
  app: INestApplication;
  moduleRef: TestingModule;
  repositories: {
    user: Repository<User>;
    postulante: Repository<Postulante>;
    empresa: Repository<Empresa>;
    vacante: Repository<Vacante>;
    interaccion: Repository<Interaccion>;
    match: Repository<Match>;
    certificado: Repository<Certificado>;
    detalleCertificado: Repository<DetallesCertificado>;
    idioma: Repository<Idioma>;
    habilidad: Repository<Habilidades>;
    postulanteIdioma: Repository<PostulanteIdioma>;
    postulanteHabilidad: Repository<PostulanteHabilidades>;
    vacanteIdioma: Repository<VacantesIdioma>;
    vacanteHabilidad: Repository<VacanteHabilidade>;
  };
}

export async function createRegressionContext(): Promise<RegressionContext> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  return {
    app,
    moduleRef,
    repositories: {
      user: moduleRef.get(getRepositoryToken(User)),
      postulante: moduleRef.get(getRepositoryToken(Postulante)),
      empresa: moduleRef.get(getRepositoryToken(Empresa)),
      vacante: moduleRef.get(getRepositoryToken(Vacante)),
      interaccion: moduleRef.get(getRepositoryToken(Interaccion)),
      match: moduleRef.get(getRepositoryToken(Match)),
      certificado: moduleRef.get(getRepositoryToken(Certificado)),
      detalleCertificado: moduleRef.get(getRepositoryToken(DetallesCertificado)),
      idioma: moduleRef.get(getRepositoryToken(Idioma)),
      habilidad: moduleRef.get(getRepositoryToken(Habilidades)),
      postulanteIdioma: moduleRef.get(getRepositoryToken(PostulanteIdioma)),
      postulanteHabilidad: moduleRef.get(getRepositoryToken(PostulanteHabilidades)),
      vacanteIdioma: moduleRef.get(getRepositoryToken(VacantesIdioma)),
      vacanteHabilidad: moduleRef.get(getRepositoryToken(VacanteHabilidade)),
    },
  };
}

export async function closeRegressionContext(context: RegressionContext) {
  if (!context) {
    return;
  }
  await context.app.close();
}

export async function resetRegressionDatabase(context: RegressionContext) {
  if (!context) {
    return;
  }

  await context.repositories.user.query(`
    TRUNCATE TABLE
      matches,
      interacciones,
      vacante_habilidades,
      vacante_idiomas,
      postulante_habilidades,
      postulante_idiomas,
      detalles_estudios,
      detalles_certificados,
      vacantes,
      certificados,
      postulantes,
      empresas,
      habilidades,
      idiomas,
      users
    RESTART IDENTITY CASCADE
  `);
}

export function snapshotHttpResponse(response: SupertestResponse) {
  const bodyIsPresent =
    response.body !== undefined &&
    response.body !== null &&
    !(typeof response.body === 'object' && Object.keys(response.body).length === 0);

  return sanitizeForSnapshot({
    status: response.status,
    response: bodyIsPresent ? response.body : response.text,
  });
}

export function sanitizeForSnapshot<T>(value: T): T {
  return sanitizeValue(value) as T;
}

function sanitizeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return '[date-object]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, currentValue]) => [
        key,
        sanitizeValue(currentValue),
      ]),
    );
  }

  if (typeof value === 'string') {
    if (JWT_REGEX.test(value)) {
      return '[jwt-token]';
    }
    if (BCRYPT_REGEX.test(value)) {
      return '[bcrypt-hash]';
    }
    if (ISO_DATE_REGEX.test(value)) {
      return '[date]';
    }
    if (ISO_DATETIME_REGEX.test(value)) {
      return '[datetime]';
    }
    if (UUID_REGEX.test(value)) {
      return value.replace(UUID_REGEX, '[uuid]');
    }
  }

  return value;
}


export async function createUser(
  context: RegressionContext,
  overrides: Partial<User> = {},
) {
  return context.repositories.user.save({
    email: overrides.email ?? 'user@test.com',
    password: overrides.password ?? 'hashed_password',
    estado_verificacion: overrides.estado_verificacion ?? 'verificado',
  });
}

export async function createEmpresa(
  context: RegressionContext,
  overrides: Partial<Empresa> & { user?: User } = {},
) {
  const user =
    overrides.user ??
    (await createUser(context, {
      email: overrides.user?.email ?? 'empresa@test.com',
    }));

  return context.repositories.empresa.save({
    name_empresa: overrides.name_empresa ?? 'Linker Labs',
    descripcion: overrides.descripcion ?? 'Empresa de pruebas',
    ubicacion: overrides.ubicacion ?? 'Bogota',
    sector: overrides.sector ?? 'Tech',
    foto: overrides.foto ?? 'https://example.com/logo.png',
    NIT: overrides.NIT ?? '900100100-1',
    user,
  });
}

export async function createPostulante(
  context: RegressionContext,
  overrides: Partial<Postulante> & { user?: User } = {},
) {
  const user =
    overrides.user ??
    (await createUser(context, {
      email: overrides.user?.email ?? 'postulante@test.com',
    }));

  return context.repositories.postulante.save({
    name: overrides.name ?? 'Jane',
    lastname: overrides.lastname ?? 'Doe',
    ['aÃ±os_experiencia']: overrides['aÃ±os_experiencia'] ?? 4,
    curriculum: overrides.curriculum ?? 'https://example.com/cv.pdf',
    foto: overrides.foto ?? 'https://example.com/photo.png',
    ubicacion: overrides.ubicacion ?? 'Bogota',
    user,
  });
}

export async function createIdioma(
  context: RegressionContext,
  nombre = 'English',
) {
  return context.repositories.idioma.save({ nombre });
}

export async function createHabilidad(
  context: RegressionContext,
  nombre_habilidad = 'Node.js',
) {
  return context.repositories.habilidad.save({ nombre_habilidad });
}

export async function createVacante(
  context: RegressionContext,
  overrides: Partial<Vacante> & { empresa?: Empresa } = {},
) {
  const empresa = overrides.empresa ?? (await createEmpresa(context));

  return context.repositories.vacante.save({
    titulo: overrides.titulo ?? 'Backend Developer',
    tipo_trabajo: overrides.tipo_trabajo ?? TipoTrabajo.FULL_TIME,
    modalidad: overrides.modalidad ?? TipoModalidad.REMOTO,
    salario: overrides.salario ?? 4500000,
    ubicacion: overrides.ubicacion ?? 'Bogota',
    empresa,
  });
}

export async function createCertificado(
  context: RegressionContext,
  overrides: Partial<Certificado> = {},
) {
  return context.repositories.certificado.save({
    entidad_emisora: overrides.entidad_emisora ?? 'Coursera',
    nombre_certificado: overrides.nombre_certificado ?? 'Backend Testing',
  });
}

export async function createDetalleCertificado(
  context: RegressionContext,
  overrides: Partial<DetallesCertificado> & {
    empresa?: Empresa;
    certificado?: Certificado;
  } = {},
) {
  const empresa = overrides.empresa ?? (await createEmpresa(context));
  const certificado =
    overrides.certificado ?? (await createCertificado(context));

  return context.repositories.detalleCertificado.save({
    empresa,
    certificado,
    fecha_emision: overrides.fecha_emision ?? new Date('2026-01-10'),
    fecha_caducidad: overrides.fecha_caducidad ?? new Date('2027-01-10'),
  });
}

export async function linkPostulanteIdioma(
  context: RegressionContext,
  postulante: Postulante,
  idioma: Idioma,
  certificado = 'cert-idioma.pdf',
) {
  return context.repositories.postulanteIdioma.save({
    postulante,
    idioma,
    certificado,
  });
}

export async function linkPostulanteHabilidad(
  context: RegressionContext,
  postulante: Postulante,
  habilidad: Habilidades,
  certificado = 'cert-habilidad.pdf',
) {
  return context.repositories.postulanteHabilidad.save({
    postulante,
    habilidades: habilidad,
    certificado,
  });
}

export async function linkVacanteIdioma(
  context: RegressionContext,
  vacante: Vacante,
  idioma: Idioma,
) {
  return context.repositories.vacanteIdioma.save({
    vacante,
    idioma,
  });
}

export async function linkVacanteHabilidad(
  context: RegressionContext,
  vacante: Vacante,
  habilidad: Habilidades,
) {
  return context.repositories.vacanteHabilidad.save({
    vacante,
    habilidades: habilidad,
  });
}

export async function createInteraccion(
  context: RegressionContext,
  overrides: Partial<Interaccion> & {
    vacante?: Vacante;
    postulante?: Postulante;
    accionEmpresa?: TipoInteraccion;
    accionPostulante?: TipoInteraccion;
  } = {},
) {
  const vacante = overrides.vacante ?? (await createVacante(context));
  const postulante = overrides.postulante ?? (await createPostulante(context));

  return context.repositories.interaccion.save({
    vacante,
    postulante,
    accionEmpresa: overrides.accionEmpresa ?? TipoInteraccion.NO_INTERACCION,
    accionPostulante:
      overrides.accionPostulante ?? TipoInteraccion.NO_INTERACCION,
  });
}
