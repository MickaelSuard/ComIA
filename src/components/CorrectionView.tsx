import React from 'react';
import { TextArea } from './TextArea';
import { Loader2, ArrowRight } from 'lucide-react';

interface CorrectionViewProps {
  inputText: string;
  setInputText: (text: string) => void;
  isProcessing: boolean;
  outputText: string;
  setOutputText: (text: string) => void;
  suggestions: string[];
}

const CorrectionView: React.FC<CorrectionViewProps> = ({
  inputText,
  setInputText,
  isProcessing,
  outputText,
  setOutputText,
  suggestions,
}) => {
  return (
    <div className="space-y-8">
      <TextArea
        value={inputText}
        onChange={setInputText}
        placeholder="Entrez votre texte à corriger ici..."
        label="Texte à corriger"
      />
      <div className="relative">
        <div className="w-full h-px bg-gray-200 my-8" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            {isProcessing ? (
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            ) : (
              <ArrowRight className="w-6 h-6 text-blue-600" />
            )}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <TextArea
          value={outputText}
          onChange={setOutputText}
          placeholder="Le texte corrigé apparaîtra ici..."
          label="Texte corrigé"
        />
        {suggestions.length > 0 && (
          <div className="bg-blue-50 p-6 rounded-xl">
            <h3 className="font-medium text-blue-900 mb-4">Corrections suggérées :</h3>
            <ul className="space-y-3 text-blue-800">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorrectionView;
