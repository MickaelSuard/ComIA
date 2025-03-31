import { processText } from './ai';

export const correctText = async (text:any) => {
  try {
    const result = await processText(text, 'correct');
    return result;
  } catch (error) {
    console.error('Erreur lors de la correction via Ollama:', error);
    throw error;
  }
};
