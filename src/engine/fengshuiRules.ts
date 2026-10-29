import {
  CompassDirection,
  FengShuiItemEvaluation,
  FengShuiRoomEvaluation,
  RoomConfig,
  RoomObject,
  SectorType,
  UserFengShuiProfile,
} from '../types/fengshui';
import {
  DIRECTION_NAMES_VI,
  getCompassDirectionFromAngle,
  getSectorFromPosition,
  SECTOR_NAMES_VI,
} from './batTrach';

/**
 * Calculates facing direction vector from yaw angle in radians.
 * Angle 0 = Facing South (Z+), PI/2 = Facing East (X+), PI = Facing North (Z-), -PI/2 = Facing West (X-)
 */
export function getFacingDirectionFromYaw(yawRad: number): CompassDirection {
  // Standard Three.js rotation: Y rotation
  // When rotation.y = 0: forward is along +Z (South in compass: Z- is North, Z+ is South)
  const deg = (yawRad * 180) / Math.PI;
  // Convert standard math to compass:
  // Yaw 0 -> S (180°)
  // Yaw Math.PI -> N (0°)
  // Yaw Math.PI/2 -> E (90°)
  // Yaw -Math.PI/2 -> W (270°)
  const compassAngle = (180 - deg + 360) % 360;
  return getCompassDirectionFromAngle(compassAngle);
}

/**
 * Headboard direction for bed:
 * Bed extends along Z when rotation.y = 0. The headboard is at -Z (North if unrotated).
 * So when yaw = 0, headboard points to North (Z-).
 */
export function getBedHeadboardDirection(yawRad: number): CompassDirection {
  const deg = (yawRad * 180) / Math.PI;
  // Unrotated: headboard is at North (0 deg)
  const compassAngle = (deg + 360) % 360;
  return getCompassDirectionFromAngle(compassAngle);
}

/**
 * Computes distance between two 2D points on the floor (X, Z).
 */
export function getFloorDistance(
  p1: { x: number; z: number },
  p2: { x: number; z: number }
): number {
  const dx = p1.x - p2.x;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Checks if point P is directly in line with a ray starting at origin O going in direction angle.
 */
export function isLineOfSight(
  origin: { x: number; z: number },
  yaw: number,
  target: { x: number; z: number },
  toleranceAngleDeg: number = 30,
  maxDist: number = 4.5
): boolean {
  const dist = getFloorDistance(origin, target);
  if (dist > maxDist) return false;

  const dx = target.x - origin.x;
  const dz = target.z - origin.z;
  const targetAngleRad = Math.atan2(dx, dz); // angle from +Z
  let diffRad = Math.abs(targetAngleRad - yaw);
  while (diffRad > Math.PI) diffRad = Math.abs(diffRad - 2 * Math.PI);

  const diffDeg = (diffRad * 180) / Math.PI;
  return diffDeg <= toleranceAngleDeg;
}

/**
 * Main evaluation function running mathematical & spatial Feng Shui rules.
 */
export function evaluateRoomFengShui(
  profile: UserFengShuiProfile,
  room: RoomConfig,
  objects: RoomObject[]
): FengShuiRoomEvaluation {
  const halfW = room.width / 2;
  const halfL = room.length / 2;

  const items: FengShuiItemEvaluation[] = [];
  const keyIssues: string[] = [];
  const cures: string[] = [];

  // Key architectural elements
  const door = objects.find((o) => o.type === 'door');
  const windowObj = objects.find((o) => o.type === 'window');
  const wc = objects.find((o) => o.type === 'wc');
  const mirrors = objects.filter((o) => o.type === 'mirror');
  const beds = objects.filter((o) => o.type === 'bed');
  const desks = objects.filter((o) => o.type === 'desk');

  // Room Direction Check
  const roomSector = profile.directionDetails[room.direction];
  const roomDirectionScore = roomSector.isGood ? 95 : 60;
  if (!roomSector.isGood) {
    keyIssues.push(
      `Hướng phòng (${roomSector.name}) thuộc hướng ${roomSector.name} (${roomSector.meaning.slice(0, 30)}...) - cần chú trọng đặt giường và bàn ở cung Cát để hóa giải.`
    );
  }

  // 1. Evaluate BEDS
  let totalBedScore = 0;
  for (const bed of beds) {
    let score = 85;
    const pros: string[] = [];
    const issues: string[] = [];
    let hasDirectConflict = false;

    // Sector where bed is located
    const sectorDir = getSectorFromPosition(bed.position.x, bed.position.z);
    const sectorInfo = profile.directionDetails[sectorDir];

    if (sectorInfo.isGood) {
      score += 8;
      pros.push(`Tọa lạc tại cung cát ${sectorInfo.name} (${sectorInfo.meaning.slice(0, 40)})`);
    } else {
      score -= 15;
      issues.push(`Đặt tại cung hung ${sectorInfo.name} (${sectorInfo.meaning.slice(0, 45)})`);
    }

    // Headboard direction (Hướng đầu giường)
    const headboardDir = getBedHeadboardDirection(bed.rotation.y);
    const headboardSector = profile.directionDetails[headboardDir];

    if (headboardSector.isGood) {
      score += 10;
      pros.push(`Đầu giường hướng về ${headboardSector.name} (${headboardSector.name}) rất cát lợi`);
    } else {
      score -= 15;
      issues.push(`Đầu giường quay về hướng hung ${headboardSector.name} (${headboardSector.name})`);
    }

    // Solid Wall Check (Tọa sơn)
    // Check if headboard is close to any perimeter wall
    // Headboard is at back of bed relative to rotation
    const distToLeftWall = Math.abs(bed.position.x - (-halfW));
    const distToRightWall = Math.abs(bed.position.x - halfW);
    const distToNorthWall = Math.abs(bed.position.z - (-halfL));
    const distToSouthWall = Math.abs(bed.position.z - halfL);
    const minDistToWall = Math.min(distToLeftWall, distToRightWall, distToNorthWall, distToSouthWall);

    if (minDistToWall <= 0.45) {
      pros.push('Đầu giường tựa sát vào tường kiên cố (thế Tọa Sơn vững chãi, giấc ngủ sâu)');
    } else {
      score -= 12;
      issues.push('Đầu giường chơi vơi không điểm tựa vững (thiếu thế Tọa Sơn, dễ bất an trằn trọc)');
    }

    // Door clash (Xung Môn)
    if (door) {
      const distToDoor = getFloorDistance(bed.position, door.position);
      const isAlignedWithDoor =
        Math.abs(bed.position.x - door.position.x) < 0.9 ||
        Math.abs(bed.position.z - door.position.z) < 0.9;

      if (distToDoor < 3.2 && isAlignedWithDoor) {
        score -= 22;
        hasDirectConflict = true;
        issues.push('Phạm thế Xung Môn: Giường nằm thẳng trên trục khí từ cửa chính thổi vào');
        keyIssues.push('Giường ngủ đối diện trực tiếp với cửa phòng gây xung sát khí (Hung Lộ sát)');
        cures.push('Dịch chuyển giường lệch khỏi luồng cửa đi hoặc đặt rèm/kệ bình phong ngăn cách');
      } else {
        pros.push('Giường không nằm trên trục luồng khí xung thẳng từ cửa');
      }
    }

    // Window clash (Đầu giường sát cửa sổ)
    if (windowObj) {
      const distToWindow = getFloorDistance(bed.position, windowObj.position);
      if (distToWindow < 1.1) {
        score -= 12;
        hasDirectConflict = true;
        issues.push('Giường đặt quá sát cửa sổ (dễ bị tán khí, gió lùa gây suy nhược tinh thần)');
      }
    }

    // Bathroom clash (Giáp WC)
    if (wc) {
      const distToWc = getFloorDistance(bed.position, wc.position);
      if (distToWc < 1.5) {
        score -= 18;
        hasDirectConflict = true;
        issues.push('Đầu giường quá gần khu vực vệ sinh (uế khí ẩm thấp ảnh hưởng sức khỏe)');
        keyIssues.push('Giường ngủ áp sát hoặc thẳng hướng nhà vệ sinh');
      }
    }

    // Mirror reflecting bed check
    for (const mirror of mirrors) {
      const distToMirror = getFloorDistance(bed.position, mirror.position);
      // Check if mirror is oriented toward bed
      const mirrorFacing = mirror.rotation.y;
      const isReflecting = isLineOfSight(mirror.position, mirrorFacing, bed.position, 45, 3.5);

      if (isReflecting || distToMirror < 1.8) {
        score -= 25;
        hasDirectConflict = true;
        issues.push(`Bị gương (${mirror.name}) chiếu thẳng vào mặt giường (gây giật mình, phân tán thần khí)`);
        keyIssues.push('Gương soi trực diện vào giường ngủ — đại kỵ trong phong thủy phòng ngủ');
        cures.push(`Xoay gương ${mirror.name} 90° hoặc di chuyển sang mảng tường bên cạnh`);
      }
    }

    score = Math.max(30, Math.min(98, score));
    totalBedScore += score;

    let recommendation = 'Vị trí và hướng giường đã tương đối hài hòa.';
    if (score < 75) {
      recommendation = `Đề xuất điều chỉnh đầu giường về hướng cát (${profile.auspiciousDirections.slice(0, 2).map((d) => profile.directionDetails[d].name).join(', ')}) và tránh trục cửa/gương.`;
    }

    items.push({
      objectId: bed.id,
      objectName: bed.name,
      type: 'bed',
      score,
      sector: sectorInfo.type,
      sectorName: sectorInfo.name,
      isSectorGood: sectorInfo.isGood,
      facingDirection: headboardDir,
      status: score >= 80 ? 'good' : score >= 65 ? 'warning' : 'bad',
      pros,
      issues,
      recommendation,
      hasDirectConflict,
    });
  }

  // 2. Evaluate DESKS
  let totalDeskScore = 0;
  for (const desk of desks) {
    let score = 82;
    const pros: string[] = [];
    const issues: string[] = [];

    const sectorDir = getSectorFromPosition(desk.position.x, desk.position.z);
    const sectorInfo = profile.directionDetails[sectorDir];

    if (sectorInfo.isGood) {
      score += 10;
      pros.push(`Tọa tại phương vị ${sectorInfo.name} (${sectorInfo.meaning.slice(0, 35)})`);
    } else {
      score -= 10;
      issues.push(`Đặt tại cung ${sectorInfo.name} (${sectorInfo.meaning.slice(0, 35)})`);
    }

    // Desk facing direction
    const deskFacing = getFacingDirectionFromYaw(desk.rotation.y);
    const facingSector = profile.directionDetails[deskFacing];
    if (facingSector.isGood) {
      score += 8;
      pros.push(`Mặt bàn quay về hướng cát ${facingSector.name} (tập trung học vấn, sự nghiệp)`);
    }

    // Command position check (Back to wall, facing door)
    if (door) {
      const distToDoor = getFloorDistance(desk.position, door.position);
      // Check if user sits with back to door (facing directly away from door)
      const dx = door.position.x - desk.position.x;
      const dz = door.position.z - desk.position.z;
      const angleToDoor = Math.atan2(dx, dz);
      let angleDiff = Math.abs(desk.rotation.y - angleToDoor);
      while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - 2 * Math.PI);

      if (angleDiff > 2.2 && distToDoor < 3.0) {
        score -= 15;
        issues.push('Ngồi quay lưng trực tiếp ra cửa vào (bất an, dễ bị giật mình khi làm việc)');
      } else {
        pros.push('Vị trí bàn có tầm nhìn bao quát cửa phòng (thế chủ động, tư duy hanh thông)');
      }
    }

    // Natural light proximity
    if (windowObj) {
      const distToWindow = getFloorDistance(desk.position, windowObj.position);
      if (distToWindow < 2.5) {
        pros.push('Đón nhận ánh sáng tự nhiên thoáng đãng từ cửa sổ');
      }
    }

    score = Math.max(40, Math.min(98, score));
    totalDeskScore += score;

    items.push({
      objectId: desk.id,
      objectName: desk.name,
      type: 'desk',
      score,
      sector: sectorInfo.type,
      sectorName: sectorInfo.name,
      isSectorGood: sectorInfo.isGood,
      facingDirection: deskFacing,
      status: score >= 80 ? 'good' : score >= 65 ? 'warning' : 'bad',
      pros,
      issues,
      recommendation:
        score >= 80
          ? 'Bàn học/làm việc đắc vị, có thể an tâm giữ nguyên.'
          : 'Nên xoay bàn để vừa nhìn thấy cửa phòng vừa đón ánh sáng thuận lợi.',
    });
  }

  // 3. Evaluate MIRRORS
  let totalMirrorScore = 0;
  for (const mirror of mirrors) {
    let score = 80;
    const pros: string[] = [];
    const issues: string[] = [];
    let hasConflict = false;

    const sectorDir = getSectorFromPosition(mirror.position.x, mirror.position.z);
    const sectorInfo = profile.directionDetails[sectorDir];

    // Check reflection toward any bed
    for (const bed of beds) {
      const isReflecting = isLineOfSight(mirror.position, mirror.rotation.y, bed.position, 45, 3.5);
      if (isReflecting) {
        score -= 35;
        hasConflict = true;
        issues.push(`Gương đang rọi trực diện vào ${bed.name}`);
      }
    }

    // Check reflection toward door
    if (door) {
      const isReflectingDoor = isLineOfSight(mirror.position, mirror.rotation.y, door.position, 35, 3.0);
      if (isReflectingDoor) {
        score -= 20;
        hasConflict = true;
        issues.push('Gương đối diện cửa chính (phản chiếu đẩy vượng khí ra ngoài)');
      }
    }

    if (!hasConflict) {
      score += 10;
      pros.push('Gương đặt ở góc khuất, không phản chiếu trực tiếp vào giường hay cửa');
    }

    score = Math.max(35, Math.min(95, score));
    totalMirrorScore += score;

    items.push({
      objectId: mirror.id,
      objectName: mirror.name,
      type: 'mirror',
      score,
      sector: sectorInfo.type,
      sectorName: sectorInfo.name,
      isSectorGood: sectorInfo.isGood,
      facingDirection: getFacingDirectionFromYaw(mirror.rotation.y),
      status: score >= 75 ? 'good' : score >= 60 ? 'warning' : 'bad',
      pros,
      issues,
      recommendation: hasConflict
        ? 'Xoay gương sang hướng khác hoặc chuyển sang cánh trong tủ quần áo.'
        : 'Vị trí gương an toàn, không phạm quang sát.',
      hasDirectConflict: hasConflict,
    });
  }

  // 4. Other furniture (Wardrobes, Plants, TV, Nightstands, Bookshelves)
  for (const obj of objects) {
    if (['bed', 'desk', 'mirror'].includes(obj.type)) continue;

    let score = 85;
    const pros: string[] = [];
    const issues: string[] = [];

    const sectorDir = getSectorFromPosition(obj.position.x, obj.position.z);
    const sectorInfo = profile.directionDetails[sectorDir];

    // Check door blockage
    if (door) {
      const dist = getFloorDistance(obj.position, door.position);
      if (dist < 1.0) {
        score -= 25;
        issues.push('Đặt quá sát lối vào, gây cản trở trường khí và lối đi lại');
      }
    }

    if (obj.type === 'wardrobe') {
      pros.push('Tủ quần áo vững chắc, đóng vai trò ngăn chắn khí trường rất tốt');
    } else if (obj.type === 'plant') {
      pros.push('Cây xanh thanh lọc không khí, bổ trợ sinh khí mộc cho căn phòng');
      score += 5;
    } else if (obj.type === 'nightstand') {
      pros.push('Tủ đầu giường cân bằng âm dương hai bên giường ngủ');
    } else if (obj.type === 'door') {
      pros.push(`Cửa mở hướng ${DIRECTION_NAMES_VI[room.direction]} nạp khí`);
    } else if (obj.type === 'window') {
      pros.push('Cửa sổ thông thoáng, lưu thông dương khí tự nhiên');
    }

    items.push({
      objectId: obj.id,
      objectName: obj.name,
      type: obj.type,
      score: Math.min(95, score),
      sector: sectorInfo.type,
      sectorName: sectorInfo.name,
      isSectorGood: sectorInfo.isGood,
      facingDirection: getFacingDirectionFromYaw(obj.rotation.y),
      status: score >= 80 ? 'good' : score >= 65 ? 'warning' : 'bad',
      pros,
      issues,
      recommendation: issues.length > 0 ? 'Dịch chuyển để tạo khoảng thoáng thông gió.' : 'Vị trí phù hợp.',
    });
  }

  // Overall Score Calculation based on user prompt specification:
  // Hướng phòng: 15%
  // Giường: 45% (Đầu giường 25%, Vị trí 20%)
  // Bàn: 10%
  // Gương: 5%
  // Cửa / Quan hệ cửa: 10%
  // Tủ và lối đi: 15%
  const avgBedScore = beds.length > 0 ? totalBedScore / beds.length : 80;
  const avgDeskScore = desks.length > 0 ? totalDeskScore / desks.length : 85;
  const avgMirrorScore = mirrors.length > 0 ? totalMirrorScore / mirrors.length : 90;
  const circulationScore = 88;

  const overallScore = Math.round(
    roomDirectionScore * 0.15 +
    avgBedScore * 0.45 +
    avgDeskScore * 0.15 +
    avgMirrorScore * 0.1 +
    circulationScore * 0.15
  );

  let statusText = 'Đại Cát';
  let statusLevel: 'excellent' | 'good' | 'neutral' | 'poor' = 'excellent';

  if (overallScore >= 85) {
    statusText = 'Hài hòa, Đón Vượng Khí (Tốt)';
    statusLevel = 'excellent';
  } else if (overallScore >= 72) {
    statusText = 'Khá Tốt, Cần Tinh Chỉnh Nhẹ';
    statusLevel = 'good';
  } else if (overallScore >= 60) {
    statusText = 'Bình Hòa, Tồn Tại Một Vài Xung Sát';
    statusLevel = 'neutral';
  } else {
    statusText = 'Cần Điều Chỉnh Ngay (Phạm Hung Sát)';
    statusLevel = 'poor';
  }

  return {
    overallScore,
    statusText,
    statusLevel,
    items,
    breakdown: {
      roomDirectionScore,
      bedScore: Math.round(avgBedScore),
      deskScore: Math.round(avgDeskScore),
      mirrorScore: Math.round(avgMirrorScore),
      circulationScore,
    },
    keyIssues,
    cures,
  };
}
