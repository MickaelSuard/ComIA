import React, { useState, useRef, createContext, useContext } from 'react';
import { MessageSquare, Globe2, FileText, Mic, Menu, Send, Upload, Bot } from 'lucide-react';
import { ThemeProvider, useTheme } from './ThemeContext'; // Import ThemeContext
import LoadingPage from './components/LoadingPage'; // Import LoadingPage

const LoadingContext = createContext<{ isLoading: boolean; setLoading: (loading: boolean) => void }>({
  isLoading: false,
  setLoading: () => {},
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

type Message = {
  content: string;
  isUser: boolean;
};

function AppContent() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeFeature, setActiveFeature] = useState('chat');
  const [chats, setChats] = useState<Chat[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toggleTheme, classes } = useTheme(); // Use ThemeContext classes
  const { isLoading, setLoading } = useLoading();

  const features = [
    { id: 'chat', name: 'Chat', icon: MessageSquare },
    { id: 'translate', name: 'Traduction', icon: Globe2 },
    { id: 'correct', name: 'Correction', icon: FileText },
    { id: 'transcribe', name: 'Transcription Audio', icon: Mic },
  ];

  const handleFeatureChange = (featureId: string) => {
    setActiveFeature(featureId);
    setSelectedChat(null); // Reset selected chat when switching features
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newChat = !selectedChat && {
      id: Date.now().toString(),
      title: `Message ${chats.length + 1}`,
      feature: activeFeature,
      messages: []
    };

    if (newChat) {
      setChats(prev => [newChat, ...prev]);
      setSelectedChat(newChat.id);
    }

    const newMessage: Message = {
      content: input,
      isUser: true
    };

    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === (selectedChat || (newChat && newChat.id))) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage]
        };
      }
      return chat;
    }));

    setInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);

      if (!file.type.includes('audio')) {
        alert('Veuillez sélectionner un fichier audio valide (MP3, WAV, M4A).');
        return;
      }

      const formData = new FormData();
      formData.append('audio', file);

      setLoading(true); // Set loading to true
      try {
        const response = await fetch('http://localhost:3001/api/transcribe', { 
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la transcription du fichier.');
        }

        const data = await response.json(); // Process only the JSON response
        console.log('Transcription:', data.transcription);

        // Add transcription as a new chat
        const newChat: Chat = {
          id: Date.now().toString(),
          title: file.name, // Use the file name as the chat title
          feature: 'transcribe',
          messages: [
            {
              content: data.transcription,
              isUser: false,
            },
          ],
        };
        setChats((prev) => [newChat, ...prev]);
        setSelectedChat(newChat.id);
      } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors de la transcription.');
      } finally {
        setLoading(false); // Set loading to false
      }
    }
  };

  const getFeatureIcon = (featureId: string) => {
    return features.find(f => f.id === featureId)?.icon || MessageSquare;
  };

  return (
    <>
      {isLoading && <LoadingPage />} {/* Show LoadingPage when loading */}
      <div className={`flex h-screen ${classes.background} ${classes.text}`}>
        {/* Sidebar */}
        <div 
          className={`${
            isSidebarOpen ? 'w-80' : 'w-0'
          } transition-all duration-300 overflow-hidden flex flex-col border-r ${classes.border}`}
        >
          <div className="flex-1 overflow-y-auto">
            {/* Feature Buttons */}
            <div className={`sticky top-0 z-10 p-6 border-b ${classes.background} ${classes.border}`}>
              {features.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => handleFeatureChange(feature.id)} // Use handleFeatureChange
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-300 ${
                    activeFeature === feature.id
                      ? `${classes.buttonBackground} ${classes.text} ring-1 ring-blue-500/30`
                      : `${classes.text} ${classes.hoverBackground}`
                  }`}
                >
                  {React.createElement(feature.icon, {
                    size: 20,
                    className: activeFeature === feature.id ? 'text-blue-400' : '',
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
                        onClick={() => setSelectedChat(chat.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-all duration-200 flex items-center gap-3 ${
                          selectedChat === chat.id
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

          {/* Messages or Feature Content */}
          <div
            className={`flex-1 overflow-y-auto p-6 space-y-6 ${
              activeFeature !== 'transcribe' ? 'max-w-7xl' : ''
            }`}
          >
            {activeFeature === 'transcribe' && (!selectedChat || chats.find(chat => chat.id === selectedChat)?.feature !== 'transcribe') ? (
              <div className="flex-1 space-x-6 h-full flex flex-col items-center justify-center">
                <div className={`w-full max-w-2xl p-8 rounded-3xl shadow-2xl border ${classes.border} ${classes.background}`}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="audio/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full p-12 border-2 border-dashed ${classes.border} rounded-2xl ${classes.hoverBackground} transition-all duration-300`}
                  >
                    <div className="flex flex-col items-center space-y-6">
                      <div className="p-6 rounded-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 ring-1 ring-blue-500/30">
                        <Upload size={40} className="text-blue-400" />
                      </div>
                      <div className="text-gray-300 text-center">
                        <span className="font-medium text-blue-400">Cliquez pour télécharger</span> ou glissez-déposez
                        <div className="text-sm text-gray-500 mt-2">MP3, WAV, M4A jusqu'à 25MB</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              selectedChat && chats.find(chat => chat.id === selectedChat)?.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl p-4 text-sm ${
                      message.isUser
                        ? `${classes.buttonBackground} shadow-md`
                        : `${classes.inputBackground} ${classes.border} shadow-md`
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          {activeFeature !== 'transcribe' || !selectedChat || chats.find(chat => chat.id === selectedChat)?.feature !== 'transcribe' ? (
            <div className="p-6">
              <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Écrivez votre message ici..."
                    className={`flex-1 p-4 rounded-xl border transition-all duration-200 ${classes.inputBackground} ${classes.inputBorder} ${classes.inputPlaceholder}`}
                  />
                  <button
                    type="submit"
                    className={`p-4 rounded-xl transition-all duration-200 shadow-lg transform ${classes.buttonBackground} ${classes.text}`}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </div>
          ) : null}
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