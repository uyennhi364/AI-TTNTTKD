import React from 'react';
import {
  CompassDirection,
  Gender,
  RoomConfig,
  UserFengShuiProfile,
} from '../types/fengshui';
import { DIRECTION_NAMES_VI } from '../engine/batTrach';

interface UserProfilePanelProps {
  userProfile: UserFengShuiProfile;
  onChangeBirthYear: (year: number) => void;
  onChangeGender: (gender: Gender) => void;
  roomConfig: RoomConfig;
  onChangeRoomConfig: (config: Partial<RoomConfig>) => void;
  onApplyPreset: (presetKey: 'master' | 'small' | 'studio') => void;
  activePreset: string;
}

export const UserProfilePanel: React.FC<UserProfilePanelProps> = ({
  userProfile,
  onChangeBirthYear,
  onChangeGender,
  roomConfig,
  onChangeRoomConfig,
  onApplyPreset,
  activePreset,
}) => {
  const directions: CompassDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  return (
    <div className="w-80 h-full bg-white border-r border-stone-200 flex flex-col overflow-y-auto p-4 text-stone-800 text-sm select-none shadow-sm">
      {/* 1. Header & Title */}
      <div className="pb-3 border-b border-stone-200">
        <h2 className="text-base font-bold text-stone-900 tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          Thông Tin Gia Chủ & Phòng
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Tính toán Quái mệnh Bát Trạch & kích thước không gian
        </p>
      </div>

      {/* 2. Birth Year & Gender */}
      <div className="py-3 border-b border-stone-200 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Năm sinh gia chủ (Dương lịch)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1930"
              max="2035"
              value={userProfile.birthYear}
              onChange={(e) => onChangeBirthYear(parseInt(e.target.value, 10) || 2000)}
              className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => onChangeBirthYear(2004)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  userProfile.birthYear === 2004
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                2004
              </button>
              <button
                onClick={() => onChangeBirthYear(1996)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  userProfile.birthYear === 1996
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                1996
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Giới tính
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onChangeGender('male')}
              className={`py-1.5 px-3 rounded-lg font-medium text-xs border transition-all ${
                userProfile.gender === 'male'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              Nam
            </button>
            <button
              onClick={() => onChangeGender('female')}
              className={`py-1.5 px-3 rounded-lg font-medium text-xs border transition-all ${
                userProfile.gender === 'female'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              Nữ
            </button>
          </div>
        </div>

        {/* Calculated Kua Card */}
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-stone-500 font-medium">Quái mệnh</div>
            <div className="font-bold text-stone-900 text-sm">
              {userProfile.guaName} ({userProfile.element})
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-stone-500 font-medium">Phân nhóm</div>
            <div className="font-semibold text-emerald-700 text-xs">
              {userProfile.group}
            </div>
          </div>
          <div className="pt-2 border-t border-stone-200/60">
            <div className="text-[11px] font-semibold text-stone-600 mb-1">
              4 Hướng Cát (Nên đặt giường/bàn):
            </div>
            <div className="flex flex-wrap gap-1">
              {userProfile.auspiciousDirections.map((d) => (
                <span
                  key={d}
                  className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px] font-medium"
                  title={userProfile.directionDetails[d].meaning}
                >
                  {DIRECTION_NAMES_VI[d]} · {userProfile.directionDetails[d].name}
                </span>
              ))}
            </div>
          </div>
          <div className="pt-1">
            <div className="text-[11px] font-semibold text-stone-600 mb-1">
              4 Hướng Hung (Cần tránh):
            </div>
            <div className="flex flex-wrap gap-1">
              {userProfile.inauspiciousDirections.map((d) => (
                <span
                  key={d}
                  className="px-2 py-0.5 bg-red-50 text-red-800 border border-red-200 rounded text-[11px] font-medium"
                  title={userProfile.directionDetails[d].meaning}
                >
                  {DIRECTION_NAMES_VI[d]} · {userProfile.directionDetails[d].name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Room Presets */}
      <div className="py-3 border-b border-stone-200 space-y-2">
        <label className="block text-xs font-semibold text-stone-700">
          Mẫu phòng có sẵn
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onApplyPreset('master')}
            className={`py-2 px-1 text-center rounded-lg border text-xs transition-colors ${
              activePreset === 'master'
                ? 'bg-stone-900 text-white border-stone-900 font-medium'
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
            }`}
          >
            Phòng Master
            <span className="block text-[10px] opacity-75">5m × 4m</span>
          </button>
          <button
            onClick={() => onApplyPreset('small')}
            className={`py-2 px-1 text-center rounded-lg border text-xs transition-colors ${
              activePreset === 'small'
                ? 'bg-stone-900 text-white border-stone-900 font-medium'
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
            }`}
          >
            Phòng Nhỏ
            <span className="block text-[10px] opacity-75">4m × 3.5m</span>
          </button>
          <button
            onClick={() => onApplyPreset('studio')}
            className={`py-2 px-1 text-center rounded-lg border text-xs transition-colors ${
              activePreset === 'studio'
                ? 'bg-stone-900 text-white border-stone-900 font-medium'
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
            }`}
          >
            Căn Studio
            <span className="block text-[10px] opacity-75">5m × 3.2m</span>
          </button>
        </div>
      </div>

      {/* 4. Custom Room Dimensions & Orientation */}
      <div className="py-3 space-y-3">
        <div className="text-xs font-semibold text-stone-700">
          Tùy chỉnh thông số căn phòng
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] text-stone-500">Dài (m)</label>
            <input
              type="number"
              step="0.5"
              min="3"
              max="10"
              value={roomConfig.length}
              onChange={(e) =>
                onChangeRoomConfig({ length: parseFloat(e.target.value) || 5 })
              }
              className="w-full px-2 py-1 border border-stone-300 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-stone-500">Rộng (m)</label>
            <input
              type="number"
              step="0.5"
              min="2.5"
              max="8"
              value={roomConfig.width}
              onChange={(e) =>
                onChangeRoomConfig({ width: parseFloat(e.target.value) || 4 })
              }
              className="w-full px-2 py-1 border border-stone-300 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-stone-500">Cao (m)</label>
            <input
              type="number"
              step="0.1"
              min="2.4"
              max="4.5"
              value={roomConfig.height}
              onChange={(e) =>
                onChangeRoomConfig({ height: parseFloat(e.target.value) || 2.8 })
              }
              className="w-full px-2 py-1 border border-stone-300 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-stone-500 mb-1">
            Hướng cửa phòng ngủ
          </label>
          <select
            value={roomConfig.direction}
            onChange={(e) =>
              onChangeRoomConfig({ direction: e.target.value as CompassDirection })
            }
            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            {directions.map((d) => (
              <option key={d} value={d}>
                {DIRECTION_NAMES_VI[d]} ({d}) -{' '}
                {userProfile.directionDetails[d]?.name} (
                {userProfile.directionDetails[d]?.isGood ? 'Cát' : 'Hung'})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
