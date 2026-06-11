#!/usr/bin/env bash
set -e

if [ -z "$PORT" ]; then
  PORT=5000
fi

if [ -z "$GAANA_FLASK_PORT" ]; then
  GAANA_FLASK_PORT=5001
fi

echo "Starting Flask microservice on port $GAANA_FLASK_PORT"
python3 /app/server/gaana_api/app.py "$GAANA_FLASK_PORT" &
FLASK_PID=$!

echo "Flask PID=$FLASK_PID"

cleanup() {
  echo "Stopping Flask PID=$FLASK_PID"
  kill "$FLASK_PID" || true
}

trap cleanup EXIT INT TERM

cd /app/server
exec npm start
