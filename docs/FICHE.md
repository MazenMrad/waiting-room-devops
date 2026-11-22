# Fiche — Waiting Room (1 page)

## Architecture

```
Browser ──HTTP :3000──> app : Next.js 15 standalone (node:22-alpine, USER nextjs)
                           │  GET /health  →  SELECT 1
                           │  DATABASE_URL=postgres://waiting:waiting@db:5432/waiting_room
                           ▼
                        db : postgres:16-alpine  (port NOT published)
                           │
                           ▼
                     volume db_data  (persistent tickets)
```

`app` waits for `db` health (`depends_on: service_healthy`). Start: `docker compose up -d --build`.

## Delivery chain

```
feature branch ──PR──> CI: test (Node 20 | 22) + JUnit artefact
                            │ needs
                            ▼
                       build image ──push on main──> GHCR :sha-<commit>
                                                          │ tag vX.Y.Z
                                                          ▼
                                          imagetools promote (NO rebuild)
                                                          │
                                                          ▼
                                   deploy on runner: compose pull + up --no-build
                                                          │
                                                          ▼
                                            scripts/healthcheck.sh → /health
```

## Version deployed

Published image: `ghcr.io/<owner>/<repo>:<version>` — version = git tag, immutable, promoted from
the image built on the commit the tag points to. The running version is returned by `/health`
(`"version":"vX.Y.Z"`) and displayed in the page footer.

To deploy: `git tag v0.1.0 && git push origin v0.1.0` → workflow `Release`.

## Rollback sequence

1. Trigger `Rollback` (`workflow_dispatch`) with `version: v0.1.0` (previous tag; find it with
   `bash scripts/previous-version.sh v0.2.0`).
2. Workflow checks `docker buildx imagetools inspect ghcr.io/<owner>/<repo>:v0.1.0`.
3. `scripts/rollback.sh` runs `docker compose pull app`, `docker compose up -d --no-build`, then
   `scripts/healthcheck.sh`.
4. Success = `[rollback] successfully rolled back ...` + `/health` reports `version: v0.1.0`.
   Failure = script exits non-zero and the workflow is red; the previous container stays up.

## Evidence for the soutenance

- Green PR run: `<paste URL>`
- Red PR run + first error line: `<paste URL>` / `AssertionError: 'A001' !== 'B001'`
- Deployment run: `<paste URL>`
- Rollback run: `<paste URL>`
