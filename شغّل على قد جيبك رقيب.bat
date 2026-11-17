@echo off
chcp 65001 > nul
title على قد جيبك رقيب — يعمل
cd /d "%~dp0"

echo [RAQEEB] Initializing Alagadjeebak Raqeeb Audit Suite...
node test/all.js %*

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [RAQEEB] Suite exited with code %ERRORLEVEL%.
    pause
)
