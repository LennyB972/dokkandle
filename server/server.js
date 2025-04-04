const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const https = require("https");
const { v4: uuidv4 } = require('uuid'); // Vous devrez peut-être installer ce module
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3000;

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Referer': 'https://dokkan.wiki/',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
};

// Connexion à MongoDB
mongoose.connect("mongodb://localhost:27017/mon_projet_db", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Erreur de connexion à MongoDB:"));
db.once("open", () => console.log("Connecté à MongoDB"));

// Schéma MongoDB modifié pour stocker uniquement les informations nécessaires
const DataSchema = new mongoose.Schema({
    id: Number,
    name: String,
    rarity: Number,
    passive_skill_itemized_desc: String,
});
const DataModel = mongoose.model("Data", DataSchema);

// Dossier de sauvegarde des fichiers JSON
const OUTPUT_DIR = path.join(__dirname, 'downloads');

// Crée le dossier s'il n'existe pas
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Liste des URLs à récupérer
let jsonUrls = [];

// Fonction pour ajouter une URL à la liste en fonction de i
function addUrl(i) {
    const url = `https://dokkan.wiki/api/cards/${i}.json`;
    jsonUrls.push(url);
    console.log(`🔗 Ajouté : ${url}`);
}

// Génération des URLs avec incrémentation de 10
for (let i = 1000001; i <= 1040001; i += 10) {
    addUrl(i);
}

// Fonction pour télécharger un fichier JSON
async function downloadJson(url) {
    try {
        const response = await axios.get(url, { headers: HEADERS, timeout: 30000 });

        if (response.status === 200) {
            const filename = path.basename(url);
            const filepath = path.join(OUTPUT_DIR, filename);

            fs.writeFileSync(filepath, JSON.stringify(response.data, null, 2));
            console.log(`✅ Téléchargé : ${filename}`);
        } else {
            console.log(`⚠️ Erreur ${response.status} pour ${url}`);
        }
    } catch (error) {
        console.error(`❌ Échec du téléchargement ${url}:`, error.message);
    }
}

// Fonction pour établir la session avec Puppeteer
async function fetchJson(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    await page.goto(url, { waitUntil: 'networkidle2' });

    const content = await page.evaluate(() => document.body.innerText);
    console.log(content); // Vérifie que c'est bien le JSON

    await browser.close();
}

// Fonction pour ajouter un délai "humain" entre les requêtes
const humanDelay = async () => {
    const delay = Math.floor(Math.random() * (60000 - 30000) + 30000); // Entre 30s et 60s
    console.log(`⏳ Pause de ${delay / 1000} secondes avant la prochaine requête...\n`);
    await new Promise(resolve => setTimeout(resolve, delay));
};

// Fonction pour établir la session
const establishSession = async () => {
    try {
        await axios.get('https://dokkan.wiki/', { 
            headers: HEADERS,
            timeout: 30000
        });
        
        await humanDelay();
        await axios.get('https://dokkan.wiki/cards', { 
            headers: HEADERS,
            timeout: 30000
        });

        console.log("Session établie avec succès");
    } catch (error) {
        console.error("Erreur lors de l'établissement de la session:", error.message);
    }
};

// Fonction principale avec délais aléatoires entre les requêtes
async function main() {
    await establishSession();  // Établir la session avant de commencer
    let requestCount = 0;

    for (const url of jsonUrls) {
        if (requestCount >= 50) {
            console.log("Renouvellement de la session...");
            await humanDelay();
            await establishSession();
            requestCount = 0;
        }

        await downloadJson(url);

        requestCount++;

        // Délai aléatoire entre 10 et 30 secondes pour éviter d'être bloqué
        await humanDelay();
    }

    console.log("🎉 Tous les fichiers JSON ont été téléchargés !");
}

main().then(() => console.log("🎉 Fin du processus de téléchargement !"));
