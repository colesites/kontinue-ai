#!/usr/bin/env bash
set -euo pipefail

if [ -x "./node_modules/.bin/convex" ]; then
  CONVEX_BIN="./node_modules/.bin/convex"
elif [ -x "./web/node_modules/.bin/convex" ]; then
  CONVEX_BIN="./web/node_modules/.bin/convex"
else
  echo "Convex CLI not found. Run \`bun install\` in the repo root (or \`bun install\` in web/)." >&2
  exit 1
fi

exec "$CONVEX_BIN" "$@"
