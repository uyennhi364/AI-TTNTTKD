export type Gender = 'male' | 'female';

export type CompassDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export type SectorType =
  | 'SINH_KHI'    // Sinh Khí (Cát)
  | 'THIEN_Y'     // Thiên Y (Cát)
  | 'DIEN_NIEN'   // Diên Niên (Cát)
  | 'PHUC_VI'     // Phục Vị (Cát)
  | 'TUYET_MENH'  // Tuyệt Mệnh (Hung)
  | 'NGU_QUY'     // Ngũ Quỷ (Hung)
  | 'LUC_SAT'     // Lục Sát (Hung)
  | 'HOA_HAI';    // Họa Hại (Hung)

export type GuaElement = 'Kim' | 'Mộc' | 'Thủy' | 'Hỏa' | 'Thổ';
export type GuaGroup = 'Đông Tứ Mệnh' | 'Tây Tứ Mệnh';

export interface DirectionSectorInfo {
  name: string;
  type: SectorType;
  isGood: boolean;
  meaning: string;
}

export interface UserFengShuiProfile {
  birthYear: number;
  gender: Gender;
  guaNumber: number; // 1 to 9
  guaName: string; // Khảm, Khôn, Chấn, Tốn, Càn, Đoài, Cấn, Ly
  element: GuaElement;
  group: GuaGroup;
  auspiciousDirections: CompassDirection[];
  inauspiciousDirections: CompassDirection[];
  directionDetails: Record<CompassDirection, DirectionSectorInfo>;
}

export interface RoomConfig {
  width: number;  // Width in meters (X axis)
  length: number; // Length in meters (Z axis)
  height: number; // Height in meters (Y axis)
  direction: CompassDirection; // Room facing direction
}

export type RoomObjectType =
  | 'bed'
  | 'desk'
  | 'wardrobe'
  | 'chair'
  | 'mirror'
  | 'nightstand'
  | 'plant'
  | 'tv'
  | 'bookshelf'
  | 'door'
  | 'window'
  | 'wc'
  | 'sofa'
  | 'table'
  | 'kitchen'
  | 'lamp'
  | 'rug'
  | 'painting'
  | 'curtain';

export interface RoomObject {
  id: string;
  type: RoomObjectType;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number }; // radians
  dimensions: { width: number; length: number; height: number }; // meters
  color?: string;
  subType?: string; // e.g. 'double_1m6', 'double_1m8', 'single'
}

export interface FengShuiItemEvaluation {
  objectId: string;
  objectName: string;
  type: RoomObjectType;
  score: number;
  sector: SectorType;
  sectorName: string;
  isSectorGood: boolean;
  facingDirection: CompassDirection;
  status: 'good' | 'warning' | 'bad';
  pros: string[];
  issues: string[];
  recommendation: string;
  hasDirectConflict?: boolean;
}

export interface FengShuiRoomEvaluation {
  overallScore: number;
  statusText: string;
  statusLevel: 'excellent' | 'good' | 'neutral' | 'poor';
  items: FengShuiItemEvaluation[];
  breakdown: {
    roomDirectionScore: number;
    bedScore: number;
    deskScore: number;
    mirrorScore: number;
    circulationScore: number;
  };
  keyIssues: string[];
  cures: string[];
}

export interface ProposedAdjustment {
  objectId: string;
  suggestedX: number;
  suggestedZ: number;
  suggestedRotationY: number;
  reason: string;
  estimatedScore: number;
}

export interface AIActionCommand {
  type: 'add_object' | 'move_object' | 'rotate_object' | 'delete_object' | 'optimize_room' | 'select_object' | 'undo_action';
  objectType?: RoomObjectType;
  objectId?: string;
  name?: string;
  dimensions?: { width: number; length: number; height: number };
  position?: { x: number; z: number };
  rotationY?: number;
  rotationDelta?: number;
  description?: string;
  adjustments?: ProposedAdjustment[];
}

export interface LayoutOptimizationProposal {
  id: string;
  title: string;
  beforeScore: number;
  afterScore: number;
  keyIssues: string[];
  improvements: string[];
  adjustments: ProposedAdjustment[];
  createdObjects?: RoomObject[];
}
