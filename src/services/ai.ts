import { TranslationResult, CorrectionResult } from '../types';

const OLLAMA_URL = '/api/generate';
const OLLAMA_MODEL = 'mistral';

const generatePrompt = (
  text: string,
  mode: 'translate' | 'correct',
  targetLanguage?: string
) => {
  if (mode === 'translate') {
    return `You are a professional translator. Translate the following text to ${targetLanguage} while preserving the original meaning, tone, and context. Provide ONLY the translation, without explanations or additional text.

Text to translate:
${text}`;
  }
  
  return `Tu es un correcteur professionnel francophone. Examine le texte suivant pour :
1. Les erreurs grammaticales
2. Les fautes d'orthographe
3. La ponctuation
4. Le style
5. Le choix des mots

Fournis d'abord la version corrigée du texte.
Puis, liste chaque correction avec une brève explication en français.
Format de la réponse :

TEXTE CORRIGÉ :
[Version corrigée]

CORRECTIONS ET EXPLICATIONS :
• [Première correction] : [Explication]
• [Deuxième correction] : [Explication]
(etc.)

Voici le texte à examiner :
${text}`;
};

const parseResponse = (response: string, mode: 'translate' | 'correct'): { text: string; suggestions?: string[] } => {
  const cleanResponse = response.trim();

  if (mode === 'translate') {
    return { text: cleanResponse.split('\n')[0].trim() };
  }

  const correctedMatch = cleanResponse.match(/TEXTE CORRIGÉ :\s*([\s\S]*?)(?=CORRECTIONS ET EXPLICATIONS :|$)/i);
  const correctionsMatch = cleanResponse.match(/CORRECTIONS ET EXPLICATIONS :\s*([\s\S]*?)$/i);

  const correctedText = correctedMatch ? correctedMatch[1].trim() : cleanResponse;
  let suggestions: string[] = [];

  if (correctionsMatch) {
    suggestions = correctionsMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('•'))
      .map(line => line.substring(1).trim());
  }

  return {
    text: correctedText,
    suggestions: suggestions.length > 0 ? suggestions : undefined
  };
};

export const processText = async (
  text: string,
  mode: 'translate' | 'correct',
  targetLanguage?: string
): Promise<TranslationResult | CorrectionResult> => {
  try {
    if (!text.trim()) {
      throw new Error('Le texte ne peut pas être vide');
    }

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: generatePrompt(text, mode, targetLanguage),
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
      const errorData = await response.text();
      throw new Error(
        `Erreur API Ollama (${response.status}): ${errorData || response.statusText}`
      );
    }

    const data = await response.json();
    
    if (!data.response) {
      throw new Error('Réponse invalide de l\'API Ollama');
    }

    const parsed = parseResponse(data.response, mode);

    if (mode === 'translate') {
      return {
        translatedText: parsed.text,
        sourceLanguage: 'auto',
        targetLanguage: targetLanguage || 'fr',
      };
    } else {
      return {
        correctedText: parsed.text,
        suggestions: parsed.suggestions || [],
      };
    }
  } catch (error) {
    console.error('Erreur lors du traitement du texte:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Impossible de se connecter à Ollama. Veuillez vous assurer qu\'Ollama est en cours d\'exécution avec le modèle Mistral.'
    );
  }
};