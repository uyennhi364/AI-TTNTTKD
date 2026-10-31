// =============================================================================
// sceneIntentParser.ts
// Parses natural language + scene state into structured AIIntentResult.
// Does NOT execute anything — only produces SceneCommand objects.
// Replaces generateLocalConsultation in geminiFengShuiAI.ts for local fallback.
// =============================================================================

import { FengShuiRoomEvaluation, UserFengShuiProfile } from '../types/fengshui';
import {
  AIIntentResult,
  AddCommand,
  ClarifyCommand,
  DeleteCommand,
  MoveCommand,
  RotateCommand,
  SceneCommand,
  SceneObject,
  SceneState,
} from './sceneCommandTypes';

// ---------------------------------------------------------------------------
// Vietnamese → English object type map
// ORDER MATTERS: more specific patterns first (e.g. 'cửa sổ' before 'cửa')
// ---------------------------------------------------------------------------
const OBJECT_TYPE_MAP: Array<{ patterns: string[]; type: string }> = [
  { patterns: ['cửa sổ', 'window'], type: 'window' },
  { patterns: ['cửa kéo', 'cửa lùa', 'kéo lùa'], type: 'door_sliding' }, // resolved later to 'door' with subType
  { patterns: ['nhà vệ sinh', 'phòng vệ sinh', 'nhà tắm', 'phòng tắm', 'wc', 'vệ sinh', 'toilet', 'bồn cầu'], type: 'wc' },
  { patterns: ['sofa', 'ghế sofa', 'ghế dài'], type: 'sofa' },
  { patterns: ['giường'], type: 'bed' },
  { patterns: ['bàn trà', 'bàn nước', 'bàn coffee'], type: 'table' },
  { patterns: ['bàn'], type: 'desk' },
  { patterns: ['tủ'], type: 'wardrobe' },
  { patterns: ['ghế'], type: 'chair' },
  { patterns: ['gương'], type: 'mirror' },
  { patterns: ['cây cảnh', 'cây xanh', 'chậu cây', 'chậu', 'cây'], type: 'plant' },
  { patterns: ['đèn'], type: 'lamp' },
  { patterns: ['thảm'], type: 'rug' },
  { patterns: ['cửa'], type: 'door' },
];

interface AttributeHint {
  patterns: string[];
  attrs: Record<string, any>;
}

const ATTRIBUTE_HINTS: AttributeHint[] = [
  { patterns: ['2 cánh', 'hai cánh'], attrs: { leafCount: 2 } },
  { patterns: ['4 cánh', 'bốn cánh'], attrs: { leafCount: 4 } },
  { patterns: ['kéo', 'lùa', 'trượt'], attrs: { subType: 'sliding' } },
  { patterns: ['xoay', 'bản lề'], attrs: { subType: 'swing' } },
];

// ---------------------------------------------------------------------------
// Helper: extract attribute hints from prompt
// ---------------------------------------------------------------------------
function extractAttributes(p: string): Record<string, any> {
  const attrs: Record<string, any> = {};
  for (const hint of ATTRIBUTE_HINTS) {
    if (hint.patterns.some((pat) => p.includes(pat))) {
      Object.assign(attrs, hint.attrs);
    }
  }
  return attrs;
}

// ---------------------------------------------------------------------------
// Helper: detect primary object type from prompt
// Returns { type, isSlidingDoor } or null
// ---------------------------------------------------------------------------
function detectObjectType(p: string): { type: string; attrs: Record<string, any> } | null {
  for (const entry of OBJECT_TYPE_MAP) {
    if (entry.patterns.some((pat) => p.includes(pat))) {
      if (entry.type === 'door_sliding') {
        return { type: 'door', attrs: { subType: 'sliding' } };
      }
      return { type: entry.type, attrs: {} };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helper: match scene objects by type, name, attributes, position
// Returns array of matching candidates
// ---------------------------------------------------------------------------
function findCandidates(
  detectedType: string | null,
  detectedAttrs: Record<string, any>,
  p: string,
  objects: SceneObject[],
  selectedId: string | null
): SceneObject[] {
  let pool = objects;

  // Filter by type first
  if (detectedType) {
    const byType = pool.filter((o) => o.type === detectedType);
    if (byType.length > 0) pool = byType;
    else pool = []; // Quan trọng: nếu đã nhận dạng được type nhưng không có trong scene thì trả rỗng, không đoán bừa
  }

  // Filter by subType attribute hint (e.g. sliding door)
  if (detectedAttrs.subType) {
    const bySub = pool.filter(
      (o) =>
        (o.attributes?.subType === detectedAttrs.subType) ||
        o.name.toLowerCase().includes(detectedAttrs.subType)
    );
    if (bySub.length > 0) pool = bySub;
  }

  // Filter by leafCount attribute (2 cánh, 4 cánh) — only when NOT ordinal intent
  if (detectedAttrs.leafCount !== undefined) {
    const byLeaf = pool.filter((o) => o.attributes?.leafCount === detectedAttrs.leafCount);
    if (byLeaf.length > 0) pool = byLeaf;
  }

  // Position hints (left / right side of room)
  const leftHint = p.includes('trái') || p.includes('bên trái');
  const rightHint = p.includes('phải') || p.includes('bên phải');
  if (leftHint && pool.length > 1) {
    const byPos = pool.filter((o) => o.position.x < 0);
    if (byPos.length > 0) pool = byPos;
  } else if (rightHint && pool.length > 1) {
    const byPos = pool.filter((o) => o.position.x > 0);
    if (byPos.length > 0) pool = byPos;
  }

  // Ordinal: "thứ 1", "thứ 2" — only match explicit ordinals, NOT "2 cánh"
  const ordinalMatch = p.match(/thứ\s*(\d+)/);
  if (ordinalMatch) {
    const idx = parseInt(ordinalMatch[1], 10) - 1;
    if (idx >= 0 && idx < pool.length) {
      return [pool[idx]];
    }
  }

  // Prefer currently selected object if within pool
  if (selectedId) {
    const selected = pool.find((o) => o.id === selectedId);
    if (selected) return [selected];
  }

  return pool;
}

// ---------------------------------------------------------------------------
// Helper: detect move target region from prompt
// ---------------------------------------------------------------------------
function detectMoveRegion(p: string): MoveCommand['target_region'] | undefined {
  if (p.includes('góc trái') || p.includes('góc bên trái')) return 'left_corner';
  if (p.includes('góc phải') || p.includes('góc bên phải')) return 'right_corner';
  if (p.includes('giữa') || p.includes('trung tâm')) return 'center';
  if (p.includes('cửa sổ')) return 'near_window';
  if (p.includes('cửa ra vào') || p.includes('gần cửa')) return 'near_door';
  if (p.includes('sát tường') || p.includes('tường')) return 'against_wall';
  return undefined;
}

function detectMoveDirection(p: string): MoveCommand['target_direction'] | undefined {
  if (p.includes('trái') || p.includes('bên trái')) return 'left';
  if (p.includes('phải') || p.includes('bên phải')) return 'right';
  if (p.includes('lên') || p.includes('phía trên') || p.includes('về phía bắc')) return 'forward';
  if (p.includes('xuống') || p.includes('phía dưới') || p.includes('về phía nam')) return 'backward';
  return undefined;
}

// ---------------------------------------------------------------------------
// Helper: detect rotation degrees from prompt
// ---------------------------------------------------------------------------
function detectRotationDegrees(p: string): number {
  if (p.includes('180')) return 180;
  if (p.includes('270')) return 270;
  if (p.includes('45')) return 45;
  return 90; // default 90°
}

// ---------------------------------------------------------------------------
// Helper: build SceneState from RoomObject[] (bridges types)
// ---------------------------------------------------------------------------
export function buildSceneState(
  roomConfig: { width: number; length: number; height: number; direction: string },
  objects: Array<{
    id: string;
    type: string;
    name: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    dimensions: { width: number; length: number; height: number };
    subType?: string;
    [key: string]: any;
  }>
): SceneState {
  return {
    room: {
      width: roomConfig.width,
      length: roomConfig.length,
      height: roomConfig.height,
      direction: roomConfig.direction,
    },
    objects: objects.map((o) => {
      let leafCount: number | undefined = undefined;
      const lowerName = o.name.toLowerCase();
      if (lowerName.includes('2 cánh') || lowerName.includes('hai cánh')) leafCount = 2;
      else if (lowerName.includes('4 cánh') || lowerName.includes('bốn cánh')) leafCount = 4;
      else if (lowerName.includes('1 cánh') || lowerName.includes('một cánh') || lowerName.includes('đơn')) leafCount = 1;

      return {
        id: o.id,
        type: o.type,
        name: o.name,
        position: o.position,
        rotation: { y: Math.round((o.rotation.y * 180) / Math.PI) },
        dimensions: o.dimensions,
        attributes: {
          ...(o.subType ? { subType: o.subType } : {}),
          ...(leafCount ? { leafCount } : {}),
        },
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// MAIN EXPORT: parseIntent
// ---------------------------------------------------------------------------
export function parseIntent(
  prompt: string,
  sceneState: SceneState,
  userProfile: UserFengShuiProfile,
  evaluation: FengShuiRoomEvaluation,
  selectedObjectId: string | null = null
): AIIntentResult {
  const p = prompt.toLowerCase();
  const objects = sceneState.objects;

  // -------------------------------------------------------------------------
  // INTENT: LIST / SHOW OBJECTS & ROOM INFO
  // -------------------------------------------------------------------------
  const isListIntent =
    p.includes('hiển thị') || p.includes('liệt kê') || p.includes('danh sách') ||
    p.includes('có gì') || p.includes('có những gì') || p.includes('cho biết') ||
    (p.includes('đồ vật') && (p.includes('trong phòng') || p.includes('hiện có') || p.includes('hiện tại') || p.includes('tất cả'))) ||
    p.includes('bao nhiêu đồ') || p.includes('những đồ');

  if (isListIntent) {
    if (objects.length === 0) {
      return {
        replyText: 'Hiện tại phòng ngủ của bạn chưa có đồ vật nào. Bạn có thể dùng thư viện nội thất ở dock phía dưới để thêm giường, bàn, gương...',
        commands: [],
        requiresPreview: false,
        requiresClarification: false,
      };
    }
    const objectList = objects.map((o, i) => {
      return `${i + 1}. **${o.name}** (${o.type})\n   • Vị trí: X=${o.position.x.toFixed(2)}m, Z=${o.position.z.toFixed(2)}m\n   • Kích thước: ${o.dimensions.width}m × ${o.dimensions.length}m × ${o.dimensions.height}m\n   • Góc xoay: ${o.rotation.y}°`;
    }).join('\n\n');

    return {
      replyText: `Phòng ngủ hiện có **${objects.length} đồ vật**:\n\n${objectList}\n\nĐiểm phong thủy Bát Trạch: **${evaluation.overallScore}/100** (${evaluation.statusText}).`,
      commands: [],
      requiresPreview: false,
      requiresClarification: false,
    };
  }

  // -------------------------------------------------------------------------
  // INTENT: DELETE
  // -------------------------------------------------------------------------
  const isDeleteIntent =
    p.includes('xóa') || p.includes('bỏ') || p.includes('gỡ') ||
    p.includes('delete') || p.includes('hủy') || p.includes('xoá');

  if (isDeleteIntent) {
    // "xóa hết" / "xóa tất cả" → delete all objects (high confidence)
    const deleteAll =
      p.includes('hết') || p.includes('tất cả') || p.includes('all') || p.includes('toàn bộ');

    const detected = detectObjectType(p);
    const detectedType = detected?.type ?? null;
    const detectedAttrs = detected?.attrs ?? extractAttributes(p);

    if (deleteAll && detectedType) {
      const targets = objects.filter((o) => o.type === detectedType);
      if (targets.length > 0) {
        const cmd: DeleteCommand = {
          action: 'delete_object',
          object_ids: targets.map((t) => t.id),
          confidence: 1.0,
          reason: `Người dùng yêu cầu xóa tất cả ${detectedType} trong phòng`,
        };
        return {
          replyText: `✓ Đã xóa **${targets.length} ${targets[0].name || detectedType}** khỏi phòng.`,
          commands: [cmd],
          requiresPreview: false,
          requiresClarification: false,
        };
      }
    }

    if (deleteAll && !detectedType) {
      // "xóa tất cả đồ vật"
      if (objects.length > 0) {
        const cmd: DeleteCommand = {
          action: 'delete_object',
          object_ids: objects.map((o) => o.id),
          confidence: 1.0,
          reason: 'Người dùng yêu cầu xóa toàn bộ đồ vật trong phòng',
        };
        return {
          replyText: `Bạn có chắc muốn xóa toàn bộ **${objects.length} đồ vật** trong phòng?`,
          commands: [cmd],
          requiresPreview: true,
          requiresClarification: false,
        };
      }
    }

    if (detectedType) {
      const candidates = findCandidates(detectedType, detectedAttrs, p, objects, selectedObjectId);

      if (candidates.length === 0) {
        return {
          replyText: `Không tìm thấy đồ vật loại "${detectedType}" trong phòng để xóa.`,
          commands: [],
          requiresPreview: false,
          requiresClarification: false,
        };
      }

      if (candidates.length === 1) {
        const cmd: DeleteCommand = {
          action: 'delete_object',
          object_ids: [candidates[0].id],
          confidence: 0.9,
          reason: `Xóa ${candidates[0].name} theo yêu cầu`,
        };
        return {
          replyText: `✓ Đã xóa **${candidates[0].name}** khỏi phòng.`,
          commands: [cmd],
          requiresPreview: false,
          requiresClarification: false,
        };
      }

      // Multiple candidates → clarify
      const clarify: ClarifyCommand = {
        action: 'clarify',
        question: `Có ${candidates.length} đồ vật loại này trong phòng. Bạn muốn xóa cái nào?`,
        candidates: candidates.map((c) => c.id),
        confidence: 0.5,
        reason: 'Nhiều ứng viên phù hợp, cần xác nhận',
      };
      return {
        replyText: clarify.question,
        commands: [clarify],
        requiresPreview: false,
        requiresClarification: true,
      };
    }

    // No type detected → clarify
    const clarify: ClarifyCommand = {
      action: 'clarify',
      question: 'Bạn muốn xóa đồ vật nào? Vui lòng nói rõ hơn, ví dụ: "Xóa cửa sổ", "Xóa cái tủ", "Xóa chậu cây".',
      confidence: 0.3,
      reason: 'Không xác định được đồ vật cần xóa',
    };
    return {
      replyText: clarify.question,
      commands: [clarify],
      requiresPreview: false,
      requiresClarification: true,
    };
  }

  // -------------------------------------------------------------------------
  // INTENT: ROTATE
  // -------------------------------------------------------------------------
  const isRotateIntent = p.includes('xoay') || p.includes('rotate');

  if (isRotateIntent) {
    const detected = detectObjectType(p);
    const detectedType = detected?.type ?? null;
    const detectedAttrs = detected?.attrs ?? {};

    const candidates = findCandidates(detectedType, detectedAttrs, p, objects, selectedObjectId);
    const degrees = detectRotationDegrees(p);

    if (candidates.length === 0) {
      const clarify: ClarifyCommand = {
        action: 'clarify',
        question: 'Bạn muốn xoay đồ vật nào? Ví dụ: "Xoay giường 90 độ", "Xoay bàn học".',
        confidence: 0.3,
        reason: 'Không xác định được đồ vật cần xoay',
      };
      return { replyText: clarify.question, commands: [clarify], requiresPreview: false, requiresClarification: true };
    }

    if (candidates.length === 1) {
      const cmd: RotateCommand = {
        action: 'rotate_object',
        object_id: candidates[0].id,
        rotation: { axis: 'y', degrees },
        confidence: 0.9,
        reason: `Xoay ${candidates[0].name} ${degrees}°`,
      };
      return {
        replyText: `✓ Đã xoay **${candidates[0].name}** ${degrees}°.`,
        commands: [cmd],
        requiresPreview: false,
        requiresClarification: false,
      };
    }

    // Multiple candidates
    const clarify: ClarifyCommand = {
      action: 'clarify',
      question: `Có ${candidates.length} đồ vật phù hợp. Bạn muốn xoay cái nào?`,
      candidates: candidates.map((c) => c.id),
      confidence: 0.5,
      reason: 'Nhiều ứng viên phù hợp',
    };
    return { replyText: clarify.question, commands: [clarify], requiresPreview: false, requiresClarification: true };
  }

  // -------------------------------------------------------------------------
  // INTENT: MOVE
  // -------------------------------------------------------------------------
  const isMoveIntent =
    p.includes('di chuyển') || p.includes('kê') || p.includes('dời') ||
    p.includes('dịch') || p.includes('đưa') || p.includes('chuyển');

  if (isMoveIntent) {
    const detected = detectObjectType(p);
    const detectedType = detected?.type ?? null;
    const detectedAttrs = detected?.attrs ?? {};

    const candidates = findCandidates(detectedType, detectedAttrs, p, objects, selectedObjectId);
    const region = detectMoveRegion(p);
    const direction = detectMoveDirection(p);

    if (candidates.length === 0) {
      const clarify: ClarifyCommand = {
        action: 'clarify',
        question: 'Bạn muốn di chuyển đồ vật nào? Ví dụ: "Di chuyển giường sang góc trái", "Dời tủ sát tường".',
        confidence: 0.3,
        reason: 'Không xác định được đồ vật cần di chuyển',
      };
      return { replyText: clarify.question, commands: [clarify], requiresPreview: false, requiresClarification: true };
    }

    if (candidates.length === 1) {
      const cmd: MoveCommand = {
        action: 'move_object',
        object_id: candidates[0].id,
        target_region: region,
        target_direction: direction,
        confidence: region || direction ? 0.85 : 0.6,
        reason: `Di chuyển ${candidates[0].name} tới ${region || direction || 'vị trí mới'}`,
      };
      return {
        replyText: `✓ Đã di chuyển **${candidates[0].name}** tới vị trí mới hợp phong thủy.`,
        commands: [cmd],
        requiresPreview: true,
        requiresClarification: false,
      };
    }

    const clarify: ClarifyCommand = {
      action: 'clarify',
      question: `Có ${candidates.length} đồ vật phù hợp. Bạn muốn di chuyển cái nào?`,
      candidates: candidates.map((c) => c.id),
      confidence: 0.5,
      reason: 'Nhiều ứng viên phù hợp',
    };
    return { replyText: clarify.question, commands: [clarify], requiresPreview: false, requiresClarification: true };
  }

  // -------------------------------------------------------------------------
  // INTENT: ADD
  // -------------------------------------------------------------------------
  const isAddIntent =
    p.includes('thêm') || p.includes('đặt thêm') || p.includes('bổ sung') || p.includes('tạo');

  if (isAddIntent) {
    const detected = detectObjectType(p);
    if (!detected) {
      const clarify: ClarifyCommand = {
        action: 'clarify',
        question: 'Bạn muốn thêm đồ vật gì? Ví dụ: "Thêm bàn học", "Thêm cây xanh", "Thêm cửa sổ 2 cánh".',
        confidence: 0.3,
        reason: 'Không xác định loại đồ vật cần thêm',
      };
      return { replyText: clarify.question, commands: [clarify], requiresPreview: false, requiresClarification: true };
    }

    const detectedAttrs = { ...detected.attrs, ...extractAttributes(p) };
    const region = detectMoveRegion(p);

    // Default dimensions per type
    const DEFAULT_DIMS: Record<string, { width: number; length: number; height: number }> = {
      bed: { width: 1.6, length: 2.0, height: 0.5 },
      desk: { width: 1.3, length: 0.65, height: 0.75 },
      wardrobe: { width: 1.8, length: 0.6, height: 2.2 },
      chair: { width: 0.55, length: 0.55, height: 0.85 },
      mirror: { width: 0.5, length: 0.05, height: 1.7 },
      plant: { width: 0.55, length: 0.55, height: 1.1 },
      lamp: { width: 0.3, length: 0.3, height: 0.6 },
      rug: { width: 2.0, length: 1.4, height: 0.05 },
      sofa: { width: 1.6, length: 0.7, height: 0.8 },
      door: { width: 0.9, length: 0.1, height: 2.1 },
      window: { width: 1.2, length: 0.1, height: 1.2 },
      wc: { width: 0.6, length: 0.7, height: 0.9 },
      table: { width: 0.8, length: 0.8, height: 0.55 },
    };

    const OBJECT_NAMES: Record<string, string> = {
      bed: 'Giường ngủ đôi',
      desk: 'Bàn học thông minh',
      wardrobe: 'Tủ quần áo',
      chair: 'Ghế công thái học',
      mirror: 'Gương đứng toàn thân',
      plant: 'Cây xanh phong thủy',
      lamp: 'Đèn ngủ',
      rug: 'Thảm trải sàn',
      sofa: 'Ghế sofa mini',
      door: detectedAttrs.subType === 'sliding' ? 'Cửa kéo lùa' : 'Cửa mở xoay',
      window: detectedAttrs.leafCount === 2 ? 'Cửa sổ 2 cánh' : detectedAttrs.leafCount === 4 ? 'Cửa sổ 4 cánh' : 'Cửa sổ',
      wc: 'Nhà vệ sinh',
      table: 'Bàn trà',
    };

    const cmd: AddCommand = {
      action: 'add_object',
      object_type: detected.type,
      object_name: OBJECT_NAMES[detected.type] || detected.type,
      target_region: region,
      dimensions: DEFAULT_DIMS[detected.type],
      attributes: Object.keys(detectedAttrs).length > 0 ? detectedAttrs : undefined,
      confidence: 0.9,
      reason: `Thêm ${OBJECT_NAMES[detected.type] || detected.type} vào phòng`,
    };

    return {
      replyText: `✓ Đã thêm **${cmd.object_name}** vào phòng${region ? ` tại vị trí ${region}` : ''}.`,
      commands: [cmd],
      requiresPreview: false,
      requiresClarification: false,
    };
  }

  // -------------------------------------------------------------------------
  // INTENT: FENG SHUI ANALYSIS / EXPLANATION / OPTIMIZATION
  // -------------------------------------------------------------------------
  const isAnalysisIntent =
    p.includes('phân tích') || p.includes('tối ưu') || p.includes('sắp xếp') ||
    p.includes('bố trí') || p.includes('tại sao') || p.includes('vì sao') ||
    p.includes('giải thích') || p.includes('phong thủy') || p.includes('layout') ||
    p.includes('hợp phong thủy');

  if (isAnalysisIntent) {
    const score = evaluation.overallScore;
    const issues = evaluation.keyIssues.slice(0, 2).join('; ') || 'Không có vấn đề nghiêm trọng';
    return {
      replyText:
        `📊 **Phân tích phong thủy phòng ngủ** (${userProfile.guaName} · ${userProfile.element}):\n\n` +
        `• Điểm hiện tại: **${score}/100** (${evaluation.statusText})\n` +
        `• Vấn đề chính: ${issues}\n` +
        `• Hướng phòng: ${sceneState.room.direction}\n\n` +
        `Tôi có thể di chuyển, xoay, thêm hoặc xóa đồ vật theo yêu cầu của bạn để tối ưu phong thủy.`,
      commands: [],
      requiresPreview: false,
      requiresClarification: false,
    };
  }

  // -------------------------------------------------------------------------
  // DEFAULT FALLBACK
  // -------------------------------------------------------------------------
  return {
    replyText:
      `Xin chào gia chủ **${userProfile.birthYear}** (${userProfile.guaName} · ${userProfile.element})!\n\n` +
      `Điểm phong thủy hiện tại: **${evaluation.overallScore}/100** (${evaluation.statusText}).\n\n` +
      `Bạn có thể yêu cầu:\n` +
      `• *"Xóa cửa sổ"* / *"Xóa tất cả cửa"*\n` +
      `• *"Xoay giường 90 độ"*\n` +
      `• *"Di chuyển tủ sang góc trái"*\n` +
      `• *"Thêm cây xanh"*\n` +
      `• *"Phân tích phong thủy"*`,
    commands: [],
    requiresPreview: false,
    requiresClarification: false,
  };
}
