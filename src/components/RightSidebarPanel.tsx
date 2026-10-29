import React, { useState } from 'react';
import {
  FengShuiRoomEvaluation,
  UserFengShuiProfile,
  RoomConfig,
  RoomObject,
  ProposedAdjustment,
  AIActionCommand,
  LayoutOptimizationProposal,
} from '../types/fengshui';
import { AIChatConsultant } from './AIChatConsultant';

interface RightSidebarPanelProps {
  userProfile: UserFengShuiProfile;
  roomConfig: RoomConfig;
  objects: RoomObject[];
  evaluation: FengShuiRoomEvaluation;
  selectedObjectId: string | null;
  onPreviewProposal: (proposal: ProposedAdjustment | null, adjustments?: ProposedAdjustment[]) => void;
  onApplyProposal: (proposal: ProposedAdjustment) => void;
  onApplyMultipleAdjustments: (proposals: ProposedAdjustment[]) => void;
  onExecuteAIAction?: (action: AIActionCommand) => void;
  onOpenOptimizationModal?: (proposal: LayoutOptimizationProposal) => void;
  isPreviewingProposal: boolean;
  externalTriggerPrompt?: string | null;
  onClearExternalTriggerPrompt?: () => void;
  onFocusObjects?: (sourceId: string, targetId: string, label: string, distance: string) => void;
  onClose?: () => void;
}

export const RightSidebarPanel: React.FC<RightSidebarPanelProps> = ({
  userProfile,
  roomConfig,
  objects,
  evaluation,
  selectedObjectId,
  onPreviewProposal,
  onApplyProposal,
  onApplyMultipleAdjustments,
  onExecuteAIAction = () => {},
  onOpenOptimizationModal,
  isPreviewingProposal,
  externalTriggerPrompt,
  onClearExternalTriggerPrompt,
  onFocusObjects,
  onClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'ai_chat'>('analysis');
  const [quickPrompt, setQuickPrompt] = useState<string>('');
  const [activeExternalPrompt, setActiveExternalPrompt] = useState<string | null>(externalTriggerPrompt || null);

  // Sync external prompt when triggered from outside
  React.useEffect(() => {
    if (externalTriggerPrompt) {
      setActiveExternalPrompt(externalTriggerPrompt);
      setActiveTab('ai_chat');
    }
  }, [externalTriggerPrompt]);

  // Recommended layout adjustments based on the reference mock
  const sampleAdjustments: ProposedAdjustment[] = [
    {
      objectId: 'bed_01',
      suggestedX: -0.6,
      suggestedZ: 0.8,
      suggestedRotationY: Math.PI / 2,
      estimatedScore: 88,
      reason: 'Xoay đầu giường 90° về hướng Tây Bắc (Diên Niên)',
    },
    {
      objectId: 'mirror_01',
      suggestedX: 1.85,
      suggestedZ: -1.2,
      suggestedRotationY: -Math.PI / 2,
      estimatedScore: 88,
      reason: 'Di chuyển gương sang tường bên phải (tránh đối diện giường)',
    },
    {
      objectId: 'desk_window',
      suggestedX: -1.4,
      suggestedZ: 1.4,
      suggestedRotationY: Math.PI,
      estimatedScore: 88,
      reason: 'Đưa bàn học về khu vực Tây Nam (Thiên Y)',
    },
  ];

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    setActiveExternalPrompt(quickPrompt);
    setQuickPrompt('');
    setActiveTab('ai_chat');
  };

  const handleTriggerSuggestion = (promptText: string) => {
    setActiveExternalPrompt(promptText);
    setActiveTab('ai_chat');
  };

  return (
    <aside className="w-[360px] h-[calc(100vh-80px)] max-h-[820px] bg-white rounded-2xl shadow-2xl border border-stone-200/80 p-3.5 flex flex-col gap-2.5 select-none text-stone-900 pointer-events-auto transition-all duration-200 overflow-hidden">
      {/* 1. Header: Trợ lý Phong Thủy + Tab Switcher (Phân tích / AI Hỗ trợ) */}
      <div className="flex items-center justify-between pb-1.5 border-b border-stone-100 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#00705a] flex items-center justify-center text-sm font-bold shadow-2xs border border-emerald-200/80 shrink-0">
            <svg className="w-4.5 h-4.5 text-[#00705a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v18" />
              <path d="M3 12h18" />
              <path d="m5.6 5.6 12.8 12.8" />
              <path d="m18.4 5.6-12.8 12.8" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 tracking-tight leading-none">
              Trợ lý Phong Thủy
            </h2>
            <p className="text-[10px] text-stone-500 mt-0.5 leading-none">
              Phân tích và tối ưu phòng ngủ của bạn
            </p>
          </div>
        </div>

        {/* Tab Switcher: Phân tích vs Trò chuyện AI */}
        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-full border border-stone-200/80">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
              activeTab === 'analysis'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Phân tích
          </button>
          <button
            onClick={() => setActiveTab('ai_chat')}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 ${
              activeTab === 'ai_chat'
                ? 'bg-[#00705a] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>✨</span>
            <span>Trò chuyện</span>
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center text-xs transition-colors shrink-0"
            title="Thu gọn"
          >
            ✕
          </button>
        )}
      </div>

      {/* 2. Content: Analysis View OR AI Chat View */}
      {activeTab === 'ai_chat' ? (
        <div className="flex-1 h-full min-h-0 overflow-hidden flex flex-col">
          <AIChatConsultant
            userProfile={userProfile}
            roomConfig={roomConfig}
            objects={objects}
            evaluation={evaluation}
            selectedObjectId={selectedObjectId}
            onPreviewProposal={onPreviewProposal}
            onApplyProposal={onApplyProposal}
            onApplyMultipleAdjustments={onApplyMultipleAdjustments}
            onExecuteAIAction={onExecuteAIAction}
            onOpenOptimizationModal={onOpenOptimizationModal}
            isPreviewingProposal={isPreviewingProposal}
            externalTriggerPrompt={activeExternalPrompt}
            onClearExternalTriggerPrompt={() => {
              setActiveExternalPrompt(null);
              if (onClearExternalTriggerPrompt) onClearExternalTriggerPrompt();
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-0.5 scrollbar-thin">
          {/* Status Banner */}
          <div className="p-2.5 bg-[#ECFDF5] rounded-xl border border-[#A7F3D0] flex items-start gap-2.5 shadow-2xs shrink-0">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              ✓
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold text-stone-900">
                Đã phân tích hoàn tất
              </p>
              <p className="text-[10px] text-stone-600 mt-0.5 leading-snug">
                Tôi đã phân tích căn phòng và phát hiện 3 điểm cần cải thiện để cân bằng phong thủy.
              </p>
            </div>
          </div>

          {/* AI Quick Request Box (Prominent AI input right inside Analysis tab) */}
          <div className="p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl shadow-2xs flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#00705a] flex items-center gap-1 text-[11px]">
                <span>🤖</span> Yêu cầu AI phong thủy:
              </span>
              <button
                onClick={() => setActiveTab('ai_chat')}
                className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
              >
                Mở chat chi tiết ›
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="flex items-center gap-1.5">
              <input
                type="text"
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                placeholder="Ví dụ: Tối ưu phòng cho tôi, xoay giường 90°..."
                className="flex-1 h-8 bg-white border border-emerald-300 rounded-lg px-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-[#00705a] shadow-2xs"
              />
              <button
                type="submit"
                disabled={!quickPrompt.trim()}
                className="h-8 px-3 bg-[#00705a] hover:bg-[#005c4a] disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs flex items-center gap-1"
              >
                <span>Gửi</span>
              </button>
            </form>
          </div>

          {/* Priority Issue Cards Header */}
          <div className="flex items-center gap-1.5 pt-0.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <h3 className="text-xs font-bold text-stone-900 tracking-tight">
              3 điểm cần cải thiện
            </h3>
          </div>

          {/* 3 Issue Cards */}
          <div className="flex flex-col gap-2 shrink-0">
            {/* Issue 1: Giường đối diện gương */}
            <div className="p-2.5 bg-white rounded-xl border border-stone-200/90 shadow-2xs hover:border-[#00705a]/50 transition-all flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <div className="w-4.5 h-4.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 leading-tight">
                    Giường đối diện gương
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-snug line-clamp-2">
                    Gương đang nằm đối diện trực tiếp với giường, không tốt cho giấc ngủ.
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => handleTriggerSuggestion('Làm sao xử lý việc gương đối diện giường? Hãy gợi ý cách khắc phục và di chuyển trên 3D.')}
                      className="text-[10px] font-bold text-[#00705a] hover:text-[#005c4a] flex items-center gap-0.5 transition-colors"
                    >
                      <span>Hỏi AI gợi ý</span>
                      <span className="text-[11px]">›</span>
                    </button>
                    <button
                      onClick={() => {
                        if (onFocusObjects) {
                          onFocusObjects('mirror_01', 'bed_01', 'Gương đối diện giường', '1.4m');
                        }
                      }}
                      className="text-[10px] text-stone-500 hover:text-stone-800 font-medium"
                    >
                      Xem trên 3D
                    </button>
                  </div>
                </div>
              </div>

              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-lg bg-stone-50 border border-stone-200/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                <svg className="w-9 h-9" viewBox="0 0 64 64" fill="none">
                  <rect x="8" y="24" width="48" height="28" rx="3" fill="#D97706" fillOpacity="0.8" />
                  <rect x="12" y="28" width="40" height="20" rx="2" fill="#FFFFFF" />
                  <rect x="16" y="22" width="14" height="8" rx="2" fill="#FEF3C7" />
                  <rect x="34" y="22" width="14" height="8" rx="2" fill="#FEF3C7" />
                  <rect x="44" y="10" width="12" height="20" rx="1" fill="#94A3B8" stroke="#475569" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            {/* Issue 2: Hướng đầu giường chưa tối ưu */}
            <div className="p-2.5 bg-white rounded-xl border border-stone-200/90 shadow-2xs hover:border-[#00705a]/50 transition-all flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <div className="w-4.5 h-4.5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 leading-tight">
                    Hướng đầu giường chưa tối ưu
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-snug line-clamp-2">
                    Đầu giường hiện quay về hướng Đông, không thuộc nhóm hướng tốt của gia chủ.
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => handleTriggerSuggestion('Hãy xoay đầu giường về hướng hợp mệnh gia chủ nhất và cập nhật trên 3D.')}
                      className="text-[10px] font-bold text-[#00705a] hover:text-[#005c4a] flex items-center gap-0.5 transition-colors"
                    >
                      <span>Hỏi AI gợi ý</span>
                      <span className="text-[11px]">›</span>
                    </button>
                    <button
                      onClick={() => {
                        if (onFocusObjects) {
                          onFocusObjects('bed_01', '', 'Hướng đầu giường: Đông', 'Chưa tối ưu');
                        }
                      }}
                      className="text-[10px] text-stone-500 hover:text-stone-800 font-medium"
                    >
                      Xem trên 3D
                    </button>
                  </div>
                </div>
              </div>

              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-lg bg-stone-50 border border-stone-200/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                <svg className="w-9 h-9" viewBox="0 0 64 64" fill="none">
                  <path d="M10 36 L54 36 L54 48 L10 48 Z" fill="#78350F" />
                  <path d="M10 20 L54 20 L54 36 L10 36 Z" fill="#B45309" />
                  <circle cx="32" cy="18" r="8" stroke="#DC2626" strokeWidth="2" fill="none" />
                  <line x1="32" y1="12" x2="32" y2="24" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                  <polygon points="32,10 36,16 28,16" fill="#DC2626" />
                </svg>
              </div>
            </div>

            {/* Issue 3: Bàn học có thể tối ưu */}
            <div className="p-2.5 bg-white rounded-xl border border-stone-200/90 shadow-2xs hover:border-[#00705a]/50 transition-all flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <div className="w-4.5 h-4.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 leading-tight">
                    Bàn học có thể tối ưu
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-snug line-clamp-2">
                    Bàn học đang nằm gần trung tâm phòng. Có thể di chuyển về khu vực Tây Nam.
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => handleTriggerSuggestion('Hãy di chuyển bàn học về vị trí phong thủy tốt nhất cho học tập và làm việc.')}
                      className="text-[10px] font-bold text-[#00705a] hover:text-[#005c4a] flex items-center gap-0.5 transition-colors"
                    >
                      <span>Hỏi AI gợi ý</span>
                      <span className="text-[11px]">›</span>
                    </button>
                    <button
                      onClick={() => {
                        if (onFocusObjects) {
                          onFocusObjects('desk_window', '', 'Vị trí bàn học', 'Gần tâm phòng');
                        }
                      }}
                      className="text-[10px] text-stone-500 hover:text-stone-800 font-medium"
                    >
                      Xem trên 3D
                    </button>
                  </div>
                </div>
              </div>

              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-lg bg-stone-50 border border-stone-200/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                <svg className="w-9 h-9" viewBox="0 0 64 64" fill="none">
                  <rect x="8" y="26" width="48" height="6" rx="2" fill="#8D5B4C" />
                  <rect x="12" y="32" width="4" height="22" rx="1" fill="#6A3B2F" />
                  <rect x="48" y="32" width="4" height="22" rx="1" fill="#6A3B2F" />
                  <rect x="22" y="18" width="16" height="8" rx="1" fill="#475569" />
                </svg>
              </div>
            </div>
          </div>

          {/* Section: Đề xuất tối ưu (Bottom section) */}
          <div className="p-3 bg-[#F9FAFB] rounded-xl border border-stone-200/80 flex flex-col gap-2 shadow-2xs shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-4.5 h-4.5 rounded-full bg-[#00705a] text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                ✓
              </div>
              <h4 className="text-xs font-bold text-stone-900">Đề xuất tối ưu</h4>
            </div>

            {/* Score Comparison Box */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg border border-stone-200/80 text-center">
              <div>
                <span className="text-[9px] text-stone-400 block font-medium">Hiện tại</span>
                <span className="text-sm font-extrabold text-stone-900 leading-none">54</span>
                <span className="text-[9px] text-stone-400 font-medium">/100</span>
              </div>
              <span className="text-sm text-stone-400 font-bold">→</span>
              <div>
                <span className="text-[9px] text-emerald-700 block font-semibold">Sau tối ưu (dự kiến)</span>
                <span className="text-sm font-extrabold text-[#00705a] leading-none">88</span>
                <span className="text-[9px] text-emerald-700 font-medium">/100</span>
              </div>
            </div>

            {/* 5 Bullet points with emerald checkmarks */}
            <div className="flex flex-col gap-1 text-[10px] text-stone-700 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[#00705a] font-bold">✓</span>
                <span>Xoay giường 90° về hướng Tây Bắc (Diên Niên)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#00705a] font-bold">✓</span>
                <span>Di chuyển gương sang tường bên</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#00705a] font-bold">✓</span>
                <span>Bố trí bàn học về hướng Tây Nam (Thiên Y)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#00705a] font-bold">✓</span>
                <span>Tăng yếu tố Thổ và Kim trong trang trí</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#00705a] font-bold">✓</span>
                <span>Giữ không gian thoáng, ánh sáng tự nhiên</span>
              </div>
            </div>

            {/* Large Primary Action Button */}
            <button
              onClick={() => onApplyMultipleAdjustments(sampleAdjustments)}
              className="mt-1 w-full py-2 bg-[#00705a] hover:bg-[#005c4a] text-white font-bold rounded-lg text-xs transition-all active:scale-98 shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>✦</span>
              <span>Áp dụng đề xuất</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
