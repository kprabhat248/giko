#!/bin/sh

echo "Running DB seed..."
python -m app.seed || echo "Seeding failed or skipped"

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
