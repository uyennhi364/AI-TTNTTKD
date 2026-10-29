import React from 'react';
import { CompassDirection } from '../types/fengshui';

interface RoomCompassWidgetProps {
  roomDirection?: CompassDirection | string;
  rotationAngle?: number;
}

export const RoomCompassWidget: React.FC<RoomCompassWidgetProps> = ({
  roomDirection = 'N',
  rotationAngle = 0,
}) => {
  return (
    <div className="flex flex-col items-center gap-1 select-none pointer-events-auto">
      {/* Dark Architectural Compass Dial */}
      <div className="relative w-15 h-15 rounded-full bg-[#1A1D20]/95 backdrop-blur-md shadow-xl border border-stone-700/80 flex items-center justify-center">
        {/* Subtle inner ring */}
        <div className="absolute inset-1.5 rounded-full border border-stone-600/50" />

        {/* Cardinal Markers */}
        <span className="absolute top-1 text-[10px] font-black text-rose-500 leading-none">N</span>
        <span className="absolute bottom-1 text-[9px] font-bold text-stone-400 leading-none">S</span>
        <span className="absolute right-1 text-[9px] font-bold text-stone-400 leading-none">B</span>
        <span className="absolute left-1 text-[9px] font-bold text-stone-400 leading-none">T</span>

        {/* Compass Needle */}
        <div
          className="relative w-1 h-9 flex flex-col items-center justify-center transition-transform duration-300"
          style={{ transform: `rotate(${rotationAngle}deg)` }}
        >
          {/* North needle */}
          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[15px] border-b-rose-500 drop-shadow-xs" />
          {/* South needle */}
          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[15px] border-t-emerald-600 drop-shadow-xs" />
          {/* Pivot pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border border-stone-700 shadow-xs z-10" />
        </div>
      </div>

      {/* Text label */}
      <p className="text-[11px] font-semibold text-stone-300 tracking-wide drop-shadow-md">
        Hướng phòng: <span className="text-white font-bold">Bắc (0°)</span>
      </p>
    </div>
  );
};

