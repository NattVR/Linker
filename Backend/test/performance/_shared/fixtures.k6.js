import http from 'k6/http';
import { JSON_HEADERS } from './config.k6.js';

function parseJsonBody(response) {
  try {
    return response.body ? JSON.parse(response.body) : {};
  } catch {
    return {};
  }
}

function assertStatus(response, expectedStatuses, context) {
  if (expectedStatuses.includes(response.status)) {
    return;
  }

  const bodyPreview = String(response.body || '').slice(0, 300);
  throw new Error(
    `[fixtures] ${context} fallo. Status=${response.status}. Body=${bodyPreview}`,
  );
}

function requireField(value, fieldName, context) {
  if (value) return value;
  throw new Error(`[fixtures] ${context} no devolvio ${fieldName}`);
}

function uniqueSuffix(label = 'fixture') {
  const rnd = Math.floor(Math.random() * 1e9);
  return `${label}-${Date.now()}-${rnd}`;
}

export function createUser(baseUrl, label = 'user') {
  const suffix = uniqueSuffix(label);
  const email = `${suffix}@test.com`;
  const password = 'password123';

  const response = http.post(
    `${baseUrl}/user/registro`,
    JSON.stringify({ email, password }),
    { headers: JSON_HEADERS },
  );

  assertStatus(response, [200, 201], 'POST /user/registro');
  const body = parseJsonBody(response);
  const id = requireField(body?.user?.id, 'user.id', 'POST /user/registro');

  return { id, email, password };
}

export function createEmpresa(baseUrl, userId, label = 'empresa') {
  const suffix = uniqueSuffix(label);
  const payload = {
    name_empresa: `Empresa ${suffix}`,
    descripcion: 'Empresa creada por fixture k6',
    ubicacion: 'Bogota',
    sector: 'Tecnologia',
    foto: 'https://example.com/logo.png',
    NIT: `NIT-${suffix}`,
    id_perfil: userId,
  };

  const response = http.post(
    `${baseUrl}/empresa/registro`,
    JSON.stringify(payload),
    { headers: JSON_HEADERS },
  );

  assertStatus(response, [200, 201], 'POST /empresa/registro');
  const body = parseJsonBody(response);
  const id = requireField(
    body?.empresa?.id,
    'empresa.id',
    'POST /empresa/registro',
  );

  return { id, userId };
}

export function createPostulante(baseUrl, userId, label = 'postulante') {
  const suffix = uniqueSuffix(label);
  const payload = {
    name: `Nombre-${suffix}`,
    lastname: `Apellido-${suffix}`,
    ubicacion: 'Medellin',
    id_perfil: userId,
  };

  const response = http.post(
    `${baseUrl}/postulante/registro`,
    JSON.stringify(payload),
    { headers: JSON_HEADERS },
  );

  assertStatus(response, [200, 201], 'POST /postulante/registro');
  const body = parseJsonBody(response);
  const id = requireField(
    body?.postulante?.id,
    'postulante.id',
    'POST /postulante/registro',
  );

  return { id, userId };
}

export function createVacante(baseUrl, empresaId, label = 'vacante') {
  const suffix = uniqueSuffix(label);
  const payload = {
    titulo: `Vacante ${suffix}`,
    tipo_trabajo: 'Full-time',
    tipo_modalidad: 'Remoto',
    salario: 3500000,
    ubicacion: 'Medellin',
    empresa: empresaId,
    vacanteHabilidades: [],
    vacantesIdiomas: [],
  };

  const response = http.post(`${baseUrl}/vacantes`, JSON.stringify(payload), {
    headers: JSON_HEADERS,
  });

  assertStatus(response, [200, 201], 'POST /vacantes');
  const body = parseJsonBody(response);
  const id = requireField(body?.id_vacante, 'id_vacante', 'POST /vacantes');

  return { id, empresaId };
}

export function createCertificado(baseUrl, label = 'certificado') {
  const suffix = uniqueSuffix(label);
  const payload = {
    entidad_emisora: `Emisor-${suffix}`,
    nombre_certificado: `Certificado-${suffix}`,
  };

  const response = http.post(
    `${baseUrl}/certificados`,
    JSON.stringify(payload),
    { headers: JSON_HEADERS },
  );
  
  assertStatus(response, [200, 201], 'POST /certificados');
  const body = parseJsonBody(response);

  const id = requireField(
    body?.id_certificado,
    'id_certificado',
    'POST /certificados',
  );

  return { id };
}

export function createDetalleCertificado(baseUrl, empresaId, certificadoId) {
  const payload = {
    empresa: { id: empresaId },
    certificado: { id_certificado: certificadoId },
    fecha_emision: '2026-01-10',
    fecha_caducidad: '2027-01-10',
  };

  const response = http.post(
    `${baseUrl}/detalles-certificados`,
    JSON.stringify(payload),
    { headers: JSON_HEADERS },
  );

  assertStatus(response, [200, 201], 'POST /detalles-certificados');
  const body = parseJsonBody(response);
  const id = requireField(
    body?.id_detalles_certificados,
    'id_detalles_certificados',
    'POST /detalles-certificados',
  );

  return { id, empresaId, certificadoId };
}

export function createMatch(baseUrl, vacanteId, postulanteId) {
  const payload = {
    vacante: { id_vacante: vacanteId },
    postulante: { id: postulanteId },
  };

  const response = http.post(`${baseUrl}/matches`, JSON.stringify(payload), {
    headers: JSON_HEADERS,
  });

  assertStatus(response, [200, 201], 'POST /matches');
  const body = parseJsonBody(response);
  const id = requireField(body?.id_match, 'id_match', 'POST /matches');

  return { id, vacanteId, postulanteId };
}
