import http from 'k6/http';
import { check } from 'k6';
import {
  BASE_URL,
  JSON_HEADERS,
  buildOptions,
  env,
  envBool,
  think,
} from './_shared/config.k6.js';

const EMPRESA_ID = env('DETALLES_EMPRESA_ID');
const CERTIFICADO_ID = env('DETALLES_CERTIFICADO_ID');
const DETALLE_ID = env('DETALLES_ID');
const RUN_WRITE = envBool('DETALLES_RUN_WRITE', false);

export const options = buildOptions({
  'http_req_duration{endpoint:get_all_detalles_certificados}': ['p(95)<900'],
  'http_req_duration{endpoint:get_detalles_certificados_by_empresa}': ['p(95)<900'],
  'http_req_duration{endpoint:create_detalle_certificado}': ['p(95)<1200'],
  'http_req_duration{endpoint:update_detalle_certificado}': ['p(95)<1200'],
  'http_req_duration{endpoint:delete_detalle_certificado}': ['p(95)<1200'],
});

function createDetalleCertificado() {
  if (!EMPRESA_ID || !CERTIFICADO_ID) {
    return;
  }

  const payload = JSON.stringify({
    empresa: { id: EMPRESA_ID },
    certificado: { id_certificado: CERTIFICADO_ID },
    fecha_emision: '2026-01-10',
    fecha_caducidad: '2027-01-10',
  });

  const response = http.post(`${BASE_URL}/detalles-certificados`, payload, {
    headers: JSON_HEADERS,
    tags: { endpoint: 'create_detalle_certificado' },
  });

  check(response, {
    'POST /detalles-certificados status 200|201': (r) =>
      r.status === 200 || r.status === 201,
  });
}

function updateDetalleCertificado() {
  if (!DETALLE_ID) {
    return;
  }

  const payload = JSON.stringify({
    fecha_caducidad: '2028-01-10',
  });

  const response = http.patch(`${BASE_URL}/detalles-certificados/${DETALLE_ID}`, payload, {
    headers: JSON_HEADERS,
    tags: { endpoint: 'update_detalle_certificado' },
  });

  check(response, {
    'PATCH /detalles-certificados/:id status 200|204': (r) =>
      r.status === 200 || r.status === 204,
  });
}

function deleteDetalleCertificado() {
  if (!DETALLE_ID) {
    return;
  }

  const response = http.del(`${BASE_URL}/detalles-certificados/${DETALLE_ID}`, null, {
    tags: { endpoint: 'delete_detalle_certificado' },
  });

  check(response, {
    'DELETE /detalles-certificados/:id status 200|204': (r) =>
      r.status === 200 || r.status === 204,
  });
}

export default function () {
  const allResponse = http.get(`${BASE_URL}/detalles-certificados`, {
    tags: { endpoint: 'get_all_detalles_certificados' },
  });

  check(allResponse, {
    'GET /detalles-certificados status 200': (r) => r.status === 200,
  });

  if (EMPRESA_ID) {
    const byEmpresa = http.get(`${BASE_URL}/detalles-certificados/empresa/${EMPRESA_ID}`, {
      tags: { endpoint: 'get_detalles_certificados_by_empresa' },
    });

    check(byEmpresa, {
      'GET /detalles-certificados/empresa/:id status 200': (r) => r.status === 200,
    });
  }

  if (RUN_WRITE) {
    createDetalleCertificado();
    updateDetalleCertificado();
    deleteDetalleCertificado();
  }

  think();
}
