import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { exec } from 'node:child_process'; // Assure-toi d'avoir "node:" ici
import fs from 'node:fs/promises';

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = 3001;

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5174',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    const filePath = req.file?.path;
    console.log('Fichier reçu:', req.file);
    console.log('Chemin du fichier:', filePath);

    if (!filePath) {
        return res.status(400).send('Aucun fichier fourni.');
    }

    try {
        // Vérifie si whisper est bien installé en exécutant une commande simple
        const whisperCheck = await new Promise((resolve, reject) => {
            exec('whisper --help', (error) => {
                if (error) {
                    console.error("Whisper n'est pas installé ou introuvable !");
                    reject(new Error("Whisper n'est pas installé sur le serveur."));
                } else {
                    resolve(true);
                }
            });
        });

        // Exécute Whisper correctement
        const transcription = await new Promise((resolve, reject) => {
            exec(`whisper ${filePath} --model base --language fr`, (error, stdout, stderr) => {
                console.log('Whisper stdout:', stdout);
                console.error('Whisper stderr:', stderr);
                if (error) {
                    console.error("Erreur lors de l'exécution de Whisper:", error);
                    reject(error);
                    return;
                }
                resolve(stdout.trim());
            });
        });

        // Supprime le fichier téléchargé après la transcription
        await fs.unlink(filePath);

        // Envoie la réponse avec la transcription
        res.json({ transcription });
    } catch (error) {
        console.error('Erreur de transcription:', error.message);

        // Vérifie si une réponse a déjà été envoyée
        if (!res.headersSent) {
            res.status(500).send(`Erreur lors de la transcription: ${error.message}`);
        }
    }
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
