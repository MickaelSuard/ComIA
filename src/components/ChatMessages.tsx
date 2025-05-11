import React from 'react';

type ChatMessagesProps = {
    chats: {
        id: string;
        messages: { content: string; isUser: boolean }[];
    }[];
    selectedChat: string | null;
    classes: {
        buttonBackground: string;
        inputBackground: string;
        border: string;
    };
    isLoading: boolean;
};

const ChatMessages: React.FC<ChatMessagesProps> = ({ chats, selectedChat, classes, isLoading }) => {
    const chat = chats.find(chat => chat.id === selectedChat);

    if (!chat) return null;

    return (
        <>
            {chat.messages.map((message, index) => (
                <div key={index} className="flex flex-col max-w-7xl mx-auto">
                    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[80%] rounded-xl p-4 text-sm ${message.isUser
                                    ? `${classes.buttonBackground} shadow-md`
                                    : `${classes.inputBackground} ${classes.border} shadow-md`
                                }`}
                            dangerouslySetInnerHTML={{ __html: message.content }}
                        ></div>
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
        </>
    );
};

export default ChatMessages;
