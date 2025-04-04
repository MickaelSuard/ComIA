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

type DocumentProps = {
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  selectedChat: string | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<string | null>>;
};

function DocumentSummary({ chats, setChats, selectedChat, setSelectedChat }: DocumentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setLoading] = useState(false);
  const { classes } = useTheme();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);

      const formData = new FormData();
      formData.append('document', file);

      setLoading(true);
      try {
        const response = await fetch('http://localhost:3001/api/summarize', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Erreur lors du résumé du document.');
        }

        const data = await response.json();
        console.log('Résumé:', data.summary);

        const newChat: Chat = {
          id: Date.now().toString(),
          title: file.name,
          feature: 'document',
          messages: [{ content: data.summary, isUser: false }],
        };
        setChats((prev) => [newChat, ...prev]);
        setSelectedChat(newChat.id);
      } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors du résumé.');
      } finally {
        setLoading(false);
      }
    }
  };

  const activeChat = chats.find((chat) => chat.id === selectedChat);

  return (
    <>
      {isLoading && <LoadingPage />}
      {selectedChat && activeChat ? (
        <div className="p-6">
          <button
            onClick={() => navigator.clipboard.writeText(activeChat.messages[0].content)}
            className="mb-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
          >
            <Clipboard size={16} />
            Copier le résumé
          </button>
          <p>{activeChat.messages[0].content}</p>
        </div>
      ) : (
        <div className="flex-1 space-x-6 h-full flex flex-col items-center justify-center">
          <div
            className={`w-full max-w-2xl p-8 rounded-3xl shadow-2xl border ${classes.border} ${classes.background}`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.pdf,.docx"
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
                  <div className="text-sm text-gray-500 mt-2">Formats acceptés : TXT, PDF, DOCX</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default DocumentSummary;
