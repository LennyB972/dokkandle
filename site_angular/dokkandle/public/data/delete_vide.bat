@echo off
REM --- Supprimer les fichiers JSON vides dans le dossier "downloads" ---
echo "🗑️ Suppression des fichiers JSON vides..."

REM --- Vérifier si le dossier 'downloads' existe ---
if not exist "downloads" (
    echo "Le dossier 'downloads' n'existe pas."
    exit /b
)

REM --- Parcourir tous les fichiers JSON dans le dossier "downloads" ---
for %%f in (downloads\*.json) do (
    REM --- Vérifier la taille du fichier ---
    for /f "usebackq" %%a in ('%%f') do (
        REM --- Si la taille est égale à 0, supprimer le fichier ---
        if %%~za==0 (
            echo "❌ Suppression de %%f (fichier vide)"
            del "%%f"
        )
    )
)

echo "🎉 Les fichiers JSON vides ont été supprimés !"
pause
