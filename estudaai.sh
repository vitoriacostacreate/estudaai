#!/usr/bin/env sh
cd "$(dirname "$0")"
PY=$(command -v python3 || command -v python)
exec $PY servidor.py "$@"
