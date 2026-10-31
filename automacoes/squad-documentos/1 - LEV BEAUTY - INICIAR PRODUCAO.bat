@echo off
REM LEV BEAUTY - Producao Premium (n8n + squad)
REM Atalho de 1 clique para iniciar o fluxo completo

cd /d "C:\Users\ricll\Documents\Squads100"

echo.
echo =====================================================
echo  LEV BEAUTY - UPLOAD-POST + PRODUCAO

echo =====================================================
echo.
echo Iniciando fluxo completo e abrindo Upload-Post...
echo.

powershell -ExecutionPolicy Bypass -File ".\scripts\lev-beauty-production.ps1" -StartN8n -OpenDashboard
powershell -ExecutionPolicy Bypass -File ".\scripts\lev-beauty-upload-post.ps1" -OpenOnly

pause
