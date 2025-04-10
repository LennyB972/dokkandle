@echo off
REM --- Recrée les JSON corrompus ou manquants dans /downloads si le nom commence par "4" ---

setlocal enabledelayedexpansion

REM --- Parcours des fichiers dans le dossier "downloads" ---
for %%f in (downloads\4*.json) do (
    set "filename=%%~nf"
    set "url=https://dokkan.wiki/api/cards/!filename!"

    echo 🔄 Téléchargement de !filename!.json depuis !url!...

    curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" !url! -o "downloads\!filename!.json"

    if errorlevel 1 (
        echo ❌ Échec du téléchargement pour !filename!
    ) else (
        echo ✅ Réussi : !filename!.json
    )
)

echo 🎉 Réparation terminée !
endlocal

