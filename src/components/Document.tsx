import React, { useRef, useState } from 'react';
import { Upload, Clipboard } from 'lucide-react';
import LoadingPage from './LoadingPage';
import { useTheme } from '../ThemeContext';
import { Worker, Viewer } from '@react-pdf-viewer/core'; // Import de react-pdf-viewer
import '@react-pdf-viewer/core/lib/styles/index.css'; // Styles nécessaires pour react-pdf-viewer
import '@react-pdf-viewer/default-layout/lib/styles/index.css'; // Styles par défaut
import Search from '../ui/Search';


type Chat = {
  id: string;
  title: string;
  feature: string;
  messages: { content: string; isUser: boolean }[];
  pdfUrl?: string;
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
  const [isLoadingMessage, setLoadingMessage] = useState(false);
  const { classes } = useTheme();
  const [inputValue, setInputValue] = useState('');

  // const [fileUrl, setFileUrl] = useState<string | null>(null);
  // const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Fichier sélectionné:', file.name);

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
          pdfUrl: URL.createObjectURL(file),
        };
        setChats((prev) => [newChat, ...prev]);
        setSelectedChat(newChat.id);
        // setFileUrl(URL.createObjectURL(file));
        // setPdfFile(file); // Sauvegarde du fichier PDF pour affichage
      } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors du résumé.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = inputValue.trim();
    if (!question) return;

    let activeChat = chats.find(chat => chat.id === selectedChat);

    // Si le chat n'existe pas encore, en crée un nouveau
    if (!activeChat) {
      const newChat = {
        id: Date.now().toString(),
        title: `Chat ${chats.length + 1}`,
        feature: 'ask',
        messages: [],
      };
      setChats(prevChats => [newChat, ...prevChats]);
      setSelectedChat(newChat.id);
      activeChat = newChat;
    }

    const userMessage = { content: question, isUser: true };
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === activeChat.id
          ? { ...chat, messages: [...chat.messages, userMessage] }
          : chat
      )
    );

    setInputValue('');
    setLoadingMessage(true);

    try {
      const response = await fetch('http://localhost:3001/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: activeChat.messages[0].content, // résumé existant
          question,
        }),
      });
      const data = await response.json();

      const botMessage = {
        content: data.answer,
        isUser: false,
      };

      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === activeChat.id
            ? { ...chat, messages: [...chat.messages, botMessage] }
            : chat
        )
      );
    } catch (err) {
      const errorMessage = {
        content: '❌ Une erreur est survenue lors de la requête.',
        isUser: false,
      };

      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === activeChat.id
            ? { ...chat, messages: [...chat.messages, errorMessage] }
            : chat
        )
      );
    } finally {
      setLoadingMessage(false);
    }
  };

  const activeChat = chats.find((chat) => chat.id === selectedChat);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Texte copié dans le presse-papiers !');
    }).catch(err => {
      console.error('Erreur lors de la copie du texte :', err);
    });
  };

  return (
    <>
      {isLoading && <LoadingPage />}
      {selectedChat && activeChat ? (
        <div className="flex gap-6 p-6 h-full ">
          {/* PDF à gauche avec react-pdf-viewer */}
          <div className="w-1/2 overflow-auto bg-white rounded-2xl p-4 shadow max-h-full">
            {activeChat.pdfUrl && (
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer fileUrl={activeChat.pdfUrl} />
              </Worker>
            )}
          </div>

          {/* Résumé et chat à droite */}
          <div className={`w-1/2 overflow-hidden max-h-full p-5  ${classes.text}`}>
            <div className="flex flex-col h-full space-y-4 overflow-auto">
              {/* Bouton copier résumé */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => navigator.clipboard.writeText(activeChat.messages[0].content)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
                >
                  <Clipboard size={16} />
                  Copier le résumé
                </button>
              </div>

              {/* Zone de chat */}
              <div className="flex-1 overflow-auto space-y-4">
                {activeChat.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex p-2 ${message.isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-xl p-4 text-sm ${message.isUser
                        ? `${classes.buttonBackground} shadow-md`
                        : `${classes.inputBackground} ${classes.border} shadow-md`
                        } relative`}
                    >
                      {!message.isUser && (
                        <div className="flex items-center">
                          <div className="flex-1" dangerouslySetInnerHTML={{ __html: message.content }} />
                          <button
                            onClick={() => handleCopy(message.content)}
                            className={`ml-2 p-1 text-gray-500 hover:text-gray-700 ${classes.text} rounded-full shadow-sm`}
                          >
                            <Clipboard size={16} />
                          </button>
                        </div>
                      )}
                      {message.isUser && (
                        message.content
                      )}
                    </div>
                  </div>
                ))}

                {/* Affichage du loader si isLoading est true */}
                {isLoadingMessage && (
                  <div className="flex justify-center items-center">
                    <div className="w-6 h-6 border-4 border-t-4 border-gray-500 border-solid rounded-full animate-spin"></div>
                    <span className="text-gray-500 ml-2">Chargement...</span>
                  </div>
                )}
              </div>

              {/* Champ d’entrée utilisateur */}
              <Search
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                isLoading={isLoadingMessage}
                onSubmit={handleSubmit}
                placeholder="Posez une question sur le document..."
                classes={classes}
              />
            </div>
          </div>

        </div>
      ) : (
        // Interface d’upload
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
                  <span className="font-medium text-blue-400">Cliquez pour télécharger</span> ou glissez-déposez
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
