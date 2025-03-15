import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
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
  isProcessing,
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
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -ml-12 hidden md:block">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          ) : (
            <ArrowRight className="w-8 h-8 text-blue-600" />
          )}
        </div>
      </div>
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
