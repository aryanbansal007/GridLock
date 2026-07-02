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

  // ============================================================================
  // HOOK #1: Load race data from JSON file
  // ============================================================================
//   useEffect(() => {
//     if (!raceId) return;
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


// ============================================================================
  // HOOK #1: Load race data from JSON file
  // ============================================================================
  useEffect(() => {
    if (!raceId) {
      setError("No race ID provided in the URL. Please select a race from the sidebar.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    fetch(`/races/${raceId}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("Expected JSON response but got something else — check the file path/routing.");
        }
        return res.json();
      })
      .then((data) => {
        setRaceData(data);
        setFrameIndex(0);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Critical Fetch Error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [raceId]);

  // ============================================================================
  // HOOK #2: Derive driver list from team colors (computed once when data loads)
  // ============================================================================
  const drivers = useMemo(() => {
    if (!raceData) return [];
    return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
      code,
      color: color as string,
    }));
  }, [raceData]);

  // ============================================================================
  // HOOK #3: Compute total laps (highest lap number in any frame)
  // ============================================================================
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

  // ============================================================================
  // HOOK #4: Playback loop — step through frames at the given speed
  // ============================================================================
  useEffect(() => {
    if (!raceData || loading || error) return;
    
    const intervalTime = 300 / playbackSpeed;
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % raceData.frames.length);
    }, intervalTime);
    
    return () => clearInterval(timer);
  }, [raceData, loading, error, playbackSpeed]);

  // ============================================================================
  // EARLY RETURNS — ONLY AFTER ALL HOOKS
  // ============================================================================
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white font-bold">
        Loading Telemetry...
      </div>
    );
  
  if (error || !raceData)
    return (
      <div className="flex h-screen items-center justify-center bg-black text-red-500 font-bold">
        {error || "No data loaded"}
      </div>
    );

  // ============================================================================
  // RENDER
  // ============================================================================
  const currentFrame = raceData.frames[frameIndex];
  const currentLap = Math.max(
    0,
    ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black flex overflow-hidden">
      {/* Control Overlay */}
      <div className="absolute top-4 left-64 z-[60] flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-1.5 rounded-lg">
        <span className="text-[10px] font-bold text-neutral-400 px-2 uppercase">Speed:</span>
        {[1, 2, 5, 10].map((speed) => (
          <button
            key={speed}
            onClick={() => setPlaybackSpeed(speed)}
            className={`text-xs font-bold px-2 py-1 rounded transition-all ${
              playbackSpeed === speed ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white bg-neutral-800/50"
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>

      <button
        onClick={() => navigate("/engineer")}
        className="absolute top-4 right-72 z-[60] mr-4 bg-neutral-900/80 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg border border-neutral-700"
      >
        ← Back to Dashboard
      </button>

      <div className="flex-1 p-8 flex items-center justify-center">
        <RaceTrack
          drivers={drivers}
          positions={currentFrame.cars}
          trackOutline={raceData.track_outline}
          bounds={raceData.meta.bounds}
        />
      </div>

      <div className="w-72 border-l border-neutral-800 bg-neutral-950 flex-shrink-0">
        <Leaderboard
          drivers={drivers}
          positions={currentFrame.cars}
          trackOutline={raceData.track_outline}
          totalLaps={totalLaps}
          currentLap={currentLap}
        />
      </div>
    </div>
  );
};

export default LiveSimulator;