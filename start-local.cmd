@echo off
REM Local development with FAKE data (Firebase Emulator). Never touches the live site.
cd /d "%~dp0"
set "JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

start "Firebase Emulator" cmd /k firebase emulators:start --project demo-worklog

echo Waiting for the emulator to start...
:wait
timeout /t 2 /nobreak >nul
curl -s -o nul http://127.0.0.1:8080 || goto wait

node scripts\seed-emulator.mjs
start "" http://localhost:3000/auth/login
npm run dev
