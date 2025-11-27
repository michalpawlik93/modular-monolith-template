/* eslint-disable */
export default {
  displayName: 'core-svc',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleNameMapper: {
    '^@app/products$': '<rootDir>/../../libs/products/src/index.ts',
    '^@app/accounts$': '<rootDir>/../../libs/accounts/src/index.ts',
    '^@app/core-svc$': '<rootDir>/src/main.ts'
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../coverage/apps/core-svc'
};
