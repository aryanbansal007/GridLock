import React, { useState } from "react";
import AskEngineer from "./components/AskEngineer";
import { useRaceStore } from "./store/useRaceStore"; // Import our Zustand store
import PaddockChat from "./components/PaddockChat";

// Mock race list (can be moved to a separate config file later)
const AVAILABLE_RACES = [
  { id: '2021-esp', title: '🇪🇸 Spanish GP', year: '2021' },
  { id: '2021-abu', title: '🇦🇪 Abu Dhabi GP', year: '2021' },
];

export default function App() {
  const [activeChannel, setActiveChannel] = useState("ask-engineer"); // Defaulted to engineer to test RAG
  
  // Zustand State
  const activeRaceId = useRaceStore((state) => state.activeRaceId);
  const setActiveRaceId = useRaceStore((state) => state.setActiveRaceId);

  return (
    <div className="flex h-screen w-full bg-neutral-950 text-white font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR: The GridLock Server Navigation */}
      <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
        {/* Branding */}
        <div className="p-6 border-b border-neutral-800">
          <h1 className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <span className="text-red-600">█</span> GridLock
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-1">
            v1.0.0 // PaddockOS
          </p>
        </div>

        {/* Navigation Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          
          {/* CHANNELS */}
          <div>
            <p className="text-xs font-bold text-neutral-500 mb-4 tracking-widest uppercase">
              Telemetry Hub
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveChannel("paddock-chat")}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  activeChannel === "paddock-chat"
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                }`}
              >
                # paddock-chat
              </button>

              <button
                onClick={() => setActiveChannel("ask-engineer")}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  activeChannel === "ask-engineer"
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                }`}
              >
                # ask-the-engineer
              </button>

              <button
                onClick={() => setActiveChannel("race-simulator")}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  activeChannel === "race-simulator"
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                }`}
              >
                # race-simulator
              </button>
            </div>
          </div>

          {/* RACE DATA CONTEXT (Zustand Integration) */}
          <div>
            <p className="text-xs font-bold text-neutral-500 mb-4 tracking-widest uppercase flex items-center justify-between">
              <span>Active Dataset</span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </p>
            <div className="space-y-1">
              {AVAILABLE_RACES.map((race) => (
                <button
                  key={race.id}
                  onClick={() => setActiveRaceId(race.id)}
                  className={`w-full text-left px-3 py-3 rounded-md transition-all border-l-2 ${
                    activeRaceId === race.id
                      ? "bg-neutral-800 text-white border-red-600"
                      : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200 border-transparent"
                  }`}
                >
                  <div className="text-sm font-semibold">{race.title}</div>
                  <div className="text-[10px] opacity-60 uppercase tracking-wider">{race.year} Telemetry</div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 relative bg-black flex flex-col">
        {/* Top Header to show active channel & context */}
        <div className="h-14 border-b border-neutral-800 flex items-center px-6 bg-neutral-950/80 backdrop-blur-sm shrink-0 justify-between">
          <div className="text-neutral-300 font-mono text-sm">
            <span className="text-neutral-500">~/</span>{activeChannel}
          </div>
          {activeChannel === "ask-engineer" && (
            <div className="text-[10px] text-green-500 font-mono uppercase tracking-widest border border-green-500/30 bg-green-500/10 px-2 py-1 rounded">
              AI Connected: {activeRaceId}
            </div>
          )}
        </div>

        {/* Dynamic Component Rendering */}
        <div className="flex-1 overflow-hidden">
          {activeChannel === "ask-engineer" ? (
            <AskEngineer />
          ) : activeChannel === "paddock-chat" ? ( // 2. Add this condition
            <PaddockChat />
          ) : (
            <div className="flex items-center justify-center h-full w-full">
              <h2 className="text-2xl font-mono text-neutral-600 animate-pulse">
                Initializing {activeChannel}...
              </h2>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
