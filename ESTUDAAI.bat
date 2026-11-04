@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>nul && (set PY=py) || (set PY=python)
%PY% -c "import pypdf" 2>nul || (echo Instalando pypdf pela primeira vez... & %PY% -m pip install --user -r requirements.txt)
%PY% servidor.py
pause
