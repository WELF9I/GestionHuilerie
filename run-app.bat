@echo off
title Gestion Huilerie - Lancement
setlocal enabledelayedexpansion

echo ========================================
echo   Lancement de l'application Gestion Huilerie
echo ========================================
echo.

REM --- CHECK NODEJS ---
echo Vérification de Node.js...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERREUR : Node.js n'est pas installé.
    echo Veuillez installer Node.js LTS depuis :
    echo https://nodejs.org/en/download
    pause
    exit /b
)
echo Node.js OK
echo.

REM --- CHECK PNPM ---
echo Vérification de PNPM...
where pnpm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo PNPM non installé. Installation...
    npm install -g pnpm
)
echo PNPM OK
echo.

REM --- CHECK SQLITE ---
echo Vérification de SQLite...
where sqlite3 >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ATTENTION : SQLite n'est pas installé.
    echo L'application fonctionnera quand même car elle contient le binaire SQLite via better-sqlite3.
    echo.
) else (
    echo SQLite OK
)
echo.

REM --- INSTALL DEPENDENCIES ---
echo Installation des dépendances (une seule fois)...
pnpm install
echo.

REM --- START SERVER LOOP ---
echo Lancement du serveur...
:RESTART
echo Démarrage...
start "" http://localhost:3000/
pnpm dev

echo Le serveur s'est arrêté. Redémarrage...
echo.
goto RESTART
