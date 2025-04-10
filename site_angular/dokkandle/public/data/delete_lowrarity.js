const fs = require("fs");
const path = require("path");

const downloadsDir = path.join(__dirname, "downloads");

// Lecture de tous les fichiers .json dans le dossier /downloads
fs.readdirSync(downloadsDir).forEach((file) => {
  if (file.endsWith(".json")) {
    const filePath = path.join(downloadsDir, file);
    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(fileContent);

      const rarity = Number(data.card?.rarity);

      if (!isNaN(rarity) && rarity < 4) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Supprimé (rarity ${rarity}) : ${file}`);
      }

    } catch (err) {
      console.error(`❌ Erreur lors du traitement de ${file}:`, err.message);
    }
  }
});
