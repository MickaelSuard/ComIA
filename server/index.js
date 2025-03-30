import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { exec } from 'node:child_process'; 
import fs from 'node:fs/promises';
import { reformulateText } from '../src/services/reformulateText.js'; 

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = 3001;

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5175',
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
        const transcription = await new Promise((resolve, reject) => {
            const outputFilePath = `${filePath}.txt`; // Chemin du fichier de sortie
            exec(`whisper ${filePath} --model base --language fr  --output_dir uploads 2>NUL`, async (error, stdout, stderr) => {
                console.log('Whisper stdout:', stdout);
                if (stderr) {
                    console.warn('Whisper stderr (filtré):', stderr);
                }
                if (error) {
                    console.error("Erreur lors de l'exécution de Whisper:", error);
                    reject(new Error(stderr || "Erreur inconnue lors de l'exécution de Whisper."));
                    return;
                }
                try {
                    const transcriptionContent = await fs.readFile(outputFilePath, 'utf-8');
                    await fs.unlink(outputFilePath); // Supprime le fichier de transcription
                    resolve(transcriptionContent); // Renvoie le contenu de la transcription
                } catch (readError) {
                    reject(new Error("Erreur lors de la lecture du fichier de transcription."));
                }
            });
        });

        await fs.unlink(filePath); // Supprime le fichier audio temporaire
        console.log('Fichier temporaire supprimé:', filePath);

        // Reformulation de la transcription
        const reformulatedText = await reformulateText(transcription);

        if (!reformulatedText) {
            throw new Error('La reformulation a échoué. Aucune donnée reçue.');
        }

        res.json({ 
            transcription, // Transcription originale
            reformulatedTranscription: reformulatedText // Transcription reformulée
        });
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
