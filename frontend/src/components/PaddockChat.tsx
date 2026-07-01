import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Connect to your Express/Socket server
// (Make sure the port matches your backend, which is 5000 based on your app.ts)
const socket: Socket = io('http://localhost:5050', {
  transports: ['websocket', 'polling'], // Prioritize websocket
  withCredentials: true
});

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
}

export default function PaddockChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up socket listeners
  useEffect(() => {
    // Listen for incoming messages
    socket.on('receive_message', (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    });

    // Cleanup listener on unmount
    return () => {
      socket.off('receive_message');
    };
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: socket.id || 'Unknown', // Using the unique socket ID
      text: input,
    };

    // Emit the message to the server
    socket.emit('send_message', newMessage);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full w-full bg-black/95">
      {/* Chat History Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === socket.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="text-[10px] text-neutral-500 font-mono mb-1 px-1">
                {isMe ? 'You' : `User_${msg.senderId.slice(0, 4)}`}
              </div>
              <div className={`max-w-[70%] p-3 rounded-xl ${
                isMe 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-bl-none'
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-neutral-800 bg-neutral-950">
        <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message #paddock-chat..."
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="bg-white text-black px-6 py-3 rounded-lg text-sm font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            SEND
          </button>
        </form>
      </div>
    </div>
  );
}