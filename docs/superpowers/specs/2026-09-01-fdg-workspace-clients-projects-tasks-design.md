# FDG Workspace — Clients, Projects and Tasks

**Date:** 2026-09-01
**Status:** Approved, ready for implementation planning
**Scope:** Sub-project 1 of 5

## Context

FDG is a marketing agency that currently runs on a stack of third-party tools —
Trello for work tracking, Metricool for social scheduling, DocuSign for
agreements, and others. The goal is to replace them with one system the agency
owns, with a client portal so clients can see their work progress directly.

This codebase is a fork of [Postiz](https://github.com/gitroomhq/postiz-app),
which already provides social scheduling, publishing to 35+ platforms, analytics,
a media library, authentication, organisations, team invitations and roles. It
provides nothing for project or task management.

The full product brief covers five independent subsystems:

1. **Projects and tasks** — this spec
2. Client portal
3. Social post approval workflow
4. Contracts and e-signature
5. Client onboarding

Each gets its own design cycle. This spec covers only the first, because
everything else depends on it: the portal is a scoped view of projects and tasks,
approvals attach to them, and onboarding produces them.

## Goals

- FDG staff can manage a list of clients, with contact details and status
- Each client has projects, with a status and a due date
- Each project has tasks on a four-column board, draggable between columns
- Tasks can be assigned to a team member and given a due date and priority
- The schema anticipates the client portal without needing a later migration

## Non-goals

Explicitly out of scope, to be handled in later specs:

- Client login and the portal itself
- Linking projects or tasks to social posts
- Contracts, signatures, onboarding
- Time tracking, invoicing, file attachments on tasks
- Custom board columns per project
- Notifications and activity feeds

## Key decisions

### New `Client` model rather than reusing Postiz's `Customer`

Postiz has a `Customer` model (`id`, `name`, `orgId`, `integrations[]`) which
exists solely to group social channels. Reusing it would mean adding contact
details, status and notes to a model that upstream owns, producing a merge
conflict every time Postiz touches it.

A separate `Client` table costs one extra table and stays entirely ours. The two
will be linked in the social-approval spec via a nullable `Client.postizCustomerId`.
Nothing in this slice needs that link, so it is not built now.

### Fixed board columns rather than per-project columns

Task status is a four-value enum (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`) rather
than a `Column` table with ordering. Every project's board looks the same.

This removes a table, the column-management UI, and column reordering logic. If
per-project columns are needed later, the enum migrates to a table without
disturbing the rest of the model.

### Internal-only, with `visibleToClient` from day one

No client-facing access in this slice. But `Task.visibleToClient` ships now,
defaulting to `false`, so the portal can be built later without a migration
against a table that already holds production data.

### Follow the codebase's existing module conventions

Postiz registers all controllers in `apps/backend/src/api/api.module.ts` and all
services and repositories in the `@Global()`
`libraries/nestjs-libraries/src/database/prisma/database.module.ts`. There is no
per-feature NestJS module anywhere in this codebase, so introducing one would be
an unfamiliar pattern. We follow the existing convention.

## Data model

Appended to the bottom of
`libraries/nestjs-libraries/src/database/prisma/schema.prisma`.

```prisma
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

### Edits to Postiz-owned models

Four lines, required for Prisma's bidirectional relations:

| Model | Line added |
|---|---|
| `Organization` | `clients Client[]` |
| `Organization` | `projects Project[]` |
| `Organization` | `tasks Task[]` |
| `User` | `assignedTasks Task[]` |

These are the only changes to upstream models. They are additive and merge
cleanly.

### Conventions followed

- Every table carries `organizationId`; every query filters on it. This is what
  prevents cross-organisation data access and matches every existing model.
- `deletedAt` for soft deletes, matching the codebase throughout.
- `uuid()` primary keys, matching `Customer`, `Signatures` and `Comments`.

## Architecture

Three vertical slices, each following the repository's mandated
`DTO → Controller → Service → Repository` layering.

### Files added

```
libraries/nestjs-libraries/src/dtos/workspace/
  create.client.dto.ts
  update.client.dto.ts
  create.project.dto.ts
  update.project.dto.ts
  create.task.dto.ts
  update.task.dto.ts
  move.task.dto.ts

libraries/nestjs-libraries/src/database/prisma/workspace/
  clients.repository.ts
  clients.service.ts
  projects.repository.ts
  projects.service.ts
  tasks.repository.ts
  tasks.service.ts

apps/backend/src/api/routes/workspace/
  clients.controller.ts
  projects.controller.ts
  tasks.controller.ts

apps/frontend/src/app/(app)/(site)/workspace/clients/page.tsx
apps/frontend/src/app/(app)/(site)/workspace/projects/[id]/page.tsx

apps/frontend/src/components/workspace/
  clients.list.component.tsx
  client.modal.component.tsx
  projects.list.component.tsx
  project.modal.component.tsx
  task.board.component.tsx
  task.card.component.tsx
  task.modal.component.tsx
```

### Files edited

| File | Change |
|---|---|
| `schema.prisma` | Append enums and models; 4 relation lines on `Organization`/`User` |
| `apps/backend/src/api/api.module.ts` | 3 controller imports + 3 array entries |
| `.../database.module.ts` | 6 provider imports + 6 array entries |
| The sidebar navigation component | Links to the new pages |

The two module files are the known merge hot spots. Imports go in one contiguous
block at the end of the import list, marked with a `// FDG Workspace` comment, so
conflicts are obvious and trivial to resolve.

### Layer responsibilities

**Controller** — HTTP surface only. Reads the organisation from
`@GetOrgFromRequest()`, validates the body through a DTO, delegates to the
service. No logic. Mirrors `signature.controller.ts`.

**Service** — business rules. In this slice most methods pass straight through to
the repository, matching `signature.service.ts`. Two exceptions carry real logic:
archiving a client, and reordering tasks.

**Repository** — Prisma access only, via
`PrismaRepository<'client' | 'project' | 'task'>`. Every query includes
`organizationId` and `deletedAt: null`. Deletes are soft.

## API

All routes sit under the existing authenticated API, so the org comes from the
session and never from the request body.

### Clients

| Method | Path | Purpose |
|---|---|---|
| GET | `/workspace/clients` | List, newest first, excluding archived unless `?includeArchived=true` |
| GET | `/workspace/clients/:id` | One client with its projects |
| POST | `/workspace/clients` | Create |
| PUT | `/workspace/clients/:id` | Update |
| DELETE | `/workspace/clients/:id` | Soft delete |

### Projects

| Method | Path | Purpose |
|---|---|---|
| GET | `/workspace/projects?clientId=` | List, optionally filtered by client |
| GET | `/workspace/projects/:id` | One project with its tasks |
| POST | `/workspace/projects` | Create |
| PUT | `/workspace/projects/:id` | Update |
| DELETE | `/workspace/projects/:id` | Soft delete |

### Tasks

| Method | Path | Purpose |
|---|---|---|
| GET | `/workspace/tasks?projectId=` | All tasks for a project, ordered by status then position |
| POST | `/workspace/tasks` | Create — appended to the end of its column |
| PUT | `/workspace/tasks/:id` | Update fields |
| PUT | `/workspace/tasks/:id/move` | Move to a column and index |
| DELETE | `/workspace/tasks/:id` | Soft delete |

### Task ordering

`Task.position` is an integer giving a task's index within its column. It is
kept contiguous by the application rather than enforced with a database
constraint — a unique constraint would fail on the intermediate states of a
reorder. A move sends the target status and target index:

```json
{ "status": "IN_PROGRESS", "position": 2 }
```

The repository handles this in a single Prisma transaction:

1. Read all non-deleted tasks in the destination column, ordered by position
2. Remove the moved task from its source column's ordering
3. Insert it at the target index
4. Rewrite `position` as `0..n` for both affected columns

Rewriting the whole column is O(n) but n is small — a board column holds tens of
tasks, not thousands. It is simpler and less error-prone than fractional
indexing, and it self-heals any drift.

## Frontend

Pages live under the existing `(app)/(site)` route group so they inherit the
authenticated layout and sidebar.

- `/workspace/clients` — client list, with a create/edit modal
- `/workspace/projects/[id]` — one project's task board

Data fetching uses SWR through the existing `useFetch` hook from
`@gitroom/helpers/utils/custom.fetch`. Per the repository's rules, each SWR call
lives in its own hook and complies with `react-hooks/rules-of-hooks` — no
`eslint-disable` on hook rules:

```ts
export const useClients = () => {
  const fetch = useFetch();
  return useSWR('/workspace/clients', async (url) =>
    (await fetch(url)).json()
  );
};
```

Drag-and-drop uses `react-dnd` with `react-dnd-html5-backend`, both already
dependencies used elsewhere in the codebase. No new packages are added.

Styling uses Tailwind 3 with the tokens in `apps/frontend/src/app/colors.scss`.
Deprecated `--color-custom*` variables are not used. Components are written
natively rather than pulled from npm, matching the repository's rules.

## Error handling

- **Validation** — `class-validator` DTOs, consistent with every other route.
  Invalid input returns 400 with field detail.
- **Cross-organisation access** — every repository query is scoped by
  `organizationId`. A request for another org's resource matches no row: reads
  return `null` and the controller returns 404; writes throw Prisma's
  `RecordNotFound`, surfacing as 404. There is no code path that returns another
  organisation's data.
- **Deleting a client with projects** — allowed. The client is soft-deleted and
  its projects are soft-deleted with it, in one transaction. Tasks follow.
- **Invalid move target** — a `position` beyond the column length clamps to the
  end rather than erroring.
- **Missing assignee** — `assigneeId` is validated as a member of the
  organisation before being written; an outside user is rejected with 400.

## Testing

Jest is already configured with `jest-mock-extended`.

**Repository tests** — mock `PrismaRepository`, assert the Prisma queries are
built correctly. Critical cases: every query includes `organizationId` and
`deletedAt: null`; deletes set `deletedAt` rather than removing rows; the
reordering transaction produces a contiguous `0..n` sequence.

**Service tests** — mock the repository. Cover the two methods with real logic:
client archival cascading to projects and tasks, and task reordering across
columns.

**Controller tests** — mock the service. Confirm DTO validation rejects bad
input and that the org id comes from the session rather than the body.

The highest-value test is the reordering transaction: it is the only non-trivial
algorithm in the slice, and an off-by-one there corrupts board order in a way
users notice immediately.

## Build order

Each step is independently usable and ends with something visible in the browser.

1. **Clients** — schema, migration, repository, service, controller, list page,
   create/edit modal. Proves the whole vertical.
2. **Projects** — nested under a client, with status and dates.
3. **Task board** — four columns, drag and drop, task modal.

Work stops after step 1 for review before continuing.

## Risks

**Merge conflicts in the two module files.** Mitigated by grouping imports in a
marked block. Reviewed at each monthly upstream merge.

**`Client` and `Customer` both existing** is a genuine source of developer
confusion. Mitigated by a comment above the `Client` model in the schema stating
that `Customer` is Postiz's social-channel grouping and `Client` is FDG's
business record, and by never using the words interchangeably in code.

**Scope creep into the portal.** The `visibleToClient` field exists but nothing
reads it in this slice. It must stay unread until the portal spec is written.
