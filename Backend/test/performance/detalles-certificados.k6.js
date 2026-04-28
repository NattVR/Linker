import http from 'k6/http';
import { check } from 'k6';
import {
  BASE_URL,
  JSON_HEADERS,
  buildOptions,
  envBool,
  think,
} from './_shared/config.k6.js';
import {
  createCertificado,
  createDetalleCertificado,
  createEmpresa,
  createUser,
} from './_shared/fixtures.k6.js';

const RUN_WRITE = envBool('DETALLES_RUN_WRITE', false);

export function setup() {
  const empresaUser = createUser(BASE_URL, 'detalles-empresa-user');
  const empresa = createEmpresa(BASE_URL, empresaUser.id, 'detalles-empresa');
  const certificado = createCertificado(BASE_URL, 'detalles-certificado');
  const detalle = createDetalleCertificado(BASE_URL, empresa.id, certificado.id);

  return {
    empresaId: empresa.id,
    certificadoId: certificado.id,
    detalleId: detalle.id,
  };
}

export const options = buildOptions({
  'http_req_duration{endpoint:get_all_detalles_certificados}': ['p(95)<900'],
  'http_req_duration{endpoint:get_detalles_certificados_by_empresa}': ['p(95)<900'],
  'http_req_duration{endpoint:create_detalle_certificado}': ['p(95)<1200'],
  'http_req_duration{endpoint:update_detalle_certificado}': ['p(95)<1200'],
  'http_req_duration{endpoint:delete_detalle_certificado}': ['p(95)<1200'],
});

function createDetalleCertificadoFromFixture(empresaId, certificadoId) {
  if (!empresaId || !certificadoId) {
    return;
  }

  const payload = JSON.stringify({
    empresa: { id: empresaId },
    certificado: { id_certificado: certificadoId },
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

  try {
    return JSON.parse(response.body).id_detalles_certificados;
  } catch {
    return undefined;
  }
}

function updateDetalleCertificado(detalleId) {
  if (!detalleId) {
    return;
  }

  const payload = JSON.stringify({
    fecha_caducidad: '2028-01-10',
  });

  const response = http.patch(`${BASE_URL}/detalles-certificados/${detalleId}`, payload, {
    headers: JSON_HEADERS,
    tags: { endpoint: 'update_detalle_certificado' },
  });

  check(response, {
    'PATCH /detalles-certificados/:id status 200|204': (r) =>
      r.status === 200 || r.status === 204,
  });
}

function deleteDetalleCertificado(detalleId) {
  if (!detalleId) {
    return;
  }

  const response = http.del(`${BASE_URL}/detalles-certificados/${detalleId}`, null, {
    tags: { endpoint: 'delete_detalle_certificado' },
  });

  check(response, {
    'DELETE /detalles-certificados/:id status 200|204': (r) =>
      r.status === 200 || r.status === 204,
  });
}

export default function (data) {
  const empresaId = data?.empresaId;
  const certificadoId = data?.certificadoId;
  const detalleId = data?.detalleId;

  const allResponse = http.get(`${BASE_URL}/detalles-certificados`, {
    tags: { endpoint: 'get_all_detalles_certificados' },
  });

  check(allResponse, {
    'GET /detalles-certificados status 200': (r) => r.status === 200,
  });

  if (empresaId) {
    const byEmpresa = http.get(`${BASE_URL}/detalles-certificados/empresa/${empresaId}`, {
      tags: { endpoint: 'get_detalles_certificados_by_empresa' },
    });

    check(byEmpresa, {
      'GET /detalles-certificados/empresa/:id status 200': (r) => r.status === 200,
    });
  }

  if (RUN_WRITE) {
    const createdDetalleId = createDetalleCertificadoFromFixture(empresaId, certificadoId);
    const targetDetalleId = createdDetalleId || detalleId;
    updateDetalleCertificado(targetDetalleId);
    deleteDetalleCertificado(targetDetalleId);
  }

  think();
}
