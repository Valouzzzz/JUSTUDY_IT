const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const cron = require('node-cron');
const axios = require('axios');
const admin = require('firebase-admin'); // Firebase Admin SDK
const { parse } = require('csv-parse/sync');

//const CSV_URL = "https://docs.google.com/spreadsheets/d/{You_number}/export?format=csv";
const CSV_FILE = path.join(__dirname, "planning.csv");
let csvData = [];

// Initialisez Firebase Admin avec vos informations d'identification Firebase
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const app = express();

async function downloadCSV() {
    try {
        console.log("Téléchargement du CSV...");
        const res = await axios.get(CSV_URL);
        const csv = res.data;

        // Supprimer l'ancien fichier si existant
        if (fs.existsSync(CSV_FILE)) {
            fs.unlinkSync(CSV_FILE);
            console.log("Ancien fichier supprimé");
        }

        fs.writeFileSync(CSV_FILE, csv);
        console.log("Nouveau CSV téléchargé !");

        // Parser le CSV
        csvData = parse(csv, { columns: true, skip_empty_lines: true });
    } catch (err) {
        console.error("Erreur lors du téléchargement du CSV :", err);
    }
}

// Téléchargement immédiat au lancement
downloadCSV();

// Planification quotidienne à 7h00
cron.schedule('0 7 * * *', () => {
    downloadCSV();
});

app.get('/chapitre-du-jour', (req, res) => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2,'0');
    const month = String(today.getMonth() + 1).padStart(2,'0');
    const year = today.getFullYear();
    const todayStr = `${day}/${month}/${year}`; // format : 19/09/2025

    let chaptersToday = [];

    csvData.forEach(row => {
        // Vérifier toutes les colonnes pour trouver la date du jour
        for (let key in row) {
            if (row[key] && row[key].trim() === todayStr) {
                chaptersToday.push(row["Chapitre :"]);
                break;
            }
        }
    });

    if (chaptersToday.length === 0) {
        res.send("✅ Aucun chapitre à réviser aujourd'hui !");
    } else {
        res.send("📚 Chapitre(s) à réviser aujourd'hui : <br>" + chaptersToday.join("<br>"));
    }
});

app.use(express.json()); // Middleware pour analyser le JSON
app.use(express.static(path.join(__dirname, 'public')));

// Chemin vers le fichier JSON pour les tâches
const tasksFilePath = path.join(__dirname, 'tasks.json');

// Fonction pour lire les tâches
function readTasks() {
    return new Promise((resolve, reject) => {
        fs.readFile(tasksFilePath, 'utf8', (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(JSON.parse(data || '[]'));
        });
    });
}

// Fonction pour écrire les tâches
function writeTasks(tasks) {
    return new Promise((resolve, reject) => {
        fs.writeFile(tasksFilePath, JSON.stringify(tasks, null, 2), 'utf8', (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

// Route pour obtenir toutes les tâches
app.get('/tasks', async (req, res) => {
    try {
        const tasks = await readTasks();
        res.json(tasks);
    } catch (err) {
        console.error('Erreur lors de la lecture des tâches:', err);
        res.status(500).send('Erreur serveur');
    }
});

// Route pour ajouter une tâche
app.post('/tasks', async (req, res) => {
    try {
        const tasks = await readTasks();
        const newTask = req.body;
        tasks.push(newTask);
        await writeTasks(tasks);
        res.status(201).json(newTask);
    } catch (err) {
        console.error('Erreur lors de l\'ajout de la tâche:', err);
        res.status(500).send('Erreur serveur');
    }
});

// Route pour supprimer une tâche
app.delete('/tasks/:index', async (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const tasks = await readTasks();
        if (index >= 0 && index < tasks.length) {
            tasks.splice(index, 1);
            await writeTasks(tasks);
            res.status(204).send();
        } else {
            res.status(404).send('Tâche non trouvée');
        }
    } catch (err) {
        console.error('Erreur lors de la suppression de la tâche:', err);
        res.status(500).send('Erreur serveur');
    }
});

// Route pour obtenir les informations météo
app.get('/weather', (req, res) => {
    exec('python3 get_weather.py', (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur lors de l'exécution du script: ${error.message}`);
            return res.status(500).send('Erreur serveur');
        }
        if (stderr) {
            console.error(`Erreur dans le script Python: ${stderr}`);
            return res.status(500).send('Erreur dans le script Python');
        }
        // Assurer que l'encodage est bien défini comme UTF-8
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(stdout);  // Envoyer la sortie du script Python
    });
});

// Chemin vers le fichier JSON pour les notes
const notesFilePath = path.join(__dirname, 'notes.json');

// Fonction pour lire les notes
function readNotes() {
    return new Promise((resolve, reject) => {
        fs.readFile(notesFilePath, 'utf8', (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(JSON.parse(data || '[]'));
        });
    });
}

// Fonction pour écrire les notes
function writeNotes(notes) {
    return new Promise((resolve, reject) => {
        fs.writeFile(notesFilePath, JSON.stringify(notes, null, 2), 'utf8', (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

// Route pour obtenir toutes les notes
app.get('/notes', async (req, res) => {
    try {
        const notes = await readNotes();
        res.json(notes);
    } catch (err) {
        console.error('Erreur lors de la lecture des notes:', err);
        res.status(500).send('Erreur serveur');
    }
});

// Route pour ajouter une note
app.post('/notes', async (req, res) => {
    try {
        const notes = await readNotes();
        const newNote = req.body;
        notes.push(newNote);
        await writeNotes(notes);
        res.status(201).json(newNote);
    } catch (err) {
        console.error('Erreur lors de l\'ajout de la note:', err);
        res.status(500).send('Erreur serveur');
    }
});

// Route pour supprimer une note
app.delete('/notes/:index', async (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const notes = await readNotes();
        if (index >= 0 && index < notes.length) {
            notes.splice(index, 1);
            await writeNotes(notes);
            res.status(204).send();
        } else {
            res.status(404).send('Note non trouvée');
        }
    } catch (err) {
        console.error('Erreur lors de la suppression de la note:', err);
        res.status(500).send('Erreur serveur');
    }
});

// coefficient 
app.post('/notes', (req, res) => {
    const { subject, value, coef, date } = req.body;

    const newNote = { subject, value, coef, date };
    notes.push(newNote);

    fs.writeFile(notesFilePath, JSON.stringify(notes), (err) => {
        if (err) {
            console.error('Erreur lors de la sauvegarde des notes :', err);
            res.status(500).send('Erreur lors de la sauvegarde des notes');
        } else {
            res.json(newNote);
        }
    });
});

// Fonction pour récupérer et afficher les notes
function fetchNotes() {
    fetch('/notes')
        .then(response => response.json())
        .then(notes => {
            // Vider la liste avant de la remplir pour éviter des doublons
            noteList.innerHTML = '';

            // Parcourir chaque note et l'afficher
            notes.forEach(note => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${note.subject} : ${note.value}/20 (Coef : ${note.coef}) (Date : ${note.date})</span>
                                <button onclick="deleteNote(this)">Supprimer</button>`;
                noteList.appendChild(li);
            });

            // Mettre à jour le graphique après récupération des notes
            updateChart();
        })
        .catch(error => console.error('Erreur lors de la récupération des notes:', error));
}

app.get('/notes', (req, res) => {
    res.json(notes);  // Envoyer toutes les notes (avec coefficients inclus)
});


const WEBHOOK_URL = 'https://discord.com/api/webhooks/{Token_ID}/{Token_ID}'; // Remplace par l'URL de ton webhook Discord

// Fonction pour charger les tâches depuis un fichier JSON
function loadTasks() {
    const data = fs.readFileSync('tasks.json', 'utf-8');
    return JSON.parse(data);
}

// Fonction pour obtenir les tâches du jour
function getTodayTasks() {
    const today = new Date().toISOString().split('T')[0];
    const tasks = loadTasks();
    return tasks.filter(task => task.deadline === today);
}

// Planifier l'envoi des tâches à 7h chaque jour
cron.schedule('0 7 * * *', async () => {
    console.log("Envoi des tâches du jour à 7h");

    const todayTasks = getTodayTasks();
    let messageContent;

    if (todayTasks.length > 0) {
        // Construit le message avec les informations des tâches
        messageContent = "**📅 Tâches du jour**\n" + todayTasks.map(task => `- **${task.name || "Sans titre"}** : ${task.desc || "Pas de description"}`).join("\n");
    } else {
        messageContent = "**📅 Tâches du jour**\nAucune tâche pour aujourd'hui !";
    }

    try {
        await axios.post(WEBHOOK_URL, {
            content: messageContent
        });
        console.log("Message envoyé avec succès !");
    } catch (error) {
        console.error("Erreur lors de l'envoi du message :", error);
    }
});

app.use(express.json());

// Chemin du fichier où les événements seront stockés
const eventsFile = './events.json';

// Récupérer tous les événements
app.get('/events', (req, res) => {
    fs.readFile(eventsFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture des événements :', err);
            return res.status(500).send('Erreur interne');
        }
        res.json(data ? JSON.parse(data) : []);
    });
});

// Sauvegarder un nouvel événement
app.post('/events', (req, res) => {
    const newEvent = req.body;

    // Lire les événements existants
    fs.readFile(eventsFile, 'utf8', (err, data) => {
        let events = data ? JSON.parse(data) : [];

        // Ajouter le nouvel événement
        events.push(newEvent);

        // Écrire dans le fichier
        fs.writeFile(eventsFile, JSON.stringify(events), (err) => {
            if (err) {
                console.error('Erreur lors de la sauvegarde de l\'événement :', err);
                return res.status(500).send('Erreur interne');
            }
            res.status(201).send('Événement sauvegardé');
        });
    });
});

// Chargement des événements depuis le fichier
app.get('/events', (req, res) => {
    fs.readFile('events.json', 'utf8', (err, data) => {
        if (err) {
            res.status(500).json({ error: 'Erreur lors du chargement des événements' });
        } else {
            const events = data ? JSON.parse(data) : [];
            res.json(events);
        }
    });
});

// Enregistrement d'un nouvel événement
app.post('/events', (req, res) => {
    const newEvent = req.body;
    fs.readFile('events.json', 'utf8', (err, data) => {
        const events = data ? JSON.parse(data) : [];
        events.push(newEvent);
        fs.writeFile('events.json', JSON.stringify(events), (err) => {
            if (err) {
                res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'événement' });
            } else {
                res.status(200).json({ message: 'Événement enregistré avec succès' });
            }
        });
    });
});

// Supprimer un événement
app.delete('/events', (req, res) => {
    const { title, day, time } = req.body;

    fs.readFile(eventsFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture des événements :', err);
            return res.status(500).send('Erreur interne');
        }

        let events = data ? JSON.parse(data) : [];

        // Filtrer pour enlever l'événement spécifique
        events = events.filter(event => !(event.title === title && event.day === day && event.time === time));

        // Écrire la mise à jour dans le fichier
        fs.writeFile(eventsFile, JSON.stringify(events), (err) => {
            if (err) {
                console.error('Erreur lors de la suppression de l\'événement :', err);
                return res.status(500).send('Erreur interne');
            }
            res.send('Événement supprimé');
        });
    });
});

const { HfInference } = require("@huggingface/inference");
const client = new HfInference("{Token_ID}");

app.use(express.json());

app.post("/chat", async (req, res) => {
    const { userMessage } = req.body;

    try {
        let out = "";

        const stream = client.chatCompletionStream({
            model: "meta-llama/Meta-Llama-3-8B-Instruct",
            messages: [{ role: "user", content: userMessage }],
            temperature: 0.5,
            max_tokens: 1024,
            top_p: 0.7
        });

        for await (const chunk of stream) {
            if (chunk.choices && chunk.choices.length > 0) {
                const newContent = chunk.choices[0].delta.content;
                out += newContent;
            }
        }

        res.json({ response: out });
    } catch (error) {
        console.error("Erreur de requête Hugging Face :", error);
        res.status(500).send("Erreur de requête Hugging Face");
    }
});

app.use(express.json());
app.use(express.static(__dirname)); // Sert les fichiers statiques comme flashcarde.html

// Endpoint pour sauvegarder une flashcard
app.post("/save-flashcard", (req, res) => {
    const newFlashcard = req.body;

    fs.readFile("flashcards.json", "utf-8", (err, data) => {
        if (err) return res.json({ success: false, message: "Erreur de lecture du fichier." });

        const flashcards = data ? JSON.parse(data) : [];
        flashcards.push(newFlashcard);

        fs.writeFile("flashcards.json", JSON.stringify(flashcards), (err) => {
            if (err) return res.json({ success: false, message: "Erreur de sauvegarde." });
            res.json({ success: true });
        });
    });
});

// Endpoint pour récupérer toutes les flashcards
app.get("/get-flashcards", (req, res) => {
    fs.readFile("flashcards.json", "utf-8", (err, data) => {
        if (err) return res.json({ success: false, message: "Erreur de lecture du fichier." });

        const flashcards = data ? JSON.parse(data) : [];
        res.json({ success: true, flashcards });
    });
});

// Endpoint pour supprimer une flashcard
app.post("/delete-flashcard", (req, res) => {
    const flashcardToDelete = req.body;

    fs.readFile("flashcards.json", "utf-8", (err, data) => {
        if (err) return res.json({ success: false, message: "Erreur de lecture du fichier." });

        const flashcards = JSON.parse(data);
        const updatedFlashcards = flashcards.filter(flashcard =>
            flashcard.question !== flashcardToDelete.question ||
            flashcard.answer !== flashcardToDelete.answer
        );

        fs.writeFile("flashcards.json", JSON.stringify(updatedFlashcards), (err) => {
            if (err) return res.json({ success: false, message: "Erreur de suppression." });
            res.json({ success: true });
        });
    });
});

app.use(express.json());
app.use(express.static('public')); // <-- Sert ton questionnaire.html

// Route POST pour sauvegarder les résultats
app.post('/save-questionnaire', (req, res) => {
    const newResult = req.body;
    const file = 'questionnaires.json';

    let data = [];
    if (fs.existsSync(file)) {
        data = JSON.parse(fs.readFileSync(file, 'utf8'));
    }
    data.push(newResult);

    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    res.json({ message: "Résultat enregistré", result: newResult });
});

// Route GET pour savoir si un questionnaire a été fait aujourd'hui
app.get('/check-today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const file = 'questionnaires.json';

    if (!fs.existsSync(file)) return res.json({ doneToday: false });

    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const doneToday = data.some(r => r.date === today);

    res.json({ doneToday });
});

// Démarrer le serveur
app.listen(3000, () => {
    console.log('Serveur en cours d\'exécution sur le port 3000');
});
