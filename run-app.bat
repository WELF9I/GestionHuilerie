@echo off
title Gestion Huilerie - Lancement

echo ========================================
echo   Lancement de l'application Gestion Huilerie
echo ========================================
echo.

REM --- LANCEMENT DU SERVEUR ---
set PORT=3000
set URL=http://localhost:%PORT%

echo Verification du port %PORT%...
REM Recherche et arrete tout processus existant utilisant le port specifie.
FOR /F "tokens=5" %%P IN ('netstat -a -n -o ^| findstr ":%PORT%" ^| findstr "LISTENING"') DO (
    echo Le port %PORT% est utilise par le processus avec PID %%P.
    echo Arret du processus existant pour eviter les conflits...
    taskkill /F /PID %%P >nul
)
echo Port %PORT% est maintenant libre.
echo.

echo Lancement du serveur de developpement sur %URL%
echo Une nouvelle fenetre va s'ouvrir pour le serveur.

REM Lance le serveur de developpement dans une nouvelle fenetre.
REM Le '& pause' permet de garder la fenetre ouverte si le serveur crashe au demarrage.
start "Gestion Huilerie - Serveur" cmd /c "npm run dev & pause"

echo.
echo Le serveur est en cours de demarrage dans une nouvelle fenetre.
echo Attente de 10 secondes avant d'ouvrir le navigateur...

REM Donne au serveur le temps de demarrer avant d'ouvrir le navigateur.
timeout /t 10 /nobreak >nul

REM Ouvre l'URL dans le navigateur par defaut.
start "" %URL%

echo.
echo =================================================================
echo L'application devrait maintenant etre ouverte dans votre navigateur.
echo Le serveur tourne dans une fenetre separee.
echo Pour arreter l'application, fermez simplement la fenetre du serveur.
echo =================================================================
echo.
echo Cette fenetre va se fermer dans 15 secondes.

timeout /t 15
