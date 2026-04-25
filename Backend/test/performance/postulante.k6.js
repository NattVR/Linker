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

const EXISTING_POSTULANTE_ID = env('EXISTING_POSTULANTE_ID');
const CREATE_USER_ID         = env('CREATE_USER_ID');
const VACANTE_ID_FOR_LIST    = env('VACANTE_ID_FOR_LIST');

export const options = buildOptions({
  'http_req_duration{endpoint:get_all_postulantes}':   ['p(95)<800'],
  'http_req_duration{endpoint:get_postulante_by_id}':  ['p(95)<800'],
  'http_req_duration{endpoint:get_perfil_completo}':   ['p(95)<1000'],
  'http_req_duration{endpoint:get_postulantes_vacante}':['p(95)<1000'],
  'http_req_duration{endpoint:create_postulante}':     ['p(95)<1200'],
  'http_req_duration{endpoint:update_postulante}':     ['p(95)<1200'],
});

function buildPostulantePayload() {
  const suffix = randomSuffix();
  return {
    name: `Nombre${suffix}`,
    lastname: `Apellido${suffix}`,
    años_experiencia: 2,
    ubicacion: 'Medellín',
    id_perfil: CREATE_USER_ID,
  };
}

function getAllPostulantes() {
  const res = http.get(`${BASE_URL}/postulante`, {
    tags: { endpoint: 'get_all_postulantes' },
  });

  check(res, {
    'GET /postulante status 200': (r) => r.status === 200,
    'GET /postulante retorna array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); }
      catch { return false; }
    },
  });
}

function maybeGetById() {
  if (!EXISTING_POSTULANTE_ID) return;

  const res = http.get(`${BASE_URL}/postulante/${EXISTING_POSTULANTE_ID}`, {
    tags: { endpoint: 'get_postulante_by_id' },
  });

  check(res, {
    'GET /postulante/:id status 200': (r) => r.status === 200,
    'GET /postulante/:id tiene name': (r) => {
      try { return JSON.parse(r.body).name !== undefined; }
      catch { return false; }
    },
  });
}

function maybeGetPerfilCompleto() {
  if (!EXISTING_POSTULANTE_ID) return;

  const res = http.get(`${BASE_URL}/postulante/perfil-completo/${EXISTING_POSTULANTE_ID}`, {
    tags: { endpoint: 'get_perfil_completo' },
  });

  check(res, {
    'GET /postulante/perfil-completo/:id status 200': (r) => r.status === 200,
  });
}

function maybeGetPostulantesParaVacante() {
  if (!VACANTE_ID_FOR_LIST) return;

  const res = http.get(`${BASE_URL}/postulante/postulantes/${VACANTE_ID_FOR_LIST}`, {
    tags: { endpoint: 'get_postulantes_vacante' },
  });

  check(res, {
    'GET /postulante/postulantes/:id status 200': (r) => r.status === 200,
    'GET /postulante/postulantes/:id retorna array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); }
      catch { return false; }
    },
  });
}

function maybeCreatePostulante() {
  if (!CREATE_USER_ID) return;

  const payload = JSON.stringify(buildPostulantePayload());
  const res = http.post(`${BASE_URL}/postulante/registro`, payload, {
    headers: JSON_HEADERS,
    tags: { endpoint: 'create_postulante' },
  });

  check(res, {
    'POST /postulante/registro status 201': (r) => r.status === 201,
    'POST /postulante/registro tiene id': (r) => {
      try { return JSON.parse(r.body).postulante?.id !== undefined; }
      catch { return false; }
    },
  });
}

function maybeUpdatePostulante() {
  if (!EXISTING_POSTULANTE_ID) return;

  const payload = JSON.stringify({
    experiencia: __ITER % 10,
    cv: `https://cv.example.com/k6_${__ITER}.pdf`,
  });

  const res = http.patch(`${BASE_URL}/postulante/${EXISTING_POSTULANTE_ID}`, payload, {
    headers: JSON_HEADERS,
    tags: { endpoint: 'update_postulante' },
  });

  check(res, {
    'PATCH /postulante/:id status 200': (r) => r.status === 200,
  });
}

export default function postulante () {
  getAllPostulantes();
  maybeGetById();
  maybeGetPerfilCompleto();
  maybeGetPostulantesParaVacante();
  maybeCreatePostulante();
  maybeUpdatePostulante();

  think();
}