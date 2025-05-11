import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import XLSX from 'xlsx';
import { exec } from 'node:child_process';
import fs from 'node:fs/promises';
import { reformulateText } from '../src/services/reformulateText.js';
import { marked } from 'marked';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { BartTokenizer, BartForConditionalGeneration } from '@xenova/transformers';

import * as cheerio from 'cheerio'

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



const summarizeTextInSections = async (text, question) => {
    if (!question || typeof question !== 'string' || question.trim() === '') {
        throw new Error("La question doit être une chaîne de caractères valide.");
    }

    const sections = splitTextIntoSections(text);
    const relevantInformation = [];
    const chunkSize = 2;
    let chunk = '';

    for (let i = 0; i < sections.length; i++) {
        chunk += sections[i] + "\n\n";

        if ((i + 1) % chunkSize === 0 || i === sections.length - 1) {
            try {
                const prompt = `
                        Tu es un expert en analyse documentaire. Tu vas lire plusieurs extraits d’un document.

                        ------------------
                        ${chunk}
                        ------------------

                        Ta tâche : répondre à la question suivante uniquement si les informations présentes dans les extraits le permettent de manière certaine.

                        ❗️Si aucune information claire ou directe ne permet de répondre, ne réponds rien. Ne donne aucune réponse vague ou partielle.

                        ⚠️ Règles à respecter impérativement :

                        1. **Tu dois ignorer complètement la question** si elle est trop vague, trop générale, ou si les extraits ne donnent pas assez de contexte pour y répondre avec certitude.
                        2. **Ne réponds que si les extraits contiennent tous les éléments nécessaires pour répondre précisément et sans interprétation**.
                        3. **Si la réponse nécessite une supposition, une interprétation, une généralisation ou une déduction implicite, NE RÉPONDS PAS**.
                        4. **Ne reformule pas la question, ne dis pas que l'information est absente, et surtout NE RÉPONDS RIEN dans ce cas. Reste silencieux.**
                        5. **Si le résumé ne fournit aucune information exacte pour répondre à la question**, réponds par **"Je ne sais pas"**, sans ajouter de commentaire supplémentaire.

                        Question : "${question}"

                        Réponse (seulement si elle est parfaitement justifiée par les extraits) :`;

                const response = await fetch("http://localhost:11434/api/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "mistral",
                        prompt,
                        stream: false,
                        options: {
                            temperature: 0.1,
                            top_p: 0.1,
                            top_k: 0.1,
                        },
                    }),
                });

                if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
                const data = await response.json();
                const answer = data.response.trim();

                // Si le modèle a vraiment donné une réponse utile, on la garde
                if (answer && answer.length > 0 && !answer.toLowerCase().includes("je ne sais pas")) {
                    relevantInformation.push(answer);
                }

            } catch (error) {
                console.error("❌ Erreur lors de la demande au modèle:", error);
                throw error;
            }

            chunk = ''; // Réinitialise pour le prochain groupe
        }
    }

    return relevantInformation.join("\n\n");
};



// Fonction pour diviser un texte en sections (implémentation simplifiée)
const splitTextIntoSections = (text) => {
    const sections = text.split("\n\n");
    return sections;
};

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

// Fonction principale pour extraire et résumer le texte du fichier
app.post('/api/summarize', upload.single('document'), async (req, res) => {
    const filePath = req.file?.path;
    const mimeType = req.file?.mimetype;

    if (!filePath || !mimeType) {
        return res.status(400).send('Aucun fichier fourni.');
    }

    try {
        // console.log(mimeType); // Affiche le type MIME du fichier dans la console
        const fileContent = await extractText(filePath, mimeType);
        // console.log('Contenu extrait du fichier:', fileContent);

        // Résumer le texte en sections et assembler le résumé global
        // const summary = await summarizeTextInSections(fileContent);

        // if (!summary) {
        //     throw new Error('Le résumé a échoué. Aucune donnée reçue.');
        // }
        const summary = fileContent;

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

    // Vérification des données reçues
    if (!summary || !question) {
        return res.status(400).json({ error: "Résumé et question requis." });
    }

    try {
        const summaryOllama = await summarizeTextInSections(summary, question);
        console.log(summaryOllama); // Affiche le résumé et la question dans la console

        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'mistral',
                prompt: `Voici un résumé du document :
                ${summaryOllama}
                
                Ta tâche est de répondre à la question suivante **uniquement si le résumé contient des informations exactes et claires qui permettent de répondre avec certitude**.
                
                ⚠️ Règles strictes :
                - Si tu trouves des informations **exactes et précises** qui répondent à la question, transmets-les **clairement et directement**.
                - **Ne fais aucune supposition, ne reformule pas, ne donne pas d'interprétation**. La réponse doit être **directe, factuelle et exacte**.
                - **Si le résumé ne fournit aucune information exacte pour répondre à la question**, **ne réponds rien du tout**, sans ajouter de commentaire tel que "Aucune information pertinente", "Je ne sais pas", ou autre phrase similaire. Il ne doit pas y avoir de réponse si aucune information précise n'est disponible.
                
                Question : "${question}"
                
                Réponse (uniquement si des informations exactes sont présentes dans le résumé) :
                `,
                stream: false,
                options: {
                    temperature: 0.1,
                    top_p: 0.1,
                    top_k: 0.1,
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



app.post('/api/search', async (req, res) => {
    try {
        const { query } = req.body;
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

        // Faire la requête DuckDuckGo
        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
            },
        });

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extraire les résultats
        const results = [];
        const sources = [];
        $('.result').each((i, el) => {
            const title = $(el).find('a.result__a').text();
            const snippet = $(el).find('.result__snippet').text();
            let url = $(el).find('a.result__a').attr('href'); // URL du résultat

            if (title && snippet && url) {
                // Ajouter le préfixe "https:" si l'URL commence par "//"
                if (url.startsWith('//')) {
                    url = `https:${url}`;
                }

                results.push(`- ${title.trim()}: ${snippet.trim()}`);
                try {
                    const decodedUrl = decodeURIComponent(url);
                    const domain = new URL(decodedUrl).hostname.replace('www.', '');
                    sources.push(`<li>${domain}: <a href="${decodedUrl}" target="_blank">${decodedUrl}</a></li>`); // Ajouter le nom du site et le lien cliquable
                } catch (error) {
                    console.error("URL invalide :", url);
                }
            }
        });

        if (results.length === 0) {
            return res.status(404).json({ error: 'Aucun résultat trouvé.' });
        }

        const context = results.slice(0, 5).join('\n');
        // Convert sources to an array of objects with domain and URL
        const sourcesArray = sources.slice(0, 5).map(source => {
            const match = source.match(/<li>(.*?): <a href="(.*?)"/);
            if (match) {
                const url = match[2];
                try {
                    // Extract the actual URL from the DuckDuckGo redirect
                    const actualUrl = new URL(url).searchParams.get('uddg');
                    if (actualUrl) {
                        const domain = new URL(actualUrl).hostname.replace('www.', ''); // Extract the correct domain
                        return { domain, url: actualUrl };
                    }
                } catch (error) {
                    console.error("Erreur lors de l'extraction du domaine :", url);
                    return null;
                }
            }
            return null;
        }).filter(Boolean);

        // Préparer le prompt pour Ollama
        const ollamaPrompt = `Voici des extraits de résultats de recherche sur : "${query}"\n\n${context}\n\nFais un résumé clair et concis en francais des informations trouvées, sans inventer.`;

        // Appel à Ollama local
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'mistral',
                prompt: ollamaPrompt,
            }),
        });

        // Lire le flux JSONL de la réponse
        const reader = ollamaResponse.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let result = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            result += decoder.decode(value, { stream: true });
        }

        // Séparer les lignes et parser chaque ligne JSON
        const lines = result
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch (e) {
                    console.error("Ligne invalide :", line);
                    return null;
                }
            })
            .filter(obj => obj && obj.response);

        // Extraire le texte du modèle
        const finalResponse = lines.map(obj => obj.response).join('');

        // Retourner la réponse avec résumé et sources
        return res.json({
            result: finalResponse,
            sources: sourcesArray // Return sources as an array of objects
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la recherche ou du résumé.' });
    }
});


app.post('/api/instruct', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt manquant.' });
    }

    try {
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'mistral',
                prompt,
                stream: false,
            })
        });

        const data = await ollamaResponse.json();

        if (data.error) {
            return res.status(500).json({ error: data.error });
        }

        const response = data.response;

        // Vérifier si le prompt contient des instructions pour générer un tableau ou du markdown
        if (prompt.toLowerCase().includes('tableau') || prompt.toLowerCase().includes('markdown') || prompt.toLowerCase().includes('formatage') )  { 
            const htmlResponse = generateHtmlFromMarkdown(response);
            return res.json({ result: htmlResponse });
        }

        // Sinon, retourner la réponse en texte brut
        return res.json({ result: response });

    } catch (error) {
        console.error('Erreur /api/instruct:', error);
        return res.status(500).json({ error: "Erreur interne du serveur." });
    }
});

// Fonction pour transformer le Markdown en HTML
const generateHtmlFromMarkdown = (markdownText) => {
    return marked(markdownText); // Cela convertira le markdown en HTML
};

  
  



// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
