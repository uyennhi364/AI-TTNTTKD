import React from 'react';
import { LayoutOptimizationProposal, ProposedAdjustment, RoomObject } from '../types/fengshui';

interface LayoutComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: LayoutOptimizationProposal | null;
  currentObjects: RoomObject[];
  onApply: (adjustments: ProposedAdjustment[]) => void;
}

export const LayoutComparisonModal: React.FC<LayoutComparisonModalProps> = ({
  isOpen,
  onClose,
  proposal,
  currentObjects,
  onApply,
}) => {
  if (!isOpen || !proposal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs select-none">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900">
                So Sánh Bố Cục Phòng Ngủ: Trước & Sau Tối Ưu
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Phân tích các thay đổi cụ thể theo nguyên lý Bát Trạch Minh Cảnh
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Comparison Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-stone-800">
          {/* 1. Score Comparison Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Before */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-500 uppercase tracking-wider text-[11px]">
                  Bố Cục Hiện Tại
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-semibold">
                  Chưa tối ưu
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold font-mono text-stone-700">
                  {proposal.beforeScore}
                </span>
                <span className="text-stone-400 font-medium">/ 100</span>
              </div>
              <p className="text-stone-500 text-[11px]">
                Tồn tại {proposal.keyIssues?.length || 2} điểm xung sát khí trường
              </p>
            </div>

            {/* After */}
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">
                  Đề Xuất Tối Ưu
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white font-semibold shadow-2xs">
                  Cát Lợi Tối Đa
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold font-mono text-emerald-600">
                  {proposal.afterScore}
                </span>
                <span className="text-emerald-700/60 font-medium">/ 100</span>
                <span className="ml-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  +{proposal.afterScore - proposal.beforeScore} điểm
                </span>
              </div>
              <p className="text-emerald-800 text-[11px]">
                Nạp vượng khí Sinh Khí / Thiên Y, triệt tiêu xung sát
              </p>
            </div>
          </div>

          {/* 2. Detected Issues vs AI Solutions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="font-bold text-stone-700 block text-xs">
                Vấn Đề Đã Phát Hiện:
              </span>
              <div className="space-y-1.5">
                {(proposal.keyIssues || []).map((iss, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-red-50/70 border border-red-200 text-red-800 flex items-start gap-2 text-xs"
                  >
                    <span className="text-red-500 font-bold shrink-0">⚠</span>
                    <span>{iss}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-stone-700 block text-xs">
                Giải Pháp Cải Thiện:
              </span>
              <div className="space-y-1.5">
                {(proposal.improvements || []).map((imp, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-800 flex items-start gap-2 text-xs"
                  >
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span>{imp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Detailed Object Movement Table */}
          <div className="space-y-2">
            <span className="font-bold text-stone-700 block text-xs">
              Chi Tiết Dịch Chuyển & Xoay Đồ Đạc:
            </span>
            <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold">
                  <tr>
                    <th className="p-2.5">Đồ vật</th>
                    <th className="p-2.5">Tọa độ mới (X, Z)</th>
                    <th className="p-2.5">Góc xoay</th>
                    <th className="p-2.5">Lý do phong thủy & công năng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {proposal.adjustments.map((adj, idx) => {
                    const current = currentObjects.find((o) => o.id === adj.objectId);
                    const deg = Math.round((adj.suggestedRotationY * 180) / Math.PI) % 360;
                    const normalizedDeg = deg < 0 ? deg + 360 : deg;

                    return (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="p-2.5 font-semibold text-stone-900">
                          {current?.name || adj.objectId}
                        </td>
                        <td className="p-2.5 font-mono text-stone-600">
                          [{adj.suggestedX.toFixed(1)}m, {adj.suggestedZ.toFixed(1)}m]
                        </td>
                        <td className="p-2.5 font-mono text-stone-600">
                          {normalizedDeg}°
                        </td>
                        <td className="p-2.5 text-stone-700 leading-relaxed">
                          {adj.reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={() => {
              onApply(proposal.adjustments);
              onClose();
            }}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <span>✓</span>
            <span>Áp Dụng Toàn Bộ Bố Cục Này Vào Phòng 3D</span>
          </button>
        </div>
      </div>
    </div>
  );
};
