# FDG Workspace — Clients Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** FDG staff can create, list, edit and delete clients in the workspace, backed by a fully organisation-scoped API and a working test suite.

**Architecture:** Three new Prisma models (`Client`, `Project`, `Task`) land in one migration because they form a single foreign-key graph, but only `Client` gets application code in this plan. The backend follows the repository's mandatory `DTO → Controller → Service → Repository` layering, registering the controller in `api.module.ts` and the providers in the global `database.module.ts` — the pattern every existing feature uses. The frontend adds one page reusing the codebase's existing `useFetch` + SWR + `useModals` stack.

**Tech Stack:** NestJS 11, Prisma 6.5, PostgreSQL, Next.js 16, React 19, SWR, react-hook-form + yup, Tailwind 3, Jest + ts-jest + jest-mock-extended.

**Spec:** `docs/superpowers/specs/2026-09-01-fdg-workspace-clients-projects-tasks-design.md`

## Global Constraints

- **Node 22.12.x only.** `package.json` declares `>=22.12.0 <23.0.0`. The machine currently runs v24.12.0 and native modules (`bcrypt`, `canvas`, `sharp`) will fail to build on it.
- **pnpm only**, version 10.6.1. Never npm or yarn.
- **No raw SQL.** Prisma only.
- **No new npm dependencies.** Everything needed is already in `package.json`.
- **Never install frontend components from npm.** Write native components.
- **Layering is mandatory:** DTO → Controller → Service → Repository. No shortcuts.
- **Every query is organisation-scoped.** Every repository method takes `orgId` and includes `organizationId` in its `where`. This is the only thing preventing cross-organisation data access.
- **Soft deletes only.** Set `deletedAt`; never `delete()`.
- **Never modify `libraries/nestjs-libraries/src/integrations/**`** — that directory receives upstream Postiz fixes.
- **Tailwind 3** using tokens from `apps/frontend/src/app/colors.scss`. The `--color-custom*` variables are deprecated; do not use them.
- **SWR rule:** each `useSWR` call lives in its own hook and complies with `react-hooks/rules-of-hooks`. Never add `eslint-disable` for hook rules.
- **Lint runs only from the repository root.**

## Scope

This plan covers the environment, the shared schema, and the **clients** slice end to end. Projects and the task board get a follow-up plan, per the spec's review gate after step 1.

## File Structure

**Created:**

| File | Responsibility |
|---|---|
| `jest.workspace.config.ts` | Jest config for workspace code. The root `jest.config.ts` uses `getJestProjects()` from `@nx/jest`, which resolves to nothing in this repo — there are no Nx project files, so it runs zero tests. A separate additive config avoids touching it. |
| `libraries/nestjs-libraries/src/dtos/workspace/create.client.dto.ts` | Validation for client creation |
| `libraries/nestjs-libraries/src/dtos/workspace/update.client.dto.ts` | Validation for client updates |
| `libraries/nestjs-libraries/src/database/prisma/workspace/clients.repository.ts` | All Prisma access for clients |
| `libraries/nestjs-libraries/src/database/prisma/workspace/clients.repository.spec.ts` | Repository tests |
| `libraries/nestjs-libraries/src/database/prisma/workspace/clients.service.ts` | Client business rules |
| `libraries/nestjs-libraries/src/database/prisma/workspace/clients.service.spec.ts` | Service tests |
| `apps/backend/src/api/routes/workspace/clients.controller.ts` | HTTP surface |
| `apps/frontend/src/components/workspace/clients.hooks.ts` | SWR hooks, one per query |
| `apps/frontend/src/components/workspace/client.modal.component.tsx` | Create/edit form in a modal |
| `apps/frontend/src/components/workspace/clients.list.component.tsx` | The client list |
| `apps/frontend/src/app/(app)/(site)/workspace/clients/page.tsx` | Route |

**Modified:**

| File | Change |
|---|---|
| `libraries/nestjs-libraries/src/database/prisma/schema.prisma` | Append 4 enums + 3 models; 4 relation lines on `Organization`/`User` |
| `apps/backend/src/api/api.module.ts` | 1 import + 1 controller array entry |
| `libraries/nestjs-libraries/src/database/prisma/database.module.ts` | 2 imports + 2 provider array entries |
| `apps/frontend/src/components/layout/top.menu.tsx` | 1 menu item |
| `package.json` | 1 script: `test:workspace` |

---

### Task 1: Environment and test infrastructure

Nothing can run yet: `node_modules` is absent, Node is the wrong major version, and the repository contains zero test files with no working Jest configuration. This task fixes all three and ends with a green test run.

**Files:**
- Create: `jest.workspace.config.ts`
- Modify: `package.json` (scripts block)

**Interfaces:**
- Consumes: nothing
- Produces: a working `pnpm run test:workspace` command that every later task uses.

- [ ] **Step 1: Switch to Node 22**

```bash
nvm install 22.12.0
nvm use 22.12.0
nvm alias default 22.12.0
node -v
```

Expected: `v22.12.0`. If `nvm` is missing, install it first:
`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash`, then reopen the shell.

- [ ] **Step 2: Install dependencies**

```bash
pnpm install
```

Expected: completes without the `Unsupported engine` warning. `postinstall` runs `prisma generate` automatically.

- [ ] **Step 3: Create the Jest config**

Create `jest.workspace.config.ts`:

```ts
import type { Config } from 'jest';

const config: Config = {
  displayName: 'workspace',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '<rootDir>/libraries/nestjs-libraries/src/database/prisma/workspace/**/*.spec.ts',
    '<rootDir>/apps/backend/src/api/routes/workspace/**/*.spec.ts',
  ],
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
```

The `moduleNameMapper` entries mirror the `paths` in `tsconfig.base.json`. Without them, every `@gitroom/...` import fails to resolve under Jest.

- [ ] **Step 4: Add the test script**

In `package.json`, inside `"scripts"`, immediately after the existing `"test"` line, add:

```json
    "test:workspace": "jest -c jest.workspace.config.ts",
```

- [ ] **Step 5: Prove the harness runs**

Create a temporary file `libraries/nestjs-libraries/src/database/prisma/workspace/harness.spec.ts`:

```ts
describe('jest harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `pnpm run test:workspace`
Expected: `1 passed`. If it reports "0 tests found", the `testMatch` paths are wrong — fix before continuing.

- [ ] **Step 6: Remove the harness file and commit**

```bash
rm libraries/nestjs-libraries/src/database/prisma/workspace/harness.spec.ts
git add jest.workspace.config.ts package.json
git commit -m "build: add jest config for workspace modules"
```

---

### Task 2: Database schema

All three models ship in one migration because `Project` and `Task` carry foreign keys that must exist together for Prisma to validate the schema. Only `Client` gets application code in this plan.

**Files:**
- Modify: `libraries/nestjs-libraries/src/database/prisma/schema.prisma`

**Interfaces:**
- Consumes: nothing
- Produces: Prisma client models `client`, `project`, `task` with the exact field names used by every later task.

- [ ] **Step 1: Add relation fields to Postiz's models**

In `schema.prisma`, find `model Organization` (around line 11). Inside it, after the existing `Integration Integration[]` line, add:

```prisma
  clients             Client[]
  projects            Project[]
  tasks               Task[]
```

Find `model User` (around line 81). After the existing `comments Comments[]` line, add:

```prisma
  assignedTasks         Task[]
```

These four lines are the only edits to upstream-owned models. Prisma requires both sides of every relation.

- [ ] **Step 2: Append the enums and models**

At the very bottom of `schema.prisma`, append:

```prisma
// ---------------------------------------------------------------------------
// FDG Workspace
//
// NOTE: `Client` is FDG's business record for a customer of the agency.
// It is NOT the same as Postiz's `Customer` model above, which exists only to
// group social channels. Do not use the two words interchangeably.
// ---------------------------------------------------------------------------

enum ClientStatus {
  ACTIVE
  ARCHIVED
}

enum ProjectStatus {
  PLANNING
  ACTIVE
  ON_HOLD
  COMPLETED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}

model Client {
  id             String       @id @default(uuid())
  organizationId String
  name           String
  contactName    String?
  contactEmail   String?
  website        String?
  notes          String?
  status         ClientStatus @default(ACTIVE)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  deletedAt      DateTime?
  organization   Organization @relation(fields: [organizationId], references: [id])
  projects       Project[]

  @@index([organizationId])
  @@index([deletedAt])
}

model Project {
  id             String        @id @default(uuid())
  organizationId String
  clientId       String
  name           String
  description    String?
  status         ProjectStatus @default(PLANNING)
  startDate      DateTime?
  dueDate        DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  deletedAt      DateTime?
  organization   Organization  @relation(fields: [organizationId], references: [id])
  client         Client        @relation(fields: [clientId], references: [id])
  tasks          Task[]

  @@index([organizationId])
  @@index([clientId])
  @@index([deletedAt])
}

model Task {
  id              String       @id @default(uuid())
  organizationId  String
  projectId       String
  title           String
  description     String?
  status          TaskStatus   @default(TODO)
  priority        TaskPriority @default(MEDIUM)
  position        Int          @default(0)
  dueDate         DateTime?
  assigneeId      String?
  visibleToClient Boolean      @default(false)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  deletedAt       DateTime?
  organization    Organization @relation(fields: [organizationId], references: [id])
  project         Project      @relation(fields: [projectId], references: [id])
  assignee        User?        @relation(fields: [assigneeId], references: [id])

  @@index([organizationId])
  @@index([projectId, status, position])
  @@index([assigneeId])
  @@index([deletedAt])
}
```

- [ ] **Step 3: Start the database if it isn't running**

```bash
pnpm run dev:docker
docker ps
```

Expected: `postiz-postgres` and `postiz-redis` are up. Confirm `.env` exists with a valid `DATABASE_URL`; if not, copy `.env.example` to `.env` and set:
`DATABASE_URL="postgresql://postiz-local:postiz-local-pwd@localhost:5432/postiz-db-local"`
(the credentials in `.env.example` do not match the compose file).

- [ ] **Step 4: Push the schema and regenerate the client**

```bash
pnpm run prisma-db-push
pnpm run prisma-generate
```

Expected: "Your database is now in sync with your Prisma schema." If Prisma reports a missing back-relation, Step 1 was incomplete.

- [ ] **Step 5: Verify the tables exist**

```bash
docker exec postiz-postgres psql -U postiz-local -d postiz-db-local -c '\dt "Client"'
```

Expected: one row describing the `Client` table.

- [ ] **Step 6: Commit**

```bash
git add libraries/nestjs-libraries/src/database/prisma/schema.prisma
git commit -m "feat(workspace): add Client, Project and Task models"
```

---

### Task 3: Client DTOs and repository

**Files:**
- Create: `libraries/nestjs-libraries/src/dtos/workspace/create.client.dto.ts`
- Create: `libraries/nestjs-libraries/src/dtos/workspace/update.client.dto.ts`
- Create: `libraries/nestjs-libraries/src/database/prisma/workspace/clients.repository.ts`
- Test: `libraries/nestjs-libraries/src/database/prisma/workspace/clients.repository.spec.ts`

**Interfaces:**
- Consumes: the `client`, `project` and `task` Prisma models from Task 2.
- Produces:
  - `CreateClientDto { name: string; contactName?: string; contactEmail?: string; website?: string; notes?: string }`
  - `UpdateClientDto` — same fields plus `status?: 'ACTIVE' | 'ARCHIVED'`
  - `ClientsRepository` with `getClients(orgId: string, includeArchived: boolean)`, `getClient(orgId: string, id: string)`, `createClient(orgId: string, body: CreateClientDto)`, `updateClient(orgId: string, id: string, body: UpdateClientDto)`, `deleteClient(orgId: string, id: string)`

- [ ] **Step 1: Write the DTOs**

Create `libraries/nestjs-libraries/src/dtos/workspace/create.client.dto.ts`:

```ts
import {
  IsDefined,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateClientDto {
  @IsDefined()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
```

Create `libraries/nestjs-libraries/src/dtos/workspace/update.client.dto.ts`:

```ts
import { IsIn, IsOptional, IsString } from 'class-validator';
import { CreateClientDto } from '@gitroom/nestjs-libraries/dtos/workspace/create.client.dto';

export class UpdateClientDto extends CreateClientDto {
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'ARCHIVED'])
  status?: 'ACTIVE' | 'ARCHIVED';
}
```

- [ ] **Step 2: Write the failing repository test**

Create `libraries/nestjs-libraries/src/database/prisma/workspace/clients.repository.spec.ts`:

```ts
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import {
  PrismaRepository,
  PrismaTransaction,
} from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { ClientsRepository } from '@gitroom/nestjs-libraries/database/prisma/workspace/clients.repository';

describe('ClientsRepository', () => {
  let prisma: DeepMockProxy<PrismaRepository<'client' | 'project' | 'task'>>;
  let transaction: DeepMockProxy<PrismaTransaction>;
  let repository: ClientsRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaRepository<'client' | 'project' | 'task'>>();
    transaction = mockDeep<PrismaTransaction>();
    repository = new ClientsRepository(prisma, transaction);
  });

  it('scopes the list to the organisation and hides deleted and archived rows', async () => {
    prisma.model.client.findMany.mockResolvedValue([] as any);

    await repository.getClients('org-1', false);

    expect(prisma.model.client.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        deletedAt: null,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('includes archived rows when asked', async () => {
    prisma.model.client.findMany.mockResolvedValue([] as any);

    await repository.getClients('org-1', true);

    expect(prisma.model.client.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('scopes a single read to the organisation', async () => {
    prisma.model.client.findFirst.mockResolvedValue(null);

    await repository.getClient('org-1', 'client-1');

    expect(prisma.model.client.findFirst).toHaveBeenCalledWith({
      where: { id: 'client-1', organizationId: 'org-1', deletedAt: null },
    });
  });

  it('stamps the organisation onto a created client', async () => {
    prisma.model.client.create.mockResolvedValue({ id: 'new-id' } as any);

    await repository.createClient('org-1', { name: 'Acme Ltd' });

    expect(prisma.model.client.create).toHaveBeenCalledWith({
      data: {
        organizationId: 'org-1',
        name: 'Acme Ltd',
        contactName: undefined,
        contactEmail: undefined,
        website: undefined,
        notes: undefined,
      },
    });
  });

  it('scopes updates to the organisation', async () => {
    prisma.model.client.updateMany.mockResolvedValue({ count: 1 } as any);

    await repository.updateClient('org-1', 'client-1', { name: 'Acme UK' });

    expect(prisma.model.client.updateMany).toHaveBeenCalledWith({
      where: { id: 'client-1', organizationId: 'org-1', deletedAt: null },
      data: {
        name: 'Acme UK',
        contactName: undefined,
        contactEmail: undefined,
        website: undefined,
        notes: undefined,
        status: undefined,
      },
    });
  });

  it('soft deletes the client together with its projects and tasks', async () => {
    transaction.model.$transaction.mockResolvedValue([] as any);

    await repository.deleteClient('org-1', 'client-1');

    expect(transaction.model.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.model.task.updateMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        deletedAt: null,
        project: { clientId: 'client-1' },
      },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prisma.model.project.updateMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        clientId: 'client-1',
        deletedAt: null,
      },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prisma.model.client.updateMany).toHaveBeenCalledWith({
      where: { id: 'client-1', organizationId: 'org-1', deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm run test:workspace`
Expected: FAIL — `Cannot find module '.../clients.repository'`.

- [ ] **Step 4: Write the repository**

Create `libraries/nestjs-libraries/src/database/prisma/workspace/clients.repository.ts`:

```ts
import { Injectable } from '@nestjs/common';
import {
  PrismaRepository,
  PrismaTransaction,
} from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { CreateClientDto } from '@gitroom/nestjs-libraries/dtos/workspace/create.client.dto';
import { UpdateClientDto } from '@gitroom/nestjs-libraries/dtos/workspace/update.client.dto';

@Injectable()
export class ClientsRepository {
  constructor(
    private _workspace: PrismaRepository<'client' | 'project' | 'task'>,
    private _transaction: PrismaTransaction
  ) {}

  getClients(orgId: string, includeArchived: boolean) {
    return this._workspace.model.client.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        ...(includeArchived ? {} : { status: 'ACTIVE' }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getClient(orgId: string, id: string) {
    return this._workspace.model.client.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
  }

  createClient(orgId: string, body: CreateClientDto) {
    return this._workspace.model.client.create({
      data: {
        organizationId: orgId,
        name: body.name,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        website: body.website,
        notes: body.notes,
      },
    });
  }

  updateClient(orgId: string, id: string, body: UpdateClientDto) {
    return this._workspace.model.client.updateMany({
      where: { id, organizationId: orgId, deletedAt: null },
      data: {
        name: body.name,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        website: body.website,
        notes: body.notes,
        status: body.status,
      },
    });
  }

  deleteClient(orgId: string, id: string) {
    const deletedAt = new Date();

    return this._transaction.model.$transaction([
      this._workspace.model.task.updateMany({
        where: {
          organizationId: orgId,
          deletedAt: null,
          project: { clientId: id },
        },
        data: { deletedAt },
      }),
      this._workspace.model.project.updateMany({
        where: { organizationId: orgId, clientId: id, deletedAt: null },
        data: { deletedAt },
      }),
      this._workspace.model.client.updateMany({
        where: { id, organizationId: orgId, deletedAt: null },
        data: { deletedAt },
      }),
    ]);
  }
}
```

`updateMany` is used rather than `update` for writes because it accepts a
compound `where` including `organizationId`. `update` requires a unique
selector and would allow a caller to reach another organisation's row.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm run test:workspace`
Expected: 6 passed.

- [ ] **Step 6: Commit**

```bash
git add libraries/nestjs-libraries/src/dtos/workspace libraries/nestjs-libraries/src/database/prisma/workspace
git commit -m "feat(workspace): add client DTOs and repository"
```

---

### Task 4: Client service

**Files:**
- Create: `libraries/nestjs-libraries/src/database/prisma/workspace/clients.service.ts`
- Test: `libraries/nestjs-libraries/src/database/prisma/workspace/clients.service.spec.ts`

**Interfaces:**
- Consumes: `ClientsRepository` from Task 3.
- Produces: `ClientsService` with the same five method names as the repository, plus `updateClient` returning the updated row rather than a count.

- [ ] **Step 1: Write the failing service test**

Create `libraries/nestjs-libraries/src/database/prisma/workspace/clients.service.spec.ts`:

```ts
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ClientsRepository } from '@gitroom/nestjs-libraries/database/prisma/workspace/clients.repository';
import { ClientsService } from '@gitroom/nestjs-libraries/database/prisma/workspace/clients.service';

describe('ClientsService', () => {
  let repository: DeepMockProxy<ClientsRepository>;
  let service: ClientsService;

  beforeEach(() => {
    repository = mockDeep<ClientsRepository>();
    service = new ClientsService(repository);
  });

  it('defaults to hiding archived clients', async () => {
    repository.getClients.mockResolvedValue([] as any);

    await service.getClients('org-1');

    expect(repository.getClients).toHaveBeenCalledWith('org-1', false);
  });

  it('returns the updated client rather than an update count', async () => {
    repository.updateClient.mockResolvedValue({ count: 1 } as any);
    repository.getClient.mockResolvedValue({ id: 'c1', name: 'Acme' } as any);

    const result = await service.updateClient('org-1', 'c1', { name: 'Acme' });

    expect(result).toEqual({ id: 'c1', name: 'Acme' });
  });

  it('returns null when updating a client in another organisation', async () => {
    repository.updateClient.mockResolvedValue({ count: 0 } as any);

    const result = await service.updateClient('org-1', 'c1', { name: 'Acme' });

    expect(result).toBeNull();
    expect(repository.getClient).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm run test:workspace`
Expected: FAIL — `Cannot find module '.../clients.service'`.

- [ ] **Step 3: Write the service**

Create `libraries/nestjs-libraries/src/database/prisma/workspace/clients.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { ClientsRepository } from '@gitroom/nestjs-libraries/database/prisma/workspace/clients.repository';
import { CreateClientDto } from '@gitroom/nestjs-libraries/dtos/workspace/create.client.dto';
import { UpdateClientDto } from '@gitroom/nestjs-libraries/dtos/workspace/update.client.dto';

@Injectable()
export class ClientsService {
  constructor(private _clientsRepository: ClientsRepository) {}

  getClients(orgId: string, includeArchived = false) {
    return this._clientsRepository.getClients(orgId, includeArchived);
  }

  getClient(orgId: string, id: string) {
    return this._clientsRepository.getClient(orgId, id);
  }

  createClient(orgId: string, body: CreateClientDto) {
    return this._clientsRepository.createClient(orgId, body);
  }

  async updateClient(orgId: string, id: string, body: UpdateClientDto) {
    const { count } = await this._clientsRepository.updateClient(
      orgId,
      id,
      body
    );

    if (!count) {
      return null;
    }

    return this._clientsRepository.getClient(orgId, id);
  }

  deleteClient(orgId: string, id: string) {
    return this._clientsRepository.deleteClient(orgId, id);
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm run test:workspace`
Expected: 9 passed.

- [ ] **Step 5: Commit**

```bash
git add libraries/nestjs-libraries/src/database/prisma/workspace
git commit -m "feat(workspace): add clients service"
```

---

### Task 5: Client controller and module registration

**Files:**
- Create: `apps/backend/src/api/routes/workspace/clients.controller.ts`
- Modify: `apps/backend/src/api/api.module.ts`
- Modify: `libraries/nestjs-libraries/src/database/prisma/database.module.ts`

**Interfaces:**
- Consumes: `ClientsService` from Task 4.
- Produces: five HTTP routes under `/workspace/clients`, consumed by the frontend in Task 6.

- [ ] **Step 1: Write the controller**

Create `apps/backend/src/api/routes/workspace/clients.controller.ts`:

```ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Organization } from '@prisma/client';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { ClientsService } from '@gitroom/nestjs-libraries/database/prisma/workspace/clients.service';
import { CreateClientDto } from '@gitroom/nestjs-libraries/dtos/workspace/create.client.dto';
import { UpdateClientDto } from '@gitroom/nestjs-libraries/dtos/workspace/update.client.dto';

@ApiTags('Workspace Clients')
@Controller('/workspace/clients')
export class ClientsController {
  constructor(private _clientsService: ClientsService) {}

  @Get('/')
  async getClients(
    @GetOrgFromRequest() org: Organization,
    @Query('includeArchived') includeArchived?: string
  ) {
    return this._clientsService.getClients(org.id, includeArchived === 'true');
  }

  @Get('/:id')
  async getClient(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    const client = await this._clientsService.getClient(org.id, id);

    if (!client) {
      throw new HttpException({ msg: 'Client not found' }, 404);
    }

    return client;
  }

  @Post('/')
  async createClient(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreateClientDto
  ) {
    return this._clientsService.createClient(org.id, body);
  }

  @Put('/:id')
  async updateClient(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: UpdateClientDto
  ) {
    const client = await this._clientsService.updateClient(org.id, id, body);

    if (!client) {
      throw new HttpException({ msg: 'Client not found' }, 404);
    }

    return client;
  }

  @Delete('/:id')
  async deleteClient(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    await this._clientsService.deleteClient(org.id, id);
    return { deleted: true };
  }
}
```

The organisation always comes from `@GetOrgFromRequest()` — never from the body or a query parameter. A client id belonging to another organisation matches no row and returns 404.

- [ ] **Step 2: Register the providers**

In `libraries/nestjs-libraries/src/database/prisma/database.module.ts`, add to the end of the import list:

```ts
// FDG Workspace
import { ClientsRepository } from '@gitroom/nestjs-libraries/database/prisma/workspace/clients.repository';
import { ClientsService } from '@gitroom/nestjs-libraries/database/prisma/workspace/clients.service';
```

Then add both to the `providers` array and to the `exports` array, following how `SignatureRepository` and `SignatureService` appear in each.

- [ ] **Step 3: Register the controller**

In `apps/backend/src/api/api.module.ts`, add to the end of the import list:

```ts
// FDG Workspace
import { ClientsController } from '@gitroom/backend/api/routes/workspace/clients.controller';
```

Then add `ClientsController` to the `controllers` array, next to `SignatureController`.

- [ ] **Step 4: Verify the app boots and the route responds**

```bash
pnpm run dev:backend
```

In a second terminal, once the backend reports it is listening:

```bash
curl -i http://localhost:3000/workspace/clients
```

Expected: `401` (unauthenticated), **not** `404`. A 404 means the controller is not registered. A dependency-injection error on boot means Step 2 is incomplete.

- [ ] **Step 5: Verify end to end through the browser**

Start the full stack with `pnpm run dev`, log in at `http://localhost:4200`, then in the browser devtools console:

```js
await (await fetch('/api/workspace/clients', { credentials: 'include' })).json();
```

Expected: `[]`.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/api/routes/workspace apps/backend/src/api/api.module.ts libraries/nestjs-libraries/src/database/prisma/database.module.ts
git commit -m "feat(workspace): expose clients API"
```

---

### Task 6: Clients page

**Files:**
- Create: `apps/frontend/src/components/workspace/clients.hooks.ts`
- Create: `apps/frontend/src/components/workspace/client.modal.component.tsx`
- Create: `apps/frontend/src/components/workspace/clients.list.component.tsx`
- Create: `apps/frontend/src/app/(app)/(site)/workspace/clients/page.tsx`
- Modify: `apps/frontend/src/components/layout/top.menu.tsx`

**Interfaces:**
- Consumes: the `/workspace/clients` routes from Task 5.
- Produces: a `/workspace/clients` page. Later plans reuse `useClients` from `clients.hooks.ts`.

- [ ] **Step 1: Write the SWR hook**

Create `apps/frontend/src/components/workspace/clients.hooks.ts`:

```ts
'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export const useClients = (includeArchived = false) => {
  const fetch = useFetch();

  const load = useCallback(async () => {
    return (
      await fetch(`/workspace/clients?includeArchived=${includeArchived}`)
    ).json();
  }, [includeArchived]);

  return useSWR(`workspace-clients-${includeArchived}`, load);
};
```

One `useSWR` per hook, as the repository rules require. Do not add a second query to this file.

- [ ] **Step 2: Write the create/edit modal**

Create `apps/frontend/src/components/workspace/client.modal.component.tsx`:

```tsx
'use client';

import React, { FC, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { object, string } from 'yup';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { Textarea } from '@gitroom/react/form/textarea';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useToaster } from '@gitroom/react/toaster/toaster';

const schema = object({
  name: string().required('Name is required').max(120),
  contactName: string().max(120),
  contactEmail: string().email('Must be a valid email'),
  website: string().url('Must be a valid URL'),
  notes: string().max(2000),
});

export const ClientModalComponent: FC<{
  data?: any;
  reload: () => void;
}> = (props) => {
  const { data, reload } = props;
  const fetch = useFetch();
  const modal = useModals();
  const toaster = useToaster();

  const form = useForm({
    resolver: yupResolver(schema),
    values: {
      name: data?.name || '',
      contactName: data?.contactName || '',
      contactEmail: data?.contactEmail || '',
      website: data?.website || '',
      notes: data?.notes || '',
    },
  });

  const submit = useCallback(
    async (values: any) => {
      const body = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== '')
      );

      await fetch(data ? `/workspace/clients/${data.id}` : '/workspace/clients', {
        method: data ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });

      toaster.show(data ? 'Client updated' : 'Client created', 'success');
      reload();
      modal.closeAll();
    },
    [data, reload]
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-[16px]">
        <Input label="Name" name="name" />
        <Input label="Contact name" name="contactName" />
        <Input label="Contact email" name="contactEmail" />
        <Input label="Website" name="website" />
        <Textarea label="Notes" name="notes" />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {data ? 'Save' : 'Create client'}
        </Button>
      </form>
    </FormProvider>
  );
};
```

These component APIs are verified against the codebase: `Input`
(`libraries/react-shared-libraries/src/form/input.tsx`) and `Textarea`
(`.../form/textarea.tsx`) both take `label: string` and `name: string` and read
their value through `useFormContext()`, so they must be rendered inside the
`FormProvider` as above. `Button` extends the native button props, so `type`,
`onClick` and `disabled` all work. `useModals()` exposes `openModal`, `closeAll`
and `closeById`.

- [ ] **Step 3: Write the list component**

Create `apps/frontend/src/components/workspace/clients.list.component.tsx`:

```tsx
'use client';

import React, { FC, useCallback } from 'react';
import { Button } from '@gitroom/react/form/button';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { useClients } from '@gitroom/frontend/components/workspace/clients.hooks';
import { ClientModalComponent } from '@gitroom/frontend/components/workspace/client.modal.component';

export const ClientsListComponent: FC = () => {
  const { data, mutate, isLoading } = useClients();
  const modal = useModals();
  const toaster = useToaster();
  const fetch = useFetch();

  const openClient = useCallback(
    (client?: any) => () => {
      modal.openModal({
        title: client ? 'Edit client' : 'Add client',
        withCloseButton: true,
        children: <ClientModalComponent data={client} reload={mutate} />,
      });
    },
    [mutate]
  );

  const removeClient = useCallback(
    (client: any) => async () => {
      if (
        !(await deleteDialog(
          `Delete ${client.name}? Their projects and tasks will be removed too.`
        ))
      ) {
        return;
      }

      await fetch(`/workspace/clients/${client.id}`, { method: 'DELETE' });
      toaster.show('Client deleted', 'success');
      mutate();
    },
    [mutate]
  );

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-[24px]">Clients</h1>
        <Button onClick={openClient()}>Add client</Button>
      </div>

      <div className="mt-[16px] bg-sixth border-fifth border rounded-[4px] p-[24px]">
        {isLoading && <div>Loading…</div>}

        {!isLoading && !data?.length && (
          <div className="text-center py-[32px]">
            No clients yet. Add your first one to get started.
          </div>
        )}

        {!!data?.length && (
          <div className="flex flex-col gap-[12px]">
            {data.map((client: any) => (
              <div
                key={client.id}
                className="flex items-center justify-between border-fifth border rounded-[4px] p-[16px]"
              >
                <div className="flex flex-col">
                  <div className="font-bold">{client.name}</div>
                  <div className="text-customColor18">
                    {client.contactEmail || 'No contact email'}
                  </div>
                </div>
                <div className="flex gap-[8px]">
                  <Button onClick={openClient(client)}>Edit</Button>
                  <Button onClick={removeClient(client)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Write the page**

Create `apps/frontend/src/app/(app)/(site)/workspace/clients/page.tsx`:

```tsx
import { Metadata } from 'next';
import { ClientsListComponent } from '@gitroom/frontend/components/workspace/clients.list.component';

export const metadata: Metadata = {
  title: 'Clients',
  description: '',
};

export default async function Page() {
  return <ClientsListComponent />;
}
```

- [ ] **Step 5: Add the navigation link**

In `apps/frontend/src/components/layout/top.menu.tsx`, inside `useMenuItem`, add an entry to the `firstMenu` array after the `/launches` item:

```tsx
    {
      name: t('clients', 'Clients'),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="23"
          height="23"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      path: '/workspace/clients',
    },
```

- [ ] **Step 6: Verify in the browser**

```bash
pnpm run dev
```

At `http://localhost:4200`:

1. "Clients" appears in the navigation
2. Clicking it shows the empty state
3. "Add client" opens the modal; submitting with an empty name shows a validation error
4. Creating "Acme Ltd" shows it in the list after the toast
5. Editing changes the name and the list updates
6. Deleting asks for confirmation and removes it
7. Reloading the page shows the persisted list

- [ ] **Step 7: Lint**

```bash
pnpm exec eslint apps/frontend/src/components/workspace apps/backend/src/api/routes/workspace libraries/nestjs-libraries/src/database/prisma/workspace --ext .ts,.tsx
```

Expected: no errors. Lint runs only from the repository root.

- [ ] **Step 8: Run the full test suite**

Run: `pnpm run test:workspace`
Expected: 9 passed.

- [ ] **Step 9: Commit**

```bash
git add apps/frontend/src/components/workspace apps/frontend/src/app/\(app\)/\(site\)/workspace apps/frontend/src/components/layout/top.menu.tsx
git commit -m "feat(workspace): add clients page"
```

---

## Done when

- `/workspace/clients` lists, creates, edits and deletes clients
- Every repository method is organisation-scoped, with tests proving it
- Deleting a client soft-deletes its projects and tasks in one transaction
- `pnpm run test:workspace` passes with 9 tests
- Lint is clean

## Next

Stop here for review, as the spec requires. The follow-up plan covers projects
and the four-column task board, reusing `useClients` and the same layering.
