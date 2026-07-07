import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SimulatorSetup = () => {
  const navigate = useNavigate();
  const [year, setYear] = useState("2024");
  const [gp, setGp] = useState("");
  const [session, setSession] = useState("R");
  
  // New States for Dynamic Schedule
  const [availableGPs, setAvailableGPs] = useState<string[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FETCH SCHEDULE WHENEVER YEAR CHANGES
  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoadingSchedule(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:5050/api/races/schedule/${year}`);
        const data = await response.json();
        
        if (data.success) {
          setAvailableGPs(data.schedule);
          // Auto-select the first race of the new year
          if (data.schedule.length > 0) {
            setGp(data.schedule[0]);
          }
        } else {
          throw new Error(data.error || "Failed to load schedule");
        }
      } catch (err: any) {
        setError(err.message);
        setAvailableGPs([]);
      } finally {
        setIsLoadingSchedule(false);
      }
    };

    fetchSchedule();
  }, [year]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5050/api/races/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, gp, session }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate telemetry");
      }

      navigate(`/simulator/${data.raceId}`);
    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-black text-white font-sans">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-black tracking-widest uppercase text-red-500 mb-2">
          Generating Telemetry
        </h2>
        <p className="text-neutral-400 font-bold text-center">
          Pulling {year} {gp} FastF1 Data.<br/>This will take a few minutes...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-black font-sans">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 p-8 rounded-2xl drop-shadow-2xl">
        <h2 className="text-2xl font-black text-white tracking-tighter mb-6">
          RACE <span className="text-red-500">SETUP</span>
        </h2>

        {error && (
          <div className="bg-red-950/50 border border-red-900 text-red-500 p-3 rounded-lg mb-6 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="flex flex-col gap-6">
          
          {/* Year Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Year</label>
            <select 
              value={year} 
              onChange={(e) => setYear(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 text-white p-3 rounded-lg font-bold focus:border-red-500 outline-none hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
            </select>
          </div>

          {/* DYNAMIC Grand Prix Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex justify-between">
              <span>Grand Prix</span>
              {isLoadingSchedule && <span className="text-red-500 animate-pulse">Loading API...</span>}
            </label>
            <select 
              value={gp} 
              onChange={(e) => setGp(e.target.value)}
              disabled={isLoadingSchedule || availableGPs.length === 0}
              className="bg-neutral-950 border border-neutral-800 text-white p-3 rounded-lg font-bold focus:border-red-500 outline-none hover:bg-neutral-900 transition-colors cursor-pointer disabled:opacity-50"
            >
              {availableGPs.map(track => (
                <option key={track} value={track}>{track}</option>
              ))}
            </select>
          </div>

          {/* Session Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Session</label>
            <select 
              value={session} 
              onChange={(e) => setSession(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 text-white p-3 rounded-lg font-bold focus:border-red-500 outline-none hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <option value="R">Race</option>
              <option value="Q">Qualifying</option>
              <option value="SQ">Sprint Shootout</option>
              <option value="S">Sprint</option>
            </select>
          </div>

          <button 
            type="submit"
            disabled={isLoadingSchedule || availableGPs.length === 0}
            className="mt-4 bg-red-600 hover:bg-red-500 disabled:bg-neutral-700 disabled:shadow-none text-white font-black py-4 rounded-xl tracking-widest uppercase transition-colors shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)]"
          >
            Launch Simulator
          </button>
        </form>
      </div>
    </div>
  );
};

export default SimulatorSetup;