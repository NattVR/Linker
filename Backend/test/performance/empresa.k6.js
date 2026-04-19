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

const EXISTING_USER_ID = env('EXISTING_USER_ID');
const CREATE_USER_ID = env('CREATE_USER_ID');

export const options = buildOptions({
  'http_req_duration{endpoint:get_all_empresas}': ['p(95)<800'],
  'http_req_duration{endpoint:get_empresa_by_id}': ['p(95)<800'],
  'http_req_duration{endpoint:is_empresa}': ['p(95)<800'],
  'http_req_duration{endpoint:create_empresa}': ['p(95)<1200'],
  'http_req_duration{endpoint:update_empresa}': ['p(95)<1200'],
});

function buildEmpresaPayload() {
  const suffix = randomSuffix();
  return {
    name_empresa: `Empresa k6 ${suffix}`,
    descripcion: 'Empresa creada en test de performance local con k6',
    ubicacion: 'Bogota',
    sector: 'Tecnologia',
    foto: 'https://example.com/logo.png',
    NIT: `K6-${suffix}`,
    id_perfil: CREATE_USER_ID,
  };
}

function maybeCreateEmpresa() {
  if (!CREATE_USER_ID) {
    return;
  }

  const payload = JSON.stringify(buildEmpresaPayload());
  const response = http.post(`${BASE_URL}/empresa/registro`, payload, {
    headers: JSON_HEADERS,
    tags: { endpoint: 'create_empresa' },
  });

  check(response, {
    'POST /empresa/registro status 200|201': (r) =>
      r.status === 200 || r.status === 201,
  });
}

function maybeUpdateEmpresa() {
  if (!EXISTING_USER_ID) {
    return;
  }

  const payload = JSON.stringify({
    descripcion: `descripcion actualizada por k6 iter ${__ITER}`,
    ubicacion: 'Bogota D.C.',
  });

  const response = http.patch(`${BASE_URL}/empresa/${EXISTING_USER_ID}`, payload, {
    headers: JSON_HEADERS,
    tags: { endpoint: 'update_empresa' },
  });

  check(response, {
    'PATCH /empresa/:id status 200|204': (r) =>
      r.status === 200 || r.status === 204,
  });
}

export default function () {
  const allEmpresasRes = http.get(`${BASE_URL}/empresa`, {
    tags: { endpoint: 'get_all_empresas' },
  });
  check(allEmpresasRes, {
    'GET /empresa status 200': (r) => r.status === 200,
  });

  if (EXISTING_USER_ID) {
    const byIdRes = http.get(`${BASE_URL}/empresa/${EXISTING_USER_ID}`, {
      tags: { endpoint: 'get_empresa_by_id' },
    });
    check(byIdRes, {
      'GET /empresa/:id status 200': (r) => r.status === 200,
    });

    const isEmpresaRes = http.get(`${BASE_URL}/empresa/isEmpresa/${EXISTING_USER_ID}`, {
      tags: { endpoint: 'is_empresa' },
    });
    check(isEmpresaRes, {
      'GET /empresa/isEmpresa/:id status 200': (r) => r.status === 200,
    });
  }

  maybeCreateEmpresa();
  maybeUpdateEmpresa();

  think();
}
