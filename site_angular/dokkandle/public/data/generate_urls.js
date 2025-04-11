const fs = require('fs');
const path = require('path');

// Fonction pour lire les fichiers JSON dans le répertoire
function readJsonFiles(dirPath) {
  return fs.readdirSync(dirPath)
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const filePath = path.join(dirPath, file);
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    });
}

// Fonction pour créer les URLs
function generateUrls(jsonData) {
  const urls = [];
  const baseUrl = 'https://dokkan.wiki/cards/id/animation';
  
  // Récupère l'ID du personnage
  const cardId = jsonData.id;

  // Teste et génère l'URL pour chaque champ
  if (jsonData.active_skill_id !== -1) {
    const activeSkillUrl = `https://dokkan.wiki/cards/id/animation/lua/active_skill_id/${jsonData.has_ultimate ? 4 : 3}/0`;
    urls.push(activeSkillUrl.replace('id', cardId).replace('active_skill_id', jsonData.active_skill_id));
  }
  
  if (jsonData.entree_id !== -1) {
    const entreeUrl = `${baseUrl}/lua/entree_id/0/0`.replace('id', cardId).replace('entree_id', jsonData.entree_id);
    urls.push(entreeUrl);
  }

  if (jsonData.fukkatsu_id !== -1) {
    const fukkatsuUrl = `${baseUrl}/effect/fukkatsu_id/-1/0`.replace('id', cardId).replace('fukkatsu_id', jsonData.fukkatsu_id);
    urls.push(fukkatsuUrl);
  }

  if (jsonData.standby_id !== -1) {
    const standbyUrl = `${baseUrl}/lua/standby_id/7/0`.replace('id', cardId).replace('standby_id', jsonData.standby_id);
    urls.push(standbyUrl);
  }

  if (jsonData.finish_1_id !== -1) {
    const finish1Url = `${baseUrl}/lua/finish_1_id/8/0`.replace('id', cardId).replace('finish_1_id', jsonData.finish_1_id);
    urls.push(finish1Url);
  }

  if (jsonData.finish_2_id !== -1) {
    const finish2Url = `${baseUrl}/lua/finish_2_id/8/0`.replace('id', cardId).replace('finish_2_id', jsonData.finish_2_id);
    urls.push(finish2Url);
  }

  if (jsonData.transfo_id !== -1) {
    const transfoUrl = `${baseUrl}/effect/transfo_id/-1/0`.replace('id', cardId).replace('transfo_id', jsonData.transfo_id);
    urls.push(transfoUrl);
  }

  return urls;
}

// Fonction pour générer le fichier texte avec toutes les URLs
function writeUrlsToFile() {
  const dirPath = './filtered-info';
  const outputFile = './urls.txt';
  
  const jsonDataArray = readJsonFiles(dirPath);
  const allUrls = [];

  jsonDataArray.forEach(jsonData => {
    const urls = generateUrls(jsonData);
    allUrls.push(...urls);
  });

  // Écriture dans le fichier "urls.txt"
  fs.writeFileSync(outputFile, allUrls.join('\n'), 'utf8');
  console.log(`Les URLs ont été écrites dans ${outputFile}`);
}

// Exécution du script
writeUrlsToFile();
