import { correctText } from '../services/correctionIA';
import { useTheme } from '../ThemeContext';
import { useState } from 'react';
import Search from '../ui/Search';

type Chat = {
  id: string;
  title: string;
  feature: string;
  messages: { content: string; isUser: boolean }[];
};

type CorrectionProps = {
  chats: Chat[];
  selectedChat: string | null;
};

function Correction({ chats, selectedChat }: CorrectionProps) {
  const { classes } = useTheme();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const activeChat = chats.find(chat => chat.id === selectedChat);

    const newChat = !selectedChat && {
      id: Date.now().toString(),
      title: `Correction ${chats.length + 1}`,
      feature: 'correct',
      messages: [],
    };

    if (newChat) {
      chats.unshift(newChat);
      selectedChat = newChat.id;
    }

    const userMessage = { content: input, isUser: true };

    if (activeChat) {
      activeChat.messages.push(userMessage);
    }

    setIsLoading(true);
    try {
      const correctedMessage = await correctText(input);
      if (activeChat) {
        if ('correctedText' in correctedMessage) {
          activeChat.messages.push({ content: correctedMessage.correctedText, isUser: false });
        } else {
          activeChat.messages.push({ content: 'Unexpected response format.', isUser: false });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la correction:', error);
      if (activeChat) {
        activeChat.messages.push({ content: 'Erreur lors de la correction.', isUser: false });
      }
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  const activeChat = chats.find(chat => chat.id === selectedChat);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {activeChat?.messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-xl p-4 text-sm ${
                message.isUser
                  ? `${classes.buttonBackground} shadow-md`
                  : `${classes.inputBackground} ${classes.border} shadow-md`
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <div className="">
        <Search
 value={input}
          onChange={(e) => setInput(e.target.value)}
          onSubmit={handleSubmit}
          placeholder="Écrivez votre message ici..."
          isLoading={isLoading}
          classes={classes}
        />
      </div>
    </div>
  );
}

export default Correction;
