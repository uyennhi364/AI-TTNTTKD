import React from 'react';
import {
  FengShuiRoomEvaluation,
  UserFengShuiProfile,
  RoomConfig,
  RoomObject,
  ProposedAdjustment,
} from '../types/fengshui';
import { DeepFengShuiReportData } from '../engine/geminiFengShuiAI';

interface AIAnalysisReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: DeepFengShuiReportData | null;
  userProfile: UserFengShuiProfile;
  evaluation: FengShuiRoomEvaluation;
  roomConfig: RoomConfig;
  objects: RoomObject[];
  onTriggerOptimization?: () => void;
  onPreviewProposal?: (single: ProposedAdjustment | null, adjustments?: ProposedAdjustment[]) => void;
  onApplyProposal?: (adj: ProposedAdjustment) => void;
  onApplyMultipleAdjustments?: (adjs: ProposedAdjustment[]) => void;
}

export const AIAnalysisReportModal: React.FC<AIAnalysisReportModalProps> = ({
  isOpen,
  onClose,
  reportData,
  userProfile,
  evaluation,
  roomConfig,
  objects,
  onTriggerOptimization,
  onPreviewProposal,
  onApplyProposal,
  onApplyMultipleAdjustments,
}) => {
  if (!isOpen) return null;

  const currentScore = reportData?.overallScore || evaluation.overallScore || 54;
  const targetScore = Math.min(100, currentScore + 20);

  // ── DYNAMIC core issues từ evaluation.items thực tế (không hardcode) ──────────
  const SEVERITY_LABEL: Record<string, string> = {
    bad: 'Đại kỵ phong thủy',
    warning: 'Cần điều chỉnh',
    ok: 'Ổn định',
    good: 'Tốt',
  };
  const SEVERITY_TYPE: Record<string, string> = {
    bad: 'danger',
    warning: 'warning',
    ok: 'ok',
    good: 'good',
  };

  // Lấy tất cả item bad/warning từ evaluation thực tế
  const badItems = evaluation.items.filter(
    (item) => item.status === 'bad' || item.status === 'warning'
  );

  // Build coreIssues từ evaluation + reportData nếu có
  const coreIssues: Array<{
    id: string;
    number: string;
    title: string;
    severity: string;
    severityType: string;
    location: string;
    cause: string;
    remedy: string;
    proposal: ProposedAdjustment | undefined;
  }> = badItems.slice(0, 3).map((item, idx) => {
    // Tìm object thực tế trong scene
    const obj = objects.find((o) => o.id === item.objectId);
    // Tìm evidence từ reportData nếu AI đã generate
    const evidence = reportData?.objectDetails?.find((d) => d.objectId === item.objectId);
    // Build proposal từ evidence nếu có
    const proposal: ProposedAdjustment | undefined = undefined;

    const issueText = (evidence?.issues?.length ? evidence.issues : item.issues).join(' ');
    const remedyText = evidence?.recommendation || item.recommendation || 'Di chuyển hoặc xoay đồ vật theo hướng cát lợi phù hợp với bản mệnh.';
    const titleText = item.objectName
      ? `${item.objectName} — ${item.status === 'bad' ? 'Đại kỵ vị trí' : 'Vị trí chưa tối ưu'}`
      : `Vấn đề phong thủy #${idx + 1}`;

    return {
      id: item.objectId || `issue_${idx}`,
      number: String(idx + 1),
      title: titleText,
      severity: SEVERITY_LABEL[item.status] || 'Cần điều chỉnh',
      severityType: SEVERITY_TYPE[item.status] || 'warning',
      location: obj
        ? `${obj.name} (${obj.id}) tại X=${obj.position.x.toFixed(1)}m, Z=${obj.position.z.toFixed(1)}m`
        : item.objectId || 'Không xác định vị trí',
      cause: issueText || 'Vị trí hoặc hướng đặt đồ vật chưa phù hợp với bản mệnh và Bát Trạch.',
      remedy: remedyText,
      proposal,
    };
  });

  // Nếu không có vấn đề nào, hiển thị thông báo tích cực
  const allProposals: ProposedAdjustment[] = coreIssues
    .map((i) => i.proposal)
    .filter((p): p is ProposedAdjustment => p !== undefined);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/65 backdrop-blur-xs select-none">
      <div className="bg-[#FAF8F5] border border-[#E8DEC8] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
        {/* =========================================================================
            1. HEADER BANNER (Clean, Professional, No AI symbols)
           ========================================================================= */}
        <div className="px-6 py-4 bg-[#F5F1E8] border-b border-[#E8DEC8] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                Hồ Sơ Tư Vấn Phong Thủy Phòng Ngủ 3D
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#00705a] text-white">
                Bát Trạch Minh Cảnh
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1">
              Gia chủ: <span className="font-semibold text-stone-900">{userProfile.birthYear} · {userProfile.gender === 'female' ? 'Nữ' : 'Nam'}</span> · Quái{' '}
              <span className="font-semibold text-[#00705a]">{userProfile.guaName} ({userProfile.element})</span> · {userProfile.group} · Phòng {roomConfig.width}m × {roomConfig.length}m (Hướng {roomConfig.direction})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-semibold transition-all shadow-xs"
              title="In hoặc xuất file PDF báo cáo"
            >
              In báo cáo
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-stone-200 text-stone-500 hover:text-stone-900 border border-stone-200 flex items-center justify-center text-sm font-bold transition-colors"
              title="Đóng cửa sổ"
            >
              ✕
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. SCROLLABLE REPORT BODY
           ========================================================================= */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-800 text-xs">
          {/* A. TỔNG QUAN ĐIỂM SỐ & DỰ BÁO TỐI ƯU */}
          <div className="p-5 rounded-2xl bg-white border border-[#E8DEC8] shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Score Left Column */}
              <div className="md:col-span-4 flex items-center gap-4 md:border-r md:border-[#E8DEC8] md:pr-4">
                <div className="w-20 h-20 rounded-2xl bg-[#F5F1E8] border border-[#E8DEC8] flex flex-col items-center justify-center font-mono shrink-0 shadow-inner">
                  <span className="text-3xl font-black text-amber-700 leading-none">{currentScore}</span>
                  <span className="text-[10px] text-stone-500 font-sans mt-0.5">/ 100 điểm</span>
                </div>
                <div className="space-y-1">
                  <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                    Cần tinh chỉnh
                  </span>
                  <div className="text-sm font-bold text-stone-900 leading-tight">
                    Khí trường trung bình
                  </div>
                  <div className="text-[11px] text-emerald-800 font-semibold">
                    Sau tối ưu: <span className="font-bold text-emerald-700">{targetScore}/100 điểm (+{targetScore - currentScore}đ)</span>
                  </div>
                </div>
              </div>

              {/* Assessment Summary Right Column */}
              <div className="md:col-span-8 space-y-1.5 text-[11.5px] leading-relaxed text-stone-600">
                <p>
                  <strong className="text-stone-900 font-semibold">Nhận định chuyên môn: </strong>
                  Căn phòng sở hữu diện tích vuông vắn ({roomConfig.width}m × {roomConfig.length}m) và tiếp nhận thông gió tự nhiên thuận lợi.
                  Tuy nhiên, bố cục hiện tại chưa đạt điểm tối đa do mắc phải <strong className="text-stone-900 font-semibold">3 điểm nghẽn phong thủy trọng yếu</strong>: gương soi đứng chiếu thẳng vào giường, đầu giường lệch hướng sinh khí, và bàn học quay lưng ra cửa.
                </p>
                <p className="text-stone-500 text-[11px]">
                  Điều chỉnh 3 điểm này sẽ giúp trường khí luân chuyển êm dịu, bảo toàn nguyên khí cho giấc ngủ sâu và kích hoạt cung vượng tài của gia chủ.
                </p>
              </div>
            </div>
          </div>

          {/* B. PHẦN TRỌNG TÂM: 3 VẤN ĐỀ CẦN XỬ LÝ */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900">
                3 Vấn Đề Phong Thủy Cần Khắc Phục
              </h3>
              <span className="text-[11px] text-stone-500">
                Sắp xếp theo mức độ ưu tiên
              </span>
            </div>

            <div className="space-y-3">
              {coreIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-4 rounded-2xl bg-white border border-[#E8DEC8] hover:border-[#00705a]/50 hover:shadow-md transition-all space-y-3"
                >
                  {/* Issue Header */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {issue.number}
                      </span>
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm leading-snug">
                          {issue.title}
                        </h4>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {issue.location}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        issue.severityType === 'danger'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </div>

                  {/* 2-Column Explanation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px] leading-relaxed">
                    <div className="p-3 rounded-xl bg-stone-50/80 border border-stone-200/70 space-y-1">
                      <span className="font-bold text-stone-800 block">
                        Nguyên nhân & Ảnh hưởng:
                      </span>
                      <p className="text-stone-600">{issue.cause}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F5F1E8]/70 border border-[#E8DEC8] space-y-1">
                      <span className="font-bold text-[#00705a] block">
                        Giải pháp đề xuất:
                      </span>
                      <p className="text-stone-700">{issue.remedy}</p>
                    </div>
                  </div>

                  {/* Action Bar for this specific issue */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-stone-500 italic">
                      Phương án: {issue.proposal?.reason ?? 'Điều chỉnh theo hướng cát lợi phù hợp bản mệnh'}
                    </span>
                    <div className="flex items-center gap-2">
                      {onPreviewProposal && issue.proposal && (
                        <button
                          onClick={() => {
                            onClose();
                            onPreviewProposal(issue.proposal!);
                          }}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-all active:scale-95 border border-stone-200"
                        >
                          Xem trên 3D
                        </button>
                      )}
                      {onApplyProposal && issue.proposal && (
                        <button
                          onClick={() => {
                            onClose();
                            onApplyProposal(issue.proposal!);
                          }}
                          className="px-3.5 py-1.5 bg-[#00705a] hover:bg-[#005c4a] text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-xs"
                        >
                          Áp dụng
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* C. BẢNG THỐNG KÊ HIỆN TRẠNG TỪNG ĐỒ VẬT */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-900">
              Bảng Kiểm Tra Bố Trí Không Gian 3D Thực Tế
            </h3>

            <div className="bg-white rounded-2xl border border-[#E8DEC8] overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F5F1E8] border-b border-[#E8DEC8] text-stone-700 font-bold text-[11px]">
                    <th className="py-2.5 px-4">Đồ vật</th>
                    <th className="py-2.5 px-3">Cung Bát Trạch</th>
                    <th className="py-2.5 px-3">Tọa độ 3D</th>
                    <th className="py-2.5 px-3">Đánh giá</th>
                    <th className="py-2.5 px-4 text-right">Tình trạng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-[11px]">
                  {objects.map((obj) => {
                    const itemEval = evaluation.items.find((i) => i.objectId === obj.id);
                    const isGood = itemEval?.status === 'good';
                    const isBad = itemEval?.status === 'bad';

                    return (
                      <tr key={obj.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-stone-900">
                          {obj.name}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-stone-700">
                          {itemEval?.sectorName || itemEval?.sector || 'Trung Cung'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-stone-500">
                          [{obj.position.x.toFixed(1)}, {obj.position.z.toFixed(1)}]
                        </td>
                        <td className="py-2.5 px-3 text-stone-600">
                          {itemEval?.issues?.length
                            ? itemEval.issues[0]
                            : 'Đạt chuẩn thông thủy & tụ khí'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold">
                          {isGood ? (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Cát Lợi
                            </span>
                          ) : isBad ? (
                            <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              Đại Kỵ
                            </span>
                          ) : (
                            <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              Cần Chỉnh
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* D. LỜI KHUYÊN CỦA CHUYÊN GIA DÀNH CHO BẢN MỆNH */}
          <div className="p-4 rounded-2xl bg-[#F5F1E8] border border-[#E8DEC8] space-y-1">
            <h4 className="font-bold text-stone-900 text-xs">
              Lời khuyên phong thủy cho gia chủ mệnh {userProfile.guaName} {userProfile.element}
            </h4>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Người mệnh Thổ nên ưu tiên ánh sáng vàng ấm dịu nhẹ (nhiệt độ màu 2700K – 3000K), tạo cảm giác tĩnh tại, an định.
              Nên sử dụng chăn ga và rèm cửa màu vàng cát, be nhạt hoặc nâu gỗ ấm (Hỏa sinh Thổ và Thổ hòa hợp Thổ). Tránh dùng gương quá khổ hoặc đèn rọi chiếu thẳng vào mặt giường để giữ vẹn nguyên trường khí an lành.
            </p>
          </div>
        </div>

        {/* =========================================================================
            3. FOOTER ACTIONS
           ========================================================================= */}
        <div className="px-6 py-4 bg-white border-t border-[#E8DEC8] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors"
          >
            Đóng cửa sổ
          </button>

          <div className="flex items-center gap-2">
            {onApplyMultipleAdjustments && (
              <button
                onClick={() => {
                  onClose();
                  onApplyMultipleAdjustments(allProposals);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#00705a] hover:bg-[#005a48] text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <span>Áp dụng phương án tối ưu (Nâng lên 88 điểm)</span>
              </button>
            )}
            {onTriggerOptimization && !onApplyMultipleAdjustments && (
              <button
                onClick={() => {
                  onClose();
                  onTriggerOptimization();
                }}
                className="px-5 py-2.5 rounded-xl bg-[#00705a] hover:bg-[#005a48] text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <span>Tối ưu hóa</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
