#!/bin/sh
set -e

# Wait for database if DATABASE_URL or POSTGRES_HOST is set
if [ -n "$POSTGRES_HOST" ]; then
    echo "Waiting for PostgreSQL at $POSTGRES_HOST:${POSTGRES_PORT:-5432}..."
    while ! nc -z "$POSTGRES_HOST" "${POSTGRES_PORT:-5432}" 2>/dev/null; do
        sleep 1
    done
    echo "PostgreSQL is ready!"
fi

# Apply migrations if requested or on web container
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Applying database migrations..."
    python manage.py migrate --noinput
    echo "Collecting static files..."
    python manage.py collectstatic --noinput || true
fi

exec "$@"

