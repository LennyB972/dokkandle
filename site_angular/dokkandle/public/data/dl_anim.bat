@echo off
setlocal enabledelayedexpansion

:: Dossier où les fichiers seront téléchargés
set "download_dir=animations"

:: Créer le dossier d'animations si nécessaire
if not exist "%download_dir%" mkdir "%download_dir%"

:: Lire chaque ligne du fichier urls.txt
for /f "tokens=*" %%a in (urls.txt) do (
    set "url=%%a"
    
    :: Extraire les parties de l'URL pour créer le nom de fichier
    for /f "delims=/ tokens=2,3,4" %%b in ("!url!") do (
        set "part1=%%b"
        set "part2=%%c"
        set "part3=%%d"
        
        :: Créer un chemin relatif basé sur l'URL (ex: /1005131/animation/effect/243/)
        set "file_name=%download_dir%\!part1!\animation\effect\!part2!\"
        
        :: Créer le dossier correspondant pour chaque fichier
        if not exist "!file_name!" mkdir "!file_name!"

        :: Télécharger le fichier avec curl (nommage de fichier selon l'URL)
        curl -o "!file_name!\%part2%.gif" "!url!"
    )
)

echo Téléchargement terminé !
pause
