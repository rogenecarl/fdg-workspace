# FDG Workspace

The internal operating system for FDG — projects, clients, and social media in one place.

Instead of paying for Trello, Metricool, DocuSign and a handful of other tools and
trying to make them talk to each other, FDG Workspace brings everything the agency
does into a single system, with a client portal on top so every client can see
exactly what's happening with their work in real time.

## Status

Early development. The social publishing engine is working; the workspace features
are being built on top of it.

### Working now

- **Social scheduling** — connect a client's channels and publish to 35+ platforms
  (Instagram, Facebook, X, LinkedIn, TikTok, YouTube, Threads, Pinterest, Bluesky,
  Mastodon, Discord, Slack and more)
- **Write once, publish everywhere** — one piece of content fanned out across
  channels, with per-platform edits and settings (YouTube titles, Reddit flair,
  Pinterest boards, and so on)
- **Content calendar** with scheduling, drafts and queues
- **Analytics** per channel and per post
- **Media library** with image and video handling
- **Teams and roles**

### In progress

- **Clients** — the agency's client list, contacts and status
- **Projects** — scoped work per client, with deadlines and status
- **Tasks** — a four-column board (To Do / In Progress / Review / Done)

### Planned

- **Client portal** — clients log in and see their own projects, deadlines and
  progress
- **Post approvals** — clients approve social content before it publishes
- **Contracts and e-signature** — agreements signed without leaving the system
- **Client onboarding** — structured intake for new clients

## Tech stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| Frontend | Next.js 16, React 19, Tailwind 3, SWR |
| Backend | NestJS 11 |
| Background jobs | Temporal (scheduled publishing, token refresh) |
| Database | PostgreSQL + Prisma |
| Cache / queues | Redis |
| Storage | Cloudflare R2 (or local disk in development) |

### Layout

```
apps/
  frontend/       Next.js app (port 4200)
  backend/        NestJS API (port 3000)
  orchestrator/   Temporal workers — scheduled publishing
  extension/      Chrome extension for cookie-based platforms
libraries/
  nestjs-libraries/  Prisma schema, services, social providers
  helpers/           Shared utilities
  react-shared-libraries/  Shared React components
```

## Getting started

> Already set up and just need to start it? See **[docs/RUNNING.md](docs/RUNNING.md)**
> for the daily commands and every problem this stack is known to throw.

**Requirements:** Node 22.12.x (the project will not build on 24), pnpm 10.6.1,
and Docker.

```bash
# 1. Submodules
git submodule update --init --recursive

# 2. Environment
cp .env.example .env
```

Edit `.env` and set at minimum:

```bash
DATABASE_URL="postgresql://postiz-local:postiz-local-pwd@localhost:5432/postiz-db-local"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="<generate with: openssl rand -base64 48>"
FRONTEND_URL="http://localhost:4200"
NEXT_PUBLIC_BACKEND_URL="http://localhost:3000"
BACKEND_INTERNAL_URL="http://localhost:3000"
STORAGE_PROVIDER="local"
```

Note that the credentials in `.env.example` do not match the Docker Compose
defaults — use the `DATABASE_URL` above.

Leave `RESEND_API_KEY` commented out so new accounts activate without email.

```bash
# 3. Infrastructure (Postgres, Redis, Temporal)
pnpm run dev:docker

# 4. Dependencies (runs prisma generate automatically)
pnpm install

# 5. Create the database tables
pnpm run prisma-db-push

# 6. Run everything
pnpm run dev
```

Then open http://localhost:4200 and register.

### Local dashboards

| URL | What |
|---|---|
| http://localhost:4200 | The app |
| http://localhost:3000 | API (Swagger) |
| http://localhost:8080 | Temporal UI — inspect scheduled jobs |
| http://localhost:8085 | pgAdmin (`admin@admin.com` / `admin`) |
| http://localhost:5540 | RedisInsight |

### Common commands

```bash
pnpm run dev                # everything
pnpm run dev-backend        # frontend + backend only (no Temporal)
pnpm run prisma-generate    # after editing schema.prisma
pnpm run prisma-db-push     # push schema changes to the database
pnpm test                   # Jest
```

Linting runs only from the repository root.

## Social platform setup

Connecting client channels requires FDG's **own** approved developer apps for each
platform — Meta, TikTok, LinkedIn, X, YouTube and Pinterest each need their own
app with the right permissions, and app review takes weeks. Credentials go in
`.env` (`FACEBOOK_APP_ID`, `TIKTOK_CLIENT_ID`, and so on).

The OAuth callback URL is registered with each platform, so **the production
domain must be settled before app review**. Changing it later means
re-registering everywhere and every client reconnecting their channels.

## Deployment

Production runs on Docker Compose: the app container plus Postgres, Redis and
Temporal (which brings its own Postgres and Elasticsearch). Budget 8GB RAM.

Because this is a fork with its own features, the production image must be built
from this repository rather than pulled from upstream:

```bash
docker build --target dist -t fdg-workspace -f Dockerfile.dev .
```

Set `STORAGE_PROVIDER="cloudflare"` in production — local disk does not survive
container restarts, and it holds every client's media.

## Staying up to date

This project is built on Postiz, which ships regular fixes for social platform
API changes. Merge them in monthly:

```bash
git fetch upstream
git merge upstream/main
```

Merging monthly takes minutes. Leaving it a year does not. To keep merges clean,
add new code in the `workspace/` folders rather than editing existing files, and
never modify `libraries/nestjs-libraries/src/integrations/**` — that is the code
that receives upstream fixes.

## Built on Postiz

FDG Workspace is built on [Postiz](https://github.com/gitroomhq/postiz-app), an
open-source social media scheduling tool, and is licensed under the
[AGPL-3.0](LICENSE) accordingly.
