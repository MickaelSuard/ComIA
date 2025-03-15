import { useState } from 'react';
import { Languages, Wand2, ArrowRight, Loader2 } from 'lucide-react';
import { TextArea } from './components/TextArea';
import { LanguageSelector } from './components/LanguageSelector';
import { processText } from './services/ai';

function App() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [targetLanguage, setTargetLanguage] = useState('fr');
  const [mode, setMode] = useState<'translate' | 'correct'>('translate');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to process');
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
      setError('Failed to process text. Make sure Ollama is running with the Mistral model.');
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
              AI Text Assistant
            </h1>
            <div className="flex items-center p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setMode('translate')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                  mode === 'translate'
                    ? 'bg-white shadow-md text-blue-600 transform scale-105'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Languages className="w-5 h-5" />
                <span className="font-medium">Translate</span>
              </button>
              <button
                onClick={() => setMode('correct')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                  mode === 'correct'
                    ? 'bg-white shadow-md text-blue-600 transform scale-105'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Wand2 className="w-5 h-5" />
                <span className="font-medium">Correct</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <TextArea
                value={inputText}
                onChange={setInputText}
                placeholder="Enter your text here..."
                label="Input Text"
              />
              {mode === 'translate' && (
                <LanguageSelector
                  value={targetLanguage}
                  onChange={setTargetLanguage}
                />
              )}
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
              <div className="space-y-4">
                <TextArea
                  value={outputText}
                  onChange={setOutputText}
                  placeholder={
                    mode === 'translate'
                      ? 'Translation will appear here...'
                      : 'Correction will appear here...'
                  }
                  label="Output"
                />
                {mode === 'correct' && suggestions.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <h3 className="font-medium text-blue-900 mb-2">Suggestions:</h3>
                    <ul className="list-disc list-inside space-y-2 text-blue-800">
                      {suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center space-x-2 font-medium ${
                isProcessing ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              <span>
                {mode === 'translate' ? 'Translate Text' : 'Correct Text'}
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