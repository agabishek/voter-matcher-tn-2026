#!/bin/bash
# ──────────────────────────────────────────────────────────
# Voter Matcher TN 2026 — Dev Server Script
#
# Usage:
#   ./dev.sh          Start the dev server
#   ./dev.sh restart   Kill existing server and restart
#   ./dev.sh stop      Kill the running dev server
#   ./dev.sh status    Check if the server is running
# ──────────────────────────────────────────────────────────

PORT=3000
PID_FILE=".dev.pid"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$PROJECT_DIR" || exit 1

kill_server() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      echo "⏹  Stopping dev server (PID $PID)..."
      kill "$PID" 2>/dev/null
      # Wait up to 5 seconds for graceful shutdown
      for i in $(seq 1 10); do
        if ! kill -0 "$PID" 2>/dev/null; then
          break
        fi
        sleep 0.5
      done
      # Force kill if still running
      if kill -0 "$PID" 2>/dev/null; then
        kill -9 "$PID" 2>/dev/null
      fi
      echo "   Server stopped."
    fi
    rm -f "$PID_FILE"
  fi

  # Also kill anything on the port just in case
  if command -v lsof &>/dev/null; then
    PIDS_ON_PORT=$(lsof -ti :$PORT 2>/dev/null)
    if [ -n "$PIDS_ON_PORT" ]; then
      echo "   Cleaning up stale processes on port $PORT..."
      echo "$PIDS_ON_PORT" | xargs kill -9 2>/dev/null
    fi
  fi
}

start_server() {
  # Install deps if node_modules is missing
  if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
  fi

  echo "🚀 Starting dev server on http://localhost:$PORT"
  echo ""

  # Start Next.js dev server in background
  npm run dev -- --port $PORT &
  SERVER_PID=$!
  echo "$SERVER_PID" > "$PID_FILE"

  echo ""
  echo "   PID: $SERVER_PID"
  echo "   URL: http://localhost:$PORT"
  echo ""
  echo "   To stop:    ./dev.sh stop"
  echo "   To restart: ./dev.sh restart"
  echo ""

  # Wait for the server process
  wait "$SERVER_PID" 2>/dev/null
  rm -f "$PID_FILE"
}

check_status() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      echo "✅ Dev server is running (PID $PID) on http://localhost:$PORT"
      return 0
    else
      echo "⚠️  PID file exists but process $PID is not running."
      rm -f "$PID_FILE"
      return 1
    fi
  else
    echo "⏹  Dev server is not running."
    return 1
  fi
}

# ── Main ──

case "${1:-start}" in
  start)
    kill_server
    start_server
    ;;
  restart)
    echo "� Restarting dev server..."
    kill_server
    sleep 1
    start_server
    ;;
  stop)
    kill_server
    ;;
  status)
    check_status
    ;;
  *)
    echo "Usage: ./dev.sh [start|restart|stop|status]"
    exit 1
    ;;
esac
