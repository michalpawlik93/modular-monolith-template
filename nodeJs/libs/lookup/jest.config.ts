/* eslint-disable */
export default {
  displayName: 'lookup',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@app/lookup$': '<rootDir>/src/index.ts',
    '^@app/core$': '<rootDir>/../../libs/core/src/index.ts',
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../coverage/libs/lookup',
};
