import React, { useState } from 'react';
import { UserFengShuiProfile } from '../types/fengshui';

interface LeftSidebarProps {
  userProfile: UserFengShuiProfile;
  onEditProfile: () => void;
  roomDirection?: string;
  onClose?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  userProfile,
  onEditProfile,
  onClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Auspicious directions based on userProfile
  const auspiciousList = [
    { name: 'Tây Bắc', desc: 'Sinh khí' },
    { name: 'Tây Nam', desc: 'Thiên y' },
    { name: 'Đông Bắc', desc: 'Diên niên' },
    { name: 'Tây', desc: 'Phục vị' },
  ];

  // Inauspicious directions based on userProfile
  const inauspiciousList = [
    { name: 'Đông', desc: 'Tuyệt mệnh' },
    { name: 'Nam', desc: 'Ngũ quỷ' },
    { name: 'Đông Nam', desc: 'Lục sát' },
    { name: 'Bắc', desc: 'Họa hại' },
  ];

  return (
    <aside className="w-[280px] bg-[#16191B]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-800/80 p-3.5 flex flex-col gap-2.5 select-none text-white pointer-events-auto transition-all duration-200">
      {/* 1. Header: Hồ sơ gia chủ + Chevron Up */}
      <div className="flex items-center justify-between pb-0.5">
        <h2 className="text-sm font-bold text-white tracking-tight">
          Hồ sơ gia chủ
        </h2>
        <button
          onClick={() => {
            if (onClose) onClose();
            else setIsCollapsed(!isCollapsed);
          }}
          className="w-6 h-6 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center text-xs transition-colors"
          title="Thu gọn"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* 2. User Profile Summary Card */}
          <div className="p-2.5 rounded-xl bg-[#202428] border border-stone-700/60 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#005C4A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                NT
              </div>
              <div className="min-w-0 leading-tight">
                <p className="text-xs font-bold text-white truncate">
                  {userProfile.birthYear} - {userProfile.gender === 'female' ? 'Nữ' : 'Nam'}
                </p>
                <p className="text-[11px] text-stone-400 font-medium truncate mt-0.5">
                  {userProfile.group}
                </p>
              </div>
            </div>

            <button
              onClick={onEditProfile}
              className="px-2.5 py-1 rounded-full border border-stone-600 bg-[#2A2F34] hover:bg-[#343A40] text-[11px] font-semibold text-stone-200 shadow-2xs active:scale-95 transition-all flex items-center gap-1 shrink-0"
            >
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>Chỉnh sửa</span>
            </button>
          </div>

          {/* 3. Detailed Specifications List */}
          <div className="flex flex-col divide-y divide-stone-800/80 text-xs">
            {/* Row 1: Năm sinh (Âm lịch) */}
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2 text-stone-400">
                <svg className="w-3.5 h-3.5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="text-[11px]">Năm sinh (Âm lịch)</span>
              </div>
              <span className="font-bold text-white text-xs">{userProfile.birthYear}</span>
            </div>

            {/* Row 2: Giới tính */}
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2 text-stone-400">
                <svg className="w-3.5 h-3.5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="text-[11px]">Giới tính</span>
              </div>
              <span className="font-bold text-white text-xs">
                {userProfile.gender === 'female' ? 'Nữ' : 'Nam'}
              </span>
            </div>

            {/* Row 3: Ngũ hành */}
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2 text-stone-400">
                <svg className="w-3.5 h-3.5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
                <span className="text-[11px]">Ngũ hành</span>
              </div>
              <span className="font-bold text-white text-xs">Thổ</span>
            </div>

            {/* Row 4: Cung phi */}
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2 text-stone-400">
                <svg className="w-3.5 h-3.5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
                <span className="text-[11px]">Cung phi</span>
              </div>
              <span className="font-bold text-white text-xs">{userProfile.guaName}</span>
            </div>

            {/* Row 5: Nhóm mệnh */}
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2 text-stone-400">
                <svg className="w-3.5 h-3.5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span className="text-[11px]">Nhóm mệnh</span>
              </div>
              <span className="font-bold text-white text-xs">{userProfile.group}</span>
            </div>
          </div>

          {/* 4. Section: Hướng tốt */}
          <div className="pt-0.5">
            <h3 className="text-xs font-bold text-stone-200 mb-1.5">Hướng tốt</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {auspiciousList.map((item) => (
                <div
                  key={item.name}
                  className="p-2 rounded-xl bg-[#0E281C]/90 border border-emerald-800/40 flex items-center gap-2 transition-all hover:border-emerald-500"
                >
                  <div className="w-5 h-5 rounded-full bg-[#00705a] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="text-[11px] font-bold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-emerald-400 font-medium truncate">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Section: Hướng cần tránh */}
          <div className="pt-0.5">
            <h3 className="text-xs font-bold text-stone-200 mb-1.5">Hướng cần tránh</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {inauspiciousList.map((item) => (
                <div
                  key={item.name}
                  className="p-2 rounded-xl bg-[#2A1417]/90 border border-rose-900/40 flex items-center gap-2 transition-all hover:border-rose-500"
                >
                  <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                    <svg className="w-2 h-2" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 22 12 12 22 2 12" />
                    </svg>
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="text-[11px] font-bold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-rose-300 font-medium truncate">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  );
};
