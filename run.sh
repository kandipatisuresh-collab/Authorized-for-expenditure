#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-3000}"
HOST="${HOST:-127.0.0.1}"
URL="http://${HOST}:${PORT}"

export PORT HOST
node "$ROOT/app/server.js" &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID"
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

ready=false
for ((attempt = 0; attempt < 40; attempt++)); do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "AFE backend exited before becoming ready." >&2
    wait "$SERVER_PID" || true
    exit 1
  fi
  if node -e 'const http=require("node:http");const port=process.env.PORT||3000;const req=http.get({host:process.env.HOST||"127.0.0.1",port,path:"/api/health",timeout:500},res=>{process.exit(res.statusCode===200?0:1)});req.on("error",()=>process.exit(1));req.on("timeout",()=>{req.destroy();process.exit(1)})'; then
    ready=true
    break
  fi
  sleep 0.25
done

if [[ "$ready" != true ]]; then
  echo "AFE backend did not become ready at $URL." >&2
  exit 1
fi

echo "Opening AFE Builder at $URL"
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    powershell.exe -NoProfile -Command "Start-Process '$URL'" ;;
  Darwin*)
    open "$URL" ;;
  *)
    if command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$URL" >/dev/null 2>&1 || true
    else
      echo "No browser opener found. Open $URL manually."
    fi ;;
esac

echo "AFE Builder is running. Press Ctrl+C to stop."
wait "$SERVER_PID"
