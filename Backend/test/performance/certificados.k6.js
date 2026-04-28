import http from 'k6/http';
import { check } from 'k6';
import {
  BASE_URL,
  JSON_HEADERS,
  buildOptions,
  envBool,
  randomSuffix,
  think,
} from './_shared/config.k6.js';


export const options = buildOptions({
  'http_req_duration{endpoint:get_all_certificados}': ['p(95)<900'],
  'http_req_duration{endpoint:create_certificado}': ['p(95)<1200'],
});

function createCertificado() {
  const suffix = randomSuffix();
  const payload = JSON.stringify({
    entidad_emisora: `k6-emisor-${suffix}`,
    nombre_certificado: `k6-certificado-${suffix}`,
  });

  const response = http.post(`${BASE_URL}/certificados`, payload, {
    headers: JSON_HEADERS,
    tags: { endpoint: 'create_certificado' },
  });

  check(response, {
    'POST /certificados status 200|201': (r) =>
      r.status === 200 || r.status === 201,
  });
}

export default function () {
  const response = http.get(`${BASE_URL}/certificados`, {
    tags: { endpoint: 'get_all_certificados' },
  });

  check(response, {
    'GET /certificados status 200': (r) => r.status === 200,
  });

  think();
}
