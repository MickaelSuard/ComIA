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

  if (activeFeature === 'search') {
    placeholder = 'Rechercher sur le Web...';
  }
  const { classes, isDarkMode } = useTheme();

  return (
    <div  className="relative flex w-full justify-center items-center gap-4  max-w-7xl mx-auto">
      <div className={`relative w-full rounded-xl border transition-all duration-200 ${classes.background}`}>
        {/* Champ de saisie avec padding à gauche */}
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`flex-1 w-full p-4 max-w-7xl min-h-[10px] border-transparent bg-transparent outline-none resize-none`}
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
        className={`p-4 rounded-xl transition-all duration-200 shadow-lg transform ${classes.buttonBackground} ${classes.text}`}
      >
        Envoyer
      </button>
    </div>

  );
}

export default Search;
