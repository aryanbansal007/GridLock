import { useNavigate } from 'react-router-dom';

const RaceEngineerSoon = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 border border-[#24262B] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF2D24]">
        Under development
      </span>
      <h1 className="text-3xl font-black tracking-tight text-[#F5F5F5]">Race Engineer</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-[#A7ACB6]">
        We are training the engineer on race data and past seasons so it can answer with real knowledge of what is
        happening on track. It will be here soon.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="mt-6 border border-[#24262B] px-4 py-2 text-[12px] font-bold uppercase tracking-widest text-[#F5F5F5] transition-colors hover:border-[#E10600]/60"
      >
        Back to dashboard
      </button>
    </div>
  );
};

export default RaceEngineerSoon;
