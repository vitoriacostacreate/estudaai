#!/usr/bin/env sh
cd "$(dirname "$0")"
PY=$(command -v python3 || command -v python)
$PY -c "import pypdf" 2>/dev/null || $PY -m pip install --user -r requirements.txt
exec $PY servidor.py "$@"
