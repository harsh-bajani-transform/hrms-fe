import React from "react";

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md transition-all duration-500">
      <div className="relative flex flex-col items-center">
        {/* Animated Rings */}
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full border-4 border-blue-100 border-t-blue-600"></div>
          <div className="absolute inset-2 animate-[spin_2s_linear_infinite_reverse] rounded-full border-4 border-indigo-50 border-t-indigo-500"></div>
          <div className="absolute inset-4 animate-[pulse_2s_ease-in-out_infinite] rounded-full bg-blue-50/50"></div>
        </div>

        {/* Brand/Text */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <h2 className="bg-linear-to-r from-blue-700 to-indigo-700 bg-clip-text text-2xl font-black tracking-tighter text-transparent">
            HRMS PORTAL
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.3s]"></span>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]"></span>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400"></span>
          </div>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Initialising Modules
          </p>
        </div>
      </div>

      {/* Subtle background detail */}
      <div className="absolute bottom-10 text-slate-300 text-[10px] font-medium tracking-widest uppercase opacity-50">
        Transform Solutions HRMS v2.0
      </div>
    </div>
  );
};

export default LoadingScreen;
