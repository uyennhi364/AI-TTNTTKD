import React from 'react';
import {
  CompassDirection,
  FengShuiItemEvaluation,
  RoomObject,
} from '../types/fengshui';
import { DIRECTION_NAMES_VI } from '../engine/batTrach';

interface ObjectPropertiesPanelProps {
  selectedObject: RoomObject | null;
  evaluationItem: FengShuiItemEvaluation | null;
  onUpdatePosition: (id: string, x: number, z: number) => void;
  onRotateObject: (id: string, angleDeltaRad: number) => void;
  onDeleteObject: (id: string) => void;
  onDuplicateObject: (id: string) => void;
  onAskAiForBetterPlacement?: (objectName: string) => void;
  onClose?: () => void;
}

export const ObjectPropertiesPanel: React.FC<ObjectPropertiesPanelProps> = ({
  selectedObject,
  evaluationItem,
  onUpdatePosition,
  onRotateObject,
  onDeleteObject,
  onDuplicateObject,
  onAskAiForBetterPlacement,
  onClose,
}) => {
  if (!selectedObject) {
    return (
      <aside className="w-full h-full bg-white flex flex-col p-5 shadow-xs select-none overflow-y-auto">
        <div className="flex justify-end">
          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors text-xs font-bold"
              title="Đóng bảng thuộc tính"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-stone-400">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-2xl mb-3 text-stone-400 shadow-inner">
            🛏️
          </div>
          <h3 className="text-sm font-semibold text-stone-700 mb-1">
            Chưa Chọn Đồ Vật
          </h3>
          <p className="text-xs text-stone-500 max-w-[200px] leading-relaxed">
            Click vào bất kỳ đồ vật nào trong phòng ngủ 3D hoặc kéo thả từ thư viện phía dưới.
          </p>
        </div>
      </aside>
    );
  }

  const deg = Math.round((selectedObject.rotation.y * 180) / Math.PI) % 360;
  const normalizedDeg = deg < 0 ? deg + 360 : deg;

  return (
    <aside className="w-full h-full bg-white flex flex-col shadow-xs select-none overflow-y-auto text-xs text-stone-800">
      {/* 1. Header */}
      <div className="p-4 border-b border-stone-200 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Thuộc tính đồ vật
          </span>
          <h2 className="text-sm font-bold text-stone-900 mt-0.5 truncate max-w-[170px]">
            {selectedObject.name}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {evaluationItem && (
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[11px] font-mono ${
                evaluationItem.score >= 80
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : evaluationItem.score >= 60
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {evaluationItem.score}/100
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors text-xs font-bold"
              title="Đóng bảng thuộc tính"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* 2. Geometric Dimensions & Coordinates */}
        <div className="space-y-2 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
          <span className="text-[11px] font-bold text-stone-600 block">
            KÍCH THƯỚC & TỌA ĐỘ
          </span>

          <div className="flex justify-between items-center text-stone-600">
            <span>Kích thước:</span>
            <span className="font-medium text-stone-900">
              {Math.round(selectedObject.dimensions.width * 100)} ×{' '}
              {Math.round(selectedObject.dimensions.length * 100)} cm
            </span>
          </div>

          <div className="flex justify-between items-center text-stone-600">
            <span>Tọa độ sàn (X, Z):</span>
            <span className="font-mono text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
              {selectedObject.position.x.toFixed(1)}m, {selectedObject.position.z.toFixed(1)}m
            </span>
          </div>

          <div className="flex justify-between items-center text-stone-600">
            <span>Góc xoay:</span>
            <span className="font-mono text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
              {normalizedDeg}°
            </span>
          </div>
        </div>

        {/* 3. Object-level Feng Shui Audit */}
        {evaluationItem && (
          <div className="space-y-2.5 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-600">
                PHONG THỦY ĐỒ VẬT
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  evaluationItem.isSectorGood
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {evaluationItem.isSectorGood ? 'Cát Khí 🟢' : 'Hung Sát 🔴'}
              </span>
            </div>

            <div className="space-y-1 text-stone-700">
              <div className="flex justify-between">
                <span className="text-stone-500">Cung Bát Trạch:</span>
                <span className="font-semibold text-stone-900">
                  {evaluationItem.sectorName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Hướng quay:</span>
                <span className="font-medium text-stone-900">
                  {DIRECTION_NAMES_VI[evaluationItem.facingDirection]} ({evaluationItem.facingDirection})
                </span>
              </div>
            </div>

            {/* Pros checklist */}
            {evaluationItem.pros && evaluationItem.pros.length > 0 && (
              <div className="space-y-1 pt-1.5 border-t border-stone-200/60">
                {evaluationItem.pros.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-emerald-700 text-[11px]">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Issues warnings */}
            {evaluationItem.issues && evaluationItem.issues.length > 0 && (
              <div className="space-y-1 pt-1.5 border-t border-stone-200/60">
                {evaluationItem.issues.map((iss, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-amber-700 text-[11px]">
                    <span className="text-amber-500 font-bold shrink-0">⚠</span>
                    <span>{iss}</span>
                  </div>
                ))}
              </div>
            )}

            {/* AI Recommendation snippet */}
            {evaluationItem.recommendation && (
              <div className="p-2 bg-emerald-50/60 rounded-lg border border-emerald-100 text-[11px] text-emerald-900 leading-relaxed">
                <span className="font-semibold block text-emerald-800 mb-0.5">
                  AI Nhận xét:
                </span>
                "{evaluationItem.recommendation}"
              </div>
            )}
          </div>
        )}

        {/* 4. Action Buttons (Rotate, Duplicate, Delete) */}
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onRotateObject(selectedObject.id, Math.PI / 2)}
              className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>↻</span>
              <span>Xoay 90°</span>
            </button>

            <button
              onClick={() => onDuplicateObject(selectedObject.id)}
              className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>⧉</span>
              <span>Nhân bản</span>
            </button>
          </div>

          {onAskAiForBetterPlacement && (
            <button
              onClick={() => onAskAiForBetterPlacement(selectedObject.name)}
              className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <span>✨</span>
              <span>Tìm vị trí tốt hơn cho {selectedObject.name}</span>
            </button>
          )}

          <button
            onClick={() => onDeleteObject(selectedObject.id)}
            className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <span>🗑</span>
            <span>Xóa khỏi phòng</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
