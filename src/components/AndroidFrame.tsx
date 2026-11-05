import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Smartphone, Monitor } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  onBackPress?: () => void;
  onHomePress?: () => void;
  title?: string;
  theme: 'light' | 'dark';
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  onBackPress,
  onHomePress,
  theme,
}) => {
  const [isFrameMode, setIsFrameMode] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center transition-colors duration-200 ${
        theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-100 text-slate-800'
      } p-0 sm:p-4`}
    >
      {/* Top frame mode toggle bar */}
      <div className="w-full max-w-md mb-2 px-3 py-1.5 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-zinc-400 bg-white/70 dark:bg-zinc-900/70 backdrop-blur rounded-lg shadow-xs border border-slate-200/80 dark:border-zinc-800 hidden sm:flex">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Android 14 (API 34) Reader
        </span>
        <button
          onClick={() => setIsFrameMode(!isFrameMode)}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-colors"
          title="Toggle phone bezel view"
        >
          {isFrameMode ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          {isFrameMode ? 'Full Viewport' : 'Android Bezel'}
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`w-full flex flex-col overflow-hidden transition-all duration-300 ${
          isFrameMode
            ? 'max-w-[420px] h-[92vh] max-h-[880px] rounded-[36px] shadow-2xl border-[8px] border-zinc-800 dark:border-zinc-700 ring-1 ring-black/20'
            : 'max-w-2xl h-screen sm:h-[94vh] sm:rounded-2xl shadow-lg border border-slate-200 dark:border-zinc-800'
        } ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'}`}
      >
        {/* Android Status Bar */}
        <div
          className={`h-7 px-5 flex items-center justify-between select-none shrink-0 text-xs font-medium tracking-tight ${
            theme === 'dark' ? 'bg-zinc-900 text-zinc-300' : 'bg-slate-50 text-slate-700 border-b border-slate-100'
          }`}
        >
          <span className="font-semibold">{currentTime}</span>

          {/* Camera Cutout pill in frame mode */}
          {isFrameMode && (
            <div className="w-4 h-4 rounded-full bg-black mx-auto ring-1 ring-zinc-700/50"></div>
          )}

          <div className="flex items-center gap-1.5 opacity-90">
            <Wifi className="w-3.5 h-3.5" />
            <BatteryMedium className="w-4 h-4" />
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-hidden relative flex flex-col">{children}</div>

        {/* Android Navigation Bar */}
        <div
          className={`h-11 px-8 flex items-center justify-around shrink-0 select-none border-t ${
            theme === 'dark'
              ? 'bg-zinc-900 border-zinc-800/80 text-zinc-400'
              : 'bg-slate-50 border-slate-200/80 text-slate-500'
          }`}
        >
          {/* Android Back Button (Triangle) */}
          <button
            onClick={onBackPress}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-transform"
            aria-label="Android Back"
            title="Android Back"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>

          {/* Android Home Button (Circle) */}
          <button
            onClick={onHomePress}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-transform"
            aria-label="Android Home"
            title="Android Home"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </button>

          {/* Android Recents Button (Square) */}
          <button
            onClick={() => {}}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-transform opacity-70"
            aria-label="Android Recents"
            title="Android Recents"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <rect
                x="4"
                y="4"
                width="16"
                height="16"
                rx="3"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
