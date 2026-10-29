import React from 'react';
import { FengShuiRoomEvaluation } from '../types/fengshui';

interface FengShuiAuditPanelProps {
  evaluation: FengShuiRoomEvaluation;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onTriggerAiAnalysis: () => void;
  isAiAnalyzing: boolean;
}

export const FengShuiAuditPanel: React.FC<FengShuiAuditPanelProps> = ({
  evaluation,
  selectedObjectId,
  onSelectObject,
  onTriggerAiAnalysis,
  isAiAnalyzing,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getBadgeColor = (status: 'good' | 'warning' | 'bad') => {
    if (status === 'good') return 'bg-emerald-500';
    if (status === 'warning') return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="h-full flex flex-col p-4 text-stone-800 text-sm select-none overflow-y-auto">
      {/* 1. Overall Score Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-stone-300">
            Điểm Phong Thủy Tổng Thể
          </span>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
              evaluation.statusLevel === 'excellent'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : evaluation.statusLevel === 'good'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}
          >
            {evaluation.statusText}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold font-mono tracking-tight text-white">
            {evaluation.overallScore}
          </span>
          <span className="text-stone-400 font-medium">/ 100</span>
        </div>

        {/* Sub-Score Breakdown Bars */}
        <div className="space-y-1.5 pt-2 border-t border-white/10 text-xs">
          <div className="flex justify-between text-stone-300 text-[11px]">
            <span>Giường ngủ (45%):</span>
            <span className="font-mono">{evaluation.breakdown.bedScore}/100</span>
          </div>
          <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${evaluation.breakdown.bedScore}%` }}
            />
          </div>

          <div className="flex justify-between text-stone-300 text-[11px] pt-1">
            <span>Bàn học & làm việc (15%):</span>
            <span className="font-mono">{evaluation.breakdown.deskScore}/100</span>
          </div>
          <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
            <div
              className="bg-sky-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${evaluation.breakdown.deskScore}%` }}
            />
          </div>

          <div className="flex justify-between text-stone-300 text-[11px] pt-1">
            <span>Gương soi (10%):</span>
            <span className="font-mono">{evaluation.breakdown.mirrorScore}/100</span>
          </div>
          <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                evaluation.breakdown.mirrorScore >= 70 ? 'bg-emerald-400' : 'bg-red-400'
              }`}
              style={{ width: `${evaluation.breakdown.mirrorScore}%` }}
            />
          </div>
        </div>

        {/* Big Action Button */}
        <button
          onClick={onTriggerAiAnalysis}
          disabled={isAiAnalyzing}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          {isAiAnalyzing ? (
            <>
              <span className="animate-spin text-sm">⏳</span>
              <span>Đang kết nối Chuyên gia AI...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>PHÂN TÍCH PHONG THỦY TOÀN DIỆN</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Detected Key Issues */}
      {evaluation.keyIssues.length > 0 && (
        <div className="my-3 p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
          <div className="text-xs font-bold text-red-900 flex items-center gap-1.5">
            <span>⚠</span>
            <span>Các điểm xung sát cần lưu tâm:</span>
          </div>
          <ul className="text-xs text-red-800 space-y-1 pl-4 list-disc">
            {evaluation.keyIssues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Detailed Itemized Audit List */}
      <div className="flex-1 mt-2 space-y-2">
        <div className="text-xs font-bold text-stone-900 uppercase tracking-wider">
          Đánh Giá Chi Tiết Từng Đồ Vật
        </div>

        <div className="space-y-2">
          {evaluation.items.map((item) => {
            const isSelected = selectedObjectId === item.objectId;
            return (
              <div
                key={item.objectId}
                onClick={() => onSelectObject(isSelected ? null : item.objectId)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-stone-900 bg-stone-50 ring-2 ring-stone-900/10 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${getBadgeColor(
                        item.status
                      )}`}
                    />
                    <span className="font-semibold text-stone-900 text-xs">
                      {item.objectName}
                    </span>
                  </div>

                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${getScoreColor(
                      item.score
                    )}`}
                  >
                    {item.score}/100
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
                  <span>
                    Cung vị: <strong className="text-stone-700">{item.sectorName}</strong>
                  </span>
                  <span>
                    Hướng: <strong className="text-stone-700">{item.facingDirection}</strong>
                  </span>
                </div>

                {/* Expanded Details when selected */}
                {isSelected && (
                  <div className="mt-2.5 pt-2.5 border-t border-stone-200 text-xs space-y-1.5">
                    {item.pros.length > 0 && (
                      <div className="text-emerald-800 space-y-0.5">
                        {item.pros.map((pro, idx) => (
                          <div key={idx} className="flex items-start gap-1">
                            <span>✓</span>
                            <span>{pro}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {item.issues.length > 0 && (
                      <div className="text-red-700 space-y-0.5">
                        {item.issues.map((iss, idx) => (
                          <div key={idx} className="flex items-start gap-1">
                            <span>✕</span>
                            <span>{iss}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-[11px] text-stone-600 bg-stone-100 p-2 rounded-lg mt-1 font-medium">
                      💡 <strong>Khuyến nghị:</strong> {item.recommendation}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
