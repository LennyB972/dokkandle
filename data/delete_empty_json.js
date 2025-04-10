const fs = require("fs");
const path = require("path");

// Dossier contenant les fichiers JSON
const OUTPUT_DIR = path.join(__dirname, 'downloads');

// Fonction pour supprimer les fichiers JSON avec une rareté inférieure à 4
function deleteLowRarityJson() {
    // Vérifie si le dossier 'downloads' existe
    if (!fs.existsSync(OUTPUT_DIR)) {
        console.log("Le dossier 'downloads' n'existe pas.");
        return;
    }

    // Parcourt tous les fichiers JSON dans le dossier 'downloads'
    fs.readdir(OUTPUT_DIR, (err, files) => {
        if (err) {
            console.error("Erreur lors de la lecture du répertoire :", err);
            return;
        }

        files.forEach(file => {
            const filePath = path.join(OUTPUT_DIR, file);

            // Vérifie si le fichier a une extension .json
            if (path.extname(file) === ".json") {
                fs.readFile(filePath, "utf8", (err, data) => {
                    if (err) {
                        console.error(`Erreur lors de la lecture du fichier ${file}:`, err);
                        return;
                    }

                    try {
                        // Parse le contenu du fichier JSON
                        const jsonData = JSON.parse(data);
                        
                        // Vérifie si le champ rarity existe et s'il est inférieur à 4
                        if (jsonData.card && jsonData.card.rarity < 4) {
                            // Supprime le fichier
                            fs.unlink(filePath, (err) => {
                                if (err) {
                                    console.error(`Erreur lors de la suppression du fichier ${file}:`, err);
                                } else {
                                    console.log(`❌ Fichier supprimé : ${file}`);
                                }
                            });
                        }
                    } catch (error) {
                        console.error(`Erreur lors du traitement du fichier ${file}:`, error);
                    }
                });
            }
        });
    });
}

// Lancer la fonction
deleteLowRarityJson();
