@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo QiAcademy starting at http://localhost:8080  (Ctrl+C to stop)
start "" http://localhost:8080
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 8080
) else (
  npx --yes serve -l 8080 .
)
pause
