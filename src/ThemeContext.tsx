import { createContext, useContext, useState, ReactNode } from 'react';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  classes: ThemeClasses;
};

type ThemeClasses = {
  background: string;
  text: string;
  border: string;
  buttonBackground: string;
  buttonText: string;
  hoverBackground: string;
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;
};

const darkThemeClasses: ThemeClasses = {
  background: 'bg-[#080810]',
  text: 'text-white',
  border: 'border-[#1a1a2e]',
  buttonBackground: 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20',
  buttonText: 'text-white',
  hoverBackground: 'hover:bg-white/5',
  inputBackground: 'bg-[#0a0a12]',
  inputBorder: 'border-[#1a1a2e]',
  inputPlaceholder: 'placeholder-gray-500',
};

const lightThemeClasses: ThemeClasses = {
  background: 'bg-white',
  text: 'text-black',
  border: 'border-gray-300',
  buttonBackground: 'bg-gray-300',
  buttonText: 'text-black',
  hoverBackground: 'hover:bg-gray-400',
  inputBackground: 'bg-gray-100',
  inputBorder: 'border-gray-300',
  inputPlaceholder: 'placeholder-gray-400',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const classes = isDarkMode ? darkThemeClasses : lightThemeClasses;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, classes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
