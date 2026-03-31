@echo off
cd hers365-app/server
echo Starting H.E.R.S.365 Server...
echo Current directory: %CD%
echo Node version: 
node --version
echo Starting server with tsx...
npx tsx index.ts