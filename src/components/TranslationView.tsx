import React from 'react';
import { TextArea } from './TextArea';
import { LanguageSelector } from './LanguageSelector';

interface TranslationViewProps {
  inputText: string;
  setInputText: (value: string) => void;
  targetLanguage: string;
  setTargetLanguage: (value: string) => void;
  isProcessing: boolean;
  outputText: string;
  setOutputText: (value: string) => void;
}

const TranslationView: React.FC<TranslationViewProps> = ({
  inputText,
  setInputText,
  targetLanguage,
  setTargetLanguage,
  outputText,
  setOutputText
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div className="space-y-6">
      <TextArea
        value={inputText}
        onChange={setInputText}
        placeholder="Entrez votre texte ici..."
        label="Texte source"
      />
      <LanguageSelector
        value={targetLanguage}
        onChange={setTargetLanguage}
      />
    </div>
    <div className="relative">
      <TextArea
        value={outputText}
        onChange={setOutputText}
        placeholder="La traduction apparaîtra ici..."
        label="Traduction"
      />
    </div>
  </div>
);

export default TranslationView;
