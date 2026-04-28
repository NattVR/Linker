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
import { createUser } from './_shared/fixtures.k6.js';

const LOGIN_EMAIL = env('LOGIN_EMAIL');
const LOGIN_PASSWORD = env('LOGIN_PASSWORD');

export function setup() {
  const profileUser = createUser(BASE_URL, 'user-perfil');
  const loginUser = createUser(BASE_URL, 'user-login');

  return {
    existingUserId: profileUser.id,
    setupLoginEmail: loginUser.email,
    setupLoginPassword: loginUser.password,
  };
}

export const options = buildOptions({
  'http_req_duration{endpoint:registro}':    ['p(95)<1200'],
  'http_req_duration{endpoint:login}':       ['p(95)<800'],
  'http_req_duration{endpoint:get_perfil}':  ['p(95)<800'],
});

function buildRegistroPayload() {
  const suffix = randomSuffix();
  return {
    email: `user_k6_${suffix}@test.com`,
    password: 'password123',
  };
}

function maybeRegistrar() {
  const payload = JSON.stringify(buildRegistroPayload());
  const res = http.post(`${BASE_URL}/user/registro`, payload, {
    headers: JSON_HEADERS,
    tags: { endpoint: 'registro' },
  });

  check(res, {
    'POST /user/registro status 201': (r) => r.status === 201,
    'POST /user/registro tiene id': (r) => {
      try { return JSON.parse(r.body).user?.id !== undefined; }
      catch { return false; }
    },
  });
}

function maybeLogin(data) {
  const loginEmail = LOGIN_EMAIL || data?.setupLoginEmail;
  const loginPassword = LOGIN_PASSWORD || data?.setupLoginPassword;
  if (!loginEmail || !loginPassword) return;

  const payload = JSON.stringify({
    email: loginEmail,
    password: loginPassword,
  });

  const res = http.post(`${BASE_URL}/user/login`, payload, {
    headers: JSON_HEADERS,
    tags: { endpoint: 'login' },
  });

  check(res, {
    'POST /user/login status 201': (r) => r.status === 201,
    'POST /user/login tiene token': (r) => {
      try { return typeof JSON.parse(r.body).token === 'string'; }
      catch { return false; }
    },
  });
}

function maybeGetPerfil(existingUserId) {
  if (!existingUserId) return;

  const res = http.get(`${BASE_URL}/user/perfil/${existingUserId}`, {
    tags: { endpoint: 'get_perfil' },
  });

  check(res, {
    'GET /user/perfil/:id status 200': (r) => r.status === 200,
  });
}

export default function user (data) {
  const existingUserId = data?.existingUserId;

  maybeRegistrar();
  maybeLogin(data);
  maybeGetPerfil(existingUserId);

  think();
}
