import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { generateOptimizedLayout } from './src/engine/layoutOptimizer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load both .env.local (preferred by AI Studio / Vite) and .env
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

/**
 * Helper to obtain an active GoogleGenAI client from either:
 * 1. Request header 'x-gemini-api-key' or body 'apiKey' (configured from UI)
 * 2. Server environment GEMINI_API_KEY (.env.local or .env)
 */
function getGenAIClient(customKey?: string): GoogleGenAI | null {
  const key = (customKey || process.env.GEMINI_API_KEY || '').trim();
  if (!key || key.includes('MY_GEMINI_API_KEY')) {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI with key:', err);
    return null;
  }
}

const FENG_SHUI_SYSTEM_PROMPT = `Bạn là một AI Assistant duy nhất, đa năng, chuyên nghiệp và thân thiện. Bạn giao tiếp trực tiếp với người dùng bằng tiếng Việt tự nhiên (trừ khi người dùng yêu cầu ngôn ngữ khác).

MỤC TIÊU:
Bạn vừa là trợ lý kiến thức tổng quát, vừa là chuyên gia tư vấn phong thủy Bát Trạch, kiến trúc sư nội thất và trợ lý điều khiển phòng ngủ 3D. Không được giới hạn mọi câu hỏi vào chủ đề phòng ngủ.

PHÂN LOẠI VÀ XỬ LÝ YÊU CẦU:
1. Câu hỏi kiến thức tổng quát, công nghệ, học tập, đời sống hoặc chủ đề bên ngoài: trả lời trực tiếp như một trợ lý AI tổng quát. Không từ chối chỉ vì câu hỏi không liên quan đến phòng ngủ.
2. Câu hỏi phong thủy: giải thích rõ nguyên tắc, giả định và mức độ chắc chắn. Phân biệt quan niệm phong thủy truyền thống với kiến thức khoa học đã được kiểm chứng; không khẳng định phong thủy có thể bảo đảm sức khỏe, tài lộc hay kết quả tương lai.
3. Câu hỏi thiết kế nội thất: cân nhắc kích thước, công năng, lối đi, ánh sáng, thông gió, thẩm mỹ và thông tin thực tế của căn phòng.
4. Câu hỏi về căn phòng hiện tại: ưu tiên dùng dữ liệu BỐI CẢNH PHÒNG được cung cấp. Không tự bịa đồ vật, kích thước, tọa độ, hướng cửa hoặc kết quả đánh giá.
5. Yêu cầu thay đổi mô hình 3D: chỉ tạo hành động khi xác định được đối tượng và ý định đủ rõ. Nếu thiếu thông tin hoặc có nhiều đồ vật cùng loại, hãy hỏi lại thay vì tự chọn ngẫu nhiên.
6. Yêu cầu tối ưu toàn bộ căn phòng: không tự khẳng định đã tối ưu hoặc đã di chuyển đồ vật nếu chưa có kết quả từ bộ máy bố trí và thực thi. Hãy đề xuất phương án hoặc trả về yêu cầu có cấu trúc để hệ thống kiểm tra.

QUY TẮC HỘI THOẠI:
- Duy trì ngữ cảnh các lượt hội thoại được gửi trong request; không tuyên bố nhớ các cuộc trò chuyện không được cung cấp.
- Trả lời đúng trọng tâm, có giải thích và ví dụ khi hữu ích.
- Nếu không biết hoặc thiếu dữ liệu, nói rõ điều đó và hỏi tối đa một câu làm rõ quan trọng nhất.
- Không bịa nguồn, số liệu, kết quả phân tích hoặc khả năng đã thực hiện hành động.
- Với chủ đề có rủi ro cao (y tế, pháp lý, tài chính), cung cấp thông tin tổng quát thận trọng và khuyến nghị chuyên gia phù hợp.

ĐỊNH DẠNG HÀNH ĐỘNG 3D:
Chỉ khi người dùng thực sự yêu cầu thao tác 3D, thêm khối [AI_ACTIONS] ở cuối câu trả lời. JSON phải hợp lệ. Các loại action được phép:
- add_object: cần objectType, name; dimensions và position nếu đã biết chắc.
- move_object: cần objectId và position.
- rotate_object: cần objectId và rotationY hoặc rotationDelta.
- delete_object: cần objectId.
- optimize_room: chỉ dùng như ý định yêu cầu bộ tối ưu bố cục, không tự bịa danh sách tọa độ.

Cấu trúc ví dụ (chỉ đưa các trường thực sự biết):
[AI_ACTIONS]
{"actions":[{"type":"move_object","objectId":"id_do_vat","position":{"x":-1.2,"z":1.0},"description":"Di chuyển đồ vật"}]}
[/AI_ACTIONS]

Không đưa [AI_ACTIONS] cho câu hỏi thông tin hoặc tư vấn thông thường. Không tuyên bố hành động đã hoàn tất; backend và bộ máy 3D mới là nơi xác nhận thực thi.`;

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
 * Handles any free-form question about the room or feng shui when Gemini API is unavailable.
 */
function handleLocalAIChat(userText: string, userProfile: any, roomConfig: any, objects: any[], ruleEngineResult: any, selectedObjectId: string | null) {
  const lower = userText.toLowerCase().trim();
  const halfW = roomConfig.width / 2;
  const halfL = roomConfig.length / 2;

  // 0. "Hiển thị / Liệt kê / Cho biết / Có những gì" — list room objects
  if (
    lower.includes('hiển thị') || lower.includes('liệt kê') || lower.includes('có gì') ||
    lower.includes('có những gì') || lower.includes('danh sách') || lower.includes('cho biết') ||
    (lower.includes('đồ vật') && (lower.includes('trong phòng') || lower.includes('hiện có') || lower.includes('hiện tại'))) ||
    lower.includes('có bao nhiêu') || lower.includes('những đồ') || lower.includes('trong phòng có')
  ) {
    if (objects.length === 0) {
      return { reply: 'Hiện tại phòng ngủ của bạn chưa có đồ vật nào. Bạn có thể dùng thư viện nội thất ở phía dưới để thêm giường, bàn, gương...' };
    }
    const objectList = objects.map((o: any, i: number) => {
      const rot = Math.round((o.rotation.y * 180) / Math.PI);
      return `${i + 1}. **${o.name}** (${o.type})\n   • Vị trí: X=${o.position.x.toFixed(2)}m, Z=${o.position.z.toFixed(2)}m\n   • Kích thước: ${o.dimensions.width}m × ${o.dimensions.length}m × ${o.dimensions.height}m\n   • Góc xoay: ${rot}°`;
    }).join('\n\n');
    return {
      reply: `Phòng ngủ hiện tại có **${objects.length} đồ vật**:\n\n${objectList}\n\nĐiểm phong thủy tổng thể: **${ruleEngineResult.overallScore}/100** (${ruleEngineResult.statusText}).`,
    };
  }

  // 0b. "Điểm phong thủy / Đánh giá"
  if (
    lower.includes('điểm phong thủy') || lower.includes('bao nhiêu điểm') ||
    lower.includes('đánh giá phòng') || lower.includes('tổng điểm') || lower.includes('điểm số')
  ) {
    const issues = ruleEngineResult.keyIssues || [];
    return {
      reply: `**Điểm phong thủy hiện tại: ${ruleEngineResult.overallScore}/100** — ${ruleEngineResult.statusText}.\n\n${issues.length > 0 ? `**Các vấn đề phát hiện:**\n${issues.map((is: string, i: number) => `${i + 1}. ${is}`).join('\n')}` : 'Không có xung sát nghiêm trọng.'}\n\nBạn có muốn tôi **tối ưu tự động** để nâng điểm không?`,
    };
  }

  // 0c. "Thông tin gia chủ / Quái mệnh"
  if (
    lower.includes('quái mệnh') || lower.includes('bản mệnh') || lower.includes('thông tin gia chủ') ||
    lower.includes('sinh năm') || lower.includes('mệnh của tôi') || lower.includes('hướng tốt') || lower.includes('hướng xấu')
  ) {
    return {
      reply: `**Thông tin gia chủ:**\n• Năm sinh: ${userProfile.birthYear} (${userProfile.gender === 'male' ? 'Nam' : 'Nữ'})\n• Quái mệnh: **${userProfile.guaName}** — Ngũ hành: **${userProfile.element}**\n• Nhóm: ${userProfile.group}\n\n**Hướng cát (tốt):** ${userProfile.auspiciousDirections?.join(', ') || 'N/A'}\n**Hướng hung (xấu):** ${userProfile.inauspiciousDirections?.join(', ') || 'N/A'}\n\nĐầu giường và bàn làm việc nên hướng về các hướng cát để tối ưu vượng khí.`,
    };
  }

  // 1. Command: "Tối ưu phòng" / "Tối ưu giúp tôi" / "Tối ưu"
  if (lower.includes('tối ưu') || lower.includes('optimize') || lower.includes('sắp xếp lại')) {
    const { proposal, optimizedObjects } = generateOptimizedLayout(
      userProfile,
      roomConfig,
      objects,
      ruleEngineResult
    );

    const improvementList = proposal.improvements.map((imp: string, i: number) => `${i + 1}. ${imp}`).join('\n');
    const replyText = `Tôi đã sử dụng Layout Optimization Engine để phân tích toàn bộ ${objects.length} đồ vật trong phòng ${roomConfig.width}m × ${roomConfig.length}m của gia chủ mệnh ${userProfile.guaName} (${userProfile.element} - ${userProfile.group}).

Đề xuất phương án tối ưu hình học & phong thủy:
• Điểm phong thủy: nâng từ **${proposal.beforeScore}** lên **${proposal.afterScore}/100**
${improvementList ? `\nCác cải tiến chính:\n${improvementList}` : ''}

Bạn có thể bấm **Xem trước** để xem bóng mờ 3D hoặc bấm **Áp dụng** để cập nhật toàn bộ vị trí mới!`;

    return {
      reply: replyText,
      aiActions: {
        actions: [
          {
            type: 'optimize_room',
            description: 'Tối ưu toàn bộ bố cục phòng ngủ',
            adjustments: proposal.adjustments,
          },
        ],
        optimizationProposal: proposal,
      },
      proposedAdjustment: proposal.adjustments[0] || null,
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

  // 6. Generic reply with context — more informative offline response
  const objectNames = objects.map((o: any) => o.name).join(', ') || 'chưa có đồ vật';
  const issues = ruleEngineResult.keyIssues || [];
  return {
    reply: `Chào gia chủ mệnh ${userProfile.guaName} (${userProfile.element} — ${userProfile.group}).\n\nPhòng ngủ ${roomConfig.width}m × ${roomConfig.length}m, hướng ${roomConfig.direction} hiện có: ${objectNames}.\nĐiểm phong thủy: ${ruleEngineResult.overallScore}/100 — ${ruleEngineResult.statusText}.${issues.length > 0 ? `\nVấn đề phát hiện: ${issues[0]}` : ''}\n\nTôi có thể giúp bạn:\n• "Hiển thị đồ vật trong phòng" — xem danh sách chi tiết\n• "Tối ưu giúp tôi" — AI tự xếp layout đạt điểm cao nhất\n• "Thêm bàn học ở góc trái" — thêm đồ vật\n• "Xoay giường 90 độ" — xoay đồ vật\n• "Điểm phong thủy là bao nhiêu?" — xem đánh giá\n\n(Hãy kết nối GEMINI_API_KEY để tôi có thể trả lời bất kỳ câu hỏi tự do nào!)`,
  };
}

const GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'move_furniture',
        description: 'Di chuyển một đồ vật trong phòng ngủ 3D tới tọa độ cụ thể hoặc vị trí an toàn.',
        parameters: {
          type: 'OBJECT',
          properties: {
            objectId: { type: 'STRING', description: 'ID của đồ vật cần di chuyển (ví dụ: bed_01, desk_window, wardrobe_north...)' },
            targetX: { type: 'NUMBER', description: 'Tọa độ trục X (mét), từ -rộng/2 đến +rộng/2' },
            targetZ: { type: 'NUMBER', description: 'Tọa độ trục Z (mét), từ -dài/2 đến +dài/2' },
            reason: { type: 'STRING', description: 'Giải thích lý do kiến trúc / phong thủy của vị trí mới' },
          },
          required: ['objectId'],
        },
      },
      {
        name: 'rotate_furniture',
        description: 'Xoay một đồ vật trong phòng ngủ 3D quanh trục đứng Y.',
        parameters: {
          type: 'OBJECT',
          properties: {
            objectId: { type: 'STRING', description: 'ID của đồ vật cần xoay' },
            angleDegrees: { type: 'NUMBER', description: 'Góc xoay theo độ (ví dụ 90, 180, 270...)' },
            reason: { type: 'STRING', description: 'Lý do xoay đồ vật' },
          },
          required: ['objectId'],
        },
      },
      {
        name: 'add_furniture',
        description: 'Thêm một đồ vật nội thất mới vào phòng ngủ 3D.',
        parameters: {
          type: 'OBJECT',
          properties: {
            objectType: {
              type: 'STRING',
              description: 'Loại đồ vật: bed, desk, chair, wardrobe, mirror, plant, nightstand, sofa, table, tv, bookshelf, lamp, rug',
            },
            name: { type: 'STRING', description: 'Tên hiển thị tiếng Việt của đồ vật' },
            targetX: { type: 'NUMBER', description: 'Tọa độ X tùy chọn' },
            targetZ: { type: 'NUMBER', description: 'Tọa độ Z tùy chọn' },
            reason: { type: 'STRING', description: 'Lý do thêm đồ vật vào không gian' },
          },
          required: ['objectType'],
        },
      },
      {
        name: 'delete_furniture',
        description: 'Xóa một đồ vật ra khỏi phòng ngủ 3D.',
        parameters: {
          type: 'OBJECT',
          properties: {
            objectId: { type: 'STRING', description: 'ID của đồ vật cần xóa' },
            reason: { type: 'STRING', description: 'Lý do xóa đồ vật' },
          },
          required: ['objectId'],
        },
      },
      {
        name: 'optimize_room_layout',
        description: 'Kích hoạt Layout Optimization Engine để tự động sắp xếp lại toàn bộ nội thất trong phòng ngủ theo chuẩn phong thủy Bát Trạch và công năng kiến trúc.',
        parameters: {
          type: 'OBJECT',
          properties: {
            reason: { type: 'STRING', description: 'Lý do tối ưu phòng' },
          },
        },
      },
      {
        name: 'undo_last_action',
        description: 'Hoàn tác lại thao tác thay đổi phòng 3D vừa thực hiện khi người dùng muốn quay lại hoặc hủy thao tác.',
        parameters: {
          type: 'OBJECT',
          properties: {
            reason: { type: 'STRING', description: 'Lý do hoàn tác' },
          },
        },
      },
    ],
  },
];

// API: Check Gemini AI Status
app.get('/api/gemini/status', (req, res) => {
  const customKey = req.headers['x-gemini-api-key'] as string | undefined;
  const client = getGenAIClient(customKey);
  res.json({
    hasServerKey: Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('MY_GEMINI_API_KEY')),
    isOnline: Boolean(client),
  });
});

// API: Detailed Feng Shui Analysis
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { userProfile, roomConfig, objects, ruleEngineResult, apiKey } = req.body;
    const customKey = (req.headers['x-gemini-api-key'] as string | undefined) || apiKey;
    const aiClient = getGenAIClient(customKey);

    if (aiClient) {
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

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: FENG_SHUI_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({ success: true, data: parsed, isGeminiOnline: true });
      } catch (geminiError: any) {
        console.warn('Gemini cloud call failed, using intelligent local engine:', geminiError.message);
      }
    }

    // Fallback: Intelligent Local Analysis (Always works smoothly even without API key)
    const localReport = generateLocalFengShuiAnalysis(userProfile, roomConfig, objects, ruleEngineResult);
    return res.json({ success: true, data: localReport, isGeminiOnline: false });
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
    const { messages, userProfile, roomConfig, objects, ruleEngineResult, selectedObjectId, apiKey } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0 || typeof messages[messages.length - 1]?.content !== 'string') {
      return res.status(400).json({ success: false, error: 'Dữ liệu hội thoại không hợp lệ.' });
    }
    const safeObjects = Array.isArray(objects) ? objects : [];
    const safeProfile = userProfile || {};
    const safeRoom = roomConfig || {};
    const safeEvaluation = ruleEngineResult || { overallScore: 0, statusText: 'Chưa có đánh giá', keyIssues: [], items: [] };
    const customKey = (req.headers['x-gemini-api-key'] as string | undefined) || apiKey;
    const aiClient = getGenAIClient(customKey);
    const latestUserMessage = String(messages[messages.length - 1].content).trim();
    if (!latestUserMessage) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập nội dung câu hỏi.' });
    }

    if (aiClient) {
      try {
        const selectedObject = safeObjects.find((o: any) => o.id === selectedObjectId);

        // Context snapshot injected as the very first turn so Gemini always knows the room state
        const contextHeader = `BỐI CẢNH PHÒNG NGỦ 3D HIỆN TẠI (cập nhật thời gian thực):
- Gia chủ: Sinh năm ${safeProfile.birthYear} (${safeProfile.gender === 'male' ? 'Nam' : 'Nữ'}), Quái ${safeProfile.guaName} (${safeProfile.element}), ${safeProfile.group}.
- Hướng cát (tốt): ${safeProfile.auspiciousDirections?.join(', ') || 'N/A'}.
- Hướng hung (xấu): ${safeProfile.inauspiciousDirections?.join(', ') || 'N/A'}.
- Kích thước phòng: ${safeRoom.width}m × ${safeRoom.length}m × ${safeRoom.height}m cao.
- Hướng phòng: ${safeRoom.direction}.
- Điểm phong thủy hiện tại: ${safeEvaluation.overallScore}/100 (${safeEvaluation.statusText}).
- Đang chọn đồ vật: ${selectedObject ? `${selectedObject.name} (id: ${selectedObject.id}) tại [x=${selectedObject.position.x.toFixed(2)}, z=${selectedObject.position.z.toFixed(2)}], góc xoay: ${Math.round((selectedObject.rotation.y * 180) / Math.PI)}°` : 'Chưa chọn đồ vật nào'}.
- Danh sách ${safeObjects.length} đồ vật hiện tại trong phòng:
${safeObjects.map((o: any, idx: number) => `  ${idx + 1}. [id: "${o.id}"] ${o.name} (loại: ${o.type}): vị trí [x=${o.position.x.toFixed(2)}m, z=${o.position.z.toFixed(2)}m], kích thước [${o.dimensions.width}m × ${o.dimensions.length}m × ${o.dimensions.height}m], góc xoay: ${Math.round((o.rotation.y * 180) / Math.PI)}°`).join('\n')}
- Cảnh báo xung sát: ${safeEvaluation.keyIssues?.join('; ') || 'Không có xung sát nghiêm trọng'}.`;

        // Build full multi-turn conversation for Gemini
        const historyTurns = messages.slice(0, -1);
        const formattedContents = [
          { role: 'user', parts: [{ text: contextHeader }] },
          { role: 'model', parts: [{ text: `Đã cập nhật bối cảnh phòng. Tôi thấy phòng có ${safeObjects.length} đồ vật, điểm phong thủy ${safeEvaluation.overallScore}/100. Tôi sẵn sàng trò chuyện, giải đáp mọi câu hỏi và điều khiển mô hình 3D theo yêu cầu của gia chủ.` }] },
          ...historyTurns.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          })),
          { role: 'user', parts: [{ text: latestUserMessage }] },
        ];

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: formattedContents,
          config: {
            systemInstruction: FENG_SHUI_SYSTEM_PROMPT,
            tools: GEMINI_TOOLS as any,
            temperature: 0.7,
          },
        });

        const replyText = response.text || '';
        let aiActions: any = null;
        let proposedAdjustment = null;
        let optimizationProposal = null;
        let cleanedReply = replyText;

        // 1. Process Official Gemini Function Calls
        const functionCalls = (response as any).functionCalls || [];
        if (Array.isArray(functionCalls) && functionCalls.length > 0) {
          const parsedActions: any[] = [];
          for (const call of functionCalls) {
            const fnName = call.name;
            const args: any = call.args || {};

            if (fnName === 'move_furniture') {
              parsedActions.push({
                type: 'move_object',
                objectId: args.objectId,
                position: args.targetX !== undefined && args.targetZ !== undefined ? { x: args.targetX, z: args.targetZ } : undefined,
                description: args.reason || `Di chuyển ${args.objectId}`,
              });
            } else if (fnName === 'rotate_furniture') {
              parsedActions.push({
                type: 'rotate_object',
                objectId: args.objectId,
                rotationDelta: args.angleDegrees ? (args.angleDegrees * Math.PI) / 180 : Math.PI / 2,
                description: args.reason || `Xoay ${args.objectId} ${args.angleDegrees || 90}°`,
              });
            } else if (fnName === 'add_furniture') {
              parsedActions.push({
                type: 'add_object',
                objectType: args.objectType,
                name: args.name,
                position: args.targetX !== undefined && args.targetZ !== undefined ? { x: args.targetX, z: args.targetZ } : undefined,
                description: args.reason || `Thêm ${args.name || args.objectType}`,
              });
            } else if (fnName === 'delete_furniture') {
              parsedActions.push({
                type: 'delete_object',
                objectId: args.objectId,
                description: args.reason || `Xóa đồ vật ${args.objectId}`,
              });
            } else if (fnName === 'optimize_room_layout') {
              const { proposal } = generateOptimizedLayout(safeProfile, safeRoom, safeObjects, safeEvaluation);
              optimizationProposal = proposal;
              proposedAdjustment = proposal.adjustments[0] || null;
              parsedActions.push({
                type: 'optimize_room',
                description: args.reason || 'Tối ưu toàn bộ bố cục phòng ngủ theo Bát Trạch',
                adjustments: proposal.adjustments,
              });
            } else if (fnName === 'undo_last_action') {
              parsedActions.push({
                type: 'undo_action',
                description: args.reason || 'Hoàn tác thao tác trước',
              });
            }
          }

          if (parsedActions.length > 0) {
            aiActions = {
              actions: parsedActions,
              ...(optimizationProposal ? { optimizationProposal } : {}),
            };
          }
        }

        // 2. Secondary Regex Fallback (in case Gemini formats JSON in text blocks)
        const actionMatch = replyText.match(/\[AI_ACTIONS\]([\s\S]*?)\[\/AI_ACTIONS\]/);
        if (actionMatch && !aiActions) {
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
        if (match && !proposedAdjustment) {
          try {
            proposedAdjustment = JSON.parse(match[1].trim());
            cleanedReply = cleanedReply.replace(/\[PROPOSED_LAYOUT\][\s\S]*?\[\/PROPOSED_LAYOUT\]/, '').trim();
          } catch (err) {
            console.error('Failed to parse proposed layout JSON:', err);
          }
        }

        // If Gemini made function calls but returned empty text, generate a clear polite summary
        if (!cleanedReply && aiActions?.actions?.length) {
          const actionSummary = aiActions.actions.map((a: any) => `• ${a.description}`).join('\n');
          cleanedReply = `Tôi đã thực thi các điều chỉnh theo yêu cầu của bạn:\n${actionSummary}\n\nMô hình 3D đã được cập nhật an toàn.`;
        }

        return res.json({
          success: true,
          reply: cleanedReply || 'Đã phân tích yêu cầu của bạn.',
          aiActions,
          proposedAdjustment,
          optimizationProposal,
          isGeminiOnline: true,
        });
      } catch (geminiError: any) {
        console.warn('Gemini chat call failed, using intelligent local chat parser:', geminiError.message);
      }
    }

    // Fallback: Intelligent Local Natural Language Chat & 3D Commander
    const localChatResult = handleLocalAIChat(latestUserMessage, safeProfile, safeRoom, safeObjects, safeEvaluation, selectedObjectId);
    return res.json({
      success: true,
      ...localChatResult,
      isGeminiOnline: false,
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

  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('MY_GEMINI_API_KEY'));
  app.listen(port, () => {
    console.log(`Feng Shui 3D Studio Server running on port ${port} (API Key: ${hasApiKey ? 'Configured' : 'Offline AI Engine Active'})`);
  });
}

startServer();
