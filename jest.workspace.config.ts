import type { Config } from 'jest';

/**
 * Jest configuration for the FDG Workspace modules.
 *
 * The root `jest.config.ts` builds its project list with `getJestProjects()`
 * from `@nx/jest`, which resolves to nothing in this repository because there
 * are no Nx project files — so `pnpm test` runs zero tests. Rather than change
 * that file (it is upstream's, and changing it would conflict on every merge),
 * workspace code gets this standalone config, run via `pnpm run test:workspace`.
 *
 * The `moduleNameMapper` entries mirror the `paths` in `tsconfig.base.json`.
 * Without them every `@gitroom/...` import fails to resolve under Jest.
 */
const config: Config = {
  displayName: 'workspace',
  testEnvironment: 'node',
  rootDir: '.',
  // `roots` is load-bearing, not an optimisation. This repository installs with
  // `node-linker=hoisted`, producing a single enormous top-level node_modules.
  // With rootDir '.' and no roots, Jest crawls all of it building its module
  // map and dies with "Reached heap limit Allocation failed" — even on a
  // trivial test. Restricting the crawl to the workspace directories fixes it.
  // moduleNameMapper still resolves imports from outside these roots.
  // These parents always exist in a fresh clone; the `workspace` subdirectories
  // may not until the first module lands. Scoping happens via testMatch.
  roots: [
    '<rootDir>/libraries/nestjs-libraries/src/database/prisma',
    '<rootDir>/apps/backend/src/api/routes',
  ],
  testMatch: ['**/workspace/**/*.spec.ts'],
  passWithNoTests: true,
  // Jest's default is one worker per core. On WSL2 with ~7GB of RAM, a dozen
  // workers each building a module map exhausts memory and the run dies with
  // "Reached heap limit Allocation failed". One worker is plenty for a suite
  // this size and keeps the run well inside the default heap.
  maxWorkers: 1,
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'es2021',
          module: 'commonjs',
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          esModuleInterop: true,
          strict: false,
          // Transpile only. Type errors surface in the real build; making Jest
          // type-check as well takes the suite from 0.2s to over 20s for no
          // extra safety.
          isolatedModules: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@gitroom/nestjs-libraries/(.*)$':
      '<rootDir>/libraries/nestjs-libraries/src/$1',
    '^@gitroom/helpers/(.*)$': '<rootDir>/libraries/helpers/src/$1',
    '^@gitroom/backend/(.*)$': '<rootDir>/apps/backend/src/$1',
  },
};

export default config;
