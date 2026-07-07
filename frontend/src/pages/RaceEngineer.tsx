// import React, { useState, useRef, useEffect } from "react";
// import { useRaceStore } from "../store/useRaceStore";

// interface Message {
//   id: string;
//   role: "user" | "ai";
//   text: string;
// }



// export default function AskEngineer() {
//   const [input, setInput] = useState("");
//   const [isTyping, setIsTyping] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   // 1. Pull the active race state and actions from the Zustand store
//   const activeRaceId = useRaceStore((state) => state.activeRaceId);
//   const chatHistories = useRaceStore((state) => state.chatHistories);
//   const addMessage = useRaceStore((state) => state.addMessage);

//   // 2. Get the specific history for the currently selected race (or default to empty array)
//   const currentMessages = chatHistories[activeRaceId] || [];

//   // Auto-scroll to the bottom when the active history changes or typing triggers

//   useEffect(() => {
//     const fetchHistory = async () => {
//       try {
//         const response = await fetch(`${API_BASE}/api/history`, {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//         });
//         if (response.ok) {
//           const history = await response.json();
//           // Map DB records to your Message format
//           history.forEach((item: any) => {
//             addMessage(activeRaceId, { id: item._id, role: item.role, text: item.text });
//           });
//         }
//       } catch (error) {
//         console.error("Failed to load history:", error);
//       }
//     };
//     fetchHistory();
//   }, [activeRaceId]);


//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [currentMessages, isTyping]);

//   const handleSend = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!input.trim()) return;

//     const userMessage: Message = {
//       id: Date.now().toString(),
//       role: "user",
//       text: input,
//     };

    

//     // 3. Save the user message to the specific active race history in Zustand
//     addMessage(activeRaceId, userMessage);
//     setInput("");
//     setIsTyping(true);

//     try {
//       //   const response = await fetch('http://localhost:5050/api/ai/ask', {
//       //     method: 'POST',
//       //     headers: { 'Content-Type': 'application/json' },
//       //     body: JSON.stringify({
//       //       prompt: userMessage.text,
//       //       raceId: activeRaceId
//       //     }),
//       //   });

//       const response = await fetch(`${API_BASE}/api/ai/ask`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${localStorage.getItem("token")}`, // <--- DON'T FORGET THIS
//         },
//         body: JSON.stringify({ prompt: input, raceId: activeRaceId }),
//       });

//       const data = await response.json();

//       if (data.answer) {
//         const aiMessage: Message = {
//           id: Date.now().toString(),
//           role: "ai",
//           text: data.answer,
//         };
//         // 4. Save the AI's response to the active race history in Zustand
//         addMessage(activeRaceId, aiMessage);
//       } else {
//         throw new Error("No answer received");
//       }
//     } catch (error) {
//       const errorMessage: Message = {
//         id: Date.now().toString(),
//         role: "ai",
//         text: "⚠️ Comm failure. Check the pit wall connection.",
//       };
//       addMessage(activeRaceId, errorMessage);
//     } finally {
//       setIsTyping(false);
//     }
//   };

//   return (
//     <div className="flex flex-col h-full w-full bg-black/95">
//       {/* Chat History Area - Maps over the history fetched from the global store */}
//       <div className="flex-1 overflow-y-auto p-6 space-y-6">
//         {currentMessages.map((msg) => (
//           <div
//             key={msg.id}
//             className={`flex ${
//               msg.role === "user" ? "justify-end" : "justify-start"
//             }`}
//           >
//             <div
//               className={`max-w-[70%] p-4 rounded-xl ${
//                 msg.role === "user"
//                   ? "bg-neutral-800 text-white rounded-br-none"
//                   : "bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-bl-none"
//               }`}
//             >
//               {msg.role === "ai" && (
//                 <div className="text-[10px] text-red-500 font-bold tracking-widest uppercase mb-2">
//                   Race Engineer
//                 </div>
//               )}
//               <p className="text-sm leading-relaxed whitespace-pre-wrap">
//                 {msg.text}
//               </p>
//             </div>
//           </div>
//         ))}

//         {/* Typing Indicator */}
//         {isTyping && (
//           <div className="flex justify-start">
//             <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl rounded-bl-none">
//               <span className="text-sm text-neutral-500 animate-pulse">
//                 Calculating telemetry...
//               </span>
//             </div>
//           </div>
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input Area */}
    //   <div className="p-4 border-t border-neutral-800 bg-neutral-950">
    //     <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
    //       <input
    //         type="text"
    //         value={input}
    //         onChange={(e) => setInput(e.target.value)}
    //         placeholder="Message the pit wall..."
    //         className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-600 transition-colors"
    //         disabled={isTyping}
    //       />
    //       <button
    //         type="submit"
    //         disabled={isTyping || !input.trim()}
    //         className="bg-white text-black px-6 py-3 rounded-lg text-sm font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    //       >
    //         SEND
    //       </button>
    //     </form>
    //   </div>
//     </div>
//   );
// }
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown"; // 👈 Import this
import { useRaceStore } from "../store/useRaceStore";
import { API_BASE } from "../lib/f1";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
}

export default function AskEngineer() {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeRaceId = useRaceStore((state) => state.activeRaceId);
  const chatHistories = useRaceStore((state) => state.chatHistories);
  const addMessage = useRaceStore((state) => state.addMessage);
  const currentMessages = chatHistories[activeRaceId] || [];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/history`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (response.ok) {
          const history = await response.json();
          history.forEach((item: any) => {
            addMessage(activeRaceId, { id: item._id, role: item.role, text: item.text });
          });
        }
      } catch (error) {
        console.error("Failed to load history:", error);
      }
    };
    fetchHistory();
  }, [activeRaceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", text: input };
    addMessage(activeRaceId, userMessage);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE}/api/ai/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ prompt: input, raceId: activeRaceId }),
      });

      const data = await response.json();
      if (data.answer) {
        addMessage(activeRaceId, { id: Date.now().toString(), role: "ai", text: data.answer });
      } else {
        throw new Error("No answer received");
      }
    } catch (error) {
      addMessage(activeRaceId, { id: Date.now().toString(), role: "ai", text: "⚠️ Comm failure. Check the pit wall connection." });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-black/95">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {currentMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] p-4 rounded-xl ${
              msg.role === "user"
                ? "bg-neutral-800 text-white rounded-br-none"
                : "bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-bl-none"
            }`}>
              {msg.role === "ai" && (
                <div className="text-[10px] text-red-500 font-bold tracking-widest uppercase mb-2">
                  Race Engineer
                </div>
              )}
              {/* 🚨 FIX: Using ReactMarkdown here instead of <p> */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-invert prose-p:my-0 prose-strong:text-white">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl rounded-bl-none">
              <span className="text-sm text-neutral-500 animate-pulse">Calculating telemetry...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* ... (keep your existing input area) ... */}
      <div className="p-4 border-t border-neutral-800 bg-neutral-950">
        <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message the pit wall..."
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-600 transition-colors"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className="bg-white text-black px-6 py-3 rounded-lg text-sm font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            SEND
          </button>
        </form>
      </div>
    </div>
  );
}