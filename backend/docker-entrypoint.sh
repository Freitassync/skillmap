#!/bin/sh
set -e

echo "Starting SkillMap Backend..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until pg_isready -h postgres -U ${POSTGRES_USER:-skillmap} > /dev/null 2>&1; do
  echo "   Postgres is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL is ready"

# Run migrations (includes seed data migration)
echo "Running database migrations (including seed data)..."
npx prisma migrate deploy
echo "Migrations completed"

# Start the application
echo "Starting application..."
exec node dist/index.js
