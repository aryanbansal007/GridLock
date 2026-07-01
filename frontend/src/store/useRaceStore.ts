// import { create } from 'zustand';

// interface RaceState {
//   activeRaceId: string | null;
//   setActiveRaceId: (id: string) => void;
// }

// export const useRaceStore = create<RaceState>((set) => ({
//   activeRaceId: "2021-esp", // We can default to the Lewis Hamilton Spanish GP data
//   setActiveRaceId: (id) => set({ activeRaceId: id }),
// }));

import { create } from 'zustand';

// 1. Define the Message structure in the store
interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

interface RaceState {
  activeRaceId: string;
  setActiveRaceId: (id: string) => void;
  // 2. Map race IDs to their respective chat histories
  chatHistories: Record<string, Message[]>;
  // 3. Action to push a new message into a specific race's log
  addMessage: (raceId: string, message: Message) => void;
}

const DEFAULT_WELCOME: Message[] = [
  { id: '1', role: 'ai', text: 'Radio check. I am your Race Engineer. What telemetry or strategy do you need me to explain?' }
];

export const useRaceStore = create<RaceState>((set) => ({
  activeRaceId: "2021-esp",
  setActiveRaceId: (id) => set({ activeRaceId: id }),
  
  // Initialize with the default welcome message for our mock data
  chatHistories: {
    "2021-esp": [...DEFAULT_WELCOME],
    "2021-abu": [...DEFAULT_WELCOME],
  },

  addMessage: (raceId, message) => set((state) => {
    // Grab the existing history for this race, or fallback to empty array
    const currentHistory = state.chatHistories[raceId] || [];
    
    return {
      chatHistories: {
        ...state.chatHistories,
        [raceId]: [...currentHistory, message], // Append the new message
      }
    };
  }),
}));