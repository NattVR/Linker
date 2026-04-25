import http from 'k6/http';
import { check } from 'k6';
import {
  BASE_URL,
  JSON_HEADERS,
  buildOptions,
  env,
  randomSuffix,
  think,
} from './_shared/config.k6.js';

const EXISTING_VACANTE_ID    = env('EXISTING_VACANTE_ID');
const EXISTING_EMPRESA_ID    = env('EXISTING_EMPRESA_ID');
const CREATE_EMPRESA_ID      = env('CREATE_EMPRESA_ID');
const POSTULANTE_ID_FOR_LIST = env('POSTULANTE_ID_FOR_LIST');

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
    empresa: CREATE_EMPRESA_ID,
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

function maybeGetVacantesEmpresa() {
  if (!EXISTING_EMPRESA_ID) return;

  const res = http.get(`${BASE_URL}/vacantes/empresaId/${EXISTING_EMPRESA_ID}`, {
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

function maybeGetVacantesParaPostulante() {
  if (!POSTULANTE_ID_FOR_LIST) return;

  const res = http.get(`${BASE_URL}/vacantes/vacantes/${POSTULANTE_ID_FOR_LIST}`, {
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

function maybeCreateVacante() {
  if (!CREATE_EMPRESA_ID) return;

  const payload = JSON.stringify(buildVacantePayload());
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

function maybeUpdateVacante() {
  if (!EXISTING_VACANTE_ID) return;

  const payload = JSON.stringify({
    titulo: `Vacante actualizada k6 iter ${__ITER}`,
    salario: 4000000 + __ITER,
  });

  const res = http.put(`${BASE_URL}/vacantes/${EXISTING_VACANTE_ID}`, payload, {
    headers: JSON_HEADERS,
    tags: { endpoint: 'update_vacante' },
  });

  check(res, {
    'PUT /vacantes/:id status 200': (r) => r.status === 200,
  });
}

export default function vacantes () {
  getAllVacantes();
  maybeGetVacantesEmpresa();
  maybeGetVacantesParaPostulante();
  maybeCreateVacante();
  maybeUpdateVacante();

  think();
}