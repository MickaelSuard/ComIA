import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import XLSX from 'xlsx';
import { exec } from 'node:child_process';
import fs from 'node:fs/promises';
import { reformulateText } from '../src/services/reformulateText.js';

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = 3001;

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
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
    } finally {
        // Nettoyage des fichiers restants dans le dossier uploads
        try {
            const files = await fs.readdir('uploads');
            for (const file of files) {
                await fs.unlink(`uploads/${file}`);
                console.log(`Fichier supprimé: uploads/${file}`);
            }
        } catch (cleanupError) {
            console.error('Erreur lors du nettoyage des fichiers temporaires:', cleanupError);
        }
    }
});

// Fonction pour extraire le texte en fonction du type de fichier
const extractText = async (filePath, mimeType) => {
    try {
        if (mimeType === 'text/plain') {
            return await fs.readFile(filePath, 'utf-8');
        }
        else if (mimeType === 'application/pdf') {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
        }
        else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const dataBuffer = await fs.readFile(filePath);
            const result = await mammoth.extractRawText({ buffer: dataBuffer });
            return result.value;
        }
        else if (mimeType === 'application/vnd.ms-excel' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            // Lecture du fichier Excel
            const workbook = XLSX.readFile(filePath);
            let text = '';

            // Boucle sur toutes les feuilles du fichier
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const sheetData = XLSX.utils.sheet_to_csv(sheet); // Convertir en texte
                text += `\n--- Feuille: ${sheetName} ---\n${sheetData}`;
            });

            return text;
        }
        else {
            throw new Error('Format de fichier non pris en charge.');
        }
    } catch (error) {
        console.error('Erreur lors de l’extraction du texte:', error);
        throw error;
    }
};

// Fonction de résumé avec Ollama Mistral
const summarizeText = async (text) => {
    // console.log('Texte à résumer:', text); // Affiche le texte à résumer dans la console
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'mistral',
                prompt: `Résumé ce texte de manière concise :\n${text}`,
                stream: false,
                options: {
                    temperature: 0.3,
                    top_p: 0.95,
                    top_k: 40,
                    num_predict: 1000,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data.response; // Adapte cette ligne si le JSON a une structure différente
    } catch (error) {
        console.error('Erreur lors du résumé du texte:', error);
        throw error;
    }
};

app.post('/api/summarize', upload.single('document'), async (req, res) => {
    const filePath = req.file?.path;
    const mimeType = req.file?.mimetype;

    if (!filePath || !mimeType) {
        return res.status(400).send('Aucun fichier fourni.');
    }

    try {
        console.log(mimeType); // Affiche le type MIME du fichier dans la console
        const fileContent = await extractText(filePath, mimeType);
        // console.log('Contenu du fichier:', fileContent); // Affiche le contenu du fichier dans la console
        const summary = await summarizeText(fileContent);

        if (!summary) {
            throw new Error('Le résumé a échoué. Aucune donnée reçue.');
        }

        res.json({ summary });
    } catch (error) {
        res.status(500).send(`Erreur lors du résumé: ${error.message}`);
    } finally {
        try {
            await fs.unlink(filePath); // Supprime le fichier temporaire
        } catch (err) {
            console.error('Erreur lors de la suppression du fichier:', err);
        }
    }
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
