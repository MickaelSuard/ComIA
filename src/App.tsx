import React, { useState, useRef } from 'react';
import { MessageSquare, Globe2, FileText, Mic, Menu, Send, Upload, Bot } from 'lucide-react';

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

function App() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeFeature, setActiveFeature] = useState('chat');
  const [chats, setChats] = useState<Chat[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true); // State for theme
  const fileInputRef = useRef<HTMLInputElement>(null);

  const features = [
    { id: 'chat', name: 'Chat', icon: MessageSquare },
    { id: 'translate', name: 'Traduction', icon: Globe2 },
    { id: 'correct', name: 'Correction', icon: FileText },
    { id: 'transcribe', name: 'Transcription Audio', icon: Mic },
  ];

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
      if (chat.id === (selectedChat || newChat?.id)) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage]
        };
      }
      return chat;
    }));

    setInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);
    }
  };

  const getFeatureIcon = (featureId: string) => {
    return features.find(f => f.id === featureId)?.icon || MessageSquare;
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-[#080810]' : 'bg-white'} ${isDarkMode ? 'text-white' : 'text-black'}`}>
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarOpen ? 'w-80' : 'w-0'
        } ${isDarkMode ? 'bg-[#0d0d15]' : 'bg-gray-100'} transition-all duration-300 overflow-hidden flex flex-col border-r ${
          isDarkMode ? 'border-[#1a1a2e]' : 'border-gray-300'
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Feature Buttons */}
          <div
            className={`sticky top-0 z-10 p-6 border-b ${
              isDarkMode
                ? 'backdrop-blur-xl bg-[#0d0d15]/80 border-[#1a1a2e]'
                : 'bg-gray-100 border-gray-300'
            }`}
          >
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-300 ${
                  activeFeature === feature.id
                    ? isDarkMode
                      ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-white ring-1 ring-blue-500/30'
                      : 'bg-blue-100 text-blue-600 ring-1 ring-blue-300'
                    : isDarkMode
                      ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-200 hover:text-black'
                }`}
              >
                {React.createElement(feature.icon, {
                  size: 20,
                  className: activeFeature === feature.id
                    ? isDarkMode
                      ? 'text-blue-400'
                      : 'text-blue-600'
                    : ''
                })}
                <span className="font-medium">{feature.name}</span>
              </button>
            ))}
          </div>

          {/* Message History */}
          <div className="p-4">
            {features.map(feature => {
              const featureChats = chats.filter(chat => chat.feature === feature.id);
              if (featureChats.length === 0) return null;

              return (
                <div key={feature.id} className="mb-6">
                  <div className="flex items-center gap-2 px-4 mb-2">
                    <feature.icon size={16} className="text-gray-500" />
                    <h2 className="text-sm font-medium text-gray-400">{feature.name}</h2>
                  </div>
                  {featureChats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChat(chat.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-all duration-200 flex items-center gap-3 ${
                        selectedChat === chat.id
                          ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-white ring-1 ring-blue-500/30'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Bot size={16} className={selectedChat === chat.id ? 'text-blue-400' : 'text-gray-500'} />
                      <span className="truncate">{chat.title}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        {/* Dark/Light Mode Toggle */}
        <div className={`p-4 border-t ${isDarkMode ? 'border-[#1a1a2e]' : 'border-gray-300'} mt-auto`}>
          <button
            onClick={toggleTheme}
            className={`w-full px-4 py-3 rounded-xl transition-all duration-300 ${
              isDarkMode
                ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-white ring-1 ring-blue-500/30'
                : 'bg-gray-300 text-black hover:bg-gray-400'
            }`}
          >
            {isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${isDarkMode ? 'bg-gradient-to-b from-[#0a0a15] to-[#080810]' : 'bg-gray-100'}`}>
        {/* Header */}
        <header
          className={`p-4 flex items-center sticky top-0 z-10 border-b ${
            isDarkMode
              ? 'bg-[#0d0d15]/80 backdrop-blur-xl border-[#1a1a2e]'
              : 'bg-gray-100 border-gray-300'
          }`}
        >
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-xl transition-colors duration-200 ${
              isDarkMode
                ? 'hover:bg-white/5 text-gray-400 hover:text-white'
                : 'hover:bg-gray-200 text-gray-600 hover:text-black'
            }`}
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-3 ml-4">
            {React.createElement(getFeatureIcon(activeFeature), {
              size: 22,
              className: isDarkMode ? 'text-blue-400' : 'text-blue-600'
            })}
            <h1
              className={`text-xl font-semibold ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-400 to-indigo-400 text-transparent bg-clip-text'
                  : 'text-blue-600'
              }`}
            >
              {features.find(f => f.id === activeFeature)?.name}
            </h1>
          </div>
        </header>

        {/* Messages or Feature Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl">
          {activeFeature === 'transcribe' ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="w-full max-w-2xl p-8 bg-[#0d0d15] rounded-3xl shadow-2xl border border-[#1a1a2e] backdrop-blur-xl bg-gradient-to-b from-[#0d0d15] to-[#0a0a12]">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="audio/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-12 border-2 border-dashed border-[#1a1a2e] rounded-2xl hover:border-blue-500 transition-all duration-300 group hover:bg-[#0f0f1a]"
                >
                  <div className="flex flex-col items-center space-y-6">
                    <div className="p-6 rounded-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 ring-1 ring-blue-500/30 group-hover:scale-110 transition-transform duration-300">
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
                  className={`max-w-[80%] rounded-xl p-4 text-sm ${ // Reduced padding and font size
                    message.isUser
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/10'
                      : 'bg-[#0d0d15] text-gray-200 border border-[#1a1a2e] shadow-md shadow-black/20'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        {activeFeature !== 'transcribe' && (
          <div className="p-6">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Écrivez votre message ici..."
                  className="flex-1 p-4 bg-[#0a0a12] rounded-xl border border-[#1a1a2e] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200"
                />
                <button
                  type="submit"
                  className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:scale-[1.02] transform"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;