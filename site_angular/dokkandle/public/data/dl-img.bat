@echo off
REM --- Créer le dossier "img" s'il n'existe pas ---
if not exist "img" (
    mkdir "img"
)

echo "🖼️ Téléchargement des images depuis les fichiers JSON..."

REM --- Parcourir tous les fichiers JSON dans le dossier "filtered-info" ---
for %%f in (filtered-info\*.json) do (
    REM --- Lire le contenu du fichier et extraire l'ID ---
    for /f "delims=" %%a in ('type "%%f" ^| findstr /i /c:"\"id\":"') do (
        set "line=%%a"
        call :extractAndDownload
    )
)

echo "✅ Téléchargement terminé !"
pause
exit /b

:extractAndDownload
REM --- Extraire l'ID numérique de la ligne contenant "id": ---
for /f "tokens=2 delims=:" %%i in ("%line%") do (
    set "rawId=%%i"
)

REM --- Nettoyer l'ID pour enlever virgule, guillemets, espaces ---
set "rawId=%rawId:,=%"
set "rawId=%rawId: =%"
set "rawId=%rawId:"=%"

REM --- Remplacer le dernier chiffre 1 par 0 (ID -1 logique) ---
set "imgId=%rawId:~0,-1%0"

REM --- Vérifier si imgId > 1000000 ---
set /a "compareId=%imgId%"
if %compareId% LEQ 1000000 (
    echo ⏭️ ID %imgId% ignoré (<= 1000000)
    exit /b
)

REM --- Construire l'URL de téléchargement ---
set "url=https://dokkan.wiki/assets/global/en/character/thumb/card_%imgId%_thumb.png"

REM --- Définir le chemin de l'image locale ---
set "output=img\%imgId%.png"

REM --- Télécharger l'image avec curl ---
curl -s -o "%output%" "%url%"

echo "📥 Image téléchargée pour ID %imgId%"
exit /b
