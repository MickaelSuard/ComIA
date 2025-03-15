import { TranslationResult, CorrectionResult } from '../types';

const OLLAMA_URL = '/api/generate';

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
  
  return `You are a professional editor and language expert. Review the following text for:
1. Grammar mistakes
2. Spelling errors
3. Punctuation issues
4. Style improvements
5. Word choice suggestions

First, provide the corrected version of the text.
Then, list each correction you made with a brief explanation of why the change was necessary.
Format your response as follows:

CORRECTED TEXT:
[Your corrected version]

CORRECTIONS AND EXPLANATIONS:
• [First correction]: [Explanation]
• [Second correction]: [Explanation]
(etc.)

Here's the text to review:
${text}`;
};

const parseResponse = (response: string, mode: 'translate' | 'correct'): { text: string; suggestions?: string[] } => {
  const cleanResponse = response.trim();

  if (mode === 'translate') {
    return { text: cleanResponse.split('\n')[0].trim() };
  }

  // For corrections, look for specific markers
  const correctedMatch = cleanResponse.match(/CORRECTED TEXT:\s*([\s\S]*?)(?=CORRECTIONS AND EXPLANATIONS:|$)/i);
  const correctionsMatch = cleanResponse.match(/CORRECTIONS AND EXPLANATIONS:\s*([\s\S]*?)$/i);

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
      throw new Error('Input text cannot be empty');
    }

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral',
        prompt: generatePrompt(text, mode, targetLanguage),
        stream: false,
        options: {
          temperature: 0.3, // Lower temperature for more precise outputs
          top_p: 0.95,
          top_k: 40,
          num_predict: 1000, // Ensure we get complete responses
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(
        `Ollama API error (${response.status}): ${errorData || response.statusText}`
      );
    }

    const data = await response.json();
    
    if (!data.response) {
      throw new Error('Invalid response from Ollama API');
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
    console.error('Error processing text:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to connect to Ollama. Please ensure Ollama is running with the Mistral model.'
    );
  }
};