import React from 'react';
import { Globe2 } from 'lucide-react';

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  value,
  onChange,
}) => {
  const languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
  ];

  return (
    <div className="flex items-center space-x-3 bg-white/50 backdrop-blur p-3 rounded-xl border border-gray-200">
      <Globe2 className="w-5 h-5 text-blue-600" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full bg-transparent border-none focus:ring-0 text-gray-700 font-medium"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};