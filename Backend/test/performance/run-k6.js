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
const testName = getArg('--test') || process.env.PERF_TEST || 'empresa';
const profileArg = getArg('--profile');
const profile = profileArg || process.env.PERF_PROFILE;
const shouldList = process.argv.includes('--list');

if (shouldList) {
  console.log('Suites disponibles:');
  availableTests.forEach((suite) => console.log(`- ${suite}`));
  process.exit(0);
}

const scriptPath = path.resolve(__dirname, `${testName}.k6.js`);

if (!fs.existsSync(scriptPath)) {
  console.error(`No existe el test k6: ${scriptPath}`);
  console.error('Crea un archivo con el formato: test/performance/<nombre>.k6.js');
  if (availableTests.length > 0) {
    console.error('Suites disponibles actualmente:');
    availableTests.forEach((suite) => console.error(`- ${suite}`));
  }
  process.exit(1);
}

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
  console.error(`Error ejecutando k6: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
