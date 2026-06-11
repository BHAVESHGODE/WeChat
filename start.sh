#!/usr/bin/env bash
set -e

if [ -z "$PORT" ]; then
  PORT=5000
fi

if [ -z "$GAANA_FLASK_PORT" ]; then
  GAANA_FLASK_PORT=5001
fi

python3 /app/server/gaana_api/app.py "$GAANA_FLASK_PORT" &
FLASK_PID=$!

trap "kill $FLASK_PID" EXIT

cd /app/server
exec npm start
