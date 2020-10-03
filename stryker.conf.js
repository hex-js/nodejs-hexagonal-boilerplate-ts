/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */

module.exports = {
  mutator: 'javascript',
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  coverageAnalysis: 'off',
  maxConcurrentTestRunners: 2,
  dashboard: {
    project: 'github.com/hex-js/nodejs-hexagonal-boilerplate'
  },
  mutate: [
    'src/**/*.ts',
    '!src/ports/http/**/*.ts',
    '!src/ports/aws-lambda/**/*.ts',
    '!src/ports/logger/**/*.ts',
    '!src/**/*.spec.ts'
  ],
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    enableFindRelatedTests: true
  },
  timeoutMS: 15000
}
