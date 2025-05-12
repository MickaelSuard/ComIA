import { Globe } from 'lucide-react';
import React from 'react';
import { useTheme } from '../ThemeContext';

interface SearchProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  placeholder?: string;
  isLoading?: boolean;
  activeFeature?: string;
  mode?: [string];
  onModeToggle?: (mode: string) => void;
}

function Search({
  value,
  onChange,
  onSubmit,
  placeholder = 'Rechercher...',
  isLoading = false,
  activeFeature = '',
  mode,
  onModeToggle,
}: SearchProps) {

  const { classes, isDarkMode } = useTheme();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto'; // Reset height to calculate new height
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`; // Set height with a max limit
    onChange(e);
  };

  if (activeFeature === 'search') {
    placeholder = 'Rechercher sur le Web...';
  }
  

  return (
    <div className="relative flex w-full justify-center items-center gap-4  max-w-7xl mx-auto">
      <div className={`relative w-full rounded-xl border transition-all duration-200 ${classes.background}`}>
        {/* Champ de saisie avec padding à gauche */}
        <textarea
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`flex-1 w-full p-4 max-w-7xl min-h-[10px] border-transparent bg-transparent outline-none resize-none`}
          style={{ maxHeight: '200px', overflowY: 'auto' }} // Add max height and scroll behavior
        />

        {/* Icône de recherche */}
        {mode?.includes('search') && (
          <div className='pl-4 mt-2'>
            <button
              type="button"
              onClick={() => onModeToggle?.(activeFeature === 'search' ? '' : 'search')}
              title="Rechercher sur le Web"
              className={`left-3 top-1/2 -translate-y-1/2 text-lg transition rounded-full p-1 hover:bg-neutral-700 hover:text-white
        ${activeFeature === 'search' ? `${isDarkMode ? `text-black bg-white` : `text-white bg-gray-700`}  ` : `text-gray-400 `}
        `}
            >
              <Globe />
            </button>
          </div>)}
      </div>

      {/* Message d'avertissement */}
      <p className="absolute -bottom-6 left-3 text-sm text-gray-500 text-center">
        ComIA peut commettre des erreurs. Il est recommandé de vérifier les informations importantes.
      </p>

      {/* Bouton envoyer */}
      <button
        type="submit"
        disabled={isLoading}
        onClick={onSubmit}
        className={` px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-md transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2  focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${classes.buttonBackground} ${classes.text}`}
      >
        {isLoading ? 'Chargement...' : 'Envoyer'}
      </button>
    </div>

  );
}

export default Search;
