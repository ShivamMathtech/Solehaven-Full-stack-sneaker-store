@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 24 LTS, then reopen this window.
  pause
  exit /b 1
)
node scripts/check-node.mjs
if errorlevel 1 (
  pause
  exit /b 1
)
call npm ci
if errorlevel 1 (
  echo The command failed. Read the message above.
  pause
  exit /b 1
)
pause
