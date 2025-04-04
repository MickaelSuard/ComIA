import React, { useRef, useState } from 'react';
import { Upload, Clipboard } from 'lucide-react';
import LoadingPage from './LoadingPage';
import { useTheme } from '../ThemeContext';

type Chat = {
  id: string;
  title: string;
  feature: string;
  messages: { content: string; isUser: boolean }[];
};

type TranscriptionTypes = {
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  selectedChat: string | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<string | null>>;
};

function Transcription({
  chats,
  setChats,
  selectedChat,
  setSelectedChat,
}: TranscriptionTypes) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcription' | 'reformulated'>('transcription');

  const { classes } = useTheme();

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

      setLoading(true);
      try {
        const response = await fetch('http://localhost:3001/api/summarize', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la transcription du fichier.');
        }

        const data = await response.json();
        console.log('Transcription:', data.transcription);
        console.log('Reformulated Transcription:', data.reformulatedTranscription);

        const newChat: Chat = {
          id: Date.now().toString(),
          title: file.name,
          feature: 'transcribe',
          messages: [
            { content: data.transcription, isUser: false },
            { content: data.reformulatedTranscription, isUser: false },
          ],
        };
        setChats((prev) => [newChat, ...prev]);
        setSelectedChat(newChat.id);
      } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors de la transcription.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTabChange = (tab: 'transcription' | 'reformulated') => {
    setActiveTab(tab);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Texte copié dans le presse-papiers !');
    });
  };

  const activeChat = chats.find((chat) => chat.id === selectedChat);

  return (
    <>
      {isLoading && <LoadingPage />}
      {selectedChat && activeChat ? (
        <>
          <div className="flex">
            <button
              onClick={() => handleTabChange('transcription')}
              className={`px-4 py-2 ${activeTab === 'transcription'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
                }`}
            >
              Transcription
            </button>
            <button
              onClick={() => handleTabChange('reformulated')}
              className={`px-4 py-2 ${activeTab === 'reformulated'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
                }`}
            >
              Transcription Reformulée
            </button>
          </div>

          <div className="mt-4">
            {activeTab === 'transcription' && (
              <>
                <button
                  onClick={() => copyToClipboard(activeChat.messages[0].content)}
                  className="mb-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
                >
                  <Clipboard size={16} />
                  Copier toute la transcription
                </button>
                {activeChat.messages[0]?.content.split('.').map((sentence, index) => (
                  <div key={index} className="mb-4">
                    <p>{sentence.trim()}.</p>
                  </div>
                ))}
              </>
            )}
            {activeTab === 'reformulated' &&
              <>
                <button
                  onClick={() => copyToClipboard(activeChat.messages[1]?.content)}
                  className="mb-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
                >
                  <Clipboard size={16} />
                  Copier toute la transcription reformulée
                </button>
                {activeChat.messages[1]?.content.split('\n').map((line, index) => (
                  <div key={index} className="mb-4">

                    <p>{line}</p>
                  </div>
                ))}
              </>}
          </div>
        </>
      ) : (
        <div className="flex-1 space-x-6 h-full flex flex-col items-center justify-center">
          <div
            className={`w-full max-w-2xl p-8 rounded-3xl shadow-2xl border ${classes.border} ${classes.background}`}
          >
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
                  <span className="font-medium text-blue-400">Cliquez pour télécharger</span> ou
                  glissez-déposez
                  <div className="text-sm text-gray-500 mt-2">MP3, WAV, M4A jusqu'à 25MB</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Transcription;
