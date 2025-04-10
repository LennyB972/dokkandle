@echo off
echo 🚀 Lancement de tous les scripts dans l'ordre...

REM --- 1. Télécharger les JSON ---
call dl.bat

REM --- 2. Supprimer les fichiers JSON vides commençant par 4 ---
call delete_vide.bat

REM --- 3. Supprimer les fichiers avec rarity < 4 ---
node delete_lowrarity.js

REM --- 4. Supprimer les fichiers via awakening si cost inférieur ---
node delete_pasdokkan.js

REM --- 5. Créer fichiers vides à partir des transformations ---
node find_transfo.js

REM --- 6. Télécharger les JSON de transformations ---
call dl-transfo.bat

REM --- 7. Filtrer les JSON (critères personnalisés) ---
node filtre.js

REM --- 8. Télécharger les images à partir des fichiers filtrés ---
call dl-img.bat

REM --- 9. Supprimer les images vides ou corrompues ---
call delete_emptyimg.bat

echo 🎉 Tous les scripts ont été exécutés avec succès !
pause
