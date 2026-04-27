import http from 'k6/http';
import { check } from 'k6';
import {
    BASE_URL,
    JSON_HEADERS,
    env,
    buildOptions,
    think,
} from './_shared/config.k6.js';

const VACANTE_ID = env('EXISTING_VACANTE_ID');
const POSTULANTE_ID = env('EXISTING_POSTULANTE_ID');
const EMPRESA_ID = env('EXISTING_EMPRESA_ID');

export const options = buildOptions({
    'http_req_duration{endpoint:create_interaccion}': ['p(95)<1200'],
    'http_req_duration{endpoint:filter_vacantes}': ['p(95)<800'],
    'http_req_duration{endpoint:filter_postulantes}': ['p(95)<800'],
    'http_req_duration{endpoint:check_match}': ['p(95)<800'],
});

function buildInteraccionPayload(accionEmpresa, accionPostulante) {
    return JSON.stringify({
        vacante: VACANTE_ID,
        postulante: POSTULANTE_ID,
        empresa: EMPRESA_ID,
        accion_empresa: accionEmpresa,
        accion_postulante: accionPostulante,
    });
}

function postInteraccion() {
    const scenarios = [
        { accionEmpresa: 'like', accionPostulante: 'no_interaccion' },
        { accionEmpresa: 'no_interaccion', accionPostulante: 'like' },
        { accionEmpresa: 'like', accionPostulante: 'like' }, // genera match
    ];
    const { accionEmpresa, accionPostulante } = scenarios[__ITER % scenarios.length];

    const res = http.post(
        `${BASE_URL}/interacciones`,
        buildInteraccionPayload(accionEmpresa, accionPostulante),
        {
            headers: JSON_HEADERS,
            tags: { endpoint: 'create_interaccion' },
        },
    );

    check(res, {
        'POST /interacciones status 201 o 200': (r) =>
            r.status === 201 || r.status === 200,
        'POST /interacciones retorna interaccion con accionEmpresa': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.accionEmpresa !== undefined;
            } catch {
                return false;
            }
        },
        'POST /interacciones retorna interaccion con accionPostulante': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.accionPostulante !== undefined;
            } catch {
                return false;
            }
        },
    });
}

function getFilterVacantes() {
    const res = http.get(
        `${BASE_URL}/interacciones/filter/vacantes/${POSTULANTE_ID}`,
        { tags: { endpoint: 'filter_vacantes' } },
    );

    check(res, {
        'GET /filter/vacantes/:id status 200': (r) => r.status === 200,
        'GET /filter/vacantes/:id retorna array': (r) => {
            try {
                return Array.isArray(JSON.parse(r.body));
            } catch {
                return false;
            }
        },
        'GET /filter/vacantes/:id items son strings': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.length === 0 || typeof body[0] === 'string';
            } catch {
                return false;
            }
        },
    });
}

function getFilterPostulantes() {
    const res = http.get(
        `${BASE_URL}/interacciones/filter/postulantes/${VACANTE_ID}`,
        { tags: { endpoint: 'filter_postulantes' } },
    );

    check(res, {
        'GET /filter/postulantes/:id status 200': (r) => r.status === 200,
        'GET /filter/postulantes/:id retorna array': (r) => {
            try {
                return Array.isArray(JSON.parse(r.body));
            } catch {
                return false;
            }
        },
        'GET /filter/postulantes/:id items son strings': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.length === 0 || typeof body[0] === 'string';
            } catch {
                return false;
            }
        },
    });
}

function getCheckMatch() {
    const res = http.get(
        `${BASE_URL}/interacciones/check-match/${POSTULANTE_ID}/${VACANTE_ID}`,
        { tags: { endpoint: 'check_match' } },
    );

    check(res, {
        'GET /check-match status 200 o 404': (r) =>
            r.status === 200 || r.status === 404,
        'GET /check-match body es JSON válido o vacío': (r) => {
            if (!r.body || r.body.trim() === '') return true;
            try {
                JSON.parse(r.body);
                return true;
            } catch {
                return false;
            }
        },
        'GET /check-match si tiene body tiene accionEmpresa': (r) => {
            if (!r.body || r.body.trim() === '') return true;
            try {
                const body = JSON.parse(r.body);
                return body.accionEmpresa !== undefined;
            } catch {
                return false;
            }
        },
        'GET /check-match si tiene body tiene accionPostulante': (r) => {
            if (!r.body || r.body.trim() === '') return true;
            try {
                const body = JSON.parse(r.body);
                return body.accionPostulante !== undefined;
            } catch {
                return false;
            }
        },
    });
}

export default function interacciones() {
    postInteraccion();
    think();

    getFilterVacantes();
    think();

    getFilterPostulantes();
    think();

    getCheckMatch();
    think();
}