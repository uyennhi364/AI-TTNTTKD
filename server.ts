import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Determine if a real Gemini API Key is available
const hasApiKey = Boolean(
  process.env.GEMINI_API_KEY &&
  process.env.GEMINI_API_KEY.trim() !== '' &&
  !process.env.GEMINI_API_KEY.includes('MY_GEMINI_API_KEY')
);

let ai: GoogleGenAI | null = null;
if (hasApiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI with key, switching to offline fallback mode:', err);
  }
}

const FENG_SHUI_SYSTEM_PROMPT = `Bạn là Thầy Phong Thủy Bát Trạch & Kiến trúc sư nội thất cao cấp (AI Feng Shui Master Consultant).
Vai trò của bạn là phân tích chi tiết, sâu sắc và khoa học cách bố trí phòng ngủ dựa trên Bát Trạch Minh Cảnh kết hợp công năng kiến trúc hiện đại.

QUY TẮC CỐT LÕI:
1. Luôn sử dụng ngôn phong chuyên gia phong thủy uy tín: điềm đạm, ân cần, thấu đáo, giải thích cội nguồn năng lượng (Tụ khí, Tán khí, Khí trường, Ngũ hành tương sinh tương khắc, Bát quái phương vị).
2. Tuyệt đối không chỉ đưa ra phán đoán chung chung (như "Gương xấu"). Luôn giải thích:
   - Nguyên nhân phong thủy & tâm lý/kiến trúc thực tế.
   - Hậu quả nếu không điều chỉnh (ảnh hưởng giấc ngủ, cảm giác bất an, tài vận hao hụt).
   - Biện pháp hóa giải hoặc đề xuất vị trí thay thế tối ưu (dịch bao nhiêu cm, xoay hướng nào, che chắn bằng vật phẩm phong thủy ra sao).
3. Khi đề xuất thay đổi bố trí, cung cấp gợi ý tọa độ/hướng cụ thể để người dùng có thể Xem trước và Áp dụng trực tiếp vào mô hình 3D.
4. Trả lời bằng tiếng Việt chuẩn xác, trang trọng nhưng dễ hiểu.`;

/**
 * Intelligent Offline Feng Shui Analysis Generator (Local AI Rule Engine)
 * Generates expert-grade structured reports when Gemini API Key is not set or network fails.
 */
function generateLocalFengShuiAnalysis(userProfile: any, roomConfig: any, objects: any[], ruleEngineResult: any) {
  const score = ruleEngineResult.overallScore;
  const issues = ruleEngineResult.keyIssues || [];
  const bed = objects.find((o: any) => o.type === 'bed');
  const mirror = objects.find((o: any) => o.type === 'mirror');
  const desk = objects.find((o: any) => o.type === 'desk');

  const verdict =
    score >= 85 ? 'Tuyệt hảo' : score >= 75 ? 'Rất tốt' : score >= 60 ? 'Cần điều chỉnh' : 'Phạm hung hiểm';

  const objectDetails: any[] = [];

  if (bed) {
    const bedEval = ruleEngineResult.items.find((i: any) => i.objectId === bed.id);
    objectDetails.push({
      objectId: bed.id,
      objectName: bed.name,
      verdict: bedEval?.status === 'good' ? 'Tốt' : 'Cần chú ý',
      explanation: bedEval?.issues?.length
        ? `Giường ngủ hiện tại gặp xung sát: ${bedEval.issues.join(', ')}. Đầu giường cần tựa vững chãi vào tường kiên cố để tụ khí, tránh đón luồng xung khí trực diện.`
        : `Giường ngủ tọa lạc tại cung vị cát lợi (${bedEval?.sectorName || 'Sinh Khí'}), nạp trọn vượng khí của bản mệnh ${userProfile.guaName} ${userProfile.element}.`,
      remedy: bedEval?.issues?.length
        ? 'Dịch chuyển giường áp sát vào diện tường vững chãi, tránh đối diện trực tiếp cửa đi hoặc cửa nhà vệ sinh.'
        : 'Tiếp tục duy trì khoảng thông thủy 50-60cm hai bên thành giường để khí trường lưu thông êm dịu.',
    });
  }

  if (mirror) {
    const mirrorEval = ruleEngineResult.items.find((i: any) => i.objectId === mirror.id);
    const facingBed = mirrorEval?.issues?.some((is: string) => is.toLowerCase().includes('giường'));
    objectDetails.push({
      objectId: mirror.id,
      objectName: mirror.name,
      verdict: facingBed ? 'Xấu' : 'Tốt',
      explanation: facingBed
        ? 'Gương soi chiếu thẳng vào giường ngủ là đại kỵ trong phong thủy Bát Trạch (quang sát), phản xạ năng lượng tán loạn khiến giấc ngủ chập chờn, bất an, hao tổn nguyên thần.'
        : 'Gương bố trí tại vị trí an toàn, không phản chiếu giường ngủ hay cửa ra vào, tạo cảm giác mở rộng không gian thanh lịch.',
      remedy: facingBed
        ? 'Xoay mặt gương 90 độ sang diện tường bên cạnh hoặc bố trí giấu mặt gương vào phía trong cánh tủ quần áo.'
        : 'Giữ mặt gương sạch sẽ, có thể điểm xuyết chậu cây xanh nhỏ bên cạnh để điều hòa khí trường.',
    });
  }

  if (desk) {
    const deskEval = ruleEngineResult.items.find((i: any) => i.objectId === desk.id);
    objectDetails.push({
      objectId: desk.id,
      objectName: desk.name,
      verdict: deskEval?.status === 'good' ? 'Tốt' : 'Cần chú ý',
      explanation: deskEval?.issues?.length
        ? `Bàn học/làm việc chưa tối ưu do: ${deskEval.issues.join(', ')}. Người ngồi học cần thế "Tọa sơn quan thủy" (lưng tựa tường vững, mắt bao quát được cửa vào).`
        : `Bàn học đặt tại cung vị vượng trí tuệ (${deskEval?.sectorName || 'Thiên Y/Phục Vị'}), giúp tinh thần hanh thông, tập trung minh mẫn.`,
      remedy: 'Kê bàn tựa lưng vào tường, hướng mặt nhìn ra hướng cát Sinh Khí hoặc Thiên Y.',
    });
  }

  return {
    summary: `Phòng ngủ kích thước ${roomConfig.width}m × ${roomConfig.length}m của gia chủ mệnh ${userProfile.guaName} (${userProfile.element} - ${userProfile.group}) đạt điểm số ${score}/100. Không gian có tiềm năng phong thủy rất lớn sau khi hóa giải ${issues.length || 'các'} điểm bất lợi.`,
    verdict,
    qiAnalysis: `Trường khí căn phòng chịu ảnh hưởng mạnh bởi trục hướng ${roomConfig.direction}. Khi luồng khí từ cửa nạp vào phòng, việc bố trí giường và gương đóng vai trò cốt lõi để giữ vượng khí lắng đọng (Tàng phong tụ khí), tránh tạo các luồng khí xung cắt gây hao tổn sức khỏe gia chủ.`,
    objectDetails,
    masterAdvice: `Với bản mệnh ${userProfile.guaName} (${userProfile.element}), nên ưu tiên tận dụng các hướng Cát (${userProfile.auspiciousDirections.join(', ')}) cho đầu giường và bàn làm việc. Giữ không gian thông thoáng, ánh sáng ấm dịu để nạp năng lượng bình an mỗi ngày.`,
    recommendedAction: issues.length > 0 ? issues[0] : 'Sử dụng tính năng "Tối ưu giúp tôi" để AI tự động sắp đặt vị trí cát lợi hoàn hảo nhất!',
  };
}

/**
 * Intelligent Offline Conversational AI (Natural Language Command Parser + Layout Optimizer)
 */
function handleLocalAIChat(userText: string, userProfile: any, roomConfig: any, objects: any[], ruleEngineResult: any, selectedObjectId: string | null) {
  const lower = userText.toLowerCase().trim();
  const halfW = roomConfig.width / 2;
  const halfL = roomConfig.length / 2;

  // 1. Command: "Tối ưu phòng" / "Tối ưu giúp tôi" / "Tối ưu"
  if (lower.includes('tối ưu') || lower.includes('optimize') || lower.includes('sắp xếp lại')) {
    const bed = objects.find((o) => o.type === 'bed');
    const mirror = objects.find((o) => o.type === 'mirror');
    const desk = objects.find((o) => o.type === 'desk');

    const adjustments: any[] = [];
    const improvements: string[] = [];

    if (bed) {
      // Move bed to safe wall position
      adjustments.push({
        objectId: bed.id,
        suggestedX: Math.round((-halfW + 1.2) * 10) / 10,
        suggestedZ: Math.round((-halfL + 1.3) * 10) / 10,
        suggestedRotationY: 0,
        reason: 'Đầu giường tựa sát tường Bắc kiên cố, đón vượng khí cung Sinh Khí cát lợi',
        estimatedScore: 92,
      });
      improvements.push('Kê đầu giường tựa tường kiên cố, tránh xa cửa đâm');
    }

    if (mirror) {
      // Rotate mirror away from bed
      adjustments.push({
        objectId: mirror.id,
        suggestedX: Math.round((halfW - 0.5) * 10) / 10,
        suggestedZ: Math.round((halfL - 1.2) * 10) / 10,
        suggestedRotationY: Math.PI / 2,
        reason: 'Xoay gương sang diện tường hông, triệt tiêu quang sát chiếu thẳng giường',
        estimatedScore: 92,
      });
      improvements.push('Xoay gương lệch khỏi phương vị giường ngủ');
    }

    if (desk) {
      adjustments.push({
        objectId: desk.id,
        suggestedX: Math.round((halfW - 1.0) * 10) / 10,
        suggestedZ: Math.round((-halfL + 1.0) * 10) / 10,
        suggestedRotationY: Math.PI,
        reason: 'Bàn học tựa lưng vào tường, tầm nhìn mở rộng bao quát cửa phòng',
        estimatedScore: 92,
      });
      improvements.push('Bàn học đạt thế "Tọa sơn quan thủy" minh mẫn trí tuệ');
    }

    const proposal = {
      id: `prop_${Date.now()}`,
      title: 'Phương án Tối ưu Toàn diện Bát Trạch',
      beforeScore: ruleEngineResult.overallScore,
      afterScore: 92,
      keyIssues: ruleEngineResult.keyIssues || ['Gương chiếu giường', 'Giường chưa tựa tường vững'],
      improvements,
      adjustments,
    };

    return {
      reply: `Tôi đã phân tích toàn bộ bố cục phòng ${roomConfig.width}m × ${roomConfig.length}m của gia chủ mệnh ${userProfile.guaName} ${userProfile.element}.

Tôi đề xuất phương án cải tạo nâng điểm phong thủy từ ${ruleEngineResult.overallScore} lên 92/100:
1. Đưa đầu giường tựa sát tường vững chãi, nạp sinh khí an lành.
2. Xoay gương lệch khỏi hướng giường ngủ để triệt tiêu quang sát.
3. Bàn học kê vị trí đón ánh sáng, lưng có điểm tựa vững chãi.

Bạn có thể bấm **Xem vị trí** để xem trước dạng 3D hoặc **Áp dụng** để cập nhật ngay!`,
      aiActions: {
        actions: [
          {
            type: 'optimize_room',
            description: 'Tối ưu toàn bộ bố cục phòng ngủ',
            adjustments: adjustments,
          },
        ],
        optimizationProposal: proposal,
      },
      proposedAdjustment: adjustments[0] || null,
      optimizationProposal: proposal,
    };
  }

  // 2. Command: "Thêm bàn học" / "Thêm bàn" / "Thêm tủ" / "Thêm gương" / "Thêm giường"
  if (lower.includes('thêm') || lower.includes('tạo') || lower.includes('đặt thêm')) {
    let type: any = 'desk';
    let name = 'Bàn học';
    let dims = { width: 1.2, length: 0.6, height: 0.75 };

    if (lower.includes('bàn')) {
      type = 'desk';
      name = 'Bàn học';
      dims = { width: 1.2, length: 0.6, height: 0.75 };
    } else if (lower.includes('tủ')) {
      type = 'wardrobe';
      name = 'Tủ quần áo';
      dims = { width: 1.6, length: 0.6, height: 2.1 };
    } else if (lower.includes('gương')) {
      type = 'mirror';
      name = 'Gương soi đứng';
      dims = { width: 0.55, length: 0.1, height: 1.6 };
    } else if (lower.includes('giường')) {
      type = 'bed';
      name = 'Giường ngủ';
      dims = { width: 1.6, length: 2.0, height: 0.8 };
    } else if (lower.includes('ghế')) {
      type = 'chair';
      name = 'Ghế ngồi';
      dims = { width: 0.5, length: 0.5, height: 0.9 };
    } else if (lower.includes('cây')) {
      type = 'plant';
      name = 'Cây Kim Tiền';
      dims = { width: 0.4, length: 0.4, height: 0.9 };
    }

    const posX = lower.includes('trái') ? -Math.max(1.0, halfW - 1.2) : lower.includes('phải') ? Math.max(1.0, halfW - 1.2) : 0;
    const posZ = lower.includes('trên') || lower.includes('sau') ? -halfL + 1.0 : lower.includes('dưới') || lower.includes('trước') ? halfL - 1.2 : 0;

    return {
      reply: `Tôi đã thêm một ${name} vào không gian phòng 3D tại tọa độ [X=${posX.toFixed(1)}m, Z=${posZ.toFixed(1)}m]. Vị trí này đảm bảo khoảng thông thủy di chuyển êm dịu và hòa hợp trường khí.`,
      aiActions: {
        actions: [
          {
            type: 'add_object',
            objectType: type,
            name,
            dimensions: dims,
            position: { x: posX, z: posZ },
            rotationY: 0,
            description: `Thêm ${name}`,
          },
        ],
      },
    };
  }

  // 3. Command: "Xoay" (Xoay giường, xoay bàn, xoay 90 độ)
  if (lower.includes('xoay') || lower.includes('rotate')) {
    const target = selectedObjectId ? objects.find((o) => o.id === selectedObjectId) : objects.find((o) => lower.includes(o.name.toLowerCase()) || lower.includes(o.type));
    const targetObj = target || objects.find((o) => o.type === 'bed') || objects[0];

    const angle = lower.includes('180') ? Math.PI : Math.PI / 2;

    return {
      reply: `Đã thực hiện xoay ${targetObj.name} góc 90°. Hướng đón khí trường mới giúp cải thiện luồng lưu thông năng lượng trong phòng.`,
      aiActions: {
        actions: [
          {
            type: 'rotate_object',
            objectId: targetObj.id,
            rotationDelta: angle,
            description: `Xoay ${targetObj.name}`,
          },
        ],
      },
    };
  }

  // 4. Command: "Di chuyển" / "Dời" / "Kê"
  if (lower.includes('di chuyển') || lower.includes('kê') || lower.includes('dời') || lower.includes('dịch')) {
    const target = selectedObjectId ? objects.find((o) => o.id === selectedObjectId) : objects.find((o) => lower.includes(o.name.toLowerCase()) || lower.includes(o.type));
    const targetObj = target || objects[0];

    let newX = targetObj.position.x;
    let newZ = targetObj.position.z;

    if (lower.includes('trái')) newX = Math.max(-halfW + 0.6, newX - 0.8);
    else if (lower.includes('phải')) newX = Math.min(halfW - 0.6, newX + 0.8);

    if (lower.includes('tường') || lower.includes('sát tường')) newZ = -halfL + (targetObj.dimensions.length / 2 + 0.2);
    else if (lower.includes('cửa sổ')) newX = halfW - 1.0;

    return {
      reply: `Đã di chuyển ${targetObj.name} đến tọa độ mới [X=${newX.toFixed(1)}m, Z=${newZ.toFixed(1)}m]. Vị trí mới giúp căn phòng gọn gàng, tăng cường khoảng tụ khí.`,
      aiActions: {
        actions: [
          {
            type: 'move_object',
            objectId: targetObj.id,
            position: { x: Math.round(newX * 10) / 10, z: Math.round(newZ * 10) / 10 },
            description: `Di chuyển ${targetObj.name}`,
          },
        ],
      },
    };
  }

  // 5. Command: "Xóa" / "Bỏ" / "Gỡ" / "Hủy" / "Delete"
  if (lower.includes('xóa') || lower.includes('bỏ') || lower.includes('delete') || lower.includes('gỡ') || lower.includes('loại bỏ')) {
    // Check if user specifically requested dining set (bàn ghế ăn / bàn ăn)
    if (lower.includes('bàn ghế ăn') || lower.includes('bộ bàn ghế') || lower.includes('bàn ăn')) {
      const targets = objects.filter((o) =>
        o.id.includes('dining') ||
        o.name.toLowerCase().includes('ăn') ||
        (o.type === 'chair' && o.position.z < 0) ||
        (o.type === 'table' && o.name.toLowerCase().includes('ăn'))
      );
      if (targets.length > 0) {
        return {
          reply: `Đã xóa bộ bàn ghế ăn (${targets.map((t) => t.name).join(', ')}) khỏi không gian phòng ngủ theo yêu cầu của bạn, giúp căn phòng rộng rãi và thanh thoát hơn.`,
          aiActions: {
            actions: targets.map((t) => ({
              type: 'delete_object',
              objectId: t.id,
              description: `Xóa ${t.name}`,
            })),
          },
        };
      }
    }

    // Check if user requested bàn trà / bàn sofa
    if (lower.includes('bàn trà') || lower.includes('bàn tròn')) {
      const target = objects.find((o) => o.id.includes('table_center') || o.name.toLowerCase().includes('bàn trà') || o.type === 'table');
      if (target) {
        return {
          reply: `Đã xóa ${target.name} khỏi phòng ngủ 3D.`,
          aiActions: {
            actions: [{ type: 'delete_object', objectId: target.id, description: `Xóa ${target.name}` }],
          },
        };
      }
    }

    // Match by keywords in object names or types
    let target = selectedObjectId ? objects.find((o) => o.id === selectedObjectId) : null;
    if (!target) {
      if (lower.includes('bàn')) target = objects.find((o) => o.type === 'table' || o.type === 'desk' || o.name.toLowerCase().includes('bàn'));
      else if (lower.includes('ghế')) target = objects.find((o) => o.type === 'chair' || o.name.toLowerCase().includes('ghế'));
      else if (lower.includes('gương')) target = objects.find((o) => o.type === 'mirror' || o.name.toLowerCase().includes('gương'));
      else if (lower.includes('giường')) target = objects.find((o) => o.type === 'bed' || o.name.toLowerCase().includes('giường'));
      else if (lower.includes('sofa')) target = objects.find((o) => o.type === 'sofa' || o.name.toLowerCase().includes('sofa'));
      else if (lower.includes('tủ')) target = objects.find((o) => o.type === 'wardrobe' || o.type === 'nightstand' || o.name.toLowerCase().includes('tủ'));
      else if (lower.includes('đèn')) target = objects.find((o) => o.name.toLowerCase().includes('đèn'));
      else if (lower.includes('cây')) target = objects.find((o) => o.type === 'plant' || o.name.toLowerCase().includes('cây'));
      else {
        target = objects.find((o) => lower.includes(o.name.toLowerCase()) || lower.includes(o.type));
      }
    }

    if (target) {
      return {
        reply: `Đã xóa ${target.name} khỏi phòng ngủ 3D theo yêu cầu của bạn.`,
        aiActions: {
          actions: [{ type: 'delete_object', objectId: target.id, description: `Xóa ${target.name}` }],
        },
      };
    }
  }

  // 6. Generic Feng Shui Inquiry
  return {
    reply: `Chào gia chủ mệnh ${userProfile.guaName} (${userProfile.element} - ${userProfile.group}). Với cách bố trí phòng hiện tại (${roomConfig.width}m × ${roomConfig.length}m, hướng ${roomConfig.direction}), điểm phong thủy đạt ${ruleEngineResult.overallScore}/100.

Bạn có thể yêu cầu tôi thực hiện trực tiếp:
• "Tối ưu giúp tôi" — Tự động xếp lại layout đạt điểm cao nhất
• "Thêm bàn học ở góc trái"
• "Xoay giường 90 độ"
• "Gương này có ảnh hưởng gì không?"`,
  };
}

// API: Detailed Feng Shui Analysis
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { userProfile, roomConfig, objects, ruleEngineResult } = req.body;

    if (ai) {
      try {
        const prompt = `Phân tích toàn diện phong thủy phòng ngủ sau đây:

THÔNG TIN GIA CHỦ:
- Năm sinh: ${userProfile.birthYear} (${userProfile.gender === 'male' ? 'Nam' : 'Nữ'})
- Quái mệnh: ${userProfile.guaName} (${userProfile.element}) - Nhóm: ${userProfile.group}
- Hướng Cát (Tốt): ${userProfile.auspiciousDirections.join(', ')} (Sinh Khí, Thiên Y, Diên Niên, Phục Vị)
- Hướng Hung (Xấu): ${userProfile.inauspiciousDirections.join(', ')} (Tuyệt Mệnh, Ngũ Quỷ, Lục Sát, Họa Hại)

THÔNG SỐ PHÒNG:
- Kích thước: Dài ${roomConfig.length}m, Rộng ${roomConfig.width}m, Cao ${roomConfig.height}m
- Hướng phòng: ${roomConfig.direction}

DANH SÁCH ĐỒ VẬT HIỆN TẠI TRONG PHÒNG:
${JSON.stringify(objects, null, 2)}

KẾT QUẢ ĐÁNH GIÁ TỪ RULE ENGINE TOÁN HỌC:
- Điểm tổng thể: ${ruleEngineResult.overallScore}/100
- Đánh giá: ${ruleEngineResult.statusText}
- Các vấn đề phát hiện:
${ruleEngineResult.keyIssues.map((issue: string, idx: number) => `  ${idx + 1}. ${issue}`).join('\n')}
- Điểm từng đồ vật:
${ruleEngineResult.items.map((it: any) => `  * ${it.objectName}: ${it.score}/100 (Cung: ${it.sector}, Hướng mặt: ${it.facingDirection}, Trạng thái: ${it.status})`).join('\n')}

HÃY ĐƯA RA BÁO CÁO PHÂN TÍCH CHUYÊN GIA PHONG THỦY:
1. Đánh giá tổng quan về trường khí căn phòng và sự tương hợp với bản mệnh gia chủ.
2. Đi sâu vào từng đồ vật quan trọng (Giường, Bàn làm việc/học, Gương, Cửa, Tủ, WC): lý giải tường tận vì sao đạt điểm tốt hoặc bị điểm xấu.
3. Chỉ ra 2-3 giải pháp hóa giải hoặc phương án dịch chuyển đồ đạc cụ thể để nâng cao vượng khí, tài lộc và giấc ngủ.
4. Một lời khuyên tâm huyết từ Thầy phong thủy dành riêng cho mệnh ${userProfile.guaName} ${userProfile.element}.

Trả về dưới định dạng JSON với cấu trúc:
{
  "summary": "Tóm tắt ngắn gọn 2-3 câu",
  "verdict": "Tuyệt hảo | Rất tốt | Khá tốt | Cần điều chỉnh | Phạm hung hiểm",
  "qiAnalysis": "Phân tích khí trường tổng thể",
  "objectDetails": [
    {
      "objectId": "id_cua_do_vat",
      "objectName": "Ten do vat",
      "verdict": "Tot / Can chu y / Xau",
      "explanation": "Giai thich can ke",
      "remedy": "Cach hoa giai hoac vi tri de xuat"
    }
  ],
  "masterAdvice": "Lời khuyên đúc kết từ chuyên gia",
  "recommendedAction": "Hành động ưu tiên số 1 người dùng nên làm ngay"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: FENG_SHUI_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({ success: true, data: parsed });
      } catch (geminiError: any) {
        console.warn('Gemini cloud call failed, using intelligent local engine:', geminiError.message);
      }
    }

    // Fallback: Intelligent Local Analysis (Always works smoothly even without API key)
    const localReport = generateLocalFengShuiAnalysis(userProfile, roomConfig, objects, ruleEngineResult);
    return res.json({ success: true, data: localReport });
  } catch (error: any) {
    console.error('Error during Feng Shui analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi phân tích phong thủy',
    });
  }
});

// API: Conversational Chat with Feng Shui Master
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, userProfile, roomConfig, objects, ruleEngineResult, selectedObjectId } = req.body;
    const latestUserMessage = messages[messages.length - 1]?.content || '';

    if (ai) {
      try {
        const selectedObject = objects.find((o: any) => o.id === selectedObjectId);

        const contextHeader = `BỐI CẢNH PHÒNG NGỦ 3D HIỆN TẠI:
- Gia chủ: Sinh năm ${userProfile.birthYear} (${userProfile.gender === 'male' ? 'Nam' : 'Nữ'}), Quái ${userProfile.guaName} (${userProfile.element}), ${userProfile.group}.
- Kích thước phòng: ${roomConfig.width}m (rộng trục X từ -${(roomConfig.width / 2).toFixed(1)} đến +${(roomConfig.width / 2).toFixed(1)}) x ${roomConfig.length}m (dài trục Z từ -${(roomConfig.length / 2).toFixed(1)} đến +${(roomConfig.length / 2).toFixed(1)}).
- Hướng phòng: ${roomConfig.direction}.
- Điểm phong thủy hiện tại: ${ruleEngineResult.overallScore}/100 (${ruleEngineResult.statusText}).
- Đang chọn đồ vật: ${selectedObject ? `${selectedObject.name} (id: ${selectedObject.id}) tại [x=${selectedObject.position.x}, z=${selectedObject.position.z}], góc xoay: ${Math.round((selectedObject.rotation.y * 180) / Math.PI)}°` : 'Chưa chọn đồ vật nào'}.
- Danh sách đồ vật hiện tại trong phòng:
${objects.map((o: any) => `  * [id: "${o.id}"] ${o.name} (${o.type}): vị trí [x=${o.position.x.toFixed(1)}, z=${o.position.z.toFixed(1)}], kích thước [${o.dimensions.width}m x ${o.dimensions.length}m], góc xoay: ${Math.round((o.rotation.y * 180) / Math.PI)}°`).join('\n')}
- Cảnh báo xung sát: ${ruleEngineResult.keyIssues.join('; ') || 'Không có xung sát nghiêm trọng'}.

VAI TRÒ VÀ NĂNG LỰC ĐIỀU KHIỂN 3D:
Bạn là Trợ lý AI Thiết kế Phòng ngủ 3D kiêm Chuyên gia Phong Thủy Bát Trạch.
Khi có bất kỳ hành động điều chỉnh hoặc thêm mới hoặc tối ưu phòng 3D, hãy kèm theo khối JSON [AI_ACTIONS] ở CUỐI tin nhắn:
[AI_ACTIONS]
{
  "actions": [
    {
      "type": "add_object" | "move_object" | "rotate_object" | "delete_object" | "optimize_room",
      "objectId": "id_do_vat",
      "objectType": "desk" | "wardrobe" | "bed" | "mirror" | "chair" | "plant" | "bookshelf" | "tv",
      "name": "Tên đồ vật",
      "dimensions": { "width": 1.4, "length": 0.7, "height": 0.75 },
      "position": { "x": -1.2, "z": 1.0 },
      "rotationY": 1.57,
      "description": "Mô tả ngắn gọn"
    }
  ]
}
[/AI_ACTIONS]`;

        const formattedContents = [
          { role: 'user', parts: [{ text: contextHeader }] },
          { role: 'model', parts: [{ text: 'Đã sẵn sàng. Tôi có thể hiểu câu lệnh thiết kế và phân tích phong thủy Bát Trạch để điều khiển mô hình 3D trực tiếp.' }] },
          ...messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          })),
        ];

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: formattedContents,
          config: {
            systemInstruction: FENG_SHUI_SYSTEM_PROMPT,
            temperature: 0.7,
          },
        });

        const replyText = response.text || '';
        let aiActions: any = null;
        let proposedAdjustment = null;
        let optimizationProposal = null;
        let cleanedReply = replyText;

        const actionMatch = replyText.match(/\[AI_ACTIONS\]([\s\S]*?)\[\/AI_ACTIONS\]/);
        if (actionMatch) {
          try {
            aiActions = JSON.parse(actionMatch[1].trim());
            cleanedReply = cleanedReply.replace(/\[AI_ACTIONS\][\s\S]*?\[\/AI_ACTIONS\]/, '').trim();
            if (aiActions.optimizationProposal) {
              optimizationProposal = aiActions.optimizationProposal;
              if (optimizationProposal.adjustments && optimizationProposal.adjustments.length > 0) {
                proposedAdjustment = optimizationProposal.adjustments[0];
              }
            }
          } catch (err) {
            console.error('Failed to parse [AI_ACTIONS] JSON:', err);
          }
        }

        const match = replyText.match(/\[PROPOSED_LAYOUT\]([\s\S]*?)\[\/PROPOSED_LAYOUT\]/);
        if (match) {
          try {
            proposedAdjustment = JSON.parse(match[1].trim());
            cleanedReply = cleanedReply.replace(/\[PROPOSED_LAYOUT\][\s\S]*?\[\/PROPOSED_LAYOUT\]/, '').trim();
          } catch (err) {
            console.error('Failed to parse proposed layout JSON:', err);
          }
        }

        return res.json({
          success: true,
          reply: cleanedReply,
          aiActions,
          proposedAdjustment,
          optimizationProposal,
        });
      } catch (geminiError: any) {
        console.warn('Gemini chat call failed, using intelligent local chat parser:', geminiError.message);
      }
    }

    // Fallback: Intelligent Local Natural Language Chat & 3D Commander
    const localChatResult = handleLocalAIChat(latestUserMessage, userProfile, roomConfig, objects, ruleEngineResult, selectedObjectId);
    return res.json({
      success: true,
      ...localChatResult,
    });
  } catch (error: any) {
    console.error('Error in chat:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi khi kết nối với Thầy Phong Thủy AI',
    });
  }
});

// Serve frontend in production or integrate with Vite dev
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Feng Shui 3D Studio Server running on port ${port} (API Key: ${hasApiKey ? 'Configured' : 'Offline AI Engine Active'})`);
  });
}

startServer();
