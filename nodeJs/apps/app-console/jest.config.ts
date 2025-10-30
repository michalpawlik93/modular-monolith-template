/* eslint-disable */
export default {
  displayName: 'wallet-console',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleNameMapper: {
    '^@app/lookup$': '<rootDir>/../../libs/lookup/src/index.ts',
    '^@app/wallet-console$': '<rootDir>/src/main.ts'
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../coverage/apps/wallet-console'
};
