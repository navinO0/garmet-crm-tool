#!/bin/sh
set -e

# Optional: Run Prisma db push if DATABASE_URL is defined
if [ -n "$DATABASE_URL" ]; then
  echo "=> Checking/Synchronizing database schema with Prisma..."
  npx prisma db push --skip-generate 2>/dev/null || echo "=> Database push skipped or will be handled externally."
fi

# Start Next.js standalone server
echo "=> Launching Garment Production System on port ${PORT:-3000}..."
exec node server.js

