import React from 'react';

type SearchProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  isLoading?: boolean;
  classes: {
    inputBackground: string;
    inputBorder: string;
    inputPlaceholder: string;
    buttonBackground: string;
    text: string;
  };
};

function Search({ value, onChange, onSubmit, placeholder = 'Rechercher...', isLoading = false, classes }: SearchProps) {
  return (
    <form onSubmit={onSubmit} className="flex p-2 w-full justify-center items-center gap-4">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`flex-1 p-4 max-w-7xl h-full rounded-xl border transition-all duration-200 ${classes.inputBackground} ${classes.inputBorder} ${classes.inputPlaceholder}`}
      />
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
