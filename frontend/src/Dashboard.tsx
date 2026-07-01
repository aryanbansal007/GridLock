import React, { useState } from "react";
import AskEngineer from "./components/AskEngineer";
import PaddockChat from "./components/PaddockChat";
import { useRaceStore } from "./store/useRaceStore";

const AVAILABLE_RACES = [
  { id: '2021-esp', title: '🇪🇸 Spanish GP', year: '2021' },
  { id: '2021-abu', title: '🇦🇪 Abu Dhabi GP', year: '2021' },
];

export default function Dashboard() {
  const [activeChannel, setActiveChannel] = useState("ask-engineer");
  
  const activeRaceId = useRaceStore((state) => state.activeRaceId);
  const setActiveRaceId = useRaceStore((state) => state.setActiveRaceId);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/auth'; // Force refresh to redirect to login
  };

  return (
    <div className="flex h-screen w-full bg-neutral-950 text-white font-sans overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <span className="text-red-600">█</span> GridLock
          </h1>
          <button onClick={handleLogout} className="text-[10px] text-neutral-500 hover:text-white">
            LOGOUT
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          <div>
            <p className="text-xs font-bold text-neutral-500 mb-4 tracking-widest uppercase">Telemetry Hub</p>
            <div className="space-y-1">
              <button onClick={() => setActiveChannel("paddock-chat")} className={`w-full text-left px-3 py-2 rounded-md ${activeChannel === "paddock-chat" ? "bg-neutral-800" : "text-neutral-400"}`}># paddock-chat</button>
              <button onClick={() => setActiveChannel("ask-engineer")} className={`w-full text-left px-3 py-2 rounded-md ${activeChannel === "ask-engineer" ? "bg-neutral-800" : "text-neutral-400"}`}># ask-the-engineer</button>
            </div>
          </div>
          
          <div>
            <p className="text-xs font-bold text-neutral-500 mb-4 tracking-widest uppercase">Active Dataset</p>
            {AVAILABLE_RACES.map((race) => (
              <button key={race.id} onClick={() => setActiveRaceId(race.id)} className={`w-full text-left px-3 py-3 rounded-md ${activeRaceId === race.id ? "bg-neutral-800" : "text-neutral-400"}`}>
                <div className="text-sm font-semibold">{race.title}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 relative bg-black flex flex-col">
        <div className="h-14 border-b border-neutral-800 flex items-center px-6 justify-between">
          <div className="text-sm">~/ {activeChannel}</div>
        </div>
        <div className="flex-1 overflow-hidden">
          {activeChannel === "ask-engineer" ? <AskEngineer /> : <PaddockChat />}
        </div>
      </div>
    </div>
  );
}