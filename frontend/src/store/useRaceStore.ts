import { create } from 'zustand';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

interface RaceEngineerState {
  messages: Message[];
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  // Appends `textChunk` to an existing message's text — used while a streamed
  // AI reply is still arriving, so the same bubble grows in place instead of
  // a new message being added for every chunk.
  appendToMessage: (id: string, textChunk: string) => void;
}

const DEFAULT_WELCOME: Message[] = [
  { id: '1', role: 'ai', text: 'Radio check. I am your Race Engineer. What telemetry or strategy do you need me to explain?' },
];

// Flat, per-user message list — matches how the backend actually stores chat
// history (the Chat model has no per-race field at all, just one log per user).
export const useRaceStore = create<RaceEngineerState>((set) => ({
  messages: [...DEFAULT_WELCOME],
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  appendToMessage: (id, textChunk) => set((state) => ({
    messages: state.messages.map((m) => (m.id === id ? { ...m, text: m.text + textChunk } : m)),
  })),
}));
