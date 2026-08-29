@echo off
cd /d "%~dp0"
echo Iniciando o Forex Desk...
echo (Deixe esta janela aberta enquanto usa o dashboard. Feche-a para desligar o servidor.)
echo.
node server.js
pause
