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
    createMatch as createMatchFixture,
    createPostulante,
    createUser,
    createVacante,
} from './_shared/fixtures.k6.js';

export function setup() {
    const empresaUser = createUser(BASE_URL, 'matches-empresa-user');
    const empresa = createEmpresa(BASE_URL, empresaUser.id, 'matches-empresa');
    const vacante = createVacante(BASE_URL, empresa.id, 'matches-vacante');

    const postulanteUser = createUser(BASE_URL, 'matches-postulante-user');
    const postulante = createPostulante(BASE_URL, postulanteUser.id, 'matches-postulante');

    const match = createMatchFixture(BASE_URL, vacante.id, postulante.id);

    return {
        matchId: match.id,
        vacanteId: vacante.id,
        postulanteId: postulante.id,
    };
}

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

function maybeGetMatchById(matchId) {
    if (!matchId) return;

    const res = http.get(`${BASE_URL}/matches/${matchId}`, {
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

function maybeCreateMatch(vacanteId, postulanteId) {
    if (!vacanteId || !postulanteId) return;

    const payload = JSON.stringify({
        vacante: { id_vacante: vacanteId },
        postulante: { id: postulanteId },
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

export default function matches(data) {
    const matchId = data?.matchId;
    const vacanteId = data?.vacanteId;
    const postulanteId = data?.postulanteId;

    getAllMatches();
    think();

    maybeGetMatchById(matchId);
    think();

    maybeCreateMatch(vacanteId, postulanteId);
    think();
}
