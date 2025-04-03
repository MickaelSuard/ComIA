import { TranslationResult } from '../types';

const OLLAMA_URL = '/api/generate';
const OLLAMA_MODEL = 'mistral';

const generatePrompt = (
  text: string,
  mode: 'translate' | 'correct',
  targetLanguage?: string
) => {
  if (mode === 'translate') {
    return `You are a professional translator, specialized in accurately translating text while maintaining its original meaning, tone, and context.  

    Translate the following text into ${targetLanguage}.  
    
    ⚠️ Important:  
    - Preserve the original style and nuances.  
    - Do NOT add explanations, comments, or additional text.  
    - Return ONLY the translated text.  
    
    Text to translate:  
    """${text}"""`;
  }

  // Removed correction-related code
  return '';
};

// Removed parseResponse function related to correction

export const processText = async (
  text: string,
  mode: 'translate',
  targetLanguage?: string
): Promise<TranslationResult> => {
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

    return {
      translatedText: data.response.trim(),
      sourceLanguage: 'auto',
      targetLanguage: targetLanguage || 'fr',
    };
  } catch (error) {
    console.error('Erreur lors du traitement du texte:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Impossible de se connecter à Ollama. Veuillez vous assurer qu\'Ollama est en cours d\'exécution avec le modèle Mistral.'
    );
  }
};

export const transcribeAndSummarize = async (file: File): Promise<{ transcription: string; summary: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erreur API Whisper (${response.status}): ${errorData || response.statusText}`);
    }

    const data = await response.json();
    return {
      transcription: data.transcription,
      summary: data.summary,
    };
  } catch (error) {
    console.error('Erreur lors de la transcription et du résumé:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Impossible de se connecter à Whisper. Veuillez vérifier que le service est en cours d\'exécution.'
    );
  }
};