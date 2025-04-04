const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const https = require("https");
const { v4: uuidv4 } = require('uuid'); // Vous devrez peut-être installer ce module

const app = express();
const PORT = 3000;

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

// Dossier de téléchargement des JSON
const downloadsDir = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
}

// Fonction pour télécharger et insérer les JSON avec bypass avancé
const fetchAndStoreJSON = async () => {
    // Rotation des User-Agents pour paraître plus naturel
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:95.0) Gecko/20100101 Firefox/95.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36'
    ];

    // Créer un agent HTTPS personnalisé pour contourner certaines vérifications SSL
    const httpsAgent = new https.Agent({
        rejectUnauthorized: true,
        keepAlive: true,
        timeout: 30000
    });

    // Fonction pour obtenir des en-têtes aléatoires mais cohérents
    const getHeaders = () => {
        const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        const browser = userAgent.includes('Chrome') ? 'Chrome' : 
                       userAgent.includes('Firefox') ? 'Firefox' : 'Safari';
        
        // Déterminer la langue aléatoirement mais avec une préférence pour le français
        const languages = ['fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7', 'en-US,en;q=0.9,fr;q=0.8', 'fr;q=0.8,en-US;q=0.6,en;q=0.4'];
        const language = languages[Math.floor(Math.random() * languages.length)];
        
        // Générer un ID de session cohérent
        const sessionId = uuidv4();
        
        return {
            'User-Agent': userAgent,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': language,
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'max-age=0',
            'sec-ch-ua': `"${browser}";v="${Math.floor(Math.random() * 20) + 90}"`,
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Upgrade-Insecure-Requests': '1',
            'Origin': 'https://dokkan.wiki',
            'Referer': 'https://dokkan.wiki/cards',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Pragma': 'no-cache',
            'Cookie': `sessionId=${sessionId}; visited=true; lastVisited=${new Date().toISOString()}`
        };
    };

    // Fonction de délai améliorée pour imiter un comportement humain
    const humanDelay = async () => {
        // Délai de base entre 2 et 6 secondes
        const baseDelay = 2000 + Math.floor(Math.random() * 4000);
        
        // Parfois ajouter un délai supplémentaire pour simuler une distraction
        if (Math.random() < 0.1) {
            return new Promise(resolve => setTimeout(resolve, baseDelay + 15000 + Math.random() * 30000));
        }
        
        return new Promise(resolve => setTimeout(resolve, baseDelay));
    };

    // Fonction pour visiter la page principale avant de télécharger les cartes
    const establishSession = async () => {
        try {
            // Visiter d'abord la page principale
            await axios.get('https://dokkan.wiki/', { 
                headers: getHeaders(),
                httpsAgent,
                timeout: 30000
            });
            
            // Puis visiter la page des cartes
            await humanDelay();
            await axios.get('https://dokkan.wiki/cards', { 
                headers: getHeaders(),
                httpsAgent,
                timeout: 30000
            });
            
            console.log("Session établie avec succès");
            return true;
        } catch (error) {
            console.error("Erreur lors de l'établissement de la session:", error.message);
            return false;
        }
    };

    // Établir une session avant de commencer les téléchargements
    await establishSession();
    await humanDelay();

    // Utiliser un compteur pour suivre combien de requêtes ont été faites
    let requestCount = 0;
    
    for (let i = 1000001; i <= 1040001; i += 10) {
        // Réinitialiser la session après 50 requêtes
        if (requestCount >= 50) {
            console.log("Renouvellement de la session...");
            await humanDelay();
            await establishSession();
            requestCount = 0;
        }
        
        const fileUrl = `https://dokkan.wiki/api/cards/${i}.json`;
        const filePath = path.join(downloadsDir, `${i}.json`);

        try {
            // Attendre un délai "humain" entre les requêtes
            await humanDelay();
            
            // Récupérer des en-têtes frais pour chaque requête
            const headers = getHeaders();
            
            // Effectuer la requête avec les en-têtes améliorés
            const response = await axios.get(fileUrl, { 
                headers: headers,
                httpsAgent,
                timeout: 30000,
                maxRedirects: 5
            });
            
            requestCount++;
            
            if (response.status === 200) {
                fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2));

                // Récupérer les informations nécessaires
                const cardData = response.data.card;
                
                // Vérifier la valeur de rarity avant d'insérer
                if (cardData.rarity >= 4) {
                    // Déterminer quelle source utiliser pour passive_skill_itemized_desc
                    let passive_skill_itemized_desc = cardData.passive_skill_itemized_desc;
                    
                    // Vérifier si optimal_awakening_growths existe et contient passive_skill_itemized_desc
                    if (response.data.optimal_awakening_growths && 
                        response.data.optimal_awakening_growths.length > 0 && 
                        response.data.optimal_awakening_growths[0].passive_skill_itemized_desc) {
                        passive_skill_itemized_desc = response.data.optimal_awakening_growths[0].passive_skill_itemized_desc;
                    }

                    // Créer un nouvel objet avec seulement les données nécessaires
                    const newData = new DataModel({
                        id: cardData.id,
                        name: cardData.name,
                        rarity: cardData.rarity,
                        passive_skill_itemized_desc: passive_skill_itemized_desc,
                    });

                    await newData.save();
                    console.log(`Fichier ${i}.json inséré dans MongoDB avec les données: id=${cardData.id}, name=${cardData.name}, rarity=${cardData.rarity}`);
                } else {
                    console.log(`Fichier ${i}.json ignoré (valeur < 4)`);
                }
            }
        } catch (error) {
            console.error(`Erreur lors du téléchargement du fichier ${i}.json :`, error.message);
            
            // Gestion spécifique des erreurs HTTP
            if (error.response) {
                // Traitement des différents codes d'erreur
                switch (error.response.status) {
                    case 403: // Forbidden
                    case 429: // Too Many Requests
                        console.log(`Erreur ${error.response.status}, attente prolongée et renouvellement de session...`);
                        await new Promise(resolve => setTimeout(resolve, 120000)); // 2 minutes d'attente
                        await establishSession();
                        requestCount = 0;
                        i -= 10; // Retenter cette requête
                        break;
                    case 404: // Not Found - ignorer et continuer
                        console.log(`Ressource non trouvée pour ${i}, on continue...`);
                        break;
                    default:
                        // Pour les autres erreurs, attendre un peu et continuer
                        await new Promise(resolve => setTimeout(resolve, 30000));
                }
            } else if (error.request) {
                // Erreur réseau, attendre et réessayer
                console.log("Erreur réseau, attente avant de réessayer...");
                await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute
                i -= 10; // Retenter cette requête
            }
        }
    }
};

// Route pour récupérer les données
app.get("/api/data", async (req, res) => {
    try {
        const data = await DataModel.find();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// Lancer la récupération et insertion des JSON au démarrage du serveur
fetchAndStoreJSON();

app.listen(PORT, () => console.log(`Serveur backend démarré sur http://localhost:${PORT}`));