@echo off
REM --- Créer un dossier pour les téléchargements si nécessaire ---
if not exist "downloads" mkdir downloads

REM --- Liste des IDs à télécharger ---
setlocal enabledelayedexpansion
for /L %%i in (1002591,10,1040001) do (
    REM --- Construire l'URL ---
    set url=https://dokkan.wiki/api/cards/%%i

    REM --- Télécharger le fichier JSON avec curl ---
    curl -v -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" !url! -o "downloads\%%i.json"

    REM --- Vérifier si le téléchargement a échoué (code 404) ---
    if errorlevel 1 (
        echo "❌ Échec du téléchargement pour !url!"
    ) else (
        echo "✅ Téléchargé : %%i.json"
    )

)

echo "🎉 Tous les fichiers JSON ont été téléchargés !"
endlocal
pause
