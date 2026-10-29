import React, { useState } from 'react';
import { Gender, UserFengShuiProfile } from '../types/fengshui';

interface LeftProfilePanelProps {
  userProfile: UserFengShuiProfile;
  onChangeBirthYear: (year: number) => void;
  onChangeGender: (gender: Gender) => void;
  onToggleCompassOverlay: () => void;
  isCompassVisible: boolean;
  onOpenDetailedReport: () => void;
}

export const LeftProfilePanel: React.FC<LeftProfilePanelProps> = ({
  userProfile,
  onChangeBirthYear,
  onChangeGender,
  onToggleCompassOverlay,
  isCompassVisible,
  onOpenDetailedReport,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="w-64 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 shadow-xl p-3.5 flex flex-col gap-3 select-none text-stone-800 transition-all">
      {/* 1. Header with Collapse Chevron */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base text-stone-700">👤</span>
          <h2 className="text-xs font-bold text-stone-900 tracking-tight">
            Thông tin gia chủ
          </h2>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors text-xs"
          title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          {isCollapsed ? '⌄' : '⌃'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-3 pt-1">
          {/* 2. Năm sinh (Dương lịch) */}
          <div>
            <label className="block text-[11px] text-stone-500 mb-1">
              Năm sinh (Dương lịch)
            </label>
            <input
              type="number"
              min={1930}
              max={2035}
              value={userProfile.birthYear}
              onChange={(e) => onChangeBirthYear(parseInt(e.target.value, 10) || 2004)}
              className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:border-stone-400"
            />
          </div>

          {/* 3. Giới tính (Segmented Button Nam / Nữ) */}
          <div>
            <label className="block text-[11px] text-stone-500 mb-1">
              Giới tính
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl">
              <button
                onClick={() => onChangeGender('male')}
                className={`py-1 rounded-lg text-xs font-semibold transition-all ${
                  userProfile.gender === 'male'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                Nam
              </button>
              <button
                onClick={() => onChangeGender('female')}
                className={`py-1 rounded-lg text-xs font-semibold transition-all ${
                  userProfile.gender === 'female'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                Nữ
              </button>
            </div>
          </div>

          {/* 4. Quái mệnh Card */}
          <div className="p-2.5 rounded-xl border border-amber-200/70 bg-amber-50/40 flex items-center gap-2.5">
            <span className="text-xl text-amber-700">☀️</span>
            <div>
              <p className="text-[10px] text-stone-400 font-medium">Quái mệnh</p>
              <p className="text-xs font-bold text-stone-900">
                {userProfile.guaName} · {userProfile.element}
              </p>
            </div>
          </div>

          {/* 5. Hướng tốt & Hướng xấu */}
          <div className="space-y-2 pt-1 border-t border-stone-100 text-[11px]">
            <div>
              <span className="font-semibold text-stone-700 block mb-1">
                Hướng tốt
              </span>
              <div className="grid grid-cols-2 gap-y-1 text-stone-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Sinh Khí</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Thiên Y</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Diên Niên</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Phục Vị</span>
                </div>
              </div>
            </div>

            <div className="pt-1.5">
              <span className="font-semibold text-stone-700 block mb-1">
                Hướng xấu
              </span>
              <div className="grid grid-cols-2 gap-y-1 text-stone-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Tuyệt Mệnh</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Ngũ Quỷ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Lục Sát</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Họa Hại</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6. Action Buttons */}
          <div className="pt-2 border-t border-stone-100 space-y-1.5">
            <button
              onClick={onToggleCompassOverlay}
              className={`w-full py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                isCompassVisible
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
              }`}
            >
              <span>👁</span>
              <span>Xem Bát Trạch</span>
            </button>
            <button
              onClick={onOpenDetailedReport}
              className="w-full py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs"
            >
              <span>📊</span>
              <span>Chi tiết phân tích</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
