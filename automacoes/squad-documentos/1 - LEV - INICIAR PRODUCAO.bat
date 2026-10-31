@echo off
REM LEV BEAUTY - Producao (n8n + squad)
REM Atalho de 1 clique para iniciar o fluxo completo

cd /d "C:\Users\ricll\Documents\Squads100"

echo.
echo =====================================================
echo  LEV BEAUTY - PRODUCAO (n8n + squad)
echo =====================================================
echo.
echo Iniciando fluxo completo...
echo.

powershell -ExecutionPolicy Bypass -File ".\n8n\start-n8n.ps1"

pause
