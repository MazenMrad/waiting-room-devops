#!/usr/bin/env bash
# Print the release tag immediately preceding the given one.
set -euo pipefail

current="${1:-$(git describe --tags --abbrev=0 2>/dev/null || true)}"

git tag --list 'v[0-9]*.[0-9]*.[0-9]*' --sort=-v:refname \
  | awk -v current="${current}" '$0 != current { print; exit }'
