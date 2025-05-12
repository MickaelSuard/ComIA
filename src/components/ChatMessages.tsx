import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Clipboard } from 'lucide-react';
import Search from '../ui/Search';
import { Message } from '../App';

type Chat = {
    id: string;
    title: string;
    feature: string;
    messages: { content: string; isUser: boolean }[];
};

type ChatMessagesProps = {
    chats: Chat[];
    selectedChat: string | null;
    setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
    setSelectedChat: React.Dispatch<React.SetStateAction<string | null>>;
    activeFeature: string;
    classes: any;
};

const ChatMessages: React.FC<ChatMessagesProps> = ({
    chats,
    selectedChat,
    setChats,
    setSelectedChat,
    activeFeature,
    classes,
}) => {
    const [input, setInput] = useState('');
    const [activeSearch, setActiveSearch] = useState('search');
    const activeChat = chats.find(chat => chat.id === selectedChat);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Texte copié dans le presse-papiers !');
        }).catch(err => {
            console.error('Erreur lors de la copie du texte :', err);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
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

        const chatId = selectedChat || (newChat && newChat.id);

        const userMessage: Message = {
            content: input,
            isUser: true
        };

        setChats(prevChats => prevChats.map(chat =>
            chat.id === chatId
                ? { ...chat, messages: [...chat.messages, userMessage] }
                : chat
        ));

        setInput('');
        setIsLoading(true);

        try {
            let apiUrl = '';
            let bodyPayload: any = {};
            let resultWithSources: string;

            if (activeSearch === 'search') {
                apiUrl = 'http://localhost:3001/api/search';
                bodyPayload = { query: input };
            } else {
                apiUrl = 'http://localhost:3001/api/instruct';
                bodyPayload = { prompt: input };
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload)
            });

            const data = await response.json();

            if (activeSearch === 'search') {
                const sourcesList = data.sources.map((source: { domain: string; url: string }, index: number) =>
                    `<li>${index + 1}. <a href="${source.url}" target="_blank">${source.domain}</a></li>`
                ).join('');

                resultWithSources = `${data.result}<br><br><strong>Sources:</strong><ul>${sourcesList}</ul>`;
            } else {
                resultWithSources = data.result || "Je n'ai pas pu traiter votre demande.";
            }

            const aiMessage: Message = {
                content: resultWithSources,
                isUser: false
            };

            setChats(prevChats => prevChats.map(chat =>
                chat.id === chatId
                    ? { ...chat, messages: [...chat.messages, aiMessage] }
                    : chat
            ));

        } catch (error) {
            console.error('Erreur lors de l’envoi :', error);

            const errorMessage: Message = {
                content: "Une erreur est survenue lors du traitement.",
                isUser: false
            };

            setChats(prevChats => prevChats.map(chat =>
                chat.id === chatId
                    ? { ...chat, messages: [...chat.messages, errorMessage] }
                    : chat
            ));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
                {activeChat ? (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="flex flex-col flex-1"
                    >
                        <div className="flex-1 p-6 overflow-y-auto space-y-4 mb-16">
                            {activeChat.messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
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

                            {isLoading && (
                                <div className="flex flex-col max-w-7xl mx-auto">
                                    <div className="flex justify-start">
                                        <div
                                            className={`max-w-[80%] rounded-xl p-4 text-sm ${classes.inputBackground} ${classes.border} shadow-md flex space-x-1`}
                                        >
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Barre de recherche */}
                        <Search
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onSubmit={handleSubmit}
                            placeholder="Poser une question..."
                            isLoading={isLoading}
                            classes={classes}
                            activeFeature={activeSearch}
                            mode={['search']}
                            onModeToggle={(mode: string) => setActiveSearch(mode)}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="search"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="flex flex-1 items-center justify-center"
                    >
                        <div className="w-full flex flex-col justify-center items-center">
                            <h2 className={`text-3xl font-semibold ${classes.text} mb-4`}>
                               Comment puis-je vous aider ?
                            </h2>
                            <Search
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onSubmit={handleSubmit}
                                placeholder="Poser une question..."
                                isLoading={isLoading}
                                classes={classes}
                                activeFeature={activeSearch}
                                mode={['search']}
                                onModeToggle={(mode: string) => setActiveSearch(mode)}
                            />
                        </div>


                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatMessages;
