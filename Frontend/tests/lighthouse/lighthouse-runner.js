const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const fs = require('fs');
const path = require('path');
const { thresholds, lighthouseFlags } = require('./lighthouse.config');

const BASE_URL = process.env.FRONTEND_URL || 'http://linker-frontend-1';
const LOGIN_URL = `${BASE_URL}/login`;
const TEST_EMAIL = process.env.LH_TEST_EMAIL || 'test@linker.com';
const TEST_PASSWORD = process.env.LH_TEST_PASSWORD || 'TestPassword123';

const PUBLIC_ROUTES = [
  { name: 'login', path: '/login' },
  { name: 'signup', path: '/signup' },
];

const PRIVATE_ROUTES = [
  { name: 'perfil-postulante', path: '/perfil-postulante' },
  { name: 'perfil-empresa', path: '/perfil-empresa' },
  { name: 'match-swipe', path: '/match/swipe' },
  { name: 'vacantes-menu', path: '/match/vacantes' },
];

const REPORTS_DIR = path.join(__dirname, '../../coverage/lighthouse');

async function getTokenViaLogin(page) {
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', TEST_EMAIL);
  await page.type('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
  await page.waitForFunction(
    () => localStorage.getItem('token') !== null,
    { timeout: 30000 }
  );

  const token = await page.evaluate(() => localStorage.getItem('token'));
  if (!token) throw new Error('Login fallido: no se encontró el token en localStorage');

  return token;
}

async function auditUrl({ browser, url, name, token }) {
  const setupPage = await browser.newPage();
  await setupPage.goto(BASE_URL, { waitUntil: 'networkidle2' });

  if (token) {
    await setupPage.evaluate((t) => localStorage.setItem('token', t), token);
  }
  await setupPage.close();

  const wsEndpoint = browser.wsEndpoint();
  const port = new URL(wsEndpoint).port;

  const result = await lighthouse(url, {
    ...lighthouseFlags,
    port: parseInt(port),
  });

  return { name, lhr: result.lhr, report: result.report };
}

function checkThresholds(name, lhr) {
  const failures = [];

  for (const [category, minScore] of Object.entries(thresholds)) {
    const score = (lhr.categories[category]?.score ?? 0) * 100;
    const rounded = Math.round(score);
    const status = rounded >= minScore ? '✅' : '❌';
    console.info(`  ${status} ${category}: ${rounded} (mínimo: ${minScore})`);
    if (rounded < minScore) {
      failures.push(`${category}: ${rounded} < ${minScore}`);
    }
  }

  return failures;
}

async function run() {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.CHROME_BIN || '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--remote-debugging-port=0'
    ],
  });

  let token = null;
  let allFailures = [];

  try {
    const loginPage = await browser.newPage();
    token = await getTokenViaLogin(loginPage);
    await loginPage.close();
    console.info('Login exitoso, token obtenido');

    const allRoutes = [
      ...PUBLIC_ROUTES.map(r => ({ ...r, token: null })),
      ...PRIVATE_ROUTES.map(r => ({ ...r, token })),
    ];

    for (const route of allRoutes) {
      const url = `${BASE_URL}${route.path}`;
      console.info(`\n🔍 Auditando: ${route.name} (${url})`);

      const { name, lhr, report } = await auditUrl({
        browser,
        url,
        name: route.name,
        token: route.token,
      });

      const reportPath = path.join(REPORTS_DIR, `${name}.html`);
      fs.writeFileSync(reportPath, report);
      console.info(`  📄 Reporte guardado: ${reportPath}`);

      const failures = checkThresholds(name, lhr);
      if (failures.length > 0) {
        allFailures.push({ route: name, failures });
      }
    }
  } finally {
    await browser.close();
  }

  if (allFailures.length > 0) {
    console.info('\nLIGHTHOUSE FALLÓ en las siguientes rutas:');
    for (const { route, failures } of allFailures) {
      console.info(`  ${route}: ${failures.join(', ')}`);
    }
    process.exit(1);
  } else {
    console.info('\nTodas las rutas pasan los thresholds de Lighthouse');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Error fatal en Lighthouse runner:', err);
  process.exit(1);
});