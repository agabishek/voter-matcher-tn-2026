@echo off
REM ──────────────────────────────────────────────────────────
REM Voter Matcher TN 2026 — Dev Server Script (Windows)
REM
REM Usage:
REM   dev.bat              Start the dev server (foreground)
REM   dev.bat restart      Kill existing and restart
REM   dev.bat stop         Kill the running dev server
REM ──────────────────────────────────────────────────────────

setlocal enabledelayedexpansion
set PORT=3000
cd /d "%~dp0"

if "%1"=="stop" goto stop
if "%1"=="restart" goto restart

:start
REM Kill anything already on port 3000
call :kill_port

REM Install deps if needed
if not exist "node_modules" (
    echo [dev] Installing dependencies...
    call npm install
    echo.
)

echo [dev] Starting on http://localhost:%PORT%
echo [dev] Press Ctrl+C to stop.
echo.

REM Run in foreground so the window stays open
npm run dev -- --port %PORT%

echo.
echo [dev] Server exited.
goto :eof

:restart
echo [dev] Restarting...
call :kill_port
timeout /t 2 /nobreak >nul
goto start

:stop
call :kill_port
echo [dev] Stopped.
goto :eof

:kill_port
REM Find and kill any process listening on our port
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    echo [dev] Killing PID %%a on port %PORT%...
    taskkill /PID %%a /T /F >nul 2>&1
)
exit /b 0
