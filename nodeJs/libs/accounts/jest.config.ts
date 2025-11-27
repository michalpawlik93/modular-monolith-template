/* eslint-disable */
export default {
  displayName: 'accounts',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@app/products$': '<rootDir>/src/index.ts',
    '^@app/accounts$': '<rootDir>/src/index.ts',
    '^@app/core$': '<rootDir>/../../libs/core/src/index.ts',
    '^@app/core/prisma$': '<rootDir>/../../libs/core/src/providers/prisma/index.ts',
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../coverage/libs/accounts',
};
