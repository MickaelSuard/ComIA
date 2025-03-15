import { useState } from 'react';
import { Languages, Wand2, ArrowRight, Loader2 } from 'lucide-react';
import { processText } from './services/ai';
import TranslationView from './components/TranslationView';
import CorrectionView from './components/CorrectionView';

function App() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [mode, setMode] = useState<'translate' | 'correct'>('translate');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!inputText.trim()) {
      setError('Veuillez entrer du texte à traiter');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setSuggestions([]);

    try {
      const result = await processText(
        inputText,
        mode,
        mode === 'translate' ? targetLanguage : undefined
      );

      if ('translatedText' in result) {
        setOutputText(result.translatedText);
      } else {
        setOutputText(result.correctedText);
        setSuggestions(result.suggestions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
              Assistant IA
            </h1>
            <div className="flex items-center p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => {
                  setMode('translate');
                  setOutputText('');
                  setSuggestions([]);
                }}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${mode === 'translate'
                  ? 'bg-white shadow-md text-blue-600 transform scale-105'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Languages className="w-5 h-5" />
                <span className="font-medium">Traduction</span>
              </button>
              <button
                onClick={() => {
                  setMode('correct');
                  setOutputText('');
                  setSuggestions([]);
                }}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${mode === 'correct'
                  ? 'bg-white shadow-md text-blue-600 transform scale-105'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Wand2 className="w-5 h-5" />
                <span className="font-medium">Correction</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          )}

          {mode === 'translate' ? <TranslationView
            inputText={inputText}
            setInputText={setInputText}
            targetLanguage={targetLanguage}
            setTargetLanguage={setTargetLanguage}
            isProcessing={isProcessing}
            outputText={outputText}
            setOutputText={setOutputText}
          /> : <CorrectionView
            inputText={inputText}
            setInputText={setInputText}
            isProcessing={isProcessing}
            outputText={outputText}
            setOutputText={setOutputText}
            suggestions={suggestions}
          />}

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center space-x-2 font-medium ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''
                }`}
            >
              <span>
                {mode === 'translate' ? 'Traduire' : 'Corriger'}
              </span>
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;