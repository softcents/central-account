@echo off
title Central Account Platform
echo ======================================================================
echo   Central Account Platform - Unified Runner
echo   ------------------------------------------------------------------
echo   Starting:
echo     [FACE] Python FastAPI Service    -^> http://127.0.0.1:8000/docs
echo     [API]  NestJS Backend Service    -^> http://127.0.0.1:4000/api
echo     [WEB]  Next.js Frontend Service  -^> http://localhost:3000
echo.
echo   Your default web browser will automatically open to:
echo   http://localhost:3000 once services are online.
echo ======================================================================
echo.

npm run dev
pause
