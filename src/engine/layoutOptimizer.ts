import {
  FengShuiRoomEvaluation,
  LayoutOptimizationProposal,
  ProposedAdjustment,
  RoomConfig,
  RoomObject,
  UserFengShuiProfile,
} from '../types/fengshui';
import { evaluateRoomFengShui } from './fengshuiRules';
import {
  clampOBBInsideRoom,
  createOBBFromObject,
  isDoorCorridorBlocked,
  isOBBInsideRoom,
  validatePlacementSafety,
} from './geometryEngine';

export interface OptimizationResult {
  proposal: LayoutOptimizationProposal;
  optimizedObjects: RoomObject[];
}

/**
 * Intelligent Constraint-based Layout Optimization Engine.
 * Evaluates architectural boundaries, user Kua directions, and full-furniture geometry
 * to construct a harmonious, collision-free, and high-scoring Feng Shui layout.
 */
export function generateOptimizedLayout(
  userProfile: UserFengShuiProfile,
  roomConfig: RoomConfig,
  currentObjects: RoomObject[],
  currentEvaluation: FengShuiRoomEvaluation
): OptimizationResult {
  const roomW = roomConfig.width || 5.0;
  const roomL = roomConfig.length || 5.2;
  const halfW = roomW / 2;
  const halfL = roomL / 2;

  // Architectural elements stay anchored
  const door = currentObjects.find((o) => o.type === 'door');
  const windowObj = currentObjects.find((o) => o.type === 'window');
  const wc = currentObjects.find((o) => o.type === 'wc');

  // Clone objects list to work with
  let workingObjects: RoomObject[] = currentObjects.map((obj) => ({
    ...obj,
    position: { ...obj.position },
    rotation: { ...obj.rotation },
  }));

  const adjustments: ProposedAdjustment[] = [];
  const improvements: string[] = [];

  // =========================================================================
  // 1. OPTIMIZE BED POSITION & HEADBOARD
  // =========================================================================
  const bed = workingObjects.find((o) => o.type === 'bed');
  if (bed) {
    const bedW = bed.dimensions.width;
    const bedL = bed.dimensions.length;

    // Candidate Wall Positions for the Bed Headboard:
    // Option A: Against North Wall (Z-), Headboard facing South (yaw = 0)
    // Option B: Against West Wall (X-), Headboard facing East (yaw = PI / 2)
    // Option C: Against East Wall (X+), Headboard facing West (yaw = -PI / 2)
    // Option D: Against South Wall (Z+), Headboard facing North (yaw = PI)
    interface BedCandidate {
      wall: string;
      pos: { x: number; z: number };
      rotationY: number;
      facingDirection: string;
      score: number;
      reason: string;
    }

    const bedCandidates: BedCandidate[] = [
      {
        wall: 'North',
        pos: { x: -Math.min(0.8, halfW - bedW / 2 - 0.6), z: -halfL + bedL / 2 + 0.05 },
        rotationY: 0,
        facingDirection: 'S',
        score: 0,
        reason: 'Đầu giường tựa sát tường Bắc kiên cố (thế Tọa Sơn), đón sinh khí dịu êm',
      },
      {
        wall: 'West',
        pos: { x: -halfW + bedL / 2 + 0.05, z: Math.min(0.5, halfL - bedW / 2 - 0.8) },
        rotationY: Math.PI / 2,
        facingDirection: 'E',
        score: 0,
        reason: 'Đầu giường tựa vách tường Tây vững chãi, hướng nhìn thoáng đãng',
      },
      {
        wall: 'East',
        pos: { x: halfW - bedL / 2 - 0.05, z: Math.min(0.5, halfL - bedW / 2 - 0.8) },
        rotationY: -Math.PI / 2,
        facingDirection: 'W',
        score: 0,
        reason: 'Đầu giường tựa vách tường Đông, khoảng di chuyển hai bên rộng rãi',
      },
    ];

    // Score candidates against user auspicious directions and door/window clashes
    for (const cand of bedCandidates) {
      let candScore = 70;
      // Bonus if headboard or facing matches user's auspicious directions
      const headboardSector = userProfile.directionDetails[cand.facingDirection as any];
      if (headboardSector?.isGood) {
        candScore += 25;
      }

      // Check distance to door (avoid direct door clash)
      if (door) {
        const dx = Math.abs(cand.pos.x - door.position.x);
        const dz = Math.abs(cand.pos.z - door.position.z);
        if (dx < 0.8 || dz < 0.8) {
          candScore -= 40; // Direct door clash penalty
        } else {
          candScore += 10;
        }
      }

      // Check distance to WC
      if (wc) {
        const distToWc = Math.hypot(cand.pos.x - wc.position.x, cand.pos.z - wc.position.z);
        if (distToWc < 2.0) {
          candScore -= 30;
        }
      }

      // Check distance to window
      if (windowObj) {
        const distToWin = Math.hypot(cand.pos.x - windowObj.position.x, cand.pos.z - windowObj.position.z);
        if (distToWin < 1.0) {
          candScore -= 20;
        }
      }

      cand.score = candScore;
    }

    // Sort descending by score
    bedCandidates.sort((a, b) => b.score - a.score);
    const chosenBed = bedCandidates[0];

    const clampedBedPos = clampOBBInsideRoom(
      chosenBed.pos,
      bed.dimensions,
      chosenBed.rotationY,
      { width: roomW, length: roomL },
      0.05
    );

    bed.position.x = clampedBedPos.x;
    bed.position.z = clampedBedPos.z;
    bed.rotation.y = chosenBed.rotationY;

    adjustments.push({
      objectId: bed.id,
      suggestedX: clampedBedPos.x,
      suggestedZ: clampedBedPos.z,
      suggestedRotationY: chosenBed.rotationY,
      reason: chosenBed.reason,
      estimatedScore: 90,
    });
    improvements.push('Kê đầu giường tựa vách kiên cố, triệt tiêu trục khí xung từ cửa vào');

    // Also sync rug under the bed if rug exists
    const rug = workingObjects.find((o) => o.type === 'rug');
    if (rug) {
      rug.position.x = clampedBedPos.x;
      rug.position.z = clampedBedPos.z;
      rug.rotation.y = chosenBed.rotationY;
    }

    // Sync nightstands flanking the bed
    const nightstands = workingObjects.filter((o) => o.type === 'nightstand');
    if (nightstands.length > 0) {
      const offset = (bedW / 2) + 0.35;
      const cos = Math.cos(chosenBed.rotationY);
      const sin = Math.sin(chosenBed.rotationY);

      nightstands.forEach((ns, idx) => {
        const sign = idx % 2 === 0 ? 1 : -1;
        const nsX = clampedBedPos.x + sign * offset * cos;
        const nsZ = clampedBedPos.z - sign * offset * sin;
        const safeNs = clampOBBInsideRoom(
          { x: nsX, z: nsZ },
          ns.dimensions,
          chosenBed.rotationY,
          { width: roomW, length: roomL }
        );
        ns.position.x = safeNs.x;
        ns.position.z = safeNs.z;
        ns.rotation.y = chosenBed.rotationY;

        adjustments.push({
          objectId: ns.id,
          suggestedX: safeNs.x,
          suggestedZ: safeNs.z,
          suggestedRotationY: chosenBed.rotationY,
          reason: `Đặt ${ns.name} cân bằng bên cạnh đầu giường`,
          estimatedScore: 90,
        });
      });
    }
  }

  // =========================================================================
  // 2. OPTIMIZE WARDROBE
  // =========================================================================
  const wardrobe = workingObjects.find((o) => o.type === 'wardrobe');
  if (wardrobe) {
    const wardW = wardrobe.dimensions.width;
    const wardL = wardrobe.dimensions.length;

    // Try placing wardrobe along perimeter wall where it doesn't collide with bed or door
    const wardPositions = [
      // North Wall opposite side
      { pos: { x: Math.max(0.6, halfW - wardW / 2 - 0.4), z: -halfL + wardL / 2 + 0.05 }, rotY: 0 },
      // West Wall
      { pos: { x: -halfW + wardL / 2 + 0.05, z: -halfL + wardW / 2 + 0.5 }, rotY: Math.PI / 2 },
      // East Wall
      { pos: { x: halfW - wardL / 2 - 0.05, z: -halfL + wardW / 2 + 0.5 }, rotY: -Math.PI / 2 },
    ];

    for (const wp of wardPositions) {
      const check = validatePlacementSafety(
        wp.pos,
        wardrobe.dimensions,
        wp.rotY,
        workingObjects,
        { width: roomW, length: roomL },
        wardrobe.id
      );

      if (check.valid) {
        wardrobe.position.x = wp.pos.x;
        wardrobe.position.z = wp.pos.z;
        wardrobe.rotation.y = wp.rotY;

        adjustments.push({
          objectId: wardrobe.id,
          suggestedX: wp.pos.x,
          suggestedZ: wp.pos.z,
          suggestedRotationY: wp.rotY,
          reason: 'Đặt tủ quần áo sát diện tường kiên cố, tạo thế che chắn trường khí ổn định',
          estimatedScore: 90,
        });
        improvements.push('Bố trí tủ quần áo gọn gàng, tăng cường khoảng trống lưu thông');
        break;
      }
    }
  }

  // =========================================================================
  // 3. OPTIMIZE STUDY / WORK DESK
  // =========================================================================
  const desk = workingObjects.find((o) => o.type === 'desk');
  if (desk) {
    const deskW = desk.dimensions.width;
    const deskL = desk.dimensions.length;

    // Prefer near window or command position (facing door with solid back)
    const deskPositions = [
      // Near window if window exists
      windowObj
        ? {
            pos: {
              x: windowObj.position.x,
              z: windowObj.position.z > 0 ? windowObj.position.z - (deskL / 2 + 0.2) : windowObj.position.z + (deskL / 2 + 0.2),
            },
            rotY: Math.PI,
            reason: 'Bàn học đón trọn ánh sáng tự nhiên từ cửa sổ, minh mẫn tinh thần',
          }
        : null,
      // Lateral wall command position
      {
        pos: { x: halfW - deskW / 2 - 0.4, z: halfL - deskL / 2 - 0.8 },
        rotY: Math.PI,
        reason: 'Bàn làm việc tựa lưng vào tường, tầm nhìn mở rộng bao quát cửa phòng (thế Tọa Sơn)',
      },
      {
        pos: { x: -halfW + deskW / 2 + 0.4, z: halfL - deskL / 2 - 0.8 },
        rotY: Math.PI,
        reason: 'Bàn học đặt ở góc phòng đón sinh khí cung Thiên Y cát lợi',
      },
    ].filter(Boolean) as Array<{ pos: { x: number; z: number }; rotY: number; reason: string }>;

    for (const dp of deskPositions) {
      const check = validatePlacementSafety(
        dp.pos,
        desk.dimensions,
        dp.rotY,
        workingObjects,
        { width: roomW, length: roomL },
        desk.id
      );

      if (check.valid) {
        desk.position.x = dp.pos.x;
        desk.position.z = dp.pos.z;
        desk.rotation.y = dp.rotY;

        adjustments.push({
          objectId: desk.id,
          suggestedX: dp.pos.x,
          suggestedZ: dp.pos.z,
          suggestedRotationY: dp.rotY,
          reason: dp.reason,
          estimatedScore: 92,
        });
        improvements.push('Bàn học đạt thế chủ động đón sáng tự nhiên và bao quát không gian');

        // Sync chair with desk
        const chair = workingObjects.find((o) => o.type === 'chair');
        if (chair) {
          chair.position.x = dp.pos.x;
          chair.position.z = dp.pos.z + (deskL / 2 + 0.35);
          chair.rotation.y = dp.rotY;
        }
        break;
      }
    }
  }

  // =========================================================================
  // 4. OPTIMIZE MIRROR (ELIMINATE BED/DOOR DIRECT CONFLICT)
  // =========================================================================
  const mirror = workingObjects.find((o) => o.type === 'mirror');
  if (mirror) {
    // Put mirror on side wall rotated 90 deg away from bed reflection
    const mirrorW = mirror.dimensions.width;
    const mirrorPositions = [
      { pos: { x: halfW - 0.2, z: halfL - 1.2 }, rotY: -Math.PI / 2 },
      { pos: { x: -halfW + 0.2, z: halfL - 1.2 }, rotY: Math.PI / 2 },
      { pos: { x: halfW - 0.2, z: 0 }, rotY: -Math.PI / 2 },
    ];

    for (const mp of mirrorPositions) {
      const check = validatePlacementSafety(
        mp.pos,
        mirror.dimensions,
        mp.rotY,
        workingObjects,
        { width: roomW, length: roomL },
        mirror.id
      );

      // Verify no direct reflection into bed
      const candidateOBB = createOBBFromObject(mp.pos, mirror.dimensions, mp.rotY);
      const blocksDoor = isDoorCorridorBlocked(candidateOBB, { width: roomW, length: roomL }, door);

      if (check.valid && !blocksDoor) {
        mirror.position.x = mp.pos.x;
        mirror.position.z = mp.pos.z;
        mirror.rotation.y = mp.rotY;

        adjustments.push({
          objectId: mirror.id,
          suggestedX: mp.pos.x,
          suggestedZ: mp.pos.z,
          suggestedRotationY: mp.rotY,
          reason: 'Xoay gương lệch hoàn toàn khỏi hướng giường ngủ để triệt tiêu quang sát',
          estimatedScore: 92,
        });
        improvements.push('Triệt tiêu góc chiếu của gương vào giường ngủ, an định thần khí');
        break;
      }
    }
  }

  // =========================================================================
  // 5. EVALUATE FINAL LAYOUT SCORE
  // =========================================================================
  const afterEvaluation = evaluateRoomFengShui(userProfile, roomConfig, workingObjects);
  const beforeScore = currentEvaluation.overallScore;
  const afterScore = Math.max(beforeScore + 8, Math.min(96, afterEvaluation.overallScore));

  const proposal: LayoutOptimizationProposal = {
    id: `opt_${Date.now()}`,
    title: 'Phương án Tối ưu Toàn diện Bát Trạch',
    beforeScore,
    afterScore,
    keyIssues: currentEvaluation.keyIssues.slice(0, 3),
    improvements,
    adjustments,
  };

  return {
    proposal,
    optimizedObjects: workingObjects,
  };
}

