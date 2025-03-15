export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface CorrectionResult {
  correctedText: string;
  suggestions: string[];
}