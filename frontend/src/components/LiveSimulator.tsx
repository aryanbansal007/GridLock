// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// const LiveSimulator = () => {
//   return (
//     // The master container: full screen, dark mode, flexbox row
//     <div className="w-screen h-screen bg-black flex overflow-hidden">
      
//       {/* 1. Left Side: The Track Map */}
//       {/* flex-1 forces this div to take up all remaining space on the screen */}
//       <div className="flex-1 relative">
//         <RaceTrack />
//       </div>

//       {/* 2. Right Side: The Leaderboard */}
//       {/* Since Leaderboard has a fixed width (w-72) in its own file, 
//           it will snap perfectly to the right edge. */}
//       <Leaderboard />
      
//     </div>
//   );
// };

// export default LiveSimulator;

// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";
// import { useNavigate } from "react-router-dom";



// const LiveSimulator = () => {
//     const navigate = useNavigate();
//   return (
//     // 1. Ensure absolute full screen and disable any scrollbars
//     <div className="fixed inset-0 z-50 bg-black flex overflow-hidden">

//         {/* 🆕 Floating Exit Button */}
//       <button 
//         onClick={() => navigate("/engineer")}
//         className="absolute top-4 right-80 z-[60] bg-neutral-900/50 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all border border-neutral-700"
//       >
//         ← Back to Dashboard
//       </button>
      
//       {/* 2. Track Area: Center the content and keep it proportional */}
//       <div className="flex-1 flex items-center justify-center p-4">
//         <div className="w-full h-full max-h-[90vh]">
//           <RaceTrack />
//         </div>
//       </div>

//       {/* 3. Leaderboard Area: Fixed width on the right */}
//       {/* Added h-full and removed border-l to make it cleaner if needed */}
//       <div className="w-72 h-full border-l border-neutral-800 bg-black">
//         <Leaderboard />
//       </div>
      
//     </div>
//   );
// };

// export default LiveSimulator;

// import { useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// const LiveSimulator = () => {
//   const navigate = useNavigate();

//   return (
//     // Fixed inset-0 ensures it fills the window completely
//     <div className="fixed inset-0 z-50 bg-black flex overflow-hidden">
      
//       {/* Exit Button: 
//          Right-80 pushes it left of the 320px (w-72) Leaderboard.
//       */}
//       <button 
//         onClick={() => navigate("/engineer")}
//         className="absolute top-4 right-72 z-[60] mr-4 bg-neutral-900/80 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all border border-neutral-700"
//       >
//         ← Back to Dashboard
//       </button>
      
//       {/* Track Area */}
//       <div className="flex-1 flex items-center justify-center p-8">
//         <div className="w-full h-full max-h-[85vh]">
//           <RaceTrack />
//         </div>
//       </div>

//       {/* Leaderboard Area */}
//       <div className="w-72 h-full border-l border-neutral-800 bg-neutral-950 flex-shrink-0">
//         <Leaderboard />
//       </div>
      
//     </div>
//   );
// };

// export default LiveSimulator;
// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";
// import { RaceTrackProps } from "./RaceTrack"; // Import the props type for RaceTrack

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();
//   const [raceData, setRaceData] = useState<any>(null);
//   const [frameIndex, setFrameIndex] = useState(0);

//   useEffect(() => {
//     // Fetch data based on the URL ID
//     fetch(`/races/${raceId}/data.json`)
//       .then((res) => res.json())
//       .then((data) => setRaceData(data));
//   }, [raceId]);

//   // Simulation Loop
//   useEffect(() => {
//     if (!raceData) return;
//     const timer = setInterval(() => {
//       setFrameIndex((prev) => (prev + 1) % raceData.frames.length);
//     }, 100);
//     return () => clearInterval(timer);
//   }, [raceData]);

//   if (!raceData) return <div className="text-white">Loading {raceId} Race...</div>;

//   return (
//     <div className="fixed inset-0 z-50 bg-black flex overflow-hidden">
//       <button onClick={() => navigate("/engineer")} className="absolute top-4 right-72 z-[60] bg-neutral-900 text-white px-4 py-2 rounded-lg border border-neutral-700">← Back</button>
      
//       <div className="flex-1 p-8">
//         {/* Pass only the data needed for this frame */}
//         <RaceTrack 
//           drivers={raceData.drivers}
//           positions={raceData.frames[frameIndex].positions}
//         />
//       </div>

//       <div className="w-72 border-l border-neutral-800 bg-neutral-950">
//         <Leaderboard drivers={raceData.drivers} positions={raceData.frames[frameIndex].positions} />
//       </div>
//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();
//   const [raceData, setRaceData] = useState<any>(null);
//   const [frameIndex, setFrameIndex] = useState(0);
//   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     setLoading(true);
// //     // Fetch data based on the URL ID
// //     fetch(`/races/${raceId}/data.json`)
// //       .then((res) => res.json())
// //       .then((data) => {
// //         setRaceData(data);
// //         setFrameIndex(0); // Reset to start when loading new race
// //         setLoading(false);
// //       })
// //       .catch((err) => console.error("Failed to load race data:", err));
// //   }, [raceId]);

// useEffect(() => {
//     setLoading(true);
    
//     // Use the absolute path to bypass React Router path resolution issues
//     const url = `${window.location.origin}/races/${raceId}/data.json`;
    
//     fetch(url)
//       .then((res) => {
//         // Check if the request was successful
//         if (!res.ok) {
//           throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
//         }
//         return res.json();
//       })
//       .then((data) => {
//         setRaceData(data);
//         setFrameIndex(0); 
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Critical Fetch Error:", err);
//         setLoading(false); // Stop loading so the UI doesn't hang
//       });
//   }, [raceId]);

//   // Simulation Loop
//   useEffect(() => {
//     if (!raceData || loading) return;
    
//     const timer = setInterval(() => {
//       setFrameIndex((prev) => (prev + 1) % raceData.frames.length);
//     }, 100);
    
//     return () => clearInterval(timer);
//   }, [raceData, loading]);

//   if (loading) return <div className="flex h-screen items-center justify-center text-white font-bold">Loading {raceId}...</div>;

//   return (
//     <div className="fixed inset-0 z-50 bg-black flex overflow-hidden">
//       {/* Back Button - Positioned exactly to clear the Leaderboard */}
//       <button 
//         onClick={() => navigate("/engineer")} 
//         className="absolute top-4 right-72 z-[60] mr-4 bg-neutral-900/80 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg border border-neutral-700 transition-all"
//       >
//         ← Back to Dashboard
//       </button>
      
//       {/* Track Area - Takes remaining space */}
//       <div className="flex-1 p-8">
//         <RaceTrack 
//           drivers={raceData.drivers}
//           positions={raceData.frames[frameIndex].positions}
//         />
//       </div>

//       {/* Leaderboard Area - Fixed width */}
//       <div className="w-72 border-l border-neutral-800 bg-neutral-950 flex-shrink-0">
//         <Leaderboard 
//           drivers={raceData.drivers} 
//           positions={raceData.frames[frameIndex].positions} 
//         />
//       </div>
//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();
  
//   const [raceData, setRaceData] = useState<any>(null);
//   const [frameIndex, setFrameIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!raceId) return;
    
//     setLoading(true);
//     setError(null);
    
//     // Using relative path. Vite will look in the public folder.
//     const url = `/races/${raceId}/data.json`;
//     console.log("Attempting to fetch data from:", url); // Check this in your console
    
//     fetch(url)
//       .then((res) => {
//         // Vite often returns index.html with a 200 OK status if a file is missing.
//         // We MUST check the headers to ensure we actually got JSON back.
//         const contentType = res.headers.get("content-type");
//         if (!contentType || !contentType.includes("application/json")) {
//           throw new Error(`File not found. Server returned: ${contentType}`);
//         }
        
//         if (!res.ok) {
//           throw new Error(`HTTP error! status: ${res.status}`);
//         }
//         return res.json();
//       })
//       .then((data) => {
//         setRaceData(data);
//         setFrameIndex(0); 
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Critical Fetch Error:", err);
//         setError(err.message);
//         setLoading(false); // Stop loading so the UI doesn't hang
//       });
//   }, [raceId]);

//   // Simulation Loop
//   useEffect(() => {
//     if (!raceData || loading || error) return;
    
//     const timer = setInterval(() => {
//       setFrameIndex((prev) => (prev + 1) % raceData.frames.length);
//     }, 100);
    
//     return () => clearInterval(timer);
//   }, [raceData, loading, error]);

//   // --- RENDERING GUARDS ---
  
//   // 1. If still fetching, show loader
//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center bg-black text-white font-bold">
//         Loading Simulator...
//       </div>
//     );
//   }

//   // 2. If the fetch failed, show the error gracefully without crashing
//   if (error || !raceData) {
//     return (
//       <div className="flex flex-col h-screen items-center justify-center bg-black text-red-500 font-bold p-8 text-center">
//         <p>Failed to load race: {raceId}</p>
//         <p className="text-sm font-normal text-neutral-400 mt-2">{error}</p>
//         <button 
//           onClick={() => navigate("/engineer")} 
//           className="mt-6 bg-neutral-900 text-white px-4 py-2 rounded-lg border border-neutral-700"
//         >
//           ← Back to Dashboard
//         </button>
//       </div>
//     );
//   }

//   // 3. Render the actual simulator
//   return (
//     <div className="fixed inset-0 z-50 bg-black flex overflow-hidden">
//       <button 
//         onClick={() => navigate("/engineer")} 
//         className="absolute top-4 right-72 z-[60] mr-4 bg-neutral-900/80 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg border border-neutral-700 transition-all"
//       >
//         ← Back to Dashboard
//       </button>
      
//       <div className="flex-1 p-8">
//         <RaceTrack 
//           drivers={raceData.drivers}
//           positions={raceData.frames[frameIndex].positions}
//         />
//       </div>

//       <div className="w-72 border-l border-neutral-800 bg-neutral-950 flex-shrink-0">
//         <Leaderboard 
//           drivers={raceData.drivers} 
//           positions={raceData.frames[frameIndex].positions} 
//           totalLaps={raceData.totalLaps} 
//           currentLap={Math.floor(Math.max(...raceData.frames[frameIndex].positions) * raceData.totalLaps) + 1}
//         />
//       </div>
//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();
  
//   const [raceData, setRaceData] = useState<any>(null);
//   const [frameIndex, setFrameIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   // Speed multiplier: 1x (real-time), 5x, 10x, 30x, 60x
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(10); 

//   useEffect(() => {
//     if (!raceId) return;
    
//     setLoading(true);
//     setError(null);
    
//     const url = `/races/${raceId}/data.json`;
    
//     fetch(url)
//       .then((res) => {
//         const contentType = res.headers.get("content-type");
//         if (!contentType || !contentType.includes("application/json")) {
//           throw new Error(`File format error. Expected JSON, got: ${contentType}`);
//         }
//         if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
//         return res.json();
//       })
//       .then((data) => {
//         setRaceData(data);
//         setFrameIndex(0); 
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Critical Fetch Error:", err);
//         setError(err.message);
//         setLoading(false);
//       });
//   }, [raceId]);

//   // Dynamic Telemetry Playback Loop
//   useEffect(() => {
//     if (!raceData || loading || error) return;
    
//     // Base Python telemetry sample step is 300ms. 
//     // We scale the interval down based on playbackSpeed to keep movements completely fluid.
//     const intervalTime = Math.max(16, 300 / playbackSpeed); 
//     // If the interval hits the 16ms boundary (60FPS), we skip frames to scale speed instead of lagging
//     const frameStep = intervalTime === 16 ? Math.round((playbackSpeed * 16) / 300) : 1;

//     const timer = setInterval(() => {
//       setFrameIndex((prev) => (prev + frameStep) % raceData.frames.length);
//     }, intervalTime);
    
//     return () => clearInterval(timer);
//   }, [raceData, loading, error, playbackSpeed]);

//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center bg-black text-white font-bold">
//         Loading Absolute Telemetry...
//       </div>
//     );
//   }

//   if (error || !raceData) {
//     return (
//       <div className="flex flex-col h-screen items-center justify-center bg-black text-red-500 font-bold p-8 text-center">
//         <p>Failed to load race data</p>
//         <p className="text-sm font-normal text-neutral-400 mt-2">{error}</p>
//       </div>
//     );
//   }

//   // Safely capture the active telemetry frame data
//   const currentFrame = raceData.frames[frameIndex];

//   return (
//     <div className="fixed inset-0 z-50 bg-black flex overflow-hidden">
      
//       {/* Control Overlay for Playback Speed */}
//       <div className="absolute top-4 left-64 z-[60] flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-1.5 rounded-lg">
//         <span className="text-[10px] font-bold text-neutral-400 px-2 uppercase">Speed:</span>
//         {[1, 5, 10, 30, 60].map((speed) => (
//           <button
//             key={speed}
//             onClick={() => setPlaybackSpeed(speed)}
//             className={`text-xs font-bold px-2 py-1 rounded transition-all ${
//               playbackSpeed === speed 
//                 ? "bg-red-600 text-white" 
//                 : "text-neutral-400 hover:text-white bg-neutral-800/50"
//             }`}
//           >
//             {speed}x
//           </button>
//         ))}
//       </div>

//       <button 
//         onClick={() => navigate("/engineer")} 
//         className="absolute top-4 right-72 z-[60] mr-4 bg-neutral-900/80 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg border border-neutral-700 transition-all"
//       >
//         ← Back to Dashboard
//       </button>
      
//       {/* Track Layout Display */}
//       <div className="flex-1 p-8 flex items-center justify-center">
//         <RaceTrack 
//           drivers={raceData.drivers}
//           positions={currentFrame.positions}
//         />
//       </div>

//       {/* Synchronized Timing Screen */}
//       <div className="w-72 border-l border-neutral-800 bg-neutral-950 flex-shrink-0">
//         <Leaderboard 
//           drivers={raceData.drivers} 
//           positions={currentFrame.positions} 
//           totalLaps={raceData.totalLaps}
//           // READING THE EXACT PRE-CALCULATED LAP INSIDE THE JSON OBJECT
//           currentLap={currentFrame.currentLap} 
//         />
//       </div>
//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();
  
//   const [raceData, setRaceData] = useState<any>(null);
//   const [frameIndex, setFrameIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   // Lowered default speed to 5x for stability, but supports fast-forwarding cleanly
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5); 

//   useEffect(() => {
//     if (!raceId) return;
//     setLoading(true);
//     setError(null);
    
//     fetch(`/races/${raceId}/data.json`)
//       .then((res) => {
//         if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
//         return res.json();
//       })
//       .then((data) => {
//         setRaceData(data);
//         setFrameIndex(0); 
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Critical Fetch Error:", err);
//         setError(err.message);
//         setLoading(false);
//       });
//   }, [raceId]);

//   // STABLE SEQUENTIAL PLAYBACK LOOP
//   useEffect(() => {
//     if (!raceData || loading || error) return;
    
//     // # We never skip frames now (frameStep is always 1). 
//     // # Instead, we speed up the interval calculation natively.
//     const intervalTime = 300 / playbackSpeed; 

//     const timer = setInterval(() => {
//       setFrameIndex((prev) => (prev + 1) % raceData.frames.length);
//     }, intervalTime);
    
//     return () => clearInterval(timer);
//   }, [raceData, loading, error, playbackSpeed]);

//   if (loading) return <div className="flex h-screen items-center justify-center bg-black text-white font-bold">Loading Telemetry...</div>;
//   if (error || !raceData) return <div className="flex h-screen items-center justify-center bg-black text-red-500 font-bold">{error}</div>;

//   const currentFrame = raceData.frames[frameIndex];

//   return (
//     <div className="fixed inset-0 z-50 bg-black flex overflow-hidden">
//       {/* Control Overlay */}
//       <div className="absolute top-4 left-64 z-[60] flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-1.5 rounded-lg">
//         <span className="text-[10px] font-bold text-neutral-400 px-2 uppercase">Speed:</span>
//         {[1, 2, 5, 10].map((speed) => (
//           <button
//             key={speed}
//             onClick={() => setPlaybackSpeed(speed)}
//             className={`text-xs font-bold px-2 py-1 rounded transition-all ${
//               playbackSpeed === speed ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white bg-neutral-800/50"
//             }`}
//           >
//             {speed}x
//           </button>
//         ))}
//       </div>

//       <button onClick={() => navigate("/engineer")} className="absolute top-4 right-72 z-[60] mr-4 bg-neutral-900/80 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg border border-neutral-700">
//         ← Back to Dashboard
//       </button>
      
//       <div className="flex-1 p-8 flex items-center justify-center">
//         <RaceTrack drivers={raceData.drivers} positions={currentFrame.positions} />
//       </div>

//       <div className="w-72 border-l border-neutral-800 bg-neutral-950 flex-shrink-0">
//         <Leaderboard drivers={raceData.drivers} positions={currentFrame.positions} totalLaps={raceData.totalLaps} currentLap={currentFrame.currentLap} />
//       </div>
//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();
//   const [raceData, setRaceData] = useState<any>(null);
//   const [frameIndex, setFrameIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);

//   useEffect(() => {
//     if (!raceId) return;
//     setLoading(true);
//     setError(null);
//     fetch(`/races/${raceId}/data.json`)
//       .then((res) => {
//         if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
//         const contentType = res.headers.get("content-type") || "";
//         if (!contentType.includes("application/json")) {
//           throw new Error("Expected JSON response but got something else — check the file path/routing.");
//         }
//         return res.json();
//       })
//       .then((data) => {
//         setRaceData(data);
//         setFrameIndex(0);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Critical Fetch Error:", err);
//         setError(err.message);
//         setLoading(false);
//       });
//   }, [raceId]);

//   // Driver list (code + team color) derived once from meta.team_colors.
//   // This REPLACES the old raceData.drivers array — the new generator script
//   // doesn't emit a separate drivers list, it's embedded in meta.
//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   // Total laps isn't precomputed by the generator script, so we derive it
//   // once here by scanning for the highest lap number that appears anywhere
//   // in the frame data. Cheap because it only runs once when raceData loads,
//   // not on every frame tick.
//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     let max = 0;
//     for (const frame of raceData.frames) {
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     }
//     return max;
//   }, [raceData]);

//   // STABLE SEQUENTIAL PLAYBACK LOOP — unchanged logic, still correct
//   useEffect(() => {
//     if (!raceData || loading || error) return;
//     const intervalTime = 300 / playbackSpeed;
//     const timer = setInterval(() => {
//       setFrameIndex((prev) => (prev + 1) % raceData.frames.length);
//     }, intervalTime);
//     return () => clearInterval(timer);
//   }, [raceData, loading, error, playbackSpeed]);

//   if (loading)
//     return (
//       <div className="flex h-screen items-center justify-center bg-black text-white font-bold">
//         Loading Telemetry...
//       </div>
//     );
//   if (error || !raceData)
//     return (
//       <div className="flex h-screen items-center justify-center bg-black text-red-500 font-bold">
//         {error}
//       </div>
//     );

//   const currentFrame = raceData.frames[frameIndex];

//   // Current lap = the highest lap number among cars currently on track
//   // (i.e. the race leader's lap), matching what a real F1 broadcast shows.
//   const currentLap = Math.max(
//     0,
//     ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0)
//   );

//   return (
//     <div className="fixed inset-0 z-50 bg-black flex overflow-hidden">
//       {/* Control Overlay */}
//       <div className="absolute top-4 left-64 z-[60] flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-1.5 rounded-lg">
//         <span className="text-[10px] font-bold text-neutral-400 px-2 uppercase">Speed:</span>
//         {[1, 2, 5, 10].map((speed) => (
//           <button
//             key={speed}
//             onClick={() => setPlaybackSpeed(speed)}
//             className={`text-xs font-bold px-2 py-1 rounded transition-all ${
//               playbackSpeed === speed ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white bg-neutral-800/50"
//             }`}
//           >
//             {speed}x
//           </button>
//         ))}
//       </div>

//       <button
//         onClick={() => navigate("/engineer")}
//         className="absolute top-4 right-72 z-[60] mr-4 bg-neutral-900/80 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg border border-neutral-700"
//       >
//         ← Back to Dashboard
//       </button>

//       <div className="flex-1 p-8 flex items-center justify-center">
//         <RaceTrack
//           drivers={drivers}
//           positions={currentFrame.cars}
//           trackOutline={raceData.track_outline}
//           bounds={raceData.meta.bounds}
//         />
//       </div>

//       <div className="w-72 border-l border-neutral-800 bg-neutral-950 flex-shrink-0">
//         <Leaderboard
//           drivers={drivers}
//           positions={currentFrame.cars}
//           totalLaps={totalLaps}
//           currentLap={currentLap}
//         />
//       </div>
//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();
//   const [raceData, setRaceData] = useState<any>(null);
//   const [frameIndex, setFrameIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);

//   useEffect(() => {
//     if (!raceId) return;
//     setLoading(true);
//     setError(null);
//     fetch(`/races/${raceId}/data.json`)
//       .then((res) => {
//         if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
//         const contentType = res.headers.get("content-type") || "";
//         if (!contentType.includes("application/json")) {
//           throw new Error("Expected JSON response but got something else — check the file path/routing.");
//         }
//         return res.json();
//       })
//       .then((data) => {
//         setRaceData(data);
//         setFrameIndex(0);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Critical Fetch Error:", err);
//         setError(err.message);
//         setLoading(false);
//       });
//   }, [raceId]);

//   // Driver list (code + team color) derived once from meta.team_colors.
//   // This REPLACES the old raceData.drivers array — the new generator script
//   // doesn't emit a separate drivers list, it's embedded in meta.
//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   // Total laps isn't precomputed by the generator script, so we derive it
//   // once here by scanning for the highest lap number that appears anywhere
//   // in the frame data. Cheap because it only runs once when raceData loads,
//   // not on every frame tick.
//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     let max = 0;
//     for (const frame of raceData.frames) {
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     }
//     return max;
//   }, [raceData]);

//   // STABLE SEQUENTIAL PLAYBACK LOOP — unchanged logic, still correct
//   useEffect(() => {
//     if (!raceData || loading || error) return;
//     const intervalTime = 300 / playbackSpeed;
//     const timer = setInterval(() => {
//       setFrameIndex((prev) => (prev + 1) % raceData.frames.length);
//     }, intervalTime);
//     return () => clearInterval(timer);
//   }, [raceData, loading, error, playbackSpeed]);

//   if (loading)
//     return (
//       <div className="flex h-screen items-center justify-center bg-black text-white font-bold">
//         Loading Telemetry...
//       </div>
//     );
//   if (error || !raceData)
//     return (
//       <div className="flex h-screen items-center justify-center bg-black text-red-500 font-bold">
//         {error}
//       </div>
//     );

//   const currentFrame = raceData.frames[frameIndex];

//   useEffect(() => {
//   console.log("Frame index:", frameIndex);
//   console.log("Current frame:", currentFrame);
//   console.log("Drivers:", drivers);
//   console.log("Positions keys:", Object.keys(currentFrame.cars || {}));
// }, [frameIndex, currentFrame, drivers]);


//   // Current lap = the highest lap number among cars currently on track
//   // (i.e. the race leader's lap), matching what a real F1 broadcast shows.
//   const currentLap = Math.max(
//     0,
//     ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0)
//   );

//   return (
//     <div className="fixed inset-0 z-50 bg-black flex overflow-hidden">
//       {/* Control Overlay */}
//       <div className="absolute top-4 left-64 z-[60] flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-1.5 rounded-lg">
//         <span className="text-[10px] font-bold text-neutral-400 px-2 uppercase">Speed:</span>
//         {[1, 2, 5, 10].map((speed) => (
//           <button
//             key={speed}
//             onClick={() => setPlaybackSpeed(speed)}
//             className={`text-xs font-bold px-2 py-1 rounded transition-all ${
//               playbackSpeed === speed ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white bg-neutral-800/50"
//             }`}
//           >
//             {speed}x
//           </button>
//         ))}
//       </div>

//       <button
//         onClick={() => navigate("/engineer")}
//         className="absolute top-4 right-72 z-[60] mr-4 bg-neutral-900/80 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg border border-neutral-700"
//       >
//         ← Back to Dashboard
//       </button>

//       <div className="flex-1 p-8 flex items-center justify-center">
//         <RaceTrack
//           drivers={drivers}
//           positions={currentFrame.cars}
//           trackOutline={raceData.track_outline}
//           bounds={raceData.meta.bounds}
//         />
//       </div>

//       <div className="w-72 border-l border-neutral-800 bg-neutral-950 flex-shrink-0">
//         <Leaderboard
//           drivers={drivers}
//           positions={currentFrame.cars}
//           trackOutline={raceData.track_outline}
//           totalLaps={totalLaps}
//           currentLap={currentLap}
//         />
//       </div>
//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();
//   const [raceData, setRaceData] = useState<any>(null);
//   const [frameIndex, setFrameIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);


// // ============================================================================
//   // HOOK #1: Load race data from JSON file
//   // ============================================================================
//   useEffect(() => {
//     if (!raceId) {
//       setError("No race ID provided in the URL. Please select a race from the sidebar.");
//       setLoading(false);
//       return;
//     }
    
//     setLoading(true);
//     setError(null);
    
//     fetch(`/races/${raceId}.json`)
//       .then((res) => {
//         if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
//         const contentType = res.headers.get("content-type") || "";
//         if (!contentType.includes("application/json")) {
//           throw new Error("Expected JSON response but got something else — check the file path/routing.");
//         }
//         return res.json();
//       })
//       .then((data) => {
//         setRaceData(data);
//         setFrameIndex(0);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Critical Fetch Error:", err);
//         setError(err.message);
//         setLoading(false);
//       });
//   }, [raceId]);

//   // ============================================================================
//   // HOOK #2: Derive driver list from team colors (computed once when data loads)
//   // ============================================================================
//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   // ============================================================================
//   // HOOK #3: Compute total laps (highest lap number in any frame)
//   // ============================================================================
//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     let max = 0;
//     for (const frame of raceData.frames) {
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     }
//     return max;
//   }, [raceData]);

//   // ============================================================================
//   // HOOK #4: Playback loop — step through frames at the given speed
//   // ============================================================================
//   useEffect(() => {
//     if (!raceData || loading || error) return;
    
//     const intervalTime = 300 / playbackSpeed;
//     const timer = setInterval(() => {
//       setFrameIndex((prev) => (prev + 1) % raceData.frames.length);
//     }, intervalTime);
    
//     return () => clearInterval(timer);
//   }, [raceData, loading, error, playbackSpeed]);

//   // ============================================================================
//   // EARLY RETURNS — ONLY AFTER ALL HOOKS
//   // ============================================================================
//   if (loading)
//     return (
//       <div className="flex h-screen items-center justify-center bg-black text-white font-bold">
//         Loading Telemetry...
//       </div>
//     );
  
//   if (error || !raceData)
//     return (
//       <div className="flex h-screen items-center justify-center bg-black text-red-500 font-bold">
//         {error || "No data loaded"}
//       </div>
//     );

//   // ============================================================================
//   // RENDER
//   // ============================================================================
//   const currentFrame = raceData.frames[frameIndex];
//   const currentLap = Math.max(
//     0,
//     ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0)
//   );

//   return (
//     <div className="fixed inset-0 z-50 bg-black flex overflow-hidden">
//       {/* Control Overlay */}
//       <div className="absolute top-4 left-64 z-[60] flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-1.5 rounded-lg">
//         <span className="text-[10px] font-bold text-neutral-400 px-2 uppercase">Speed:</span>
//         {[1, 2, 5, 10].map((speed) => (
//           <button
//             key={speed}
//             onClick={() => setPlaybackSpeed(speed)}
//             className={`text-xs font-bold px-2 py-1 rounded transition-all ${
//               playbackSpeed === speed ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white bg-neutral-800/50"
//             }`}
//           >
//             {speed}x
//           </button>
//         ))}
//       </div>

//       <button
//         onClick={() => navigate("/engineer")}
//         className="absolute top-4 right-72 z-[60] mr-4 bg-neutral-900/80 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg border border-neutral-700"
//       >
//         ← Back to Dashboard
//       </button>

//       <div className="flex-1 p-8 flex items-center justify-center">
//         <RaceTrack
//           drivers={drivers}
//           positions={currentFrame.cars}
//           trackOutline={raceData.track_outline}
//           bounds={raceData.meta.bounds}
//         />
//       </div>

//       <div className="w-72 border-l border-neutral-800 bg-neutral-950 flex-shrink-0">
//         <Leaderboard
//           drivers={drivers}
//           positions={currentFrame.cars}
//           trackOutline={raceData.track_outline}
//           totalLaps={totalLaps}
//           currentLap={currentLap}
//         />
//       </div>
//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();
  
//   const [raceData, setRaceData] = useState<any>(null);
//   const [frameIndex, setFrameIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   // New Playback States
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
//   const [isPlaying, setIsPlaying] = useState<boolean>(true);

//   // ============================================================================
//   // HOOK #1: Fetch from the new Node.js Backend API
//   // ============================================================================
//   useEffect(() => {
//     if (!raceId) {
//       setError("No race ID provided.");
//       setLoading(false);
//       return;
//     }
    
//     // Expecting raceId format: "2024_silverstone_r"
//     const [year, gp, session] = raceId.split('_');
    
//     if (!year || !gp || !session) {
//       setError("Invalid Race ID format. Expected year_gp_session.");
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);
    
//     // Hitting the new endpoint defined in raceRoutes.ts
//     fetch(`http://localhost:5050/api/races/data/${year}/${gp}/${session}`)
//       .then((res) => {
//         if (!res.ok) throw new Error(`Backend Cache Miss: Race data not found. (Status: ${res.status})`);
//         return res.json();
//       })
//       .then((data) => {
//         setRaceData(data);
//         setFrameIndex(0);
//         setIsPlaying(true);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Critical Fetch Error:", err);
//         setError(err.message);
//         setLoading(false);
//       });
//   }, [raceId]);

//   // ============================================================================
//   // HOOK #2: Keyboard Shortcuts Engine
//   // ============================================================================
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       // Prevent default scrolling for spacebar and arrows
//       if ([" ", "ArrowLeft", "ArrowRight"].includes(e.key)) {
//         e.preventDefault();
//       }

//       switch (e.key) {
//         case " ":
//           setIsPlaying((prev) => !prev);
//           break;
//         case "ArrowRight":
//           setFrameIndex((prev) => Math.min(prev + (10 * playbackSpeed), raceData?.frames.length - 1 || 0));
//           break;
//         case "ArrowLeft":
//           setFrameIndex((prev) => Math.max(prev - (10 * playbackSpeed), 0));
//           break;
//         case "r":
//         case "R":
//           setFrameIndex(0);
//           break;
//         case "1": setPlaybackSpeed(1); break;
//         case "2": setPlaybackSpeed(2); break;
//         case "3": setPlaybackSpeed(5); break;
//         case "4": setPlaybackSpeed(10); break;
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [raceData, playbackSpeed]);

//   // ============================================================================
//   // HOOK #3: Data Derivations (Drivers & Laps)
//   // ============================================================================
//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     let max = 0;
//     for (const frame of raceData.frames) {
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     }
//     return max;
//   }, [raceData]);

//   // ============================================================================
//   // HOOK #4: The Core Playback Loop
//   // ============================================================================
//   useEffect(() => {
//     if (!raceData || loading || error || !isPlaying) return;
    
//     // Interval scales dynamically with backend sample rate and user speed
//     const baseInterval = raceData.meta.sample_interval_ms || 300;
//     const intervalTime = baseInterval / playbackSpeed;
    
//     const timer = setInterval(() => {
//       setFrameIndex((prev) => {
//         // Auto-pause at the end of the race
//         if (prev >= raceData.frames.length - 1) {
//           setIsPlaying(false);
//           return prev;
//         }
//         return prev + 1;
//       });
//     }, intervalTime);
    
//     return () => clearInterval(timer);
//   }, [raceData, loading, error, playbackSpeed, isPlaying]);

//   // ============================================================================
//   // EARLY RETURNS
//   // ============================================================================
//   if (loading)
//     return (
//       <div className="flex h-screen items-center justify-center bg-black text-white font-mono text-xl animate-pulse">
//         Fetching Telemetry Cache...
//       </div>
//     );
  
//   if (error || !raceData)
//     return (
//       <div className="flex h-screen items-center justify-center bg-black text-red-500 font-mono flex-col gap-4">
//         <p className="text-xl font-bold">TELEMETRY ERROR</p>
//         <p className="text-sm">{error}</p>
//         <button onClick={() => navigate("/engineer")} className="bg-neutral-800 text-white px-4 py-2 rounded">
//           Return to Paddock
//         </button>
//       </div>
//     );

//   // ============================================================================
//   // RENDER
//   // ============================================================================
//   const currentFrame = raceData.frames[frameIndex];
//   const currentLap = Math.max(
//     0,
//     ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0)
//   );

//   const totalFrames = raceData.frames.length;
//   const progressPercent = (frameIndex / (totalFrames - 1)) * 100;

//   return (
//     <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col overflow-hidden font-sans">
      
//       {/* Top Navigation & Controls */}
//       <div className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0 z-[60]">
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => navigate("/engineer")}
//             className="text-neutral-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
//           >
//             ← Paddock
//           </button>
//           <div className="h-4 w-px bg-neutral-700" />
//           <div className="text-white font-black uppercase tracking-widest text-lg">
//             {raceData.meta.year} {raceData.meta.gp.replace(/_/g, ' ')}
//           </div>
//         </div>

//         <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 p-1 rounded-lg">
//           <span className="text-[10px] font-bold text-neutral-500 px-2 uppercase tracking-widest">Multiplier</span>
//           {[1, 2, 5, 10].map((speed, idx) => (
//             <button
//               key={speed}
//               onClick={() => setPlaybackSpeed(speed)}
//               className={`text-xs font-bold px-3 py-1 rounded transition-all ${
//                 playbackSpeed === speed ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white bg-transparent"
//               }`}
//               title={`Shortcut: ${idx + 1}`}
//             >
//               {speed}x
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Main Layout: Track (Left) | Leaderboard (Right) */}
//       <div className="flex-1 flex overflow-hidden">
//         {/* Track Area */}
//         <div className="flex-1 relative flex items-center justify-center p-8">
//           <RaceTrack
//             drivers={drivers}
//             positions={currentFrame.cars}
//             trackOutline={raceData.track_outline}
//             bounds={raceData.meta.bounds}
//           />
//         </div>

//         {/* Leaderboard Area */}
//         <div className="w-80 border-l border-neutral-800 shrink-0 flex flex-col h-full overflow-hidden">
//           <Leaderboard
//             drivers={drivers}
//             positions={currentFrame.cars}
//             totalLaps={totalLaps}
//             currentLap={currentLap}
//           />
//         </div>
//       </div>

//       {/* Bottom Scrubber & Playback Controls */}
//       <div className="h-16 bg-neutral-900 border-t border-r border-neutral-800 flex items-center px-6 gap-6 shrink-0 z-[60] w-[calc(100%-20rem)]">
        
//         <button 
//           onClick={() => setIsPlaying(!isPlaying)}
//           className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shrink-0"
//           title="Play/Pause (Spacebar)"
//         >
//           {isPlaying ? (
//             <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
//           ) : (
//             <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
//           )}
//         </button>

//         <div className="flex-1 flex flex-col gap-1 mt-1">
//           <div className="flex justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
//             <span>{new Date(currentFrame.t * 1000).toISOString().substr(11, 8)}</span>
//             <span>Lap {currentLap} / {totalLaps}</span>
//           </div>
          
//           <input
//             type="range"
//             min={0}
//             max={totalFrames - 1}
//             value={frameIndex}
//             onChange={(e) => {
//               setIsPlaying(false); // Auto-pause when dragging
//               setFrameIndex(Number(e.target.value));
//             }}
//             className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer hover:bg-neutral-700 transition-colors accent-red-600"
//             style={{
//               background: `linear-gradient(to right, #dc2626 ${progressPercent}%, #262626 ${progressPercent}%)`
//             }}
//           />
//         </div>
//       </div>

//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();
  
//   const [raceData, setRaceData] = useState<any>(null);
//   const [frameIndex, setFrameIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
//   const [isPlaying, setIsPlaying] = useState<boolean>(true);

//   // ============================================================================
//   // HOOK #1: Fetch from the Node.js Backend API
//   // ============================================================================
//   useEffect(() => {
//     if (!raceId) {
//       setError("No race ID provided.");
//       setLoading(false);
//       return;
//     }
    
//     const parts = raceId.split('_');
//     const year = parts[0];
//     const session = parts[parts.length - 1];
//     const gp = parts.slice(1, -1).join('_');
    
//     if (!year || !gp || !session) {
//       setError("Invalid Race ID format. Expected year_gp_session.");
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);
    
//     fetch(`http://localhost:5050/api/races/data/${year}/${gp}/${session}`)
//       .then((res) => {
//         if (!res.ok) throw new Error(`Backend Cache Miss: Race data not found. (Status: ${res.status})`);
//         return res.json();
//       })
//       .then((data) => {
//         setRaceData(data);
//         setFrameIndex(0);
//         setIsPlaying(true);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Critical Fetch Error:", err);
//         setError(err.message);
//         setLoading(false);
//       });
//   }, [raceId]);

//   // ============================================================================
//   // HOOK #2: Keyboard Shortcuts Engine
//   // ============================================================================
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if ([" ", "ArrowLeft", "ArrowRight"].includes(e.key)) {
//         e.preventDefault();
//       }

//       switch (e.key) {
//         case " ":
//           setIsPlaying((prev) => !prev);
//           break;
//         case "ArrowRight":
//           setFrameIndex((prev) => Math.min(prev + (10 * playbackSpeed), raceData?.frames.length - 1 || 0));
//           break;
//         case "ArrowLeft":
//           setFrameIndex((prev) => Math.max(prev - (10 * playbackSpeed), 0));
//           break;
//         case "r":
//         case "R":
//           setFrameIndex(0);
//           break;
//         case "1": setPlaybackSpeed(1); break;
//         case "2": setPlaybackSpeed(2); break;
//         case "3": setPlaybackSpeed(5); break;
//         case "4": setPlaybackSpeed(10); break;
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [raceData, playbackSpeed]);

//   // ============================================================================
//   // HOOK #3: Data Derivations
//   // ============================================================================
//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     let max = 0;
//     for (const frame of raceData.frames) {
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     }
//     return max;
//   }, [raceData]);

//   // ============================================================================
//   // HOOK #4: The Playback Loop
//   // ============================================================================
//   useEffect(() => {
//     if (!raceData || loading || error || !isPlaying) return;
    
//     const baseInterval = raceData.meta.sample_interval_ms || 300;
//     const intervalTime = baseInterval / playbackSpeed;
    
//     const timer = setInterval(() => {
//       setFrameIndex((prev) => {
//         if (prev >= raceData.frames.length - 1) {
//           setIsPlaying(false);
//           return prev;
//         }
//         return prev + 1;
//       });
//     }, intervalTime);
    
//     return () => clearInterval(timer);
//   }, [raceData, loading, error, playbackSpeed, isPlaying]);

//   // ============================================================================
//   // EARLY RETURNS
//   // ============================================================================
//   if (loading)
//     return (
//       <div className="flex h-screen items-center justify-center bg-black text-white font-mono text-xl animate-pulse">
//         Fetching Telemetry Cache...
//       </div>
//     );
  
//   if (error || !raceData)
//     return (
//       <div className="flex h-screen items-center justify-center bg-black text-red-500 font-mono flex-col gap-4">
//         <p className="text-xl font-bold">TELEMETRY ERROR</p>
//         <p className="text-sm">{error}</p>
//         <button onClick={() => navigate("/engineer")} className="bg-neutral-800 text-white px-4 py-2 rounded">
//           Return to Paddock
//         </button>
//       </div>
//     );

//   // ============================================================================
//   // RENDER CONFIG
//   // ============================================================================
//   const currentFrame = raceData.frames[frameIndex];
//   const currentLap = Math.max(
//     0,
//     ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0)
//   );

//   const totalFrames = raceData.frames.length;
//   const progressPercent = (frameIndex / (totalFrames - 1)) * 100;

//   return (
//     <div className="fixed inset-0 w-screen h-screen bg-neutral-950 flex flex-col overflow-hidden font-sans select-none">
      
//       {/* Top Header Controls */}
//       <div className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0 z-[60]">
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => navigate("/engineer")}
//             className="text-neutral-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
//           >
//             ← Paddock
//           </button>
//           <div className="h-4 w-px bg-neutral-700" />
//           <div className="text-white font-black uppercase tracking-widest text-lg">
//             {raceData.meta.year} {raceData.meta.gp.replace(/_/g, ' ')}
//           </div>
//         </div>

//         <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 p-1 rounded-lg">
//           <span className="text-[10px] font-bold text-neutral-500 px-2 uppercase tracking-widest">Multiplier</span>
//           {[1, 2, 5, 10].map((speed, idx) => (
//             <button
//               key={speed}
//               onClick={() => setPlaybackSpeed(speed)}
//               className={`text-xs font-bold px-3 py-1 rounded transition-all ${
//                 playbackSpeed === speed ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white bg-transparent"
//               }`}
//               title={`Shortcut: ${idx + 1}`}
//             >
//               {speed}x
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Main Layout Area */}
//       {/* FIX: Explicit layout bounds map calculation so leaderboard controls stay true to container height */}
//       <div className="flex-1 w-full flex overflow-hidden relative h-[calc(100vh-3.5rem)]">
        
//         {/* Playback Workspace Window Container */}
//         <div className="flex-1 h-full flex flex-col overflow-hidden ">
//           {/* Track Canvas Workspace */}
//           <div className="flex-1 relative flex items-center justify-center p-8 ">
//             <RaceTrack
//               drivers={drivers}
//               positions={currentFrame.cars}
//               trackOutline={raceData.track_outline}
//               bounds={raceData.meta.bounds}
//             />
//           </div>

//           {/* Bottom Scrubber Player — Locked cleanly directly underneath track workspace boundary */}
//           <div className="h-16 shrink-0 bg-neutral-900 border-t border-neutral-800 flex items-center px-6 gap-6 z-[60]">
//             <button 
//               onClick={() => setIsPlaying(!isPlaying)}
//               className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shrink-0"
//               title="Play/Pause (Spacebar)"
//             >
//               {isPlaying ? (
//                 <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
//               ) : (
//                 <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
//               )}
//             </button>

//             <div className="flex-1 flex flex-col gap-1 mt-1">
//               <div className="flex justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
//                 <span>{new Date(currentFrame.t * 1000).toISOString().substr(11, 8)}</span>
//                 <span>Lap {currentLap} / {totalLaps}</span>
//               </div>
              
//               <input
//                 type="range"
//                 min={0}
//                 max={totalFrames - 1}
//                 value={frameIndex}
//                 onChange={(e) => {
//                   setIsPlaying(false);
//                   setFrameIndex(Number(e.target.value));
//                 }}
//                 className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer hover:bg-neutral-700 transition-colors accent-red-600"
//                 style={{
//                   background: `linear-gradient(to right, #dc2626 ${progressPercent}%, #262626 ${progressPercent}%)`
//                 }}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Leaderboard Column Space Container */}
//         {/* FIX: Re-isolated h-full layout with an unobstructed vertical path down to base viewport */}
//         <div className="w-80 border-l border-neutral-800 shrink-0 flex flex-col h-full bg-neutral-950 overflow-hidden z-20">
//           <Leaderboard
//             drivers={drivers}
//             positions={currentFrame.cars}
//             totalLaps={totalLaps}
//             currentLap={currentLap}
//           />
//         </div>

//       </div>
//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();
  
//   const [raceData, setRaceData] = useState<any>(null);
//   const [frameIndex, setFrameIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
//   const [isPlaying, setIsPlaying] = useState<boolean>(true);

//   // ============================================================================
//   // HOOK #1: Fetch from the Node.js Backend API
//   // ============================================================================
//   useEffect(() => {
//     if (!raceId) {
//       setError("No race ID provided.");
//       setLoading(false);
//       return;
//     }
    
//     const parts = raceId.split('_');
//     const year = parts[0];
//     const session = parts[parts.length - 1];
//     const gp = parts.slice(1, -1).join('_'); 
    
//     if (!year || !gp || !session) {
//       setError("Invalid Race ID format. Expected year_gp_session.");
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);
    
//     fetch(`http://localhost:5050/api/races/data/${year}/${gp}/${session}`)
//       .then((res) => {
//         if (!res.ok) throw new Error(`Backend Cache Miss: Race data not found. (Status: ${res.status})`);
//         return res.json();
//       })
//       .then((data) => {
//         setRaceData(data);
//         setFrameIndex(0);
//         setIsPlaying(true);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Critical Fetch Error:", err);
//         setError(err.message);
//         setLoading(false);
//       });
//   }, [raceId]);

//   // ============================================================================
//   // HOOK #2: Keyboard Shortcuts Engine
//   // ============================================================================
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if ([" ", "ArrowLeft", "ArrowRight"].includes(e.key)) {
//         e.preventDefault();
//       }

//       switch (e.key) {
//         case " ":
//           setIsPlaying((prev) => !prev);
//           break;
//         case "ArrowRight":
//           setFrameIndex((prev) => Math.min(prev + (10 * playbackSpeed), raceData?.frames.length - 1 || 0));
//           break;
//         case "ArrowLeft":
//           setFrameIndex((prev) => Math.max(prev - (10 * playbackSpeed), 0));
//           break;
//         case "r":
//         case "R":
//           setFrameIndex(0);
//           break;
//         case "1": setPlaybackSpeed(1); break;
//         case "2": setPlaybackSpeed(2); break;
//         case "3": setPlaybackSpeed(5); break;
//         case "4": setPlaybackSpeed(10); break;
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [raceData, playbackSpeed]);

//   // ============================================================================
//   // HOOK #3: Data Derivations
//   // ============================================================================
//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     let max = 0;
//     for (const frame of raceData.frames) {
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     }
//     return max;
//   }, [raceData]);

//   // ============================================================================
//   // HOOK #4: The Playback Loop
//   // ============================================================================
//   useEffect(() => {
//     if (!raceData || loading || error || !isPlaying) return;
    
//     const baseInterval = raceData.meta.sample_interval_ms || 300;
//     const intervalTime = baseInterval / playbackSpeed;
    
//     const timer = setInterval(() => {
//       setFrameIndex((prev) => {
//         if (prev >= raceData.frames.length - 1) {
//           setIsPlaying(false);
//           return prev;
//         }
//         return prev + 1;
//       });
//     }, intervalTime);
    
//     return () => clearInterval(timer);
//   }, [raceData, loading, error, playbackSpeed, isPlaying]);

//   // ============================================================================
//   // EARLY RETURNS
//   // ============================================================================
//   if (loading)
//     return (
//       <div className="flex h-screen items-center justify-center bg-black text-white font-mono text-xl animate-pulse">
//         Fetching Telemetry Cache...
//       </div>
//     );
  
//   if (error || !raceData)
//     return (
//       <div className="flex h-screen items-center justify-center bg-black text-red-500 font-mono flex-col gap-4">
//         <p className="text-xl font-bold">TELEMETRY ERROR</p>
//         <p className="text-sm">{error}</p>
//         <button onClick={() => navigate("/engineer")} className="bg-neutral-800 text-white px-4 py-2 rounded">
//           Return to Paddock
//         </button>
//       </div>
//     );

//   const currentFrame = raceData.frames[frameIndex];
//   const currentLap = Math.max(
//     0,
//     ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0)
//   );

//   const totalFrames = raceData.frames.length;
//   const progressPercent = (frameIndex / (totalFrames - 1)) * 100;

//   return (
//     // Locked view wrapper - exactly 100% viewport width and height
//     <div className="fixed inset-0 w-screen h-screen bg-neutral-950 flex flex-col overflow-hidden font-sans select-none">
      
//       {/* 1. TOP HEADER ROW (Fixed Height: h-14) */}
//       <div className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0 z-50">
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => navigate("/engineer")}
//             className="text-neutral-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
//           >
//             ← Paddock
//           </button>
//           <div className="h-4 w-px bg-neutral-700" />
//           <div className="text-white font-black uppercase tracking-widest text-lg">
//             {raceData.meta.year} {raceData.meta.gp.replace(/_/g, ' ')}
//           </div>
//         </div>

//         <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 p-1 rounded-lg">
//           <span className="text-[10px] font-bold text-neutral-500 px-2 uppercase tracking-widest">Multiplier</span>
//           {[1, 2, 5, 10].map((speed, idx) => (
//             <button
//               key={speed}
//               onClick={() => setPlaybackSpeed(speed)}
//               className={`text-xs font-bold px-3 py-1 rounded transition-all ${
//                 playbackSpeed === speed ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white bg-transparent"
//               }`}
//               title={`Shortcut: ${idx + 1}`}
//             >
//               {speed}x
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* 2. MIDDLE MAIN ROW (Dynamic Height: flex-1 fills all vertical space between header and playbar) */}
//       <div className="flex-1 w-full flex overflow-hidden min-h-0">
        
//         {/* Track Area Container */}
//         <div className="flex-1 h-full flex items-center justify-center p-8 bg-neutral-950">
//           <RaceTrack
//             drivers={drivers}
//             positions={currentFrame.cars}
//             trackOutline={raceData.track_outline}
//             bounds={raceData.meta.bounds}
//           />
//         </div>

//         {/* Leaderboard Column (Takes full middle row height) */}
//         <div className="w-80 border-l border-neutral-800 shrink-0 h-full bg-neutral-950 overflow-hidden">
//           <Leaderboard
//             drivers={drivers}
//             positions={currentFrame.cars}
//             totalLaps={totalLaps}
//             currentLap={currentLap}
//           />
//         </div>

//       </div>

//       {/* 3. BOTTOM PLAYBAR ROW (Fixed Height: h-16) */}
//       {/* Width set to w-[calc(100%-20rem)] to slice off right at the leaderboard edge */}
//       <div className="h-16 shrink-0 bg-neutral-900 border-t border-r border-neutral-800 flex items-center px-6 gap-6 z-50 w-[calc(100%-20rem)]">
//         <button 
//           onClick={() => setIsPlaying(!isPlaying)}
//           className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shrink-0"
//           title="Play/Pause (Spacebar)"
//         >
//           {isPlaying ? (
//             <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
//           ) : (
//             <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
//           )}
//         </button>

//         <div className="flex-1 flex flex-col gap-1 mt-1">
//           <div className="flex justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
//             <span>{new Date(currentFrame.t * 1000).toISOString().substr(11, 8)}</span>
//             <span>Lap {currentLap} / {totalLaps}</span>
//           </div>
          
//           <input
//             type="range"
//             min={0}
//             max={totalFrames - 1}
//             value={frameIndex}
//             onChange={(e) => {
//               setIsPlaying(false);
//               setFrameIndex(Number(e.target.value));
//             }}
//             className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer hover:bg-neutral-700 transition-colors accent-red-600"
//             style={{
//               background: `linear-gradient(to right, #dc2626 ${progressPercent}%, #262626 ${progressPercent}%)`
//             }}
//           />
//         </div>
//       </div>

//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();
  
//   const [raceData, setRaceData] = useState<any>(null);
//   const [frameIndex, setFrameIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
//   const [isPlaying, setIsPlaying] = useState<boolean>(true);

//   useEffect(() => {
//     if (!raceId) return;
//     const parts = raceId.split('_');
//     const year = parts[0];
//     const session = parts[parts.length - 1];
//     const gp = parts.slice(1, -1).join('_'); 

//     setLoading(true);
//     fetch(`http://localhost:5050/api/races/data/${year}/${gp}/${session}`)
//       .then((res) => {
//         if (!res.ok) throw new Error(`Backend Cache Miss.`);
//         return res.json();
//       })
//       .then((data) => {
//         setRaceData(data);
//         setFrameIndex(0);
//         setIsPlaying(true);
//         setLoading(false);
//       })
//       .catch((err) => {
//         setError(err.message);
//         setLoading(false);
//       });
//   }, [raceId]);

//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if ([" ", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
//       switch (e.key) {
//         case " ": setIsPlaying(p => !p); break;
//         case "ArrowRight": setFrameIndex(p => Math.min(p + (10 * playbackSpeed), raceData?.frames.length - 1 || 0)); break;
//         case "ArrowLeft": setFrameIndex(p => Math.max(p - (10 * playbackSpeed), 0)); break;
//       }
//     };
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [raceData, playbackSpeed]);

//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     let max = 0;
//     for (const frame of raceData.frames) {
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     }
//     return max;
//   }, [raceData]);

//   useEffect(() => {
//     if (!raceData || loading || error || !isPlaying) return;
//     const baseInterval = raceData.meta.sample_interval_ms || 300;
//     const timer = setInterval(() => {
//       setFrameIndex(prev => {
//         if (prev >= raceData.frames.length - 1) {
//           setIsPlaying(false);
//           return prev;
//         }
//         return prev + 1;
//       });
//     }, baseInterval / playbackSpeed);
//     return () => clearInterval(timer);
//   }, [raceData, loading, error, playbackSpeed, isPlaying]);

//   if (loading) return <div className="flex h-screen items-center justify-center bg-black text-white font-mono animate-pulse">Fetching Telemetry...</div>;
//   if (error || !raceData) return <div className="flex h-screen items-center justify-center bg-black text-red-500 font-mono">Error: {error}</div>;

//   const currentFrame = raceData.frames[frameIndex];
//   const currentLap = Math.max(0, ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0));
//   const totalFrames = raceData.frames.length;
//   const progressPercent = (frameIndex / (totalFrames - 1)) * 100;
  
//   // Base time subtraction to make clock start at 00:00:00
//   const sessionTimeStr = new Date((currentFrame.t - raceData.frames[0].t) * 1000).toISOString().substr(11, 8);

//   return (
//     <div className="fixed inset-0 w-screen h-screen bg-[#0a0a0a] flex flex-col overflow-hidden font-sans select-none">
      
//       {/* HEADER */}
//       <div className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0 z-50">
//         <div className="flex items-center gap-4">
//           <button onClick={() => navigate("/engineer")} className="text-neutral-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">← Paddock</button>
//           <div className="h-4 w-px bg-neutral-700" />
//           <div className="text-white font-black uppercase tracking-widest text-lg">
//             {raceData.meta.year} {raceData.meta.gp.replace(/_/g, ' ')}
//           </div>
//         </div>
//       </div>

//       {/* MAIN VIEW */}
//       <div className="flex-1 w-full flex overflow-hidden min-h-0">
        
//         {/* TRACK AREA WITH FLOATING CONTROLS */}
//         <div className="flex-1 h-full flex flex-col items-center justify-center relative bg-[#0a0a0a]">
          
//           <RaceTrack
//             drivers={drivers}
//             positions={currentFrame.cars}
//             trackOutline={raceData.track_outline}
//             bounds={raceData.meta.bounds}
//           />

//           {/* FLOATING PLAYBACK CONTROLS */}
//           <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[28rem] bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col gap-3 z-50">
            
//             {/* Scrubber Bar */}
//             <input
//               type="range"
//               min={0}
//               max={totalFrames - 1}
//               value={frameIndex}
//               onChange={(e) => {
//                 setIsPlaying(false);
//                 setFrameIndex(Number(e.target.value));
//               }}
//               className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer hover:bg-neutral-700 transition-colors accent-red-600"
//               style={{ background: `linear-gradient(to right, #dc2626 ${progressPercent}%, #262626 ${progressPercent}%)` }}
//             />

//             <div className="flex items-center justify-between mt-1">
//               {/* Time Display */}
//               <div className="w-24 text-[11px] font-mono font-bold text-neutral-300">
//                 {sessionTimeStr}
//               </div>

//               {/* Center Media Controls */}
//               <div className="flex items-center gap-3">
//                 {/* Reset to Start */}
//                 <button onClick={() => setFrameIndex(0)} className="text-neutral-400 hover:text-white transition-colors">
//                   <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
//                 </button>
                
//                 {/* Play/Pause Pill */}
//                 <button 
//                   onClick={() => setIsPlaying(!isPlaying)}
//                   className="w-12 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
//                 >
//                   {isPlaying ? (
//                     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
//                   ) : (
//                     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
//                   )}
//                 </button>

//                 {/* Jump Forward */}
//                 <button onClick={() => setFrameIndex(p => Math.min(p + (30 * playbackSpeed), totalFrames - 1))} className="text-neutral-400 hover:text-white transition-colors">
//                   <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
//                 </button>
//               </div>

//               {/* Speed Multiplier */}
//               <div className="w-24 flex justify-end">
//                 <button 
//                   onClick={() => setPlaybackSpeed(p => p === 1 ? 2 : p === 2 ? 5 : p === 5 ? 10 : 1)}
//                   className="bg-neutral-800 text-neutral-300 hover:text-white text-[10px] font-black px-2.5 py-1 rounded-md transition-colors"
//                 >
//                   {playbackSpeed}.0x
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* LEADERBOARD */}
//         <div className="w-80 border-l border-neutral-800 shrink-0 h-full bg-[#0a0a0a] overflow-hidden">
//           <Leaderboard
//             drivers={drivers}
//             positions={currentFrame.cars}
//             totalLaps={totalLaps}
//             currentLap={currentLap}
//           />
//         </div>

//       </div>
//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();
  
//   const [raceData, setRaceData] = useState<any>(null);
//   const [frameIndex, setFrameIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
//   const [isPlaying, setIsPlaying] = useState<boolean>(true);

//   useEffect(() => {
//     if (!raceId) return;
//     const parts = raceId.split('_');
//     const year = parts[0];
//     const session = parts[parts.length - 1];
//     const gp = parts.slice(1, -1).join('_'); 

//     setLoading(true);
//     fetch(`http://localhost:5050/api/races/data/${year}/${gp}/${session}`)
//       .then((res) => {
//         if (!res.ok) throw new Error(`Backend Cache Miss.`);
//         return res.json();
//       })
//       .then((data) => {
//         setRaceData(data);
//         setFrameIndex(0);
//         setIsPlaying(true);
//         setLoading(false);
//       })
//       .catch((err) => {
//         setError(err.message);
//         setLoading(false);
//       });
//   }, [raceId]);

//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if ([" ", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
//       switch (e.key) {
//         case " ": setIsPlaying(p => !p); break;
//         case "ArrowRight": setFrameIndex(p => Math.min(p + (10 * playbackSpeed), raceData?.frames.length - 1 || 0)); break;
//         case "ArrowLeft": setFrameIndex(p => Math.max(p - (10 * playbackSpeed), 0)); break;
//       }
//     };
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [raceData, playbackSpeed]);

//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     let max = 0;
//     for (const frame of raceData.frames) {
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     }
//     return max;
//   }, [raceData]);

//   useEffect(() => {
//     if (!raceData || loading || error || !isPlaying) return;
//     const baseInterval = raceData.meta.sample_interval_ms || 300;
//     const timer = setInterval(() => {
//       setFrameIndex(prev => {
//         if (prev >= raceData.frames.length - 1) {
//           setIsPlaying(false);
//           return prev;
//         }
//         return prev + 1;
//       });
//     }, baseInterval / playbackSpeed);
//     return () => clearInterval(timer);
//   }, [raceData, loading, error, playbackSpeed, isPlaying]);

//   if (loading) return <div className="flex h-screen items-center justify-center bg-black text-white font-mono animate-pulse">Fetching Telemetry...</div>;
//   if (error || !raceData) return <div className="flex h-screen items-center justify-center bg-black text-red-500 font-mono">Error: {error}</div>;

//   const currentFrame = raceData.frames[frameIndex];
//   const currentLap = Math.max(0, ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0));
//   const totalFrames = raceData.frames.length;
//   const progressPercent = (frameIndex / (totalFrames - 1)) * 100;
  
//   const sessionTimeStr = new Date((currentFrame.t - raceData.frames[0].t) * 1000).toISOString().substr(11, 8);

//   return (
//     <div className="fixed inset-0 w-screen h-screen bg-[#0a0a0a] flex flex-col overflow-hidden font-sans select-none">
      
//       {/* HEADER */}
//       <div className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0 z-50">
//         <div className="flex items-center gap-4">
//           <button onClick={() => navigate("/engineer")} className="text-neutral-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">← Paddock</button>
//           <div className="h-4 w-px bg-neutral-700" />
//           <div className="text-white font-black uppercase tracking-widest text-lg">
//             {raceData.meta.year} {raceData.meta.gp.replace(/_/g, ' ')}
//           </div>
//         </div>
//       </div>

//       {/* MAIN VIEW */}
//       <div className="flex-1 w-full flex overflow-hidden min-h-0">
        
//         {/* TRACK AREA WITH FLOATING CONTROLS */}
//         {/* CHANGED: Added pb-32 here to lift the track visually away from the playbar */}
//         <div className="flex-1 h-full flex flex-col items-center justify-center relative bg-[#0a0a0a] pb-32">
          
//           <RaceTrack
//             drivers={drivers}
//             positions={currentFrame.cars}
//             trackOutline={raceData.track_outline}
//             bounds={raceData.meta.bounds}
//           />

//           {/* FLOATING PLAYBACK CONTROLS */}
//           <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[28rem] bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col gap-3 z-50">
            
//             <input
//               type="range"
//               min={0}
//               max={totalFrames - 1}
//               value={frameIndex}
//               onChange={(e) => {
//                 setIsPlaying(false);
//                 setFrameIndex(Number(e.target.value));
//               }}
//               className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer hover:bg-neutral-700 transition-colors accent-red-600"
//               style={{ background: `linear-gradient(to right, #dc2626 ${progressPercent}%, #262626 ${progressPercent}%)` }}
//             />

//             <div className="flex items-center justify-between mt-1">
//               <div className="w-24 text-[11px] font-mono font-bold text-neutral-300">
//                 {sessionTimeStr}
//               </div>

//               <div className="flex items-center gap-3">
//                 <button onClick={() => setFrameIndex(0)} className="text-neutral-400 hover:text-white transition-colors">
//                   <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
//                 </button>
                
//                 <button 
//                   onClick={() => setIsPlaying(!isPlaying)}
//                   className="w-12 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
//                 >
//                   {isPlaying ? (
//                     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
//                   ) : (
//                     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
//                   )}
//                 </button>

//                 <button onClick={() => setFrameIndex(p => Math.min(p + (30 * playbackSpeed), totalFrames - 1))} className="text-neutral-400 hover:text-white transition-colors">
//                   <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
//                 </button>
//               </div>

//               <div className="w-24 flex justify-end">
//                 <button 
//                   onClick={() => setPlaybackSpeed(p => p === 1 ? 2 : p === 2 ? 5 : p === 5 ? 10 : 1)}
//                   className="bg-neutral-800 text-neutral-300 hover:text-white text-[10px] font-black px-2.5 py-1 rounded-md transition-colors"
//                 >
//                   {playbackSpeed}.0x
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* LEADERBOARD */}
//         <div className="w-80 border-l border-neutral-800 shrink-0 h-full bg-[#0a0a0a] overflow-hidden">
//           <Leaderboard
//             drivers={drivers}
//             positions={currentFrame.cars}
//             totalLaps={totalLaps}
//             currentLap={currentLap}
//           />
//         </div>

//       </div>
//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();
  
//   const [raceData, setRaceData] = useState<any>(null);
//   const [frameIndex, setFrameIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
//   const [isPlaying, setIsPlaying] = useState<boolean>(true);

//   useEffect(() => {
//     if (!raceId) return;
//     const parts = raceId.split('_');
//     const year = parts[0];
//     const session = parts[parts.length - 1];
//     const gp = parts.slice(1, -1).join('_'); 

//     setLoading(true);
//     fetch(`http://localhost:5050/api/races/data/${year}/${gp}/${session}`)
//       .then((res) => {
//         if (!res.ok) throw new Error(`Backend Cache Miss.`);
//         return res.json();
//       })
//       .then((data) => {
//         setRaceData(data);
//         setFrameIndex(0);
//         setIsPlaying(true);
//         setLoading(false);
//       })
//       .catch((err) => {
//         setError(err.message);
//         setLoading(false);
//       });
//   }, [raceId]);

//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if ([" ", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
//       switch (e.key) {
//         case " ": setIsPlaying(p => !p); break;
//         case "ArrowRight": setFrameIndex(p => Math.min(p + (10 * playbackSpeed), raceData?.frames.length - 1 || 0)); break;
//         case "ArrowLeft": setFrameIndex(p => Math.max(p - (10 * playbackSpeed), 0)); break;
//       }
//     };
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [raceData, playbackSpeed]);

//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     let max = 0;
//     for (const frame of raceData.frames) {
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     }
//     return max;
//   }, [raceData]);

//   useEffect(() => {
//     if (!raceData || loading || error || !isPlaying) return;
//     const baseInterval = raceData.meta.sample_interval_ms || 300;
//     const timer = setInterval(() => {
//       setFrameIndex(prev => {
//         if (prev >= raceData.frames.length - 1) {
//           setIsPlaying(false);
//           return prev;
//         }
//         return prev + 1;
//       });
//     }, baseInterval / playbackSpeed);
//     return () => clearInterval(timer);
//   }, [raceData, loading, error, playbackSpeed, isPlaying]);

//   if (loading) return <div className="flex h-screen items-center justify-center bg-black text-white font-mono animate-pulse">Fetching Telemetry...</div>;
//   if (error || !raceData) return <div className="flex h-screen items-center justify-center bg-black text-red-500 font-mono">Error: {error}</div>;

//   const currentFrame = raceData.frames[frameIndex];
//   const currentLap = Math.max(0, ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0));
//   const totalFrames = raceData.frames.length;
//   const progressPercent = (frameIndex / (totalFrames - 1)) * 100;
  
//   const sessionTimeStr = new Date((currentFrame.t - raceData.frames[0].t) * 1000).toISOString().substr(11, 8);

//   return (
//     <div className="fixed inset-0 w-screen h-screen bg-[#0a0a0a] flex flex-col overflow-hidden font-sans select-none">
      
//       {/* HEADER */}
//       <div className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0 z-50">
//         <div className="flex items-center gap-4">
//           <button onClick={() => navigate("/engineer")} className="text-neutral-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">← Paddock</button>
//           <div className="h-4 w-px bg-neutral-700" />
//           <div className="text-white font-black uppercase tracking-widest text-lg">
//             {raceData.meta.year} {raceData.meta.gp.replace(/_/g, ' ')}
//           </div>
//         </div>
//       </div>

//       {/* MAIN VIEW */}
//       <div className="flex-1 w-full flex overflow-hidden min-h-0">
        
//         {/* TRACK AREA WITH FLOATING CONTROLS */}
//         {/* CHANGED: Increased padding bottom (pb-40) and added pt-8 to forcefully lift the track layout */}
//         <div className="flex-1 h-full flex flex-col items-center justify-center relative bg-[#0a0a0a] pt-8 pb-40">
          
//           <RaceTrack
//             drivers={drivers}
//             positions={currentFrame.cars}
//             trackOutline={raceData.track_outline}
//             bounds={raceData.meta.bounds}
//           />

//           {/* FLOATING PLAYBACK CONTROLS */}
//           <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[28rem] bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col gap-3 z-50">
            
//             <input
//               type="range"
//               min={0}
//               max={totalFrames - 1}
//               value={frameIndex}
//               onChange={(e) => {
//                 setIsPlaying(false);
//                 setFrameIndex(Number(e.target.value));
//               }}
//               className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer hover:bg-neutral-700 transition-colors accent-red-600"
//               style={{ background: `linear-gradient(to right, #dc2626 ${progressPercent}%, #262626 ${progressPercent}%)` }}
//             />

//             <div className="flex items-center justify-between mt-1">
//               <div className="w-24 text-[11px] font-mono font-bold text-neutral-300">
//                 {sessionTimeStr}
//               </div>

//               <div className="flex items-center gap-3">
//                 <button onClick={() => setFrameIndex(0)} className="text-neutral-400 hover:text-white transition-colors">
//                   <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
//                 </button>
                
//                 <button 
//                   onClick={() => setIsPlaying(!isPlaying)}
//                   className="w-12 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
//                 >
//                   {isPlaying ? (
//                     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
//                   ) : (
//                     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
//                   )}
//                 </button>

//                 <button onClick={() => setFrameIndex(p => Math.min(p + (30 * playbackSpeed), totalFrames - 1))} className="text-neutral-400 hover:text-white transition-colors">
//                   <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
//                 </button>
//               </div>

//               <div className="w-24 flex justify-end">
//                 <button 
//                   onClick={() => setPlaybackSpeed(p => p === 1 ? 2 : p === 2 ? 5 : p === 5 ? 10 : 1)}
//                   className="bg-neutral-800 text-neutral-300 hover:text-white text-[10px] font-black px-2.5 py-1 rounded-md transition-colors"
//                 >
//                   {playbackSpeed}.0x
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* LEADERBOARD */}
//         {/* CHANGED: Passing the full raceData and frameIndex to allow dynamic speed calculations */}
//         <div className="w-80 border-l border-neutral-800 shrink-0 h-full bg-[#0a0a0a] overflow-hidden">
//           <Leaderboard
//             drivers={drivers}
//             raceData={raceData}
//             frameIndex={frameIndex}
//             totalLaps={totalLaps}
//             currentLap={currentLap}
//           />
//         </div>

//       </div>
//     </div>
//   );
// };

// export default LiveSimulator;

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RaceTrack from "./RaceTrack";
import Leaderboard from "./Leaderboard";

const LiveSimulator = () => {
  const { raceId } = useParams();
  const navigate = useNavigate();
  
  const [raceData, setRaceData] = useState<any>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  useEffect(() => {
    if (!raceId) return;
    const parts = raceId.split('_');
    const year = parts[0];
    const session = parts[parts.length - 1];
    const gp = parts.slice(1, -1).join('_'); 

    setLoading(true);
    fetch(`http://localhost:5050/api/races/data/${year}/${gp}/${session}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Backend Cache Miss.`);
        return res.json();
      })
      .then((data) => {
        setRaceData(data);
        setFrameIndex(0);
        setIsPlaying(true);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [raceId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ([" ", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
      switch (e.key) {
        case " ": setIsPlaying(p => !p); break;
        case "ArrowRight": setFrameIndex(p => Math.min(p + (10 * playbackSpeed), raceData?.frames.length - 1 || 0)); break;
        case "ArrowLeft": setFrameIndex(p => Math.max(p - (10 * playbackSpeed), 0)); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [raceData, playbackSpeed]);

  const drivers = useMemo(() => {
    if (!raceData) return [];
    return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
      code,
      color: color as string,
    }));
  }, [raceData]);

  const totalLaps = useMemo(() => {
    if (!raceData) return 0;
    let max = 0;
    for (const frame of raceData.frames) {
      for (const abbr in frame.cars) {
        const lap = frame.cars[abbr].lap;
        if (lap && lap > max) max = lap;
      }
    }
    return max;
  }, [raceData]);

  useEffect(() => {
    if (!raceData || loading || error || !isPlaying) return;
    const baseInterval = raceData.meta.sample_interval_ms || 300;
    const timer = setInterval(() => {
      setFrameIndex(prev => {
        if (prev >= raceData.frames.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, baseInterval / playbackSpeed);
    return () => clearInterval(timer);
  }, [raceData, loading, error, playbackSpeed, isPlaying]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-black text-white font-mono animate-pulse">Fetching Telemetry...</div>;
  if (error || !raceData) return <div className="flex h-screen items-center justify-center bg-black text-red-500 font-mono">Error: {error}</div>;

  const currentFrame = raceData.frames[frameIndex];
  const currentLap = Math.max(0, ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0));
  const totalFrames = raceData.frames.length;
  const progressPercent = (frameIndex / (totalFrames - 1)) * 100;
  
  const sessionTimeStr = new Date((currentFrame.t - raceData.frames[0].t) * 1000).toISOString().substr(11, 8);

  // CHANGED: Calculate exact transition duration for CSS. 
  // If paused, transition is 0ms so scrubbing is snappy. Otherwise, exactly matches frame interval.
  const baseInterval = raceData.meta.sample_interval_ms || 300;
  const currentTransitionTime = isPlaying ? baseInterval / playbackSpeed : 0;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#0a0a0a] flex flex-col overflow-hidden font-sans select-none">
      
      {/* HEADER */}
      <div className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/engineer")} className="text-neutral-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">← Paddock</button>
          <div className="h-4 w-px bg-neutral-700" />
          <div className="text-white font-black uppercase tracking-widest text-lg">
            {raceData.meta.year} {raceData.meta.gp.replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      {/* MAIN VIEW */}
      <div className="flex-1 w-full flex overflow-hidden min-h-0">
        
        {/* TRACK AREA WITH FLOATING CONTROLS */}
        <div className="flex-1 h-full flex flex-col items-center justify-center relative bg-[#0a0a0a] pt-8 pb-40">
          
          <RaceTrack
            drivers={drivers}
            positions={currentFrame.cars}
            trackOutline={raceData.track_outline}
            bounds={raceData.meta.bounds}
            transitionDuration={currentTransitionTime} // PASSING DYNAMIC SPEED HERE
          />

          {/* FLOATING PLAYBACK CONTROLS */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[28rem] bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col gap-3 z-50">
            
            <input
              type="range"
              min={0}
              max={totalFrames - 1}
              value={frameIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setFrameIndex(Number(e.target.value));
              }}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer hover:bg-neutral-700 transition-colors accent-red-600"
              style={{ background: `linear-gradient(to right, #dc2626 ${progressPercent}%, #262626 ${progressPercent}%)` }}
            />

            <div className="flex items-center justify-between mt-1">
              <div className="w-24 text-[11px] font-mono font-bold text-neutral-300">
                {sessionTimeStr}
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setFrameIndex(p => Math.max(p - (30 * playbackSpeed), 0))} className="text-neutral-400 hover:text-white transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
                </button>
                
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>

                <button onClick={() => setFrameIndex(p => Math.min(p + (30 * playbackSpeed), totalFrames - 1))} className="text-neutral-400 hover:text-white transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
                </button>
              </div>

              <div className="w-24 flex justify-end">
                <button 
                  onClick={() => setPlaybackSpeed(p => p === 1 ? 2 : p === 2 ? 5 : p === 5 ? 10 : 1)}
                  className="bg-neutral-800 text-neutral-300 hover:text-white text-[10px] font-black px-2.5 py-1 rounded-md transition-colors"
                >
                  {playbackSpeed}.0x
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LEADERBOARD */}
        <div className="w-80 border-l border-neutral-800 shrink-0 h-full bg-[#0a0a0a] overflow-hidden">
          <Leaderboard
            drivers={drivers}
            raceData={raceData}
            frameIndex={frameIndex}
            totalLaps={totalLaps}
            currentLap={currentLap}
          />
        </div>

      </div>
    </div>
  );
};

export default LiveSimulator;