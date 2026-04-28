import http from 'k6/http';
import { check } from 'k6';
import {
  BASE_URL,
  JSON_HEADERS,
  buildOptions,
  randomSuffix,
  think,
} from './_shared/config.k6.js';
import {
  createEmpresa,
  createPostulante,
  createUser,
  createVacante,
} from './_shared/fixtures.k6.js';

export function setup() {
  const existingEmpresaUser = createUser(BASE_URL, 'vacantes-existing-empresa-user');
  const existingEmpresa = createEmpresa(BASE_URL, existingEmpresaUser.id, 'vacantes-existing-empresa');
  const existingVacante = createVacante(BASE_URL, existingEmpresa.id, 'vacantes-existing-vacante');

  const createEmpresaUser = createUser(BASE_URL, 'vacantes-create-empresa-user');
  const createEmpresaTarget = createEmpresa(BASE_URL, createEmpresaUser.id, 'vacantes-create-empresa');

  const postulanteUser = createUser(BASE_URL, 'vacantes-postulante-user');
  const postulante = createPostulante(BASE_URL, postulanteUser.id, 'vacantes-postulante');

  return {
    existingVacanteId: existingVacante.id,
    existingEmpresaId: existingEmpresa.id,
    createEmpresaId: createEmpresaTarget.id,
    postulanteIdForList: postulante.id,
  };
}

export const options = buildOptions({
  'http_req_duration{endpoint:get_all_vacantes}':        ['p(95)<800'],
  'http_req_duration{endpoint:get_vacantes_empresa}':    ['p(95)<800'],
  'http_req_duration{endpoint:get_vacantes_postulante}': ['p(95)<1000'],
  'http_req_duration{endpoint:create_vacante}':          ['p(95)<1200'],
  'http_req_duration{endpoint:update_vacante}':          ['p(95)<1200'],
});

function buildVacantePayload() {
  const suffix = randomSuffix();
  return {
    titulo: `Vacante k6 ${suffix}`,
    tipo_trabajo: 'Full-time',
    tipo_modalidad: 'Remoto',
    salario: 3500000,
    ubicacion: 'Medellín',
  };
}

function getAllVacantes() {
  const res = http.get(`${BASE_URL}/vacantes`, {
    tags: { endpoint: 'get_all_vacantes' },
  });

  check(res, {
    'GET /vacantes status 200': (r) => r.status === 200,
    'GET /vacantes retorna array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); }
      catch { return false; }
    },
  });
}

function maybeGetVacantesEmpresa(existingEmpresaId) {
  if (!existingEmpresaId) return;

  const res = http.get(`${BASE_URL}/vacantes/empresaId/${existingEmpresaId}`, {
    tags: { endpoint: 'get_vacantes_empresa' },
  });

  check(res, {
    'GET /vacantes/empresaId/:id status 200': (r) => r.status === 200,
    'GET /vacantes/empresaId/:id retorna array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); }
      catch { return false; }
    },
  });
}

function maybeGetVacantesParaPostulante(postulanteIdForList) {
  if (!postulanteIdForList) return;

  const res = http.get(`${BASE_URL}/vacantes/vacantes/${postulanteIdForList}`, {
    tags: { endpoint: 'get_vacantes_postulante' },
  });

  check(res, {
    'GET /vacantes/vacantes/:id status 200': (r) => r.status === 200,
    'GET /vacantes/vacantes/:id retorna array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); }
      catch { return false; }
    },
    'GET /vacantes/vacantes/:id tiene habilidades e idiomas': (r) => {
      try {
        const body = JSON.parse(r.body);
        if (!Array.isArray(body) || body.length === 0) return true; // lista vacía es válida
        return Array.isArray(body[0].habilidades) && Array.isArray(body[0].idiomas);
      } catch { return false; }
    },
  });
}

function maybeCreateVacante(createEmpresaId) {
  if (!createEmpresaId) return;

  const payload = JSON.stringify({
    ...buildVacantePayload(),
    empresa: createEmpresaId,
  });
  const res = http.post(`${BASE_URL}/vacantes`, payload, {
    headers: JSON_HEADERS,
    tags: { endpoint: 'create_vacante' },
  });

  check(res, {
    'POST /vacantes status 201': (r) => r.status === 201,
    'POST /vacantes tiene id_vacante': (r) => {
      try { return JSON.parse(r.body).id_vacante !== undefined; }
      catch { return false; }
    },
  });
}

function maybeUpdateVacante(existingVacanteId) {
  if (!existingVacanteId) return;

  const payload = JSON.stringify({
    titulo: `Vacante actualizada k6 iter ${__ITER}`,
    salario: 4000000 + __ITER,
  });

  const res = http.put(`${BASE_URL}/vacantes/${existingVacanteId}`, payload, {
    headers: JSON_HEADERS,
    tags: { endpoint: 'update_vacante' },
  });

  check(res, {
    'PUT /vacantes/:id status 200': (r) => r.status === 200,
  });
}

export default function vacantes (data) {
  const existingVacanteId = data?.existingVacanteId;
  const existingEmpresaId = data?.existingEmpresaId;
  const createEmpresaId = data?.createEmpresaId;
  const postulanteIdForList = data?.postulanteIdForList;

  getAllVacantes();
  maybeGetVacantesEmpresa(existingEmpresaId);
  maybeGetVacantesParaPostulante(postulanteIdForList);
  maybeCreateVacante(createEmpresaId);
  maybeUpdateVacante(existingVacanteId);

  think();
}
