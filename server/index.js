import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import XLSX from 'xlsx';
import { exec } from 'node:child_process';
import fs from 'node:fs/promises';
import { reformulateText } from '../src/services/reformulateText.js';

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { BartTokenizer, BartForConditionalGeneration } from '@xenova/transformers';

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

// Fonction pour extraire le texte du fichier sans découper par page
const extractText = async (filePath, mimeType) => {
    try {
        if (mimeType === "text/plain") {
            return await fs.readFile(filePath, "utf-8");
        } else if (mimeType === "application/pdf") {
            console.log("📄 PDF détecté, chargement avec LangChain...");
            const loader = new PDFLoader(filePath);
            const docs = await loader.load();

            // Extraire tout le texte sans découper par page
            const fullText = docs.map(doc => doc.pageContent).join("\n\n");
            return fullText;
        } else {
            throw new Error("Format non pris en charge.");
        }
    } catch (error) {
        console.error("Erreur lors de l'extraction du texte:", error);
        throw error;
    }
};

// Fonction pour découper un texte en sections basées sur des paragraphes
const splitTextIntoSections = (text) => {
    const paragraphs = text.split('\n\n'); // Découpe le texte par paragraphes
    return paragraphs;
};

// Fonction pour résumer plusieurs sections en une seule requête
const summarizeTextInSections = async (text) => {
    const sections = splitTextIntoSections(text);
    const summaries = [];
    const chunkSize = 15; // Nombre de sections à regrouper par requête
    let chunk = '';

    // Regrouper les sections par bloc
    for (let i = 0; i < sections.length; i++) {
        chunk += sections[i] + "\n\n";

        // Si on atteint la taille maximale du chunk, on envoie la requête
        if ((i + 1) % chunkSize === 0 || i === sections.length - 1) {
            try {
                console.log("✍️ Envoi du bloc à Ollama (Mistral)...", chunk);
                const response = await fetch("http://localhost:11434/api/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "mistral:instruct",
                        prompt: `Fais un résumé en français uniquement, sans aucune phrase en anglais, des sections suivantes. Ne donne pas ton opinion, uniquement un résumé des points clés :\n\n${chunk}`,
                        stream: false,
                        options: {
                            temperature: 0.1,
                            top_p: 0.85,
                            top_k: 50,
                        },
                    }),
                });

                if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
                const data = await response.json();
                summaries.push(data.response); // Ajoute le résumé du bloc
            } catch (error) {
                console.error("❌ Erreur lors du résumé du bloc:", error);
                throw error;
            }

            // Réinitialiser le bloc pour le prochain ensemble de sections
            chunk = '';
        }
    }

    // Assemble tous les résumés des blocs
    return summaries.join("\n\n");
};

// Fonction principale pour extraire et résumer le texte du fichier
app.post('/api/summarize', upload.single('document'), async (req, res) => {
    const filePath = req.file?.path;
    const mimeType = req.file?.mimetype;

    if (!filePath || !mimeType) {
        return res.status(400).send('Aucun fichier fourni.');
    }

    try {
        console.log(mimeType); // Affiche le type MIME du fichier dans la console
        const fileContent = await extractText(filePath, mimeType);
        console.log('Contenu extrait du fichier:', fileContent); // Affiche tout le texte extrait du fichier dans la console

        // Résumer le texte en sections et assembler le résumé global
        const summary = await summarizeTextInSections(fileContent);

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

app.post('/api/ask', async (req, res) => {
    const { summary, question } = req.body;
  
    if (!summary || !question) {
      return res.status(400).json({ error: "Résumé et question requis." });
    }
  
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral:instruct',
          prompt: `Voici un résumé de document :\n\n${summary}\n\nRéponds précisément à cette question basée uniquement sur ce résumé (en français) : "${question}"`,
          stream: false,
          options: {
            temperature: 0.2,
            top_p: 0.9,
            top_k: 50,
          },
        }),
      });
  
      const data = await response.json();
      return res.json({ answer: data.response });
    } catch (error) {
      console.error("Erreur API /ask:", error);
      res.status(500).json({ error: "Erreur lors de la génération de la réponse." });
    }
});



// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
