#!/bin/sh
set -e

echo "[entrypoint] waiting for database…"
i=0
until node -e "import('./src/shared/db/pool.js').then(async ({ pingDatabase, closePool }) => { const ok = await pingDatabase(); await closePool(); process.exit(ok ? 0 : 1); }).catch(() => process.exit(1))" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "[entrypoint] database not ready after 30s — continuing anyway"
    break
  fi
  sleep 1
done

if [ "${AUTO_MIGRATE:-true}" = "true" ]; then
  echo "[entrypoint] running migrations…"
  node src/db/cli.js up
fi

if [ "${AUTO_SEED:-false}" = "true" ]; then
  echo "[entrypoint] running seed-system-admin…"
  node scripts/seed-system-admin.js || echo "[entrypoint] seed-system-admin skipped/failed"
fi

echo "[entrypoint] starting API…"
exec node src/server.js
