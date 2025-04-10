const fs = require('fs');
const path = require('path');

// Dossier où se trouvent les fichiers JSON
const downloadsDir = path.join(__dirname, 'downloads');

// Dossier où les fichiers filtrés seront sauvegardés
const outputDir = path.join(__dirname, 'filtered-info');

// Créer le dossier 'filtered-info' s'il n'existe pas
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Fonction pour filtrer et enregistrer les données
const processFiles = async () => {
    const files = fs.readdirSync(downloadsDir).filter(file => file.endsWith('.json')); // Récupérer les fichiers JSON du répertoire 'downloads'

    for (const file of files) {
        const filePath = path.join(downloadsDir, file);
        try {
            // Lire le fichier JSON
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            
            // Extraire les informations nécessaires
            const card = data.card;

            if (card && card.id) {
                const id = card.id;

                // Déterminer la "class" et le "type" à partir de card.element
                let classType = null;
                let unitType = null;

                if (typeof card.element === 'number') {
                    const elementStr = card.element.toString().padStart(2, '0'); // S'assurer qu'on a deux chiffres
                    const firstDigit = elementStr[0];
                    const secondDigit = elementStr[1];

                    classType = firstDigit === '1' ? 'Super' :
                                firstDigit === '2' ? 'Extreme' : null;

                    const typeMap = {
                        '0': 'AGL',
                        '1': 'TEQ',
                        '2': 'INT',
                        '3': 'STR',
                        '4': 'PHY'
                    };

                    unitType = typeMap[secondDigit] || null;
                }

                let categories = [];
                if (Array.isArray(data.categories)) {
                    categories = data.categories
                        .sort((a, b) => b.priority - a.priority);
                }

                const filteredData = {
                    name: card.name,
                    id: card.id,
                    hp_max: card.hp_max,
                    atk_max: card.atk_max,
                    def_max: card.def_max,
                    is_f2p: card.is_f2p,
                    is_dokkan_fes: card.is_dokkan_fes,
                    is_carnival_only: card.is_carnival_only,
                    open_at: card.open_at,
                    has_optimal_awakening_growths: data.hasOwnProperty("optimal_awakening_growths"),
                    class: classType,
                    type: unitType,
                    categories: categories
                };

                // Sauvegarder le fichier filtré dans le dossier 'filtered-info'
                const outputFilePath = path.join(outputDir, `${id}.json`);
                fs.writeFileSync(outputFilePath, JSON.stringify(filteredData, null, 2));
                console.log(`Fichier filtré pour ID ${id} sauvegardé dans "${outputFilePath}"`);
            }
        } catch (error) {
            console.error(`Erreur lors de la lecture ou du traitement du fichier ${file}:`, error);
        }
    }

    console.log('Traitement terminé.');
};

// Lancer la fonction de traitement
processFiles();
