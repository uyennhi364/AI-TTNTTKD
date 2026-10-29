import React, { useState, useRef, useEffect } from 'react';
import {
  AIActionCommand,
  FengShuiRoomEvaluation,
  LayoutOptimizationProposal,
  ProposedAdjustment,
  RoomConfig,
  RoomObject,
  UserFengShuiProfile,
} from '../types/fengshui';
import { generateFengShuiConsultation } from '../engine/geminiFengShuiAI';
import { parseIntent, buildSceneState } from '../engine/sceneIntentParser';
import { executeSceneCommand } from '../engine/sceneCommandExecutor';
import { SceneCommand, ClarifyCommand, AIIntentResult } from '../engine/sceneCommandTypes';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: AIActionCommand[];
  proposal?: LayoutOptimizationProposal | null;
  proposedAdjustment?: ProposedAdjustment | null;
  executedSummary?: {
    changes: string[];
    beforeScore?: number;
    afterScore?: number;
  };
  // New: pending commands waiting for confirmation
  pendingCommands?: SceneCommand[];
  clarifyCommand?: ClarifyCommand;
}

interface AIChatConsultantProps {
  userProfile: UserFengShuiProfile;
  roomConfig: RoomConfig;
  objects: RoomObject[];
  evaluation: FengShuiRoomEvaluation;
  selectedObjectId: string | null;
  onPreviewProposal: (proposal: ProposedAdjustment | null, adjustments?: ProposedAdjustment[]) => void;
  onApplyProposal: (proposal: ProposedAdjustment) => void;
  onApplyMultipleAdjustments: (adjustments: ProposedAdjustment[]) => void;
  onExecuteAIAction: (action: AIActionCommand) => void;
  onOpenOptimizationModal?: (proposal: LayoutOptimizationProposal) => void;
  isPreviewingProposal: boolean;
  externalTriggerPrompt?: string | null;
  onClearExternalTriggerPrompt?: () => void;
  onClose?: () => void;
  // New props
  onExecuteSceneCommands?: (commands: SceneCommand[]) => void;
  onHighlightObjects?: (ids: string[]) => void;
}

const QUICK_FEATURE_BADGES = [
  { label: 'Phân tích phong thủy', prompt: 'Phân tích phong thủy chi tiết phòng ngủ hiện tại' },
  { label: 'Sắp xếp nội thất', prompt: 'Sắp xếp lại nội thất phòng ngủ cho gọn gàng và hợp phong thủy' },
  { label: 'Tối ưu vị trí đồ vật', prompt: 'Tối ưu phòng ngủ cho tôi' },
  { label: 'Thay đổi layout 3D', prompt: 'Thay đổi layout phòng ngủ để hợp phong thủy hơn' },
  { label: 'Giải thích vấn đề', prompt: 'Tại sao nên xoay giường và vị trí hiện tại có vấn đề gì?' },
  { label: 'Đề xuất thiết kế', prompt: 'Đề xuất phương án thiết kế phong thủy tốt nhất cho phòng ngủ' },
];

export const AIChatConsultant: React.FC<AIChatConsultantProps> = ({
  userProfile,
  roomConfig,
  objects,
  evaluation,
  selectedObjectId,
  onPreviewProposal,
  onApplyMultipleAdjustments,
  onExecuteAIAction,
  isPreviewingProposal,
  externalTriggerPrompt,
  onClearExternalTriggerPrompt,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Handle external prompt trigger
  useEffect(() => {
    if (externalTriggerPrompt) {
      handleSendMessage(externalTriggerPrompt);
      if (onClearExternalTriggerPrompt) {
        onClearExternalTriggerPrompt();
      }
    }
  }, [externalTriggerPrompt]);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: promptText,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const response = await generateFengShuiConsultation(
        promptText,
        userProfile,
        roomConfig,
        objects,
        evaluation,
        selectedObjectId
      );

      let executedSummary = undefined;
      if (response.actions && response.actions.length > 0) {
        executedSummary = {
          changes: response.actions.map((act) => act.description || `Thực hiện ${act.type}`),
          beforeScore: evaluation.overallScore,
          afterScore: Math.min(95, evaluation.overallScore + 10),
        };
        // Execute validated actions on 3D scene
        response.actions.forEach((act: AIActionCommand) => onExecuteAIAction(act));
      }

      const assistantMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: response.replyText,
        actions: response.actions,
        proposal: response.proposal,
        proposedAdjustment: response.proposedAdjustment,
        executedSummary,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Error generating AI response:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'Xin lỗi, hệ thống AI đang bận. Tôi vẫn có thể giúp bạn tối ưu phòng ngủ hoặc giải thích các nguyên tắc Bát Trạch.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyProposalWithFeedback = (proposal: LayoutOptimizationProposal) => {
    onApplyMultipleAdjustments(proposal.adjustments);

    const executedMsg: ChatMessage = {
      id: `exec_${Date.now()}`,
      role: 'assistant',
      content: '✓ Đã cập nhật căn phòng thành công theo phương án tối ưu!',
      executedSummary: {
        changes: proposal.adjustments.map((adj) => adj.reason),
        beforeScore: proposal.beforeScore,
        afterScore: proposal.afterScore,
      },
    };

    setMessages((prev) => [...prev, executedMsg]);
  };

  return (
    <aside className="w-84 sm:w-92 h-full max-h-[calc(100vh-130px)] bg-white/95 backdrop-blur-md rounded-3xl border border-stone-200/90 shadow-2xl flex flex-col overflow-hidden text-stone-800 select-none animate-in fade-in duration-200">
      {/* 1. HEADER (AI Design Copilot) */}
      <div className="px-4 py-3.5 border-b border-stone-100 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-lg shadow-sm">
            🪷
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 tracking-tight leading-none">
              AI Feng Shui
            </h3>
            <p className="text-[11px] text-stone-500 mt-1 leading-none font-medium">
              Trợ lý thiết kế phòng ngủ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
            Live 3D
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              title="Đóng panel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. QUICK FEATURE BADGES (Scrollable horizontal or grid) */}
      <div className="px-3 py-2 bg-stone-50/70 border-b border-stone-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        {QUICK_FEATURE_BADGES.map((b, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(b.prompt)}
            className="px-2.5 py-1 rounded-xl bg-white border border-stone-200/80 hover:border-purple-300 hover:bg-purple-50/50 text-[10px] font-medium text-stone-700 hover:text-purple-900 whitespace-nowrap transition-all shadow-2xs flex items-center gap-1 shrink-0 active:scale-95"
          >
            <span>{b.label}</span>
          </button>
        ))}
      </div>

      {/* 3. MESSAGES & DIALOGUE BODY */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin text-xs">
        {/* Intro Greeting when empty */}
        {messages.length === 0 && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-stone-50 to-purple-50/30 border border-stone-200/80 space-y-2">
              <p className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                <span>👋</span>
                <span>Xin chào gia chủ {userProfile.birthYear} ({userProfile.guaName} · {userProfile.element})</span>
              </p>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Tôi là Trợ lý AI thiết kế phòng ngủ 3D. Tôi có thể đọc trực tiếp vị trí các đồ vật trong phòng để phân tích phong thủy Bát Trạch và thay đổi mô hình 3D theo lệnh của bạn.
              </p>
              <div className="pt-1.5 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
                <span className="text-stone-500">Điểm phong thủy hiện tại:</span>
                <span className="font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {evaluation.overallScore}/100
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider px-1">
                Gợi ý câu lệnh mẫu
              </p>
              {[
                'Tối ưu phòng ngủ cho tôi',
                'Thêm bàn học ở góc trái',
                'Xoay giường 90 độ',
                'Tại sao nên xoay giường?',
                'Di chuyển gương ra khỏi vị trí đối diện giường',
              ].map((text, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(text)}
                  className="w-full text-left p-2.5 rounded-xl border border-stone-200/80 bg-white hover:bg-stone-50 hover:border-purple-300 text-[11px] font-medium text-stone-700 transition-all shadow-2xs flex items-center justify-between group"
                >
                  <span>{text}</span>
                  <span className="text-stone-400 group-hover:text-purple-600 transition-colors">↗</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dialogue Messages */}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[92%] p-3.5 rounded-2xl leading-relaxed ${
                m.role === 'user'
                  ? 'bg-stone-900 text-white rounded-br-xs font-medium shadow-xs'
                  : 'bg-stone-50/90 border border-stone-200/90 text-stone-800 rounded-bl-xs shadow-2xs'
              }`}
            >
              <div className="whitespace-pre-line text-xs">{m.content}</div>

              {/* STATE 2: AI ĐỀ XUẤT (Layout Proposal Card with Preview & Apply) */}
              {m.proposal && (
                <div className="mt-3 p-3 bg-white rounded-2xl border border-emerald-400/90 shadow-sm space-y-2.5 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                    <span className="font-bold text-emerald-900 text-xs">
                      ✨ {m.proposal.title}
                    </span>
                    <span className="font-bold text-emerald-700 text-xs font-mono bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      {m.proposal.beforeScore}đ → {m.proposal.afterScore}đ
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-stone-600">
                    {m.proposal.adjustments.map((adj, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold shrink-0">{i + 1}.</span>
                        <span>{adj.reason}</span>
                      </div>
                    ))}
                  </div>

                  {/* 2 Primary Buttons: Xem trước 3D & Áp dụng */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onPreviewProposal(null, m.proposal!.adjustments)}
                      className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-95 ${
                        isPreviewingProposal
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300/80'
                      }`}
                    >
                      <span>👁</span>
                      <span>{isPreviewingProposal ? 'Đang xem trước' : 'Xem trước'}</span>
                    </button>
                    <button
                      onClick={() => handleApplyProposalWithFeedback(m.proposal!)}
                      className="flex-1 py-1.5 px-2.5 bg-[#00705a] hover:bg-[#005c4a] active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1"
                    >
                      <span>✓</span>
                      <span>Áp dụng</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 3: AI ĐÃ THỰC HIỆN (Card showing executed changes & recalculated score) */}
              {m.executedSummary && (
                <div className="mt-2.5 p-3 bg-emerald-50/70 rounded-2xl border border-emerald-300 text-[11px] space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between font-bold text-emerald-900 text-xs">
                    <span>✓ Đã cập nhật căn phòng</span>
                    {m.executedSummary.afterScore && (
                      <span className="font-mono text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                        {m.executedSummary.beforeScore || 64} → {m.executedSummary.afterScore}/100
                      </span>
                    )}
                  </div>
                  <ul className="space-y-0.5 text-stone-700">
                    {m.executedSummary.changes.map((chg, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{chg}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* STATE 1: AI ĐANG PHÂN TÍCH (Animated Checklist) */}
        {isLoading && (
          <div className="p-3.5 bg-stone-50/90 border border-stone-200/90 rounded-2xl space-y-2 text-stone-800 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" />
              <span>✨ AI đang phân tích căn phòng...</span>
            </div>
            <div className="pl-4 space-y-1 text-[11px] text-stone-600">
              <p className="text-[10px] font-semibold text-stone-400">Đang kiểm tra:</p>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span>✓</span>
                <span>Hướng phòng Bát Trạch</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span>✓</span>
                <span>Vị trí & hướng đầu giường</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span>✓</span>
                <span>Vị trí bàn học & đón sáng</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span>✓</span>
                <span>Vị trí gương soi</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span>✓</span>
                <span>Khoảng cách cửa & lối lưu thông</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span>✓</span>
                <span>Quan hệ phong thủy với WC</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. INPUT AREA */}
      <div className="p-3 border-t border-stone-100 bg-white space-y-2 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập yêu cầu: di chuyển, xoay, thêm đồ hoặc tối ưu..."
            disabled={isLoading}
            className="w-full pl-3.5 pr-10 py-2.5 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:ring-1.5 focus:ring-[#00705a] bg-stone-50/60 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 p-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-30 text-white rounded-xl transition-all active:scale-95 shadow-2xs"
            title="Gửi lệnh"
          >
            <span className="text-xs">↗</span>
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-stone-500 px-1">
          <button
            onClick={() => handleSendMessage('Tối ưu phòng ngủ cho tôi')}
            className="flex items-center gap-1 hover:text-[#00705a] transition-colors font-medium"
          >
            <span>Tối ưu ngay</span>
          </button>
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1 hover:text-stone-800 transition-colors"
          >
            <span>🗑 Xóa đoạn chat</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
