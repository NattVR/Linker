import http from 'k6/http';
import { check } from 'k6';
import {
    BASE_URL,
    JSON_HEADERS,
    buildOptions,
    env,
    think,
} from './_shared/config.k6.js';

const MATCH_ID = env('EXISTING_MATCH_ID');
const VACANTE_ID = env('EXISTING_VACANTE_ID');
const POSTULANTE_ID = env('EXISTING_POSTULANTE_ID');

export const options = buildOptions({
    'http_req_duration{endpoint:get_all_matches}': ['p(95)<1000'],
    'http_req_duration{endpoint:get_match_by_id}': ['p(95)<1000'],
    'http_req_duration{endpoint:create_match}': ['p(95)<2000'],
});

function getAllMatches() {
    const res = http.get(`${BASE_URL}/matches`, {
        tags: { endpoint: 'get_all_matches' },
    });

    check(res, {
        'GET /matches status 200': (r) => r.status === 200,
        'GET /matches retorna array': (r) => {
            try {
                return Array.isArray(JSON.parse(r.body));
            } catch {
                return false;
            }
        },
        'GET /matches items tienen id_match': (r) => {
            try {
                const body = JSON.parse(r.body);
                if (body.length === 0) return true;
                return body[0].id_match !== undefined;
            } catch {
                return false;
            }
        },
        'GET /matches items tienen vacante y postulante': (r) => {
            try {
                const body = JSON.parse(r.body);
                if (body.length === 0) return true;
                return body[0].vacante !== undefined && body[0].postulante !== undefined;
            } catch {
                return false;
            }
        },
    });
}

function maybeGetMatchById() {
    if (!MATCH_ID) return;

    const res = http.get(`${BASE_URL}/matches/${MATCH_ID}`, {
        tags: { endpoint: 'get_match_by_id' },
    });

    check(res, {
        'GET /matches/:id status 200': (r) => r.status === 200,
        'GET /matches/:id responde correctamente': (r) => {
            try {
                return r.body !== undefined && r.body !== null;
                return true;
            } catch {
                return false;
            }
        },
    });
}

function maybeCreateMatch() {
    if (!VACANTE_ID || !POSTULANTE_ID) return;

    const payload = JSON.stringify({
        vacante: { id_vacante: VACANTE_ID },
        postulante: { id: POSTULANTE_ID },
    });

    const res = http.post(`${BASE_URL}/matches`, payload, {
        headers: JSON_HEADERS,
        tags: { endpoint: 'create_match' },
    });

    check(res, {
        'POST /matches status 201 o 200': (r) =>
            r.status === 201 || r.status === 200,
        'POST /matches retorna id_match': (r) => {
            try {
                return JSON.parse(r.body).id_match !== undefined;
            } catch {
                return false;
            }
        },
        'POST /matches retorna fecha': (r) => {
            try {
                return JSON.parse(r.body).fecha !== undefined;
            } catch {
                return false;
            }
        },
    });
}

export default function matches() {
    getAllMatches();
    think();

    maybeGetMatchById();
    think();

    maybeCreateMatch();
    think();
}