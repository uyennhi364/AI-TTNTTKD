import {
  CompassDirection,
  Gender,
  GuaElement,
  GuaGroup,
  SectorType,
  UserFengShuiProfile,
  DirectionSectorInfo,
} from '../types/fengshui';

export const DIRECTION_NAMES_VI: Record<CompassDirection, string> = {
  N: 'Bắc',
  NE: 'Đông Bắc',
  E: 'Đông',
  SE: 'Đông Nam',
  S: 'Nam',
  SW: 'Tây Nam',
  W: 'Tây',
  NW: 'Tây Bắc',
};

export const DIRECTION_ANGLES: Record<CompassDirection, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
};

export const SECTOR_NAMES_VI: Record<SectorType, string> = {
  SINH_KHI: 'Sinh Khí',
  THIEN_Y: 'Thiên Y',
  DIEN_NIEN: 'Diên Niên',
  PHUC_VI: 'Phục Vị',
  TUYET_MENH: 'Tuyệt Mệnh',
  NGU_QUY: 'Ngũ Quỷ',
  LUC_SAT: 'Lục Sát',
  HOA_HAI: 'Họa Hại',
};

export const SECTOR_MEANINGS_VI: Record<SectorType, string> = {
  SINH_KHI: 'Đại cát, thu hút tài lộc, danh tiếng, thăng quan tiến chức, năng lượng sống dồi dào',
  THIEN_Y: 'Cát lợi, nâng cao sức khỏe, trường thọ, gặp quý nhân phù trợ, giấc ngủ sâu',
  DIEN_NIEN: 'Hòa thuận, củng cố các mối quan hệ tình cảm, gia đình êm ấm, tinh thần an định',
  PHUC_VI: 'Bình an, mang lại sự vững chắc trong tâm trí, tăng cường học vấn và bản lĩnh cá nhân',
  TUYET_MENH: 'Đại hung, dễ hao tán tài lộc, suy kiệt sức khỏe, tinh thần bất an trằn trọc',
  NGU_QUY: 'Hung hiểm, thị phi, dễ gặp tranh cãi, hỏa hoạn, mất mát nguồn thu',
  LUC_SAT: 'Xáo trộn khí trường, quan hệ trắc trở, dễ mắc bệnh tật và thị phi',
  HOA_HAI: 'Kém may mắn, việc làm ăn dễ thất bại, mâu thuẫn vụn vặt thường xuyên',
};

// Classical Bát Trạch lookup table for each Gua number (1-9, excluding 5 as 5 maps to 2 for male, 8 for female)
const GUA_SECTOR_MAP: Record<number, Record<CompassDirection, SectorType>> = {
  // 1: Khảm (Thủy - Đông Tứ Mệnh)
  1: {
    SE: 'SINH_KHI',
    E: 'THIEN_Y',
    S: 'DIEN_NIEN',
    N: 'PHUC_VI',
    SW: 'TUYET_MENH',
    NE: 'NGU_QUY',
    NW: 'LUC_SAT',
    W: 'HOA_HAI',
  },
  // 2: Khôn (Thổ - Tây Tứ Mệnh)
  2: {
    NE: 'SINH_KHI',
    W: 'THIEN_Y',
    NW: 'DIEN_NIEN',
    SW: 'PHUC_VI',
    N: 'TUYET_MENH',
    SE: 'NGU_QUY',
    S: 'LUC_SAT',
    E: 'HOA_HAI',
  },
  // 3: Chấn (Mộc - Đông Tứ Mệnh)
  3: {
    S: 'SINH_KHI',
    N: 'THIEN_Y',
    SE: 'DIEN_NIEN',
    E: 'PHUC_VI',
    W: 'TUYET_MENH',
    NW: 'NGU_QUY',
    NE: 'LUC_SAT',
    SW: 'HOA_HAI',
  },
  // 4: Tốn (Mộc - Đông Tứ Mệnh)
  4: {
    N: 'SINH_KHI',
    S: 'THIEN_Y',
    E: 'DIEN_NIEN',
    SE: 'PHUC_VI',
    NE: 'TUYET_MENH',
    SW: 'NGU_QUY',
    W: 'LUC_SAT',
    NW: 'HOA_HAI',
  },
  // 6: Càn (Kim - Tây Tứ Mệnh)
  6: {
    W: 'SINH_KHI',
    NE: 'THIEN_Y',
    SW: 'DIEN_NIEN',
    NW: 'PHUC_VI',
    S: 'TUYET_MENH',
    E: 'NGU_QUY',
    N: 'LUC_SAT',
    SE: 'HOA_HAI',
  },
  // 7: Đoài (Kim - Tây Tứ Mệnh)
  7: {
    NW: 'SINH_KHI',
    SW: 'THIEN_Y',
    NE: 'DIEN_NIEN',
    W: 'PHUC_VI',
    E: 'TUYET_MENH',
    S: 'NGU_QUY',
    SE: 'LUC_SAT',
    N: 'HOA_HAI',
  },
  // 8: Cấn (Thổ - Tây Tứ Mệnh)
  8: {
    SW: 'SINH_KHI',
    NW: 'THIEN_Y',
    W: 'DIEN_NIEN',
    NE: 'PHUC_VI',
    SE: 'TUYET_MENH',
    N: 'NGU_QUY',
    E: 'LUC_SAT',
    S: 'HOA_HAI',
  },
  // 9: Ly (Hỏa - Đông Tứ Mệnh)
  9: {
    E: 'SINH_KHI',
    SE: 'THIEN_Y',
    N: 'DIEN_NIEN',
    S: 'PHUC_VI',
    NW: 'TUYET_MENH',
    W: 'NGU_QUY',
    SW: 'LUC_SAT',
    NE: 'HOA_HAI',
  },
};

const GUA_METADATA: Record<number, { name: string; element: GuaElement; group: GuaGroup }> = {
  1: { name: 'Khảm', element: 'Thủy', group: 'Đông Tứ Mệnh' },
  2: { name: 'Khôn', element: 'Thổ', group: 'Tây Tứ Mệnh' },
  3: { name: 'Chấn', element: 'Mộc', group: 'Đông Tứ Mệnh' },
  4: { name: 'Tốn', element: 'Mộc', group: 'Đông Tứ Mệnh' },
  6: { name: 'Càn', element: 'Kim', group: 'Tây Tứ Mệnh' },
  7: { name: 'Đoài', element: 'Kim', group: 'Tây Tứ Mệnh' },
  8: { name: 'Cấn', element: 'Thổ', group: 'Tây Tứ Mệnh' },
  9: { name: 'Ly', element: 'Hỏa', group: 'Đông Tứ Mệnh' },
};

/**
 * Calculates Gua (Quái số) from Birth Year and Gender according to Bát Trạch.
 */
export function calculateGua(birthYear: number, gender: Gender): number {
  // Sum digits of year until single digit
  const yearStr = birthYear.toString();
  let sum = 0;
  for (let i = 0; i < yearStr.length; i++) {
    sum += parseInt(yearStr[i], 10);
  }
  while (sum > 9) {
    let temp = 0;
    const s = sum.toString();
    for (let i = 0; i < s.length; i++) {
      temp += parseInt(s[i], 10);
    }
    sum = temp;
  }

  let gua: number;

  if (birthYear < 2000) {
    if (gender === 'male') {
      gua = 11 - sum;
    } else {
      gua = 4 + sum;
    }
  } else {
    // Born in 2000 or later
    if (gender === 'male') {
      gua = (11 - sum) - 1;
    } else {
      gua = 4 + sum + 1;
    }
  }

  // Reduce to 1-9
  while (gua > 9) {
    gua -= 9;
  }
  while (gua < 1) {
    gua += 9;
  }

  // Handle special Gua 5: Male -> 2 (Khôn), Female -> 8 (Cấn)
  if (gua === 5) {
    gua = gender === 'male' ? 2 : 8;
  }

  return gua;
}

/**
 * Builds the complete User Feng Shui Profile including 8 directions and sectors.
 */
export function getUserFengShuiProfile(birthYear: number, gender: Gender): UserFengShuiProfile {
  const guaNumber = calculateGua(birthYear, gender);
  const meta = GUA_METADATA[guaNumber];
  const sectorMap = GUA_SECTOR_MAP[guaNumber];

  const auspiciousDirections: CompassDirection[] = [];
  const inauspiciousDirections: CompassDirection[] = [];
  const directionDetails: Record<CompassDirection, DirectionSectorInfo> = {} as any;

  const allDirections: CompassDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  for (const dir of allDirections) {
    const sector = sectorMap[dir];
    const isGood = ['SINH_KHI', 'THIEN_Y', 'DIEN_NIEN', 'PHUC_VI'].includes(sector);

    if (isGood) {
      auspiciousDirections.push(dir);
    } else {
      inauspiciousDirections.push(dir);
    }

    directionDetails[dir] = {
      name: SECTOR_NAMES_VI[sector],
      type: sector,
      isGood,
      meaning: SECTOR_MEANINGS_VI[sector],
    };
  }

  return {
    birthYear,
    gender,
    guaNumber,
    guaName: meta.name,
    element: meta.element,
    group: meta.group,
    auspiciousDirections,
    inauspiciousDirections,
    directionDetails,
  };
}

/**
 * Given a point (x, z) relative to room center and room dimensions,
 * determine which 8-compass sector it falls into based on room facing direction.
 */
export function getCompassDirectionFromAngle(angleDeg: number): CompassDirection {
  // Normalize angle to 0..360
  let norm = (angleDeg % 360 + 360) % 360;

  if (norm >= 337.5 || norm < 22.5) return 'N';
  if (norm >= 22.5 && norm < 67.5) return 'NE';
  if (norm >= 67.5 && norm < 112.5) return 'E';
  if (norm >= 112.5 && norm < 157.5) return 'SE';
  if (norm >= 157.5 && norm < 202.5) return 'S';
  if (norm >= 202.5 && norm < 247.5) return 'SW';
  if (norm >= 247.5 && norm < 292.5) return 'W';
  return 'NW';
}

/**
 * Returns compass direction from room center (0,0) to object position (x, z).
 * In standard 3D world:
 * X+ is East, X- is West
 * Z- is North, Z+ is South
 */
export function getSectorFromPosition(x: number, z: number): CompassDirection {
  // Math.atan2(x, -z) gives angle from North (Z-) clockwise:
  // (0, -1) -> 0 rad (North)
  // (1, 0)  -> pi/2 (East)
  // (0, 1)  -> pi (South)
  // (-1, 0) -> -pi/2 (West)
  const angleRad = Math.atan2(x, -z);
  const angleDeg = (angleRad * 180) / Math.PI;
  return getCompassDirectionFromAngle(angleDeg);
}
