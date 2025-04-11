const fs = require('fs');
const path = require('path');

const downloadsDir = path.join(__dirname, 'downloads');
const outputDir = path.join(__dirname, 'filtered-info');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const processFiles = async () => {
    const files = fs.readdirSync(downloadsDir).filter(file => file.endsWith('.json'));

    for (const file of files) {
        const filePath = path.join(downloadsDir, file);
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const card = data.card;

            if (card && card.id) {
                const id = card.id;

                // Déterminer la "class" et le "type"
                let classType = null;
                let unitType = null;

                if (typeof card.element === 'number') {
                    const elementStr = card.element.toString().padStart(2, '0');
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

                // Catégories
                let categories = [];
                if (Array.isArray(data.categories)) {
                    categories = data.categories.sort((a, b) => b.priority - a.priority);
                }

                // Champs principaux
                let active_skill_id = card.hasOwnProperty('active_skill_view_id') ? card.active_skill_view_id : -1;
                let has_ultimate = card.hasOwnProperty('ultimate_special_id');

                let entree_id = -1;
                let fukkatsu_id = -1;
                if (Array.isArray(data.passive_animations)) {
                    for (const passive of data.passive_animations) {
                        if (passive.type === "lua" && passive.hasOwnProperty("id")) {
                            entree_id = passive.id;
                        }
                        if (passive.type === "effect" && passive.hasOwnProperty("id")) {
                            fukkatsu_id = passive.id;
                        }
                    }
                }

                let standby_id = -1;
                if (Array.isArray(data.standby_skills)) {
                    for (const standby of data.standby_skills) {
                        if (standby.hasOwnProperty("special_view_id")) {
                            standby_id = standby.special_view_id;
                            break;
                        }
                    }
                }

                let finish_1_id = -1;
                let finish_2_id = -1;
                if (Array.isArray(data.finish_skills)) {
                    if (data.finish_skills[0]?.special_view_id) {
                        finish_1_id = data.finish_skills[0].special_view_id;
                    }
                    if (data.finish_skills[1]?.special_view_id) {
                        finish_2_id = data.finish_skills[1].special_view_id;
                    }
                }

                let transfo_id = -1;
                if (Array.isArray(data.transformations)) {
                    for (const transfo of data.transformations) {
                        if (
                            transfo &&
                            typeof transfo === 'object' &&
                            typeof transfo.next_card_id === 'number' &&
                            transfo.next_card_id > card.id &&
                            transfo.next_card &&
                            typeof transfo.next_card === 'object' &&
                            typeof transfo.next_card.eff_value3 !== 'undefined'
                        ) {
                            const effKey = transfo.next_card.eff_value3;
                            const battleParams = transfo.next_card.battle_params;

                            if (
                                battleParams &&
                                typeof battleParams === 'object' &&
                                battleParams.hasOwnProperty(effKey) &&
                                typeof battleParams[effKey] === 'object' &&
                                battleParams[effKey].hasOwnProperty("1")
                            ) {
                                const value = battleParams[effKey]["1"];
                                if (typeof value === 'number' && value > 0) {
                                    transfo_id = value;
                                    console.log(`transfo_id affecté pour la carte ${card.id} : ${transfo_id}`);
                                    break;
                                }
                            }
                        }
                    }
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
                    active_skill_id: active_skill_id,
                    has_ultimate: has_ultimate,
                    entree_id: entree_id,
                    fukkatsu_id: fukkatsu_id,
                    standby_id: standby_id,
                    finish_1_id: finish_1_id,
                    finish_2_id: finish_2_id,
                    transfo_id: transfo_id,
                    categories: categories
                };

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

processFiles();
