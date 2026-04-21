const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function getAvailableTests() {
  return fs
    .readdirSync(__dirname, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.k6.js'))
    .map((entry) => entry.name.replace(/\.k6\.js$/, ''))
    .sort();
}

const availableTests = getAvailableTests();
const testName = getArg('--test') || process.env.PERF_TEST; 
const profileArg = getArg('--profile');
const profile = profileArg || process.env.PERF_PROFILE;
const shouldList = process.argv.includes('--list');

if (shouldList) {
  console.log('Suites disponibles:');
  availableTests.forEach((suite) => console.log(`- ${suite}`));
  process.exit(0);
}

// SIN --test corre todos, CON --test corre solo ese
const testsToRun = testName ? [testName] : availableTests;

if (testsToRun.length === 0) {
  console.error('No hay archivos .k6.js en la carpeta.');
  process.exit(1);
}

console.log(`\nCorriendo ${testsToRun.length} suite(s) con perfil: ${profile || 'smoke'}\n`);

let failed = 0;

for (const test of testsToRun) {
  const scriptPath = path.resolve(__dirname, `${test}.k6.js`);

  if (!fs.existsSync(scriptPath)) {
    console.error(`No existe: ${scriptPath}`);
    failed++;
    continue;
  }

  console.log(`\n▶ ${test} (perfil: ${profile || 'smoke'})`);
  console.log('─'.repeat(50));

  const k6Bin = process.env.K6_BIN || 'k6';
  const args = ['run'];

  if (profile) {
    args.push('--env', `PERF_PROFILE=${profile}`);
  }

  args.push(scriptPath);

  const result = spawnSync(k6Bin, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  if (result.error) {
    console.error(`Error ejecutando ${test}: ${result.error.message}`);
    failed++;
    continue;
  }

  if (result.status !== 0) {
    console.error(`✗ ${test} falló`);
    failed++;
  } else {
    console.log(`✓ ${test} pasó`);
  }
}

console.log('\n' + '═'.repeat(50));
console.log(`Resultado: ${testsToRun.length - failed}/${testsToRun.length} suites pasaron`);
process.exit(failed > 0 ? 1 : 0);