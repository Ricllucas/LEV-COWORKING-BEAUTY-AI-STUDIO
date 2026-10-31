@echo off
REM LEV BEAUTY - Esteira ChatGPT + Upload-Post
REM Requer Opensquad ativo e UPLOAD_POST_API_KEY configurada

cd /d "C:\Users\ricll\.squads100"
set "DASHBOARD_URL=http://127.0.0.1:3737/?squad=lev-instagram-automacao"

echo.
echo =====================================================
echo  LEV BEAUTY - ESTEIRA COMPLETA
echo =====================================================
echo.
echo Abrindo dashboard da squad...
echo %DASHBOARD_URL%
start "LEV Beauty Dashboard" "%DASHBOARD_URL%"
echo.
echo Iniciando squad, gerando criativos e publicando...
echo.

powershell -ExecutionPolicy Bypass -File ".\scripts\lev-beauty-automation.ps1"
if errorlevel 1 (
	echo.
	echo [ERRO] A esteira foi interrompida. Leia a mensagem acima.
) else (
	echo.
	echo [OK] Esteira concluida.
)

pause
