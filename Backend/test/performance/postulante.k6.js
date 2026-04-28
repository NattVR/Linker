import http from 'k6/http';
import { check } from 'k6';
import {
  BASE_URL,
  JSON_HEADERS,
  buildOptions,
  //randomSuffix,
  think,
} from './_shared/config.k6.js';
import {
  createEmpresa,
  createPostulante,
  createUser,
  createVacante,
} from './_shared/fixtures.k6.js';

export function setup() {
  const existingPostulanteUser = createUser(BASE_URL, 'postulante-existing-user');
  const existingPostulante = createPostulante(
    BASE_URL,
    existingPostulanteUser.id,
    'postulante-existing',
  );

  //const createPostulanteUser = createUser(BASE_URL, 'postulante-create-user');

  const empresaOwner = createUser(BASE_URL, 'postulante-vacante-owner-user');
  const empresa = createEmpresa(BASE_URL, empresaOwner.id, 'postulante-vacante-owner');
  const vacante = createVacante(BASE_URL, empresa.id, 'postulante-vacante');

  return {
    existingPostulanteId: existingPostulante.id,
    //createUserId: createPostulanteUser.id,
    vacanteIdForList: vacante.id,
  };
}

export const options = buildOptions({
  'http_req_duration{endpoint:get_all_postulantes}':   ['p(95)<800'],
  'http_req_duration{endpoint:get_postulante_by_id}':  ['p(95)<800'],
  'http_req_duration{endpoint:get_perfil_completo}':   ['p(95)<1000'],
  'http_req_duration{endpoint:get_postulantes_vacante}':['p(95)<1000'],
  'http_req_duration{endpoint:update_postulante}':     ['p(95)<1200'],
});

/**function buildPostulantePayload() {
  const suffix = randomSuffix();
  return {
    name: `Nombre${suffix}`,
    lastname: `Apellido${suffix}`,
    años_experiencia: 2,
    ubicacion: 'Medellín',
  };
}**/

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

function maybeGetById(existingPostulanteId) {
  if (!existingPostulanteId) return;

  const res = http.get(`${BASE_URL}/postulante/${existingPostulanteId}`, {
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

function maybeGetPerfilCompleto(existingPostulanteId) {
  if (!existingPostulanteId) return;

  const res = http.get(`${BASE_URL}/postulante/perfil-completo/${existingPostulanteId}`, {
    tags: { endpoint: 'get_perfil_completo' },
  });

  check(res, {
    'GET /postulante/perfil-completo/:id status 200': (r) => r.status === 200,
  });
}

function maybeGetPostulantesParaVacante(vacanteIdForList) {
  if (!vacanteIdForList) return;

  const res = http.get(`${BASE_URL}/postulante/postulantes/${vacanteIdForList}`, {
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


function maybeUpdatePostulante(existingPostulanteId) {
  if (!existingPostulanteId) return;

  const payload = JSON.stringify({
    experiencia: __ITER % 10,
    cv: `https://cv.example.com/k6_${__ITER}.pdf`,
  });

  const res = http.patch(`${BASE_URL}/postulante/${existingPostulanteId}`, payload, {
    headers: JSON_HEADERS,
    tags: { endpoint: 'update_postulante' },
  });

  check(res, {
    'PATCH /postulante/:id status 200': (r) => r.status === 200,
  });
}

export default function postulante (data) {
  const existingPostulanteId = data?.existingPostulanteId;
  const createUserId = data?.createUserId;
  const vacanteIdForList = data?.vacanteIdForList;

  getAllPostulantes();
  maybeGetById(existingPostulanteId);
  maybeGetPerfilCompleto(existingPostulanteId);
  maybeGetPostulantesParaVacante(vacanteIdForList);
  //maybeCreatePostulante(createUserId);
  maybeUpdatePostulante(existingPostulanteId);

  think();
}
