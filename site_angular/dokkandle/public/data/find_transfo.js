const fs = require("fs");
const path = require("path");

const downloadsDir = path.join(__dirname, "downloads");

fs.readdirSync(downloadsDir).forEach((file) => {
  if (!file.endsWith(".json")) return;

  const filePath = path.join(downloadsDir, file);
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);

    const currentId = data.card?.id;
    const transformations = data.transformations;

    if (!Array.isArray(transformations) || currentId === undefined) return;

    transformations.forEach((transfo) => {
      const nextId = transfo?.next_card_id;
      if (nextId === undefined || nextId === currentId) return;

      const newFilePath = path.join(downloadsDir, `${nextId}.json`);
      if (!fs.existsSync(newFilePath)) {
        fs.writeFileSync(newFilePath, "");
        console.log(`📄 Créé : ${nextId}.json`);
      }
    });

  } catch (err) {
    console.error(`❌ Erreur dans ${file} :`, err.message);
  }
});
