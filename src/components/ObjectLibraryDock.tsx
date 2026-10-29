import React, { useState, useRef } from 'react';
import { RoomObjectType } from '../types/fengshui';

export interface LibraryItem {
  id: string;
  type: RoomObjectType;
  name: string;
  subtext: string;
  dimensions: { width: number; length: number; height: number };
  category: 'bed' | 'desk' | 'chair' | 'storage' | 'lighting' | 'door' | 'rug' | 'decor' | 'plant' | 'wc';
  renderPreview: () => React.ReactNode;
}

// 3D Isometric Mini SVG Graphics
const BedQueenSVG = () => (
  <svg className="w-16 h-11" viewBox="0 0 100 70" fill="none">
    <ellipse cx="50" cy="56" rx="38" ry="8" fill="rgba(0,0,0,0.06)" />
    <path d="M16 34 L50 48 L84 34 L50 20 Z" fill="#8C6239" />
    <path d="M16 34 L50 48 L50 54 L16 40 Z" fill="#603813" />
    <path d="M50 48 L84 34 L84 40 L50 54 Z" fill="#7B4922" />
    <path d="M16 34 L50 20 L50 8 L16 22 Z" fill="#A07248" />
    <path d="M22 34 L50 45 L78 34 L50 22 Z" fill="#F8FAFC" />
    <path d="M38 40 L50 45 L62 40 L50 35 Z" fill="#4D7C0F" />
    <rect x="26" y="18" width="14" height="8" rx="2" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.5" />
    <rect x="42" y="12" width="14" height="8" rx="2" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.5" />
  </svg>
);

const BedKingSVG = () => (
  <svg className="w-16 h-11" viewBox="0 0 100 70" fill="none">
    <ellipse cx="50" cy="56" rx="40" ry="8" fill="rgba(0,0,0,0.06)" />
    <path d="M12 34 L50 50 L88 34 L50 18 Z" fill="#78350F" />
    <path d="M12 34 L50 50 L50 56 L12 40 Z" fill="#451A03" />
    <path d="M50 50 L88 34 L88 40 L50 56 Z" fill="#5E2306" />
    <path d="M12 34 L50 18 L50 4 L12 20 Z" fill="#92400E" />
    <path d="M18 34 L50 47 L82 34 L50 21 Z" fill="#FFFFFF" />
    <rect x="24" y="16" width="15" height="8" rx="2" fill="#F1F5F9" />
    <rect x="42" y="10" width="15" height="8" rx="2" fill="#F1F5F9" />
  </svg>
);

const BedSingleSVG = () => (
  <svg className="w-16 h-11" viewBox="0 0 100 70" fill="none">
    <ellipse cx="50" cy="56" rx="32" ry="7" fill="rgba(0,0,0,0.06)" />
    <path d="M22 34 L50 46 L78 34 L50 22 Z" fill="#A16207" />
    <path d="M22 34 L50 46 L50 52 L22 40 Z" fill="#713F12" />
    <path d="M50 46 L78 34 L78 40 L50 52 Z" fill="#854D0E" />
    <path d="M22 34 L50 22 L50 10 L22 22 Z" fill="#CA8A04" />
    <path d="M26 34 L50 44 L74 34 L50 24 Z" fill="#F8FAFC" />
    <rect x="32" y="17" width="14" height="7" rx="2" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.5" />
  </svg>
);

const DeskStudySVG = () => (
  <svg className="w-16 h-11" viewBox="0 0 100 70" fill="none">
    <ellipse cx="50" cy="56" rx="30" ry="6" fill="rgba(0,0,0,0.06)" />
    <path d="M26 36 L26 58" stroke="#451A03" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M46 44 L46 64" stroke="#451A03" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M54 36 L54 56" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />
    <path d="M74 42 L74 62" stroke="#451A03" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M22 32 L52 44 L78 32 L48 20 Z" fill="#B45309" />
    <path d="M22 32 L52 44 L52 48 L22 36 Z" fill="#78350F" />
    <path d="M52 44 L78 32 L78 36 L52 48 Z" fill="#92400E" />
    <path d="M46 32 L56 36 L60 33 L50 29 Z" fill="#475569" />
  </svg>
);

const DeskWorkSVG = () => (
  <svg className="w-16 h-11" viewBox="0 0 100 70" fill="none">
    <ellipse cx="50" cy="56" rx="32" ry="6" fill="rgba(0,0,0,0.06)" />
    <path d="M20 34 L20 58 L24 59 L24 35 Z" fill="#334155" />
    <path d="M48 45 L48 63 L52 64 L52 46 Z" fill="#1E293B" />
    <path d="M76 34 L76 58 L80 59 L80 35 Z" fill="#334155" />
    <path d="M16 32 L50 46 L84 32 L50 18 Z" fill="#78350F" />
    <path d="M16 32 L50 46 L50 50 L16 36 Z" fill="#451A03" />
    <path d="M50 46 L84 32 L84 36 L50 50 Z" fill="#5E2306" />
    <path d="M44 33 L56 38 L62 34 L50 29 Z" fill="#1E293B" />
  </svg>
);

const WardrobeSVG = () => (
  <svg className="w-16 h-11" viewBox="0 0 100 70" fill="none">
    <ellipse cx="50" cy="60" rx="30" ry="5" fill="rgba(0,0,0,0.06)" />
    <path d="M24 16 L50 26 L76 16 L50 6 Z" fill="#A16207" />
    <path d="M24 16 L50 26 L50 58 L24 48 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
    <path d="M50 26 L76 16 L76 48 L50 58 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
    <line x1="37" y1="21" x2="37" y2="53" stroke="#E2E8F0" strokeWidth="1" />
    <line x1="63" y1="21" x2="63" y2="53" stroke="#E2E8F0" strokeWidth="1" />
  </svg>
);

const LampSVG = () => (
  <svg className="w-16 h-11" viewBox="0 0 100 70" fill="none">
    <ellipse cx="50" cy="56" rx="16" ry="4" fill="rgba(0,0,0,0.06)" />
    <path d="M38 38 L50 44 L62 38 L50 32 Z" fill="#92400E" />
    <path d="M38 38 L50 44 L50 54 L38 48 Z" fill="#78350F" />
    <path d="M50 44 L62 38 L62 48 L50 54 Z" fill="#451A03" />
    <circle cx="50" cy="26" r="9" fill="#FEF08A" stroke="#FDE047" strokeWidth="1" />
  </svg>
);

const DoorSwingSVG = () => (
  <svg className="w-16 h-11" viewBox="0 0 100 70" fill="none">
    <ellipse cx="50" cy="62" rx="36" ry="5" fill="rgba(0,0,0,0.06)" />
    {/* Door frame top */}
    <path d="M22 14 L50 22 L78 14 L50 6 Z" fill="#78350F" />
    {/* Door panel left face */}
    <path d="M22 14 L50 22 L50 58 L22 50 Z" fill="#A16207" />
    {/* Door panel right face */}
    <path d="M50 22 L78 14 L78 50 L50 58 Z" fill="#92400E" />
    {/* Door decorative molding */}
    <line x1="30" y1="22" x2="30" y2="50" stroke="#78350F" strokeWidth="1" />
    <line x1="42" y1="22" x2="42" y2="50" stroke="#78350F" strokeWidth="1" />
    {/* Handle */}
    <circle cx="40" cy="38" r="2" fill="#FDE047" />
    {/* Arc showing swing direction */}
    <path d="M22 50 Q14 36 22 22" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 2" fill="none" />
  </svg>
);

const DoorSlideSVG = () => (
  <svg className="w-16 h-11" viewBox="0 0 100 70" fill="none">
    <ellipse cx="50" cy="62" rx="36" ry="5" fill="rgba(0,0,0,0.06)" />
    {/* Rail top */}
    <path d="M18 10 L50 18 L82 10 L50 2 Z" fill="#475569" />
    {/* Panel 1 */}
    <path d="M18 10 L46 18 L46 58 L18 50 Z" fill="#BFDBFE" stroke="#93C5FD" strokeWidth="0.5" />
    {/* Panel 2 */}
    <path d="M46 18 L78 10 L78 50 L46 58 Z" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="0.5" />
    {/* Handles */}
    <rect x="42" y="30" width="2" height="10" rx="1" fill="#64748B" />
    <rect x="54" y="30" width="2" height="10" rx="1" fill="#64748B" />
    {/* Arrow showing slide */}
    <path d="M32 54 L20 54" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 1" fill="none" />
    <path d="M22 52 L18 54 L22 56" fill="#94A3B8" />
  </svg>
);

const WindowSVG = () => (
  <svg className="w-16 h-11" viewBox="0 0 100 70" fill="none">
    <ellipse cx="50" cy="62" rx="34" ry="5" fill="rgba(0,0,0,0.06)" />
    {/* Frame top */}
    <path d="M20 12 L50 20 L80 12 L50 4 Z" fill="#475569" />
    {/* Frame left */}
    <path d="M20 12 L50 20 L50 56 L20 48 Z" fill="#94A3B8" />
    {/* Frame right */}
    <path d="M50 20 L80 12 L80 48 L50 56 Z" fill="#64748B" />
    {/* Glass left */}
    <path d="M24 14 L48 21 L48 52 L24 45 Z" fill="rgba(186,230,253,0.55)" stroke="#7DD3FC" strokeWidth="0.5" />
    {/* Glass right */}
    <path d="M52 21 L76 14 L76 45 L52 52 Z" fill="rgba(186,230,253,0.40)" stroke="#7DD3FC" strokeWidth="0.5" />
    {/* Center divider */}
    <line x1="50" y1="20" x2="50" y2="56" stroke="#475569" strokeWidth="1.5" />
    {/* Horizontal bar */}
    <line x1="20" y1="36" x2="50" y2="38" stroke="#475569" strokeWidth="1.5" />
    <line x1="50" y1="38" x2="80" y2="36" stroke="#475569" strokeWidth="1.5" />
  </svg>
);

const RugSVG = () => (
  <svg className="w-16 h-11" viewBox="0 0 100 70" fill="none">
    <path d="M18 36 L50 52 L82 36 L50 20 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
    <path d="M22 36 L50 50 L78 36 L50 22 Z" fill="#F8FAFC" />
  </svg>
);

const PlantSVG = () => (
  <svg className="w-16 h-11" viewBox="0 0 100 70" fill="none">
    <ellipse cx="50" cy="58" rx="16" ry="4" fill="rgba(0,0,0,0.06)" />
    <path d="M42 44 L50 48 L58 44 L50 40 Z" fill="#F8FAFC" />
    <path d="M42 44 L50 48 L50 56 L42 52 Z" fill="#E2E8F0" />
    <path d="M50 48 L58 44 L58 52 L50 56 Z" fill="#CBD5E1" />
    <path d="M50 42 Q40 28 36 18 Q48 22 50 42" fill="#15803D" />
    <path d="M50 42 Q60 28 64 18 Q52 22 50 42" fill="#16A34A" />
    <path d="M50 42 Q48 16 50 8 Q54 20 50 42" fill="#22C55E" />
  </svg>
);

const ToiletSVG = () => (
  <svg className="w-16 h-11" viewBox="0 0 100 70" fill="none">
    <ellipse cx="50" cy="56" rx="22" ry="6" fill="rgba(0,0,0,0.06)" />
    <path d="M38 34 L50 42 L62 34 L50 28 Z" fill="#F8FAFC" />
    <path d="M38 34 L50 42 L50 52 L38 44 Z" fill="#E2E8F0" />
    <path d="M50 42 L62 34 L62 44 L50 52 Z" fill="#CBD5E1" />
    <ellipse cx="50" cy="35" rx="13" ry="8" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.8" />
    <path d="M40 24 L60 24 L60 12 L40 12 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
    <circle cx="50" cy="14" r="2" fill="#0284C7" />
  </svg>
);

const WcSuiteSVG = () => (
  <svg className="w-16 h-11" viewBox="0 0 100 70" fill="none">
    <ellipse cx="50" cy="58" rx="34" ry="7" fill="rgba(0,0,0,0.06)" />
    <path d="M22 42 L50 54 L78 42 L50 30 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="0.8" />
    <path d="M22 42 L22 16 L50 28 L50 54 Z" fill="rgba(224, 242, 254, 0.45)" stroke="#334155" strokeWidth="1" />
    <path d="M50 54 L50 28 L78 16 L78 42 Z" fill="rgba(224, 242, 254, 0.3)" stroke="#334155" strokeWidth="1" />
    <rect x="30" y="32" width="9" height="12" rx="2" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.5" />
    <rect x="58" y="32" width="11" height="14" rx="1" fill="#475569" />
  </svg>
);

export const LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: 'lib_bed_queen',
    type: 'bed',
    name: 'Giường đôi 1m6',
    subtext: '160 × 200 cm',
    dimensions: { width: 1.6, length: 2.0, height: 0.8 },
    category: 'bed',
    renderPreview: () => <BedQueenSVG />,
  },
  {
    id: 'lib_bed_king',
    type: 'bed',
    name: 'Giường King 1m8',
    subtext: '180 × 200 cm',
    dimensions: { width: 1.8, length: 2.0, height: 0.85 },
    category: 'bed',
    renderPreview: () => <BedKingSVG />,
  },
  {
    id: 'lib_bed_single',
    type: 'bed',
    name: 'Giường đơn 1m2',
    subtext: '120 × 200 cm',
    dimensions: { width: 1.2, length: 2.0, height: 0.75 },
    category: 'bed',
    renderPreview: () => <BedSingleSVG />,
  },
  {
    id: 'lib_desk_study',
    type: 'desk',
    name: 'Bàn học',
    subtext: '120 × 60 cm',
    dimensions: { width: 1.2, length: 0.6, height: 0.75 },
    category: 'desk',
    renderPreview: () => <DeskStudySVG />,
  },
  {
    id: 'lib_desk_work',
    type: 'desk',
    name: 'Bàn làm việc 1m4',
    subtext: '140 × 70 cm',
    dimensions: { width: 1.4, length: 0.7, height: 0.75 },
    category: 'desk',
    renderPreview: () => <DeskWorkSVG />,
  },
  {
    id: 'lib_wardrobe',
    type: 'wardrobe',
    name: 'Tủ quần áo',
    subtext: '180 × 60 cm',
    dimensions: { width: 1.8, length: 0.6, height: 2.2 },
    category: 'storage',
    renderPreview: () => <WardrobeSVG />,
  },
  {
    id: 'lib_table_lamp',
    type: 'lamp',
    name: 'Đèn ngủ',
    subtext: 'Ø 30 cm',
    dimensions: { width: 0.3, length: 0.3, height: 0.45 },
    category: 'lighting',
    renderPreview: () => <LampSVG />,
  },
  {
    id: 'lib_rug_nordic',
    type: 'rug',
    name: 'Thảm',
    subtext: '160 × 230 cm',
    dimensions: { width: 2.3, length: 1.6, height: 0.02 },
    category: 'rug',
    renderPreview: () => <RugSVG />,
  },
  {
    id: 'lib_plant_monstera',
    type: 'plant',
    name: 'Cây xanh',
    subtext: 'Cao 100 cm',
    dimensions: { width: 0.6, length: 0.6, height: 1.0 },
    category: 'plant',
    renderPreview: () => <PlantSVG />,
  },
  {
    id: 'lib_wc_toilet',
    type: 'wc',
    name: 'Bồn cầu thông minh',
    subtext: '50 × 70 cm',
    dimensions: { width: 0.5, length: 0.7, height: 0.75 },
    category: 'wc',
    renderPreview: () => <ToiletSVG />,
  },
  {
    id: 'lib_wc_suite',
    type: 'wc',
    name: 'Phòng WC khép kín',
    subtext: '140 × 160 cm',
    dimensions: { width: 1.4, length: 1.6, height: 2.1 },
    category: 'wc',
    renderPreview: () => <WcSuiteSVG />,
  },
  {
    id: 'lib_door_swing',
    type: 'door',
    name: 'Cửa mở xoay',
    subtext: '90 × 210 cm',
    dimensions: { width: 0.9, length: 0.1, height: 2.1 },
    category: 'door',
    renderPreview: () => <DoorSwingSVG />,
  },
  {
    id: 'lib_door_double',
    type: 'door',
    name: 'Cửa 2 cánh',
    subtext: '160 × 210 cm',
    dimensions: { width: 1.6, length: 0.1, height: 2.1 },
    category: 'door',
    renderPreview: () => <DoorSwingSVG />,
  },
  {
    id: 'lib_door_slide',
    type: 'door',
    name: 'Cửa kéo lùa',
    subtext: '120 × 210 cm',
    dimensions: { width: 1.2, length: 0.1, height: 2.1 },
    category: 'door',
    renderPreview: () => <DoorSlideSVG />,
  },
  {
    id: 'lib_window_single',
    type: 'window',
    name: 'Cửa sổ 2 cánh',
    subtext: '120 × 120 cm',
    dimensions: { width: 1.2, length: 0.1, height: 1.2 },
    category: 'door',
    renderPreview: () => <WindowSVG />,
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'bed', label: 'Giường' },
  { id: 'desk', label: 'Bàn' },
  { id: 'chair', label: 'Ghế' },
  { id: 'storage', label: 'Tủ' },
  { id: 'wc', label: 'Vệ sinh' },
  { id: 'lighting', label: 'Đèn' },
  { id: 'door', label: 'Cửa' },
  { id: 'rug', label: 'Thảm' },
  { id: 'decor', label: 'Decor' },
  { id: 'plant', label: 'Cây xanh' },
];

interface ObjectLibraryDockProps {
  onAddObject: (item: {
    type: RoomObjectType;
    name: string;
    dimensions: { width: number; length: number; height: number };
  }) => void;
}

export const ObjectLibraryDock: React.FC<ObjectLibraryDockProps> = ({ onAddObject }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredItems = LIBRARY_ITEMS.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 160, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-xl border border-stone-200/80 px-4 py-2 flex flex-col gap-1.5 select-none pointer-events-auto">
      {/* 1. Header Row: Categories + Search & Filter */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-xs font-bold text-stone-900 tracking-tight shrink-0">
            Thư viện nội thất
          </h3>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-0.5 text-xs rounded-full transition-all whitespace-nowrap font-medium ${
                  activeCategory === cat.id
                    ? 'bg-[#005C4A] text-white shadow-2xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filter Right Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-28 h-6 bg-stone-50 border border-stone-200 rounded-full pl-6 pr-2 text-[11px] text-stone-700 placeholder-stone-400 focus:outline-hidden focus:border-stone-400"
            />
            <svg
              className="w-3 h-3 text-stone-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <button
            className="w-6 h-6 rounded-md border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-xs text-stone-600 shadow-2xs"
            title="Lọc nâng cao"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. Compact Furniture Cards Row */}
      <div className="relative flex items-center">
        <div
          ref={scrollContainerRef}
          className="flex-1 flex items-center gap-2 overflow-x-auto py-0.5 px-0.5 scrollbar-none"
        >
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onAddObject(item)}
              className="w-[96px] shrink-0 p-1.5 rounded-xl bg-[#F9FAFB] border border-stone-200/70 hover:border-[#00705a] hover:bg-white hover:shadow-xs active:scale-95 transition-all cursor-pointer group flex flex-col items-center text-center"
            >
              {/* 3D Isometric Preview Area */}
              <div className="w-full h-11 rounded-lg flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                {item.renderPreview()}
              </div>

              {/* Title & Dimension */}
              <p className="text-[10px] font-bold text-stone-800 truncate w-full group-hover:text-[#005C4A] transition-colors leading-tight mt-0.5">
                {item.name}
              </p>
              <p className="text-[9px] text-stone-400 font-mono leading-tight">
                {item.subtext}
              </p>
            </div>
          ))}
        </div>

        {/* Scroll Next Chevron */}
        <button
          onClick={handleScrollRight}
          className="ml-1.5 w-6 h-6 rounded-full border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-xs text-stone-600 shadow-2xs active:scale-90 transition-all shrink-0"
          title="Xem tiếp"
        >
          ›
        </button>
      </div>
    </div>
  );
};
