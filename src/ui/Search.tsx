import { Globe } from 'lucide-react';
import React from 'react';

interface SearchProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  placeholder?: string;
  isLoading?: boolean;
  classes: {
    inputBackground: string;
    inputBorder: string;
    inputPlaceholder: string;
    buttonBackground: string;
    text: string;
  };
  activeFeature?: string;
  onModeToggle?: (mode: string) => void;
}

function Search({
  value,
  onChange,
  onSubmit,
  placeholder = 'Rechercher...',
  isLoading = false,
  classes,
  activeFeature,
  onModeToggle,
}: SearchProps) {

  if (activeFeature === 'search') {
    placeholder = 'Rechercher sur le Web...';
  }
  

  return (
    <form onSubmit={onSubmit} className="relative flex p-2 w-full justify-center items-center gap-4">
      <div className={`relative flex-1 max-w-7xl rounded-xl border transition-all duration-200`}>
        {/* Champ de saisie avec padding à gauche */}
        <textarea
          value={value}
          onChange={onChange}
        placeholder={placeholder}
        className={`flex-1 w-full p-4 max-w-7xl min-h-[10px] rounded-xl border-transparent bg-transparent outline-none resize-none`}
  />

        <div className='pl-4 mt-2'>
          <button
            type="button"
            onClick={() => onModeToggle?.(activeFeature === 'search' ? '' : 'search')}
            title="Rechercher sur le Web"
            className={`left-3 top-1/2 -translate-y-1/2 text-lg transition rounded-full p-1
        ${activeFeature === 'search' ? 'text-black bg-white ' : `text-gray-400 ` }
        hover:bg-neutral-700`}
          >
            <Globe />
          </button>
        </div>
      </div>


      {/* Bouton envoyer */}
      <button
        type="submit"
        disabled={isLoading}
        className={`p-4 rounded-xl transition-all duration-200 shadow-lg transform ${classes.buttonBackground} ${classes.text}`}
      >
        Envoyer
      </button>
    </form>

  );
}

export default Search;
