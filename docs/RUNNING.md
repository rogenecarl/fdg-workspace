# Running FDG Workspace

Everything below assumes first-time setup is already done. If you are on a fresh
machine, jump to [First-time setup](#first-time-setup) and come back.

## Every time

**1. Start Docker Desktop** on Windows and wait for the whale icon in the system
tray to stop animating. Docker Desktop running on Windows and Docker working
inside WSL are two different things — see
[Docker is not found](#docker-is-not-found) if it does not.

**2. Start the services, then check Temporal survived:**

```bash
cd ~/Bajig/Projects/review-revolution/postiz-app
pnpm run dev:docker
docker ps --format '{{.Names}}' | grep -qx temporal || docker start temporal
```

That second line is not optional. See
[Temporal loses a startup race](#temporal-loses-a-startup-race).

**3. Start the app:**

```bash
pnpm run dev
```

Leave it running. `Ctrl+C` stops everything.

**4. Wait for it to actually be ready.** "Starting compilation in watch mode" is
the *beginning*, not the end. The first compile takes one to three minutes. Wait
for lines like:

```
apps/frontend dev: ✓ Ready in 45s
apps/backend dev:  Nest application successfully started
```

**5. Open <http://localhost:4200>.**

## Where things are

| URL | What |
|---|---|
| <http://localhost:4200> | The app. Logged out, you get the landing page. |
| <http://localhost:3000> | Backend API (Swagger) |
| <http://localhost:8080> | Temporal — watch scheduled posts fire |
| <http://localhost:8085> | pgAdmin — `admin@admin.com` / `admin` |
| <http://localhost:5540> | RedisInsight |

To connect pgAdmin to the database: host `postiz-postgres`, port `5432`,
database `postiz-db-local`, user `postiz-local`, password `postiz-local-pwd`.

## Lighter run

Frontend and backend only — skips the Temporal worker and the browser
extension, so it starts faster and uses about half the memory:

```bash
pnpm run dev-backend
```

Scheduled posts will **not** publish without the orchestrator, so use the full
`pnpm run dev` whenever you are testing social scheduling.

## Common commands

```bash
pnpm run test:workspace     # the workspace test suite
pnpm run prisma-generate    # after editing schema.prisma
pnpm run prisma-db-push     # push schema changes to the database
docker compose -f ./docker-compose.dev.yaml down    # stop the containers
```

Linting only runs from the repository root. Note that `pnpm exec eslint`
currently fails repo-wide with `Converting circular structure to JSON` — a
pre-existing problem in the upstream ESLint config, not caused by workspace
code. TypeScript compilation and the tests still cover correctness.

---

## Troubleshooting

### Temporal loses a startup race

**Symptom:** the backend refuses to start, with:

```
Backend failed to start on port 3000
Error: 14 UNAVAILABLE: connect ECONNREFUSED 127.0.0.1:7233
```

**Cause:** Temporal's auto-setup image runs its schema setup before its *own*
Postgres has finished initialising, fails, and the container exits:

```
ERROR  unable to refresh database connection pool: "the database system is starting up"
ERROR  Unable to setup SQL schema: "no usable database connection found"
```

The backend requires Temporal at boot, so it dies too. This happens on most cold
starts.

**Fix:**

```bash
docker start temporal
```

Then restart the backend — press `rs` then Enter in the `pnpm run dev` terminal,
or `Ctrl+C` and start it again.

**Prevention:** always run the `docker ps ... || docker start temporal` line from
step 2. Confirm with:

```bash
docker exec temporal-admin-tools temporal operator cluster health
# expect: SERVING
```

### Docker is not found

**Symptom:**

```
The command 'docker' could not be found in this WSL 2 distro.
```

or a stale mount:

```
ls: cannot access '/mnt/wsl/docker-desktop/cli-tools/usr/bin/': Input/output error
```

**Cause:** WSL integration is off for this distro, or Docker Desktop updated and
left the old mount behind.

**Fix:** Docker Desktop → **Settings → Resources → WSL Integration** → enable
**Ubuntu** → **Apply & Restart**. If the mount is stale, toggle it off, apply,
then back on. Verify with `docker version` — you want a **Server** version, not
just a client.

### Port already in use

**Symptom:** `EADDRINUSE: address already in use :::4200`

**Cause:** a stale process from a previous run.

**Fix:**

```bash
ss -ltnp | grep 4200     # find the PID
kill -9 <PID>
```

### Out of memory

**Symptom:**

```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Cause:** `pnpm run dev` starts four Node processes, each compiling this
monorepo. Node's default heap ceiling is about 2GB per process, and WSL2 gets
half the host's RAM by default.

**Fixes, in order of preference:**

1. Give WSL more memory. Create `C:\Users\<you>\.wslconfig`:

   ```ini
   [wsl2]
   memory=10GB
   processors=8
   swap=2GB
   ```

   Then `wsl --shutdown` in PowerShell and reopen your terminal. Save it with
   Notepad's "Save as type" set to **All Files**, or you get `.wslconfig.txt`,
   which Windows ignores.

2. Raise the per-process ceiling: `export NODE_OPTIONS="--max-old-space-size=3072"`
3. Run fewer processes: `pnpm run dev-backend`

Check what you actually have with `free -h`.

### Changes to `.env` do nothing

`dotenv` reads the file once at process start. Restart `pnpm run dev`.

### "Slow filesystem detected"

Harmless as long as the project lives under your Linux home directory, which it
does. It would be a real problem if the path were under `/mnt/c/`, because
crossing the Windows filesystem boundary is very slow. Never move the project
there.

### `pnpm: command not found` after switching Node

nvm gives each Node version its own global packages. Reinstall pnpm under the
active version:

```bash
npm install -g pnpm@10.6.1
```

Do **not** use `corepack prepare` on Node 22.12.0 — it ships signing keys that
have since rotated and fails with `Cannot find matching keyid`.

---

## First-time setup

Only needed on a new machine.

**Requirements:** Node 22.12.x (the project will not build on 24), pnpm 10.6.1,
Docker Desktop with WSL integration, and at least 8GB available to WSL.

```bash
# 1. Node
nvm install 22.12.0 && nvm alias default 22.12.0 && nvm use 22.12.0
npm install -g pnpm@10.6.1

# 2. Submodules
git submodule update --init --recursive

# 3. Environment
cp .env.example .env
```

Edit `.env`. The credentials in `.env.example` **do not match** the Docker
Compose file, which is the single most common way to lose an hour here:

```bash
DATABASE_URL="postgresql://postiz-local:postiz-local-pwd@localhost:5432/postiz-db-local"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="<openssl rand -base64 48>"
FRONTEND_URL="http://localhost:4200"
NEXT_PUBLIC_BACKEND_URL="http://localhost:3000"
BACKEND_INTERNAL_URL="http://localhost:3000"
STORAGE_PROVIDER="local"
```

Leave `RESEND_API_KEY` commented out so new accounts activate without an email
service. Leave `POSTIZ_GENERIC_OAUTH` empty — with the value `"false"` it used
to switch the generic OAuth button *on*, since environment variables are
strings; the layouts now compare against `'true'`, but empty is still clearest.

```bash
# 4. Dependencies (postinstall runs prisma generate)
pnpm install

# 5. Services
pnpm run dev:docker
docker ps --format '{{.Names}}' | grep -qx temporal || docker start temporal

# 6. Create the tables
pnpm run prisma-db-push

# 7. Run
pnpm run dev
```

Then register an account at <http://localhost:4200>.

---

## Connecting social channels

The Add Channel screen lists **every** provider whether or not you have
configured credentials for it, so the list does not tell you what is ready.
Clicking an unconfigured provider fails with an OAuth error.

**Work with no setup at all** — credentials are typed into the UI:
Bluesky, Mastodon, Nostr, Dev.to, Medium, WordPress, Lemmy.

Bluesky is the fastest way to prove the whole chain works: create a free account
at bsky.app, go to **Settings → Privacy and Security → App Passwords**, then in
the app choose **Add Channel → Bluesky** with service `https://bsky.social`,
your handle, and that app password. Schedule a post a couple of minutes out and
watch it publish. The orchestrator must be running, so use `pnpm run dev`.

**Need a developer app** (client ID and secret in `.env`, then a restart):
everything else. Google and YouTube share `YOUTUBE_CLIENT_ID` /
`YOUTUBE_CLIENT_SECRET`.

**Need a public HTTPS domain, so they cannot be tested on localhost:**
Instagram, Facebook, TikTok, LinkedIn, X, Pinterest. Meta and TikTok also review
applications manually, which takes weeks and can be rejected.

Because OAuth callback URLs are registered per platform against an exact
address, **settle the production domain before submitting anything**. Changing it
later means re-registering with every platform and every client reconnecting
their channels.

---

## Staying current with upstream

This project is a fork of [Postiz](https://github.com/gitroomhq/postiz-app),
which ships regular fixes for social platform API changes.

```bash
git fetch upstream
git merge upstream/main
```

Do it monthly — it takes minutes. Leaving it a year does not.

To keep merges clean, add new code under `workspace/` folders rather than
editing existing files, and never modify
`libraries/nestjs-libraries/src/integrations/**`, which is the code that
receives those upstream fixes.

Files where FDG code does touch upstream, each marked with an
`FDG Workspace` comment:

- `libraries/nestjs-libraries/src/database/prisma/schema.prisma`
- `libraries/nestjs-libraries/src/database/prisma/database.module.ts`
- `apps/backend/src/api/api.module.ts`
- `apps/frontend/src/components/layout/top.menu.tsx`
- `apps/frontend/src/proxy.ts`
- `apps/frontend/src/app/(app)/auth/layout.tsx`
- `apps/frontend/src/app/(app)/layout.tsx`,
  `(provider)/layout.tsx`, `(extension)/layout.tsx`
