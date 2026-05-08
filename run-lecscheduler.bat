@echo off
title LecScheduler Development Server
color 0B

echo ===================================================
echo       LecScheduler Local Development Server
echo ===================================================
echo.
echo Checking Node.js installation...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo Error: Node.js is not installed or not in your system PATH!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b
)

echo Checking if port 8000 is available...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo Port 8000 is in use by PID %%a. Killing process...
    taskkill /F /PID %%a >nul 2>&1
    echo Process killed successfully.
)

echo.
echo Starting the application...
echo You can stop the server anytime by pressing Ctrl+C.
echo.

node dev-server.js

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo The server encountered an error and stopped.
    pause
)
