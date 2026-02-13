#!/bin/sh
set -e

echo "Waiting for database..."
sleep 3

echo "Running migrations..."
node src/db/migrate.js

echo "Running seed..."
node src/db/seed.js

echo "Starting server..."
exec "$@"
