# Waiting Room — DevOps mini-project

A small Next.js waiting-room app used as a support for the DevOps chain: the application code is
not graded, the delivery chain is.

## Quick start (one command)

```bash
docker compose up -d --build
```

Open <http://localhost:3000>. Health endpoint: <http://localhost:3000/health>.
Stop with `docker compose down` (add `-v` to also drop the database volume).

Prerequisites: Docker with Compose v2, Git, Node 20+ (only for local development/tests).

## Architecture

```
Browser ──> app (Next.js standalone, non-root, :3000) ──> db (PostgreSQL 16)
                     │  /health                                  │
                     └── named volume "db_data" ◄────────────────┘
```

- `app` reaches the database by service name `db` (`DATABASE_URL=postgres://...@db:5432/...`).
- The database port is **not** published; only `app` publishes `:3000`.
- `db_data` is a named volume, so tickets survive container recreation.
- `app` starts only after `db` is healthy (`depends_on.condition: service_healthy`).
- `Dockerfile`: multi-stage, pinned base, explicit image tag, `USER nextjs` (uid 1001), `HEALTHCHECK`.
- `.dockerignore` keeps Git metadata, docs, tests and local env files out of the build context.

## Local development

```bash
npm ci
npm test
docker compose up -d db
DATABASE_URL=postgres://waiting:waiting@localhost:5433/waiting_room npm run dev
```

> Compose does not publish the DB port on purpose. For local `npm run dev`, add
> `ports: ["5433:5432"]` temporarily to the `db` service, or run everything in containers.

## Git workflow

- `main` is protected: no direct push, required status checks (`Test (Node 20)`,
  `Test (Node 22)`, `Build image`), 1 approval, branches must be up to date.
- Work on `feature/<topic>` → open a Pull Request (GitHub's equivalent of a merge request)
  using `.github/PULL_REQUEST_TEMPLATE.md`.
- Commit format: `feat: add ticket counter`, `fix: handle empty queue`, `ci: add matrix`, etc.
- No secret is ever committed. Only `${{ secrets.GITHUB_TOKEN }}` is used, and `.env` is ignored.

To enable protection: **Settings → Branches → Add branch ruleset** targeting `main`, enable
"Require a pull request before merging", "Require status checks to pass" and select the three
checks above.

## CI/CD

| Workflow | Trigger | What it does |
|---|---|---|
| `.github/workflows/ci.yml` | PR to `main` and push to `main` | `test` job runs on Node 20 and 22, uploads `junit.xml` as an artefact; `build` job has `needs: test`, builds the image, and pushes it to GHCR only on `main` as `sha-<commit>` + `main`. |
| `.github/workflows/release.yml` | tag `v*.*.*` | Promotes the tested `sha-<commit>` image to the version tag with `docker buildx imagetools create` — **the image is never rebuilt** — then deploys to the test environment and runs `/health`. |
| `.github/workflows/rollback.yml` | manual `workflow_dispatch` with a version | Verifies the published image and redeploys it, then runs `/health`. |

The "test environment" is the GitHub-hosted runner itself: `scripts/deploy.sh` pulls the
published image and runs `docker compose up -d --no-build`, so no SSH server is needed. Each run
is ephemeral and shows the health check result in its log.

### Scripts (control points)

- `scripts/healthcheck.sh` — polls `/health`, exits `0` on `"status":"ok"`, exits `1` otherwise.
- `scripts/deploy.sh` — pulls `APP_IMAGE`, recreates the containers, verifies health.
- `scripts/rollback.sh` — same control path for a previously published tag.
- `scripts/previous-version.sh` — prints the release tag before the current one.

## Soutenance — demo script

1. **Green PR:** push `feature/demo` with a passing change → PR → show CI green, the two matrix
   jobs and the downloaded `junit.xml` artefact.
2. **Red PR:** in a second PR, temporarily break `tests/queue.test.mjs` (e.g. expect
   `ticketCode(1)` to be `'B001'`). Show the failed check and the first useful line in the log:
   `AssertionError: Expected values to be strictly equal: 'A001' !== 'B001'`. Revert in the PR.
3. **Deploy:** create and push tag `v0.1.0` → show `Release` promoting the image and
   `[healthcheck] OK ... {"status":"ok","db":"ok","version":"v0.1.0"}`.
4. **Rollback:** push tag `v0.2.0`, then run `Rollback` with `version: v0.1.0` → show
   `[rollback] successfully rolled back to ghcr.io/<owner>/<repo>:v0.1.0`.

Pipeline runs (recorded on `MazenMrad/waiting-room-devops`):

- Successful PR run (green): <https://github.com/MazenMrad/waiting-room-devops/actions/runs/45074973852>
- Failed PR run (first useful error: `repository name must be lowercase`): <https://github.com/MazenMrad/waiting-room-devops/actions/runs/45074576435>
- Deployment run (tag `v0.1.0`): <https://github.com/MazenMrad/waiting-room-devops/actions/runs/45075725592>
- Rollback run (back to `v0.1.0`): <https://github.com/MazenMrad/waiting-room-devops/actions/runs/45075925578>

## Coverage of the grading grid

| # | Requirement | Where |
|---|---|---|
| 1 | Clean Git, branches, PRs, `.gitignore`, no secrets | Git history, `.github/PULL_REQUEST_TEMPLATE.md`, `.gitignore` |
| 2 | Bash control script, `0`/non-zero | `scripts/healthcheck.sh` |
| 3 | Dockerfile, `.dockerignore`, explicit tag, non-root, `HEALTHCHECK` | `Dockerfile`, `.dockerignore`, workflow tags |
| 4 | Compose: app + DB, service name, no published DB port, volume, health-gated start | `docker-compose.yml` |
| 5 | CI on PR, tests → image with `needs`, test report artefact | `.github/workflows/ci.yml` |
| 6 | `vX.Y.Z` tag, published never rebuilt image, deploy + health check | `.github/workflows/release.yml` |
| 7 | Rollback demonstrated | `.github/workflows/rollback.yml` |
| +1 | Protected `main` | branch ruleset (instructions above) |
| +2 | Auto-deploy on tag | `release.yml` |
| +1 | Version matrix | `ci.yml` `matrix.node: ['20','22']` |

See `docs/FICHE.md` for the one-page architecture/deployment/rollback sheet.
