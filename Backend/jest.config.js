module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'user/**/*.ts',
    'postulante/**/*.ts',
    'vacantes/**/*.ts',
    'interacciones/**/*.ts',
    'matches/**/*.ts',
    'empresa/**/*.ts',
    'certificados/**/*.ts',
    'detalles_certificados/**/*.ts',
    '!**/*.spec.ts',
    '!**/*.module.ts',
    '!**/dto/**',
    '!**/entities/**',
    '!**/logger/**',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['lcov', 'text-summary'],
  testEnvironment: 'node',
};