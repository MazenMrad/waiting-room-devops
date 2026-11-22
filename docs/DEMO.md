# Demo script

Commands used during the soutenance. Replace `<owner>` with the GitHub user or organisation.

## 1. Start the app locally

```bash
docker compose up -d --build
bash scripts/healthcheck.sh
```

Expected: `{"status":"ok","db":"ok","version":"local"}`.

## 2. Green pipeline

Push a branch, open a pull request to `main`, and show the CI run with the Node 20 and Node 22
matrix jobs, the `build` job after `needs: test`, and the `junit.xml` artefact.

## 3. Red pipeline

In a throwaway pull request, change the expected value in `tests/queue.test.mjs` from `A001` to
`B001`. The `test` job fails and the log starts with:

```
AssertionError: Expected values to be strictly equal:
'A001' !== 'B001'
```

Close the pull request without merging.

## 4. Deploy a version

```bash
git tag v0.1.0
git push origin v0.1.0
```

The `Release` workflow promotes the image built on that commit and deploys it. `/health` reports
`"version":"v0.1.0"`.

## 5. Roll back

Run the `Rollback` workflow with `version: v0.1.0`. `scripts/rollback.sh` pulls the old tag,
recreates the app, and verifies health.
