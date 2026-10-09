#!/bin/sh
set -e

# Run Prisma migrations if DATABASE_URL is defined
if [ -n "$DATABASE_URL" ]; then
  echo "=> Applying pending database migrations with Prisma..."
  npx prisma migrate deploy || echo "=> Database migration failed or database is not reachable."
fi

# Start Next.js standalone server
echo "=> Launching Garment Production System on port ${PORT:-3000}..."
exec node server.js

