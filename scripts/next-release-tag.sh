#!/usr/bin/env bash
# Print the next CalVer release tag for an annotated git tag on main.
# Scheme: vYYYY.MM.DD, then vYYYY.MM.DD.2, .3, … for same-day re-releases.
set -euo pipefail

DATE="$(date -u +%Y.%m.%d)"
BASE="v${DATE}"

if ! git rev-parse -q --verify "refs/tags/${BASE}" >/dev/null 2>&1; then
  echo "${BASE}"
  exit 0
fi

n=2
while git rev-parse -q --verify "refs/tags/${BASE}.${n}" >/dev/null 2>&1; do
  n=$((n + 1))
done
echo "${BASE}.${n}"
