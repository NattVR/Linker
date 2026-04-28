import http from 'k6/http';
import { check } from 'k6';
import {
  BASE_URL,
  JSON_HEADERS,
  buildOptions,
  randomSuffix,
  think,
} from './_shared/config.k6.js';
import { createEmpresa, createUser } from './_shared/fixtures.k6.js';

export function setup() {
  const existingUser = createUser(BASE_URL, 'empresa-existing-user');
  const existingEmpresa = createEmpresa(BASE_URL, existingUser.id, 'empresa-existing');

  //const createUserCandidate = createUser(BASE_URL, 'empresa-create-user');

  return {
    existingUserId: existingUser.id,
    existingEmpresaId: existingEmpresa.id,
    //createUserId: createUserCandidate.id,
  };
}

export const options = buildOptions({
  'http_req_duration{endpoint:get_all_empresas}': ['p(95)<800'],
  'http_req_duration{endpoint:get_empresa_by_id}': ['p(95)<800'],
  'http_req_duration{endpoint:is_empresa}': ['p(95)<800'],
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
  };
}

function maybeUpdateEmpresa(existingUserId) {
  if (!existingUserId) {
    return;
  }

  const payload = JSON.stringify({
    descripcion: `descripcion actualizada por k6 iter ${__ITER} - ${new Date().toISOString()}`,
    ubicacion: 'Bogota D.C.',
  });

  const response = http.patch(`${BASE_URL}/empresa/${existingUserId}`, payload, {
    headers: JSON_HEADERS,
    tags: { endpoint: 'update_empresa' },
  });

  check(response, {
    'PATCH /empresa/:id status 200|204': (r) =>
      r.status === 200 || r.status === 204,
  });
}

export default function (data) {
  const existingUserId = data?.existingUserId;
  const existingEmpresaId = data?.existingEmpresaId;
  
  const allEmpresasRes = http.get(`${BASE_URL}/empresa`, {
    tags: { endpoint: 'get_all_empresas' },
  });
  check(allEmpresasRes, {
    'GET /empresa status 200': (r) => r.status === 200,
  });

  if (existingEmpresaId) {
    const byIdRes = http.get(`${BASE_URL}/empresa/${existingEmpresaId}`, {
      tags: { endpoint: 'get_empresa_by_id' },
    });
    check(byIdRes, {
      'GET /empresa/:id status 200': (r) => r.status === 200,
    });

    const isEmpresaRes = http.get(`${BASE_URL}/empresa/isEmpresa/${existingUserId}`, {
      tags: { endpoint: 'is_empresa' },
    });
    check(isEmpresaRes, {
      'GET /empresa/isEmpresa/:id status 200': (r) => r.status === 200,
    });
  }

  // maybeCreateEmpresa(createUserId);
  maybeUpdateEmpresa(existingUserId);

  think();
}
