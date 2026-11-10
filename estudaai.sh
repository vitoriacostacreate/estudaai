#!/usr/bin/env sh
cd "$(dirname "$0")"
PY=$(command -v python3 || command -v python)
$PY configurar_ia.py --primeira-vez
$PY configurar_sincronia.py --primeira-vez
exec $PY servidor.py "$@"
