@echo off
cd hers365-app/server
echo Starting H.E.R.S.365 Server...
echo Current directory: %CD%
echo Node version: %NODE_VERSION%
node --version
echo TypeScript version: %TYPESCRIPT_VERSION%
npx --version
echo Starting server...
npx tsx index.ts
pause