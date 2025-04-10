const fs = require("fs");
const path = require("path");

// Dossier contenant les fichiers JSON
const OUTPUT_DIR = path.join(__dirname, 'downloads');

// Fonction pour supprimer un fichier
function deleteFile(filePath) {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Erreur lors de la suppression du fichier ${filePath}:`, err);
        } else {
            console.log(`❌ Fichier supprimé : ${filePath}`);
        }
    });
}

// Fonction principale pour supprimer des fichiers selon les conditions spécifiées
function deleteJsonByConditions() {
    // Vérifie si le dossier 'downloads' existe
    if (!fs.existsSync(OUTPUT_DIR)) {
        console.log("Le dossier 'downloads' n'existe pas.");
        return;
    }

    // Récupère tous les fichiers dans le dossier
    fs.readdir(OUTPUT_DIR, (err, files) => {
        if (err) {
            console.error("Erreur lors de la lecture du répertoire :", err);
            return;
        }

        // Filtre uniquement les fichiers .json
        const jsonFiles = files.filter(file => path.extname(file) === ".json");

        // Parcourt tous les fichiers JSON dans l'ordre actuel
        for (let i = 0; i < jsonFiles.length; i++) {
            const file = jsonFiles[i];
            const filePath = path.join(OUTPUT_DIR, file);

            fs.readFile(filePath, "utf8", (err, data) => {
                if (err) {
                    console.error(`Erreur lors de la lecture du fichier ${file}:`, err);
                    return;
                }

                try {
                    // Parse le contenu du fichier JSON
                    const jsonData = JSON.parse(data);
                    const currentRarity = jsonData.card ? jsonData.card.rarity : null;
                    const currentCost = jsonData.card ? jsonData.card.cost : null;

                    // Si la rarity est 5, supprimer les deux fichiers précédents (nom-10 et nom-20)
                    if (currentRarity === 5) {
                        const currentId = parseInt(path.basename(file).replace(".json", ""));
                        const prevFile10 = `${currentId - 10}.json`;
                        const prevFile20 = `${currentId - 20}.json`;

                        // Supprimer le fichier actuel, le fichier -10 et le fichier -20
                        const prevFilePath10 = path.join(OUTPUT_DIR, prevFile10);
                        const prevFilePath20 = path.join(OUTPUT_DIR, prevFile20);

                        if (fs.existsSync(prevFilePath10)) deleteFile(prevFilePath10);
                        if (fs.existsSync(prevFilePath20)) deleteFile(prevFilePath20);

                    } else {
                        // Vérifie si le fichier actuel doit être supprimé selon le coût du fichier suivant
                        if (i < jsonFiles.length - 1) {
                            const nextFile = jsonFiles[i + 1];
                            const nextFilePath = path.join(OUTPUT_DIR, nextFile);

                            fs.readFile(nextFilePath, "utf8", (err, nextData) => {
                                if (err) {
                                    console.error(`Erreur lors de la lecture du fichier suivant ${nextFile}:`, err);
                                    return;
                                }

                                try {
                                    const nextJsonData = JSON.parse(nextData);
                                    const nextCost = nextJsonData.card ? nextJsonData.card.cost : null;

                                    // Si le cost du fichier actuel est inférieur à celui du fichier suivant et que le fichier suivant a un id+10
                                    const currentId = parseInt(path.basename(file).replace(".json", ""));
                                    const nextId = parseInt(path.basename(nextFile).replace(".json", ""));

                                    if (currentCost < nextCost && nextId === currentId + 10) {
                                        deleteFile(filePath);
                                    }
                                } catch (error) {
                                    console.error(`Erreur lors du traitement du fichier suivant ${nextFile}:`, error);
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Erreur lors du traitement du fichier ${file}:`, error);
                }
            });
        }
    });
}

// Lancer la fonction
deleteJsonByConditions();
