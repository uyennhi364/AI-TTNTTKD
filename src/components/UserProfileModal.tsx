import React from 'react';
import {
  CompassDirection,
  Gender,
  RoomConfig,
  UserFengShuiProfile,
} from '../types/fengshui';
import { DIRECTION_NAMES_VI } from '../engine/batTrach';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserFengShuiProfile;
  onChangeBirthYear: (year: number) => void;
  onChangeGender: (gender: Gender) => void;
  roomConfig: RoomConfig;
  onChangeRoomConfig: (config: Partial<RoomConfig>) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onChangeBirthYear,
  onChangeGender,
  roomConfig,
  onChangeRoomConfig,
}) => {
  if (!isOpen) return null;

  const directions: CompassDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <div>
              <h2 className="text-sm font-bold text-stone-900">
                Hồ Sơ Bản Mệnh & Phòng Ngủ
              </h2>
              <p className="text-[11px] text-stone-500">
                Tính toán cung quái Bát Trạch & kích thước thực tế
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs text-stone-800">
          {/* 1. Birth Year & Gender */}
          <div className="space-y-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200/80">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Năm sinh gia chủ (Dương lịch)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1930"
                  max="2035"
                  value={userProfile.birthYear}
                  onChange={(e) => onChangeBirthYear(parseInt(e.target.value, 10) || 2000)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <button
                  onClick={() => onChangeBirthYear(2004)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                    userProfile.birthYear === 2004
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  2004
                </button>
                <button
                  onClick={() => onChangeBirthYear(1996)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                    userProfile.birthYear === 1996
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  1996
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Giới tính
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['male', 'female'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => onChangeGender(g)}
                    className={`py-1.5 rounded-lg border font-semibold text-xs transition-all ${
                      userProfile.gender === g
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {g === 'male' ? 'Nam (Dương)' : 'Nữ (Âm)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Calculated Bat Trach Result Card */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 space-y-2">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Kết Quả Bát Trạch Minh Cảnh
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-600">Quái mệnh:</span>
              <span className="font-bold text-emerald-900 text-sm">
                Quẻ {userProfile.guaName} ({userProfile.element}) - Số {userProfile.guaNumber}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-600">Nhóm mệnh:</span>
              <span className="font-bold text-emerald-900">
                {userProfile.group}
              </span>
            </div>

            <div className="pt-2 border-t border-emerald-200/60 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="font-bold text-emerald-800 block mb-0.5">
                  4 Hướng Cát (Tốt):
                </span>
                <span className="text-stone-700">
                  {userProfile.auspiciousDirections.map((d) => DIRECTION_NAMES_VI[d]).join(', ')}
                </span>
              </div>
              <div>
                <span className="font-bold text-red-800 block mb-0.5">
                  4 Hướng Hung (Xấu):
                </span>
                <span className="text-stone-700">
                  {userProfile.inauspiciousDirections.map((d) => DIRECTION_NAMES_VI[d]).join(', ')}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Room Dimensions & Facing Direction */}
          <div className="space-y-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200/80">
            <span className="text-[11px] font-bold text-stone-700 block">
              KÍCH THƯỚC & HƯỚNG PHÒNG
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-600 block mb-1">
                  Chiều rộng phòng (X, m)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="3.0"
                  max="12.0"
                  value={roomConfig.width}
                  onChange={(e) =>
                    onChangeRoomConfig({ width: parseFloat(e.target.value) || 5.0 })
                  }
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-stone-600 block mb-1">
                  Chiều dài phòng (Z, m)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="3.0"
                  max="12.0"
                  value={roomConfig.length}
                  onChange={(e) =>
                    onChangeRoomConfig({ length: parseFloat(e.target.value) || 4.0 })
                  }
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-stone-600 block mb-1">
                Hướng mặt phòng ngủ (Tọa hung hướng cát)
              </label>
              <select
                value={roomConfig.direction}
                onChange={(e) =>
                  onChangeRoomConfig({ direction: e.target.value as CompassDirection })
                }
                className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold bg-white"
              >
                {directions.map((d) => (
                  <option key={d} value={d}>
                    {DIRECTION_NAMES_VI[d]} ({d}) - Cung{' '}
                    {userProfile.directionDetails[d]?.name || ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Lưu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
