@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js 22 ou superior e abra este arquivo novamente.
  pause
  exit /b 1
)
echo Abra http://localhost:8080 no navegador depois que o servidor iniciar.
node server.mjs
pause
