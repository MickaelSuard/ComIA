import React, { useState, createContext, useContext } from 'react';
import { MessageSquare, Globe2, FileText, Mic, Menu, Bot } from 'lucide-react';
import { ThemeProvider, useTheme } from './ThemeContext';
import LoadingPage from './components/LoadingPage';
import LogoColor from '../logo-color.png';
import LogoWhite from '../logo-white.svg';
import Transcription from './components/Transcription';
import Correction from './components/Correction';
import DocumentSummary from './components/Document';
import ChatMessages from './components/ChatMessages';

const LoadingContext = createContext<{ isLoading: boolean; setLoading: (loading: boolean) => void }>({
  isLoading: false,
  setLoading: () => { },
});

function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setLoading] = useState(false);
  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

function useLoading() {
  return useContext(LoadingContext);
}

type Chat = {
  id: string;
  title: string;
  feature: string;
  messages: Message[];
};

export type Message = {
  content: string;
  isUser: boolean;
};

function AppContent() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeFeature, setActiveFeature] = useState('chat');
  const [chats, setChats] = useState<Chat[]>([]);
  const { toggleTheme, classes, isDarkMode } = useTheme(); // Utilisation du theme
  const { isLoading } = useLoading();

  const features = [
    { id: 'chat', name: 'Chat', icon: MessageSquare },
    { id: 'translate', name: 'Traduction', icon: Globe2 },
    { id: 'correct', name: 'Correction', icon: FileText },
    { id: 'transcribe', name: 'Transcription Audio', icon: Mic },
    { id: 'document', name: 'Document', icon: FileText }, // New feature
  ];

  const handleFeatureChange = (featureId: string) => {
    setActiveFeature(featureId);
    setSelectedChat(null); // Reset selected chat when switching features
  };

  const handleChatSelection = (chatId: string) => {
    setSelectedChat(chatId);
    setActiveFeature(chats.find(chat => chat.id === chatId)?.feature || ''); // Ensure only one is active
  };

  

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!input.trim()) return;

  //   const newChat = !selectedChat && {
  //     id: Date.now().toString(),
  //     title: `Message ${chats.length + 1}`,
  //     feature: activeFeature,
  //     messages: []
  //   };

  //   if (newChat) {
  //     setChats(prev => [newChat, ...prev]);
  //     setSelectedChat(newChat.id);
  //   }

  //   const chatId = selectedChat || (newChat && newChat.id);

  //   const userMessage: Message = {
  //     content: input,
  //     isUser: true
  //   };

  //   setChats(prevChats => prevChats.map(chat =>
  //     chat.id === chatId
  //       ? { ...chat, messages: [...chat.messages, userMessage] }
  //       : chat
  //   ));

  //   setInput('');
  //   setIsLoad(true);

  //   try {
  //     let apiUrl = '';
  //     let bodyPayload: any = {};
  //     let resultWithSources: string;

  //     if (activeSearch === 'search') {
  //       apiUrl = 'http://localhost:3001/api/search';
  //       bodyPayload = { query: input };
  //     } else {
  //       apiUrl = 'http://localhost:3001/api/instruct';
  //       bodyPayload = { prompt: input };
  //     }

  //     const response = await fetch(apiUrl, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(bodyPayload)
  //     });

  //     const data = await response.json();

  //     if (activeSearch === 'search') {
  //       const sourcesList = data.sources.map((source: { domain: string; url: string }, index: number) =>
  //         `<li>${index + 1}. <a href="${source.url}" target="_blank">${source.domain}</a></li>`
  //       ).join('');

  //       resultWithSources = `${data.result}<br><br><strong>Sources:</strong><ul>${sourcesList}</ul>`;
  //     } else {
  //       resultWithSources = data.result || "Je n'ai pas pu traiter votre demande.";
  //     }

  //     const aiMessage: Message = {
  //       content: resultWithSources,
  //       isUser: false
  //     };

  //     setChats(prevChats => prevChats.map(chat =>
  //       chat.id === chatId
  //         ? { ...chat, messages: [...chat.messages, aiMessage] }
  //         : chat
  //     ));

  //   } catch (error) {
  //     console.error('Erreur lors de l’envoi :', error);

  //     const errorMessage: Message = {
  //       content: "Une erreur est survenue lors du traitement.",
  //       isUser: false
  //     };

  //     setChats(prevChats => prevChats.map(chat =>
  //       chat.id === chatId
  //         ? { ...chat, messages: [...chat.messages, errorMessage] }
  //         : chat
  //     ));
  //   } finally {
  //     setIsLoad(false);
  //   }
  // };


  const getFeatureIcon = (featureId: string) => {
    return features.find(f => f.id === featureId)?.icon || MessageSquare;
  };

  return (
    <>
      {isLoading && <LoadingPage />}
      <div className={`flex h-screen ${classes.background} ${classes.text}`}>
        {/* Sidebar */}
        <div
          className={`${isSidebarOpen ? 'w-80' : 'w-0'
            } transition-all duration-300 overflow-hidden flex flex-col border-r ${classes.border}`}
        >
          {/* Logo */}
          <div className={`p-6 flex justify-center items-center border-b ${classes.border}`}>
            <img
              src={isDarkMode ? LogoWhite : LogoColor} // Affichage conditionnel du logo
              alt="Logo"
              className="h-16"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Feature Buttons */}
            <div className={`sticky top-0 z-10 p-6 border-b ${classes.background} ${classes.border}`}>
              {features.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => handleFeatureChange(feature.id)} // Use handleFeatureChange
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-300 ${activeFeature === feature.id && !selectedChat // Ensure only one is active
                    ? `${classes.buttonBackground} ${classes.text} ring-1 ring-blue-500/30`
                    : `${classes.text} ${classes.hoverBackground}`
                    }`}
                >
                  {React.createElement(feature.icon, {
                    size: 20,
                    className: activeFeature === feature.id && !selectedChat ? 'text-blue-400' : '',
                  })}
                  <span className="font-medium">{feature.name}</span>
                </button>
              ))}
            </div>

            {/* Message History */}
            <div className="p-4">
              {features.map(feature => {
                const featureChats = chats.filter(chat => chat.feature === feature.id); // Remove activeFeature filter
                if (featureChats.length === 0) return null;

                return (
                  <div key={feature.id} className="mb-6">
                    <div className="flex items-center gap-2 px-4 mb-2">
                      {React.createElement(feature.icon, { size: 16, className: 'text-gray-500' })}
                      <h2 className="text-sm font-medium text-gray-400">{feature.name}</h2>
                    </div>
                    {featureChats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => handleChatSelection(chat.id)} // Use handleChatSelection
                        className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-all duration-200 flex items-center gap-3 ${selectedChat === chat.id
                          ? `${classes.buttonBackground} ${classes.text} ring-1 ring-blue-500/30`
                          : `${classes.text} ${classes.hoverBackground}`
                          }`}
                      >
                        <Bot size={16} className="text-gray-500" />
                        <span className="truncate">{chat.title}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Dark/Light Mode Toggle */}
          <div className={`p-4 border-t ${classes.border} mt-auto`}>
            <button
              onClick={toggleTheme}
              className={`w-full px-4 py-3 rounded-xl transition-all duration-300 ${classes.buttonBackground} ${classes.text}`}
            >
              {classes.text === 'text-white' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${classes.background}`}>
          {/* Header */}
          <header className={`p-4 flex items-center sticky top-0 z-10 border-b ${classes.background} ${classes.border}`}>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-xl transition-colors duration-200 ${classes.hoverBackground}`}
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-3 ml-4">
              {React.createElement(getFeatureIcon(activeFeature), {
                size: 22,
                className: 'text-blue-400',
              })}
              <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-indigo-400 text-transparent bg-clip-text">
                {features.find(f => f.id === activeFeature)?.name}
              </h1>
            </div>
          </header>

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-6 space-y-6`}>
            {activeFeature === 'document' ? (
              <DocumentSummary
                chats={chats}
                setChats={setChats}
                selectedChat={selectedChat}
                setSelectedChat={setSelectedChat}
              />
            ) : activeFeature === 'transcribe' ? (
              <Transcription
                chats={chats}
                setChats={setChats}
                selectedChat={selectedChat}
                setSelectedChat={setSelectedChat}
              />
            ) : activeFeature === 'correct' ? (
              <Correction
                chats={chats}
                setChats={setChats}
                selectedChat={selectedChat}
                setSelectedChat={setSelectedChat}
              />
            ) : (
              <ChatMessages
                setChats={setChats}
                setSelectedChat={setSelectedChat}
                chats={chats}
                selectedChat={selectedChat}
                classes={classes}
                activeFeature={activeFeature}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <LoadingProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </LoadingProvider>
  );
}

export default App;