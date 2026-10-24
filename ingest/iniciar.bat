@echo off
chcp 65001 >nul
title Prognos - ingestao do arquivo tecnico
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (
  echo Python nao encontrado. Instale o Python 3.11 ou mais novo em https://www.python.org/downloads/ marcando "Add python.exe to PATH".
  pause
  exit /b 1
)
if not exist .venv (
  echo Preparando o ambiente pela primeira vez...
  py -3 -m venv .venv
)
call .venv\Scripts\activate.bat
python -m pip install -q --upgrade pip
python -m pip install -q -r requirements.txt
echo.
echo 1 - Ver o inventario do HD (nao envia nada)
echo 2 - Indexar o texto de todos os arquivos (sem custo de IA)
echo 3 - Indexar e extrair eventos com IA (com teto de gasto)
echo.
set /p OPC=Escolha 1, 2 ou 3:
set PASTA=G:\1 - Arquivo Tecnico
set /p PASTA=Pasta [%PASTA%]:
if "%OPC%"=="1" python prognos_ingest.py "%PASTA%" --inventario
if "%OPC%"=="2" python prognos_ingest.py "%PASTA%"
if "%OPC%"=="3" (
  set /p TETO=Teto de gasto com IA em dolares [5]:
  if "%TETO%"=="" set TETO=5
  python prognos_ingest.py "%PASTA%" --ia --orcamento-usd %TETO%
)
pause
