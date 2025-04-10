@echo off
REM --- Supprimer les fichiers images vides dans le dossier "img" ---
echo "🗑️ Suppression des fichiers images vides..."

REM --- Vérifier si le dossier 'img' existe ---
if not exist "img" (
    echo "Le dossier 'img' n'existe pas."
    exit /b
)

REM --- Parcourir tous les fichiers png dans le dossier "img" ---
for %%f in (img\*.png) do (
    REM --- Vérifier la taille du fichier ---
    for /f "usebackq" %%a in ('%%f') do (
        REM --- Si la taille est égale à 0, supprimer l'image ---
        if %%~za==0 (
            echo "❌ Suppression de %%f (image vide)"
            del "%%f"
        )
    )
)

echo "🎉 Les fichiers png vides ont été supprimés !"

