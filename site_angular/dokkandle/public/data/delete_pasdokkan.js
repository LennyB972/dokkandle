const fs = require("fs");
const path = require("path");

const downloadsDir = path.join(__dirname, "downloads");

fs.readdirSync(downloadsDir).forEach((file) => {
  if (!file.endsWith(".json")) return;

  const filePath = path.join(downloadsDir, file);
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    const currentCost = Number(data.card?.cost);
    if (!Array.isArray(data.awakening_routes) || isNaN(currentCost)) return;

    data.awakening_routes.forEach((route) => {
      const awakedId = Number(route.awaked_card_id);
      if (!awakedId) return;

      const awakedFilePath = path.join(downloadsDir, `${awakedId}.json`);
      if (fs.existsSync(awakedFilePath)) {
        try {
          const awakedContent = fs.readFileSync(awakedFilePath, "utf-8");
          const awakedData = JSON.parse(awakedContent);
          const awakedCost = Number(awakedData.card?.cost);

          if (!isNaN(awakedCost) && awakedCost < currentCost) {
            fs.unlinkSync(awakedFilePath);
            console.log(`🗑️ Supprimé (cost ${awakedCost} < ${currentCost}) : ${awakedId}.json`);
          }
        } catch (err) {
          console.error(`❌ Erreur lecture ${awakedId}.json:`, err.message);
        }
      }
    });

  } catch (err) {
    console.error(`❌ Erreur traitement ${file}:`, err.message);
  }
});
