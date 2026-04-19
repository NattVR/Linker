import { sleep } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const PERF_PROFILE = __ENV.PERF_PROFILE || 'smoke';
export const THINK_TIME_MS = Number(__ENV.THINK_TIME_MS || 250);

const PROFILES = {
  quick: {
    vus: 1,
    duration: '5s',
  },
  smoke: {
    vus: 1,
    duration: '30s',
  },
  load: {
    stages: [
      { duration: '20s', target: 5 },
      { duration: '1m', target: 15 },
      { duration: '20s', target: 0 },
    ],
  },
};

const DEFAULT_THRESHOLDS = {
  http_req_failed: ['rate<0.05'],
  http_req_duration: ['p(95)<1200', 'p(99)<2500'],
};

export const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

export function getProfileConfig() {
  return PROFILES[PERF_PROFILE] || PROFILES.smoke;
}

export function buildOptions(extraThresholds = {}) {
  return {
    ...getProfileConfig(),
    thresholds: {
      ...DEFAULT_THRESHOLDS,
      ...extraThresholds,
    },
  };
}

export function env(name, fallback = '') {
  return __ENV[name] || fallback;
}

export function envBool(name, fallback = false) {
  const value = __ENV[name];
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

export function randomSuffix() {
  return `${__VU}-${__ITER}-${Date.now()}`;
}

export function think() {
  sleep(THINK_TIME_MS / 1000);
}
