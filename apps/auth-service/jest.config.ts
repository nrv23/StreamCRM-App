/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "node",
  preset: "ts-jest/presets/default-esm",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
  },
  moduleNameMapper: {
    // Permite que jest resuelva los imports que terminan en .js
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  extensionsToTreatAsEsm: ['.ts'],
  // Corre todos los archivos .test.ts de la carpeta tests/
  testMatch: ["**/tests/**/*.test.ts"],
};
