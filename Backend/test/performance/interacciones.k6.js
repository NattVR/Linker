import http from 'k6/http';
import { check } from 'k6';
import {
    BASE_URL,
    JSON_HEADERS,
    buildOptions,
    think,
} from './_shared/config.k6.js';
import {
    createEmpresa,
    createPostulante,
    createUser,
    createVacante,
} from './_shared/fixtures.k6.js';

export function setup() {
    const empresaUser = createUser(BASE_URL, 'interacciones-empresa-user');
    const empresa = createEmpresa(BASE_URL, empresaUser.id, 'interacciones-empresa');
    const vacante = createVacante(BASE_URL, empresa.id, 'interacciones-vacante');

    const postulanteUser = createUser(BASE_URL, 'interacciones-postulante-user');
    const postulante = createPostulante(BASE_URL, postulanteUser.id, 'interacciones-postulante');

    return {
        vacanteId: vacante.id,
        postulanteId: postulante.id,
        empresaId: empresa.id,
    };
}

export const options = buildOptions({
    'http_req_duration{endpoint:create_interaccion}': ['p(95)<2000'],
    'http_req_duration{endpoint:filter_vacantes}': ['p(95)<1200'],
    'http_req_duration{endpoint:filter_postulantes}': ['p(95)<1200'],
    'http_req_duration{endpoint:check_match}': ['p(95)<1200'],
});

function buildInteraccionPayload(accionEmpresa, accionPostulante, ids) {
    return JSON.stringify({
        vacante: ids.vacanteId,
        postulante: ids.postulanteId,
        empresa: ids.empresaId,
        accion_empresa: accionEmpresa,
        accion_postulante: accionPostulante,
    });
}

function postInteraccion(ids) {
    const scenarios = [
        { accionEmpresa: 'like', accionPostulante: 'no_interaccion' },
        { accionEmpresa: 'no_interaccion', accionPostulante: 'like' },
        { accionEmpresa: 'like', accionPostulante: 'like' }, // genera match
    ];
    const { accionEmpresa, accionPostulante } = scenarios[__ITER % scenarios.length];

    const res = http.post(
        `${BASE_URL}/interacciones`,
        buildInteraccionPayload(accionEmpresa, accionPostulante, ids),
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

function getFilterVacantes(postulanteId) {
    const res = http.get(
        `${BASE_URL}/interacciones/filter/vacantes/${postulanteId}`,
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

function getFilterPostulantes(vacanteId) {
    const res = http.get(
        `${BASE_URL}/interacciones/filter/postulantes/${vacanteId}`,
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

function getCheckMatch(postulanteId, vacanteId) {
    const res = http.get(
        `${BASE_URL}/interacciones/check-match/${postulanteId}/${vacanteId}`,
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

export default function interacciones(data) {
    const ids = data || {};
    if (!ids.vacanteId || !ids.postulanteId || !ids.empresaId) {
        return;
    }

    postInteraccion(ids);
    think();

    getFilterVacantes(ids.postulanteId);
    think();

    getFilterPostulantes(ids.vacanteId);
    think();

    getCheckMatch(ids.postulanteId, ids.vacanteId);
    think();
}
