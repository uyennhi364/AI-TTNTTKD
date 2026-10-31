import {
  AIActionCommand,
  FengShuiRoomEvaluation,
  LayoutOptimizationProposal,
  ProposedAdjustment,
  RoomConfig,
  RoomObject,
  UserFengShuiProfile,
} from '../types/fengshui';
import { getFloorDistance } from './fengshuiRules';
import { generateOptimizedLayout } from './layoutOptimizer';
import { parseIntent, buildSceneState } from './sceneIntentParser';
import { executeSceneCommand } from './sceneCommandExecutor';
import {
  AIIntentResult,
  SceneCommand,
  DeleteCommand,
  MoveCommand,
  RotateCommand,
  AddCommand,
} from './sceneCommandTypes';

export interface FengShuiConsultationResult {
  replyText: string;
  actions?: AIActionCommand[];
  proposal?: LayoutOptimizationProposal | null;
  proposedAdjustment?: ProposedAdjustment | null;
  isGeminiOnline?: boolean;
}

export interface DetailedObjectEvidence {
  objectId: string;
  objectName: string;
  type: string;
  coords: string;
  rotationDeg: number;
  dimensions: string;
  sector: string;
  score: number;
  status: 'good' | 'warning' | 'bad';
  distToDoor?: number;
  distToWindow?: number;
  distToWc?: number;
  mirrorDirectView?: boolean;
  solidWall?: boolean;
  pros: string[];
  issues: string[];
  recommendation: string;
}

export interface DeepFengShuiReportData {
  summary: string;
  verdict: string;
  overallScore: number;
  qiAnalysis: string;
  objectDetails: DetailedObjectEvidence[];
  topIssues: string[];
  recommendations: string[];
  masterAdvice: string;
  recommendedAction: string;
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Natural language intent parser & 3D Feng Shui Interior Designer.
 * Understands 3D room state, user Kua, furniture geometry, and generates safe structured actions.
 * Supports full multi-turn conversation history for contextual memory.
 */
export async function generateFengShuiConsultation(
  prompt: string,
  userProfile: UserFengShuiProfile,
  roomConfig: RoomConfig,
  objects: RoomObject[],
  evaluation: FengShuiRoomEvaluation,
  selectedObjectId: string | null,
  chatHistory?: ChatHistoryMessage[]
): Promise<FengShuiConsultationResult> {
  // 1. Try sending real-time 3D context to server endpoint with full chat history
  try {
    // Build full conversation history ending with the current user message
    const historyMessages = (chatHistory || []).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      content: m.content,
    }));
    const messages = [
      ...historyMessages,
      { role: 'user', content: prompt },
    ];

    const localApiKey = typeof window !== 'undefined' ? (localStorage.getItem('gemini_api_key') || '').trim() : '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (localApiKey) {
      headers['x-gemini-api-key'] = localApiKey;
    }

    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages,
        userProfile,
        roomConfig,
        objects,
        ruleEngineResult: evaluation,
        selectedObjectId,
        apiKey: localApiKey || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      // Server returns { success, reply, aiActions, proposedAdjustment, optimizationProposal, isGeminiOnline }
      if (data && data.success) {
        return {
          replyText: data.reply || data.replyText || 'Đã phân tích căn phòng.',
          actions: data.aiActions?.actions || data.actions,
          proposal: data.optimizationProposal || data.proposal,
          proposedAdjustment: data.proposedAdjustment,
          isGeminiOnline: Boolean(data.isGeminiOnline),
        };
      }
    }
  } catch (_e) {
    // Offline or server not responding -> proceed seamlessly with intelligent local engine
  }

  // 2. High-Intelligence Local AI Designer Fallback
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes('tối ưu') || lowerPrompt.includes('optimize') || lowerPrompt.includes('sắp xếp lại')) {
    const { proposal } = generateOptimizedLayout(userProfile, roomConfig, objects, evaluation);
    return {
      replyText: `Tôi đã phân tích toàn bộ bố cục phòng ${roomConfig.width}m × ${roomConfig.length}m của gia chủ mệnh ${userProfile.guaName} (${userProfile.element}) và tạo phương án tối ưu nâng điểm phong thủy từ ${proposal.beforeScore} lên ${proposal.afterScore}/100.\n\nCác cải tiến:\n${proposal.improvements.map((imp, i) => `${i + 1}. ${imp}`).join('\n')}\n\nBạn có thể bấm Xem trước để kiểm tra bóng mờ 3D hoặc Áp dụng ngay!`,
      proposal,
      proposedAdjustment: proposal.adjustments[0] || null,
      actions: [
        {
          type: 'optimize_room',
          description: 'Tối ưu toàn bộ bố cục phòng ngủ theo Bát Trạch',
          adjustments: proposal.adjustments,
        },
      ],
    };
  }

  // Build scene state snapshot and delegate to intent parser
  const sceneState = buildSceneState(roomConfig, objects);
  const intentResult: AIIntentResult = parseIntent(prompt, sceneState, userProfile, evaluation, selectedObjectId);

  // Convert AIIntentResult → FengShuiConsultationResult (backward-compatible)
  if (intentResult.commands.length === 0 || intentResult.requiresClarification) {
    return { replyText: intentResult.replyText };
  }

  // Convert SceneCommands → legacy AIActionCommand[] so existing UI still works
  const actions: AIActionCommand[] = [];
  for (const cmd of intentResult.commands) {
    if (cmd.action === 'delete_object') {
      const dc = cmd as DeleteCommand;
      dc.object_ids.forEach((id) => {
        actions.push({ type: 'delete_object', objectId: id, description: cmd.reason });
      });
    } else if (cmd.action === 'move_object') {
      const mc = cmd as MoveCommand;
      // Compute actual coordinates via executor (read-only pass)
      const execOut = executeSceneCommand(cmd, objects, roomConfig);
      const moved = execOut.updatedObjects.find((o) => o.id === mc.object_id);
      if (moved) {
        actions.push({
          type: 'move_object',
          objectId: mc.object_id,
          position: { x: moved.position.x, z: moved.position.z },
          description: cmd.reason,
        });
      }
    } else if (cmd.action === 'rotate_object') {
      const rc = cmd as RotateCommand;
      actions.push({
        type: 'rotate_object',
        objectId: rc.object_id,
        rotationDelta: (rc.rotation.degrees * Math.PI) / 180,
        description: cmd.reason,
      });
    } else if (cmd.action === 'add_object') {
      const ac = cmd as AddCommand;
      const execOut = executeSceneCommand(cmd, objects, roomConfig);
      const added = execOut.updatedObjects.find((o) => !objects.some((orig) => orig.id === o.id));
      actions.push({
        type: 'add_object',
        objectType: ac.object_type as any,
        name: ac.object_name,
        dimensions: ac.dimensions,
        position: added ? { x: added.position.x, z: added.position.z } : { x: 0, z: 0 },
        description: cmd.reason,
      });
    }
  }

  return { replyText: intentResult.replyText, actions: actions.length > 0 ? actions : undefined };
}

/**
 * Generates an Evidence-Based Deep Feng Shui Report from actual 3D scene data.
 */
export async function generateDeepFengShuiReport(
  userProfile: UserFengShuiProfile,
  roomConfig: RoomConfig,
  objects: RoomObject[],
  evaluation: FengShuiRoomEvaluation
): Promise<DeepFengShuiReportData> {
  const door = objects.find((o) => o.type === 'door');
  const windowObj = objects.find((o) => o.type === 'window');
  const wc = objects.find((o) => o.type === 'wc');
  const bed = objects.find((o) => o.type === 'bed');

  const halfW = roomConfig.width / 2;
  const halfL = roomConfig.length / 2;

  // Build exact geometric evidence for all objects
  const objectDetails: DetailedObjectEvidence[] = objects.map((obj) => {
    const itemEval = evaluation.items.find((i) => i.objectId === obj.id);

    const distToDoor = door ? Math.round(getFloorDistance(obj.position, door.position) * 10) / 10 : undefined;
    const distToWindow = windowObj ? Math.round(getFloorDistance(obj.position, windowObj.position) * 10) / 10 : undefined;
    const distToWc = wc ? Math.round(getFloorDistance(obj.position, wc.position) * 10) / 10 : undefined;

    const rotDeg = Math.round(((obj.rotation.y * 180) / Math.PI + 360) % 360);
    const coordsStr = `X: ${obj.position.x >= 0 ? '+' : ''}${obj.position.x.toFixed(2)}m, Z: ${obj.position.z >= 0 ? '+' : ''}${obj.position.z.toFixed(2)}m`;
    const dimsStr = `${Math.round(obj.dimensions.width * 100)} × ${Math.round(obj.dimensions.length * 100)} × ${Math.round(obj.dimensions.height * 100)} cm`;

    let solidWall = false;
    if (obj.type === 'bed') {
      const minDist = Math.min(
        Math.abs(obj.position.x - (-halfW)),
        Math.abs(obj.position.x - halfW),
        Math.abs(obj.position.z - (-halfL)),
        Math.abs(obj.position.z - halfL)
      );
      solidWall = minDist <= 0.45;
    }

    let mirrorDirectView = false;
    if (obj.type === 'mirror' && bed) {
      mirrorDirectView = Boolean(itemEval?.hasDirectConflict || Math.abs(obj.position.z - bed.position.z) < 1.4);
    }

    return {
      objectId: obj.id,
      objectName: obj.name,
      type: obj.type,
      coords: coordsStr,
      rotationDeg: rotDeg,
      dimensions: dimsStr,
      sector: itemEval?.sectorName || itemEval?.sector || 'Trung Cung',
      score: itemEval?.score || 80,
      status: itemEval?.status || 'good',
      distToDoor,
      distToWindow,
      distToWc,
      mirrorDirectView,
      solidWall,
      pros: itemEval?.pros || ['Bố trí hài hòa với tổng thể không gian'],
      issues: itemEval?.issues || [],
      recommendation: itemEval?.recommendation || 'Giữ nguyên vị trí hiện tại để bảo toàn trường khí ổn định.',
    };
  });

  // Try calling server endpoint for enhanced deep analysis text
  try {
    const res = await fetch('/api/gemini/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userProfile,
        roomConfig,
        objects,
        ruleEngineResult: evaluation,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.data) {
        return {
          summary: data.data.summary || 'Trường khí căn phòng tương đối hài hòa với bản mệnh gia chủ.',
          verdict: data.data.verdict || evaluation.statusText,
          overallScore: evaluation.overallScore,
          qiAnalysis: data.data.qiAnalysis || 'Dòng năng lượng lưu thông êm dịu, cần lưu ý điểm tựa đầu giường và hướng phản chiếu gương.',
          objectDetails,
          topIssues: evaluation.keyIssues.slice(0, 3),
          recommendations: evaluation.cures.slice(0, 3),
          masterAdvice: data.data.masterAdvice || 'Nên ưu tiên củng cố thế Tọa Sơn cho đầu giường để gia tăng sự an định trong tâm trí.',
          recommendedAction: data.data.recommendedAction || 'Dịch chuyển đầu giường tựa sát tường phía Bắc và xoay gương tránh chiếu vào giường.',
        };
      }
    }
  } catch (_e) {
    // Offline mode
  }

  return {
    summary: `Phòng ngủ của gia chủ sinh năm ${userProfile.birthYear} (${userProfile.gender === 'female' ? 'Nữ' : 'Nam'}, Quái ${userProfile.guaName} - ${userProfile.element}) đạt ${evaluation.overallScore}/100 điểm (${evaluation.statusText}).`,
    verdict: evaluation.statusText,
    overallScore: evaluation.overallScore,
    qiAnalysis: `Trường khí căn phòng rộng ${roomConfig.width}m × ${roomConfig.length}m tiếp nhận sinh khí tốt từ hướng chính. Tuy nhiên cần tối ưu hóa vị trí kê đầu giường tựa vách kiên cố và triệt tiêu góc chiếu của gương để đạt thế Tàng Phong Tụ Khí trọn vẹn.`,
    objectDetails,
    topIssues: evaluation.keyIssues.length > 0 ? evaluation.keyIssues.slice(0, 3) : ['Chưa có xung sát nghiêm trọng'],
    recommendations: evaluation.cures.length > 0 ? evaluation.cures.slice(0, 3) : ['Bố trí hiện tại đã tương đối cát lợi'],
    masterAdvice: `Với bản mệnh ${userProfile.guaName} ${userProfile.element} thuộc Tây Tứ Mệnh, giường ngủ và bàn học nên ưu tiên tọa lạc tại các cung Tây, Tây Nam, Tây Bắc hoặc Đông Bắc để tiếp nhận năng lượng tương sinh mạnh nhất.`,
    recommendedAction: 'Áp dụng phương án bố trí tự động của AI để tối ưu hóa đồng bộ tất cả đồ vật trong phòng.',
  };
}
