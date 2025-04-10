const fs = require('fs');
const path = require('path');

// Chemin vers le répertoire contenant les fichiers JSON des personnages
// Ajustez ce chemin selon l'emplacement réel de vos fichiers
const dirPath = './public/data/filtered-info';

// Lire tous les fichiers du répertoire
fs.readdir(dirPath, (err, files) => {
  if (err) {
    console.error('Erreur lors de la lecture du répertoire:', err);
    return;
  }
  
  // Filtrer pour ne garder que les fichiers JSON
  const jsonFiles = files.filter(file => file.endsWith('.json'));
  
  // Extraire les IDs (noms de fichiers sans l'extension .json)
  const ids = jsonFiles.map(file => parseInt(path.basename(file, '.json')));
  
  // Écrire les IDs dans character-ids.json
  fs.writeFile('./public/data/character-ids.json', JSON.stringify(ids, null, 2), err => {
    if (err) {
      console.error('Erreur lors de l\'écriture du fichier:', err);
      return;
    }
    console.log(`${ids.length} IDs écrits dans character-ids.json`);
  });
});