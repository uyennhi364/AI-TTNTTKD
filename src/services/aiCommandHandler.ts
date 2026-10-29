import { RoomConfig, RoomObject, RoomObjectType } from '../types/fengshui';

export interface AICommand {
  type: 'add_object' | 'move_object' | 'rotate_object' | 'delete_object' | 'update_object';
  objectId?: string;
  objectType?: RoomObjectType;
  name?: string;
  dimensions?: { width: number; length: number; height: number };
  position?: { x: number; y: number; z: number };
  rotationDelta?: number;
  rotationY?: number;
  description?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  sanitizedCommand?: AICommand;
}

/**
 * Checks if two 2D oriented bounding boxes overlap on the floor plane (X, Z).
 */
function checkFurnitureOverlap(
  pos1: { x: number; z: number },
  dim1: { width: number; length: number },
  pos2: { x: number; z: number },
  dim2: { width: number; length: number },
  margin: number = 0.05
): boolean {
  const halfW1 = dim1.width / 2 - margin;
  const halfL1 = dim1.length / 2 - margin;
  const halfW2 = dim2.width / 2 - margin;
  const halfL2 = dim2.length / 2 - margin;

  const overlapX = Math.abs(pos1.x - pos2.x) < halfW1 + halfW2;
  const overlapZ = Math.abs(pos1.z - pos2.z) < halfL1 + halfL2;

  return overlapX && overlapZ;
}

/**
 * Safety Validator for all AI-generated 3D commands.
 * Ensures no objects clip outside room walls, intersect other furniture, or block door clearance.
 */
export function validateAICommand(
  rawAction: any,
  roomConfig: RoomConfig,
  objects: RoomObject[]
): ValidationResult {
  if (!rawAction || typeof rawAction !== 'object') {
    return { valid: false, error: 'Lệnh không hợp lệ (phải là object JSON).' };
  }

  // Normalize action type (supports both lower-case and UPPERCASE like ADD_OBJECT)
  const rawType = String(rawAction.type || rawAction.action || '').toLowerCase();
  const type = rawType.startsWith('add')
    ? 'add_object'
    : rawType.startsWith('move')
      ? 'move_object'
      : rawType.startsWith('rotate')
        ? 'rotate_object'
        : rawType.startsWith('delete')
          ? 'delete_object'
          : rawType.startsWith('update')
            ? 'update_object'
            : null;

  if (!type) {
    return { valid: false, error: `Thao tác không được hỗ trợ: ${rawAction.type || rawAction.action}` };
  }

  const roomW = roomConfig.width || 5.0;
  const roomL = roomConfig.length || 5.2;
  const halfW = roomW / 2;
  const halfL = roomL / 2;

  // Clamps position inside room boundaries considering furniture dimensions
  const clampInsideRoom = (
    targetX: number,
    targetZ: number,
    itemDim: { width: number; length: number }
  ) => {
    const margin = 0.15;
    const maxBoundX = Math.max(0, halfW - itemDim.width / 2 - margin);
    const maxBoundZ = Math.max(0, halfL - itemDim.length / 2 - margin);

    const clampedX = Math.min(maxBoundX, Math.max(-maxBoundX, Number(targetX) || 0));
    const clampedZ = Math.min(maxBoundZ, Math.max(-maxBoundZ, Number(targetZ) || 0));

    return {
      x: Math.round(clampedX * 100) / 100,
      y: 0,
      z: Math.round(clampedZ * 100) / 100,
    };
  };

  // Door swing clearance check (East wall door opening around z = -0.2m, x = halfW)
  const isDoorCorridorBlocked = (pos: { x: number; z: number }, dim: { width: number; length: number }) => {
    const doorCenterZ = -0.2;
    const doorCorridorX = halfW - 1.0;
    // If object is placed directly in the 1m zone inside the entrance door
    return pos.x > doorCorridorX && Math.abs(pos.z - doorCenterZ) < (dim.length / 2 + 0.6);
  };

  switch (type) {
    case 'add_object': {
      const objType = (rawAction.objectType || 'plant') as RoomObjectType;
      const defaultDims: Record<string, { width: number; length: number; height: number }> = {
        desk: { width: 1.3, length: 0.65, height: 0.75 },
        chair: { width: 0.55, length: 0.55, height: 0.85 },
        wardrobe: { width: 1.8, length: 0.6, height: 2.2 },
        bed: { width: 1.6, length: 2.0, height: 0.95 },
        mirror: { width: 0.55, length: 0.15, height: 1.65 },
        plant: { width: 0.5, length: 0.5, height: 0.9 },
        nightstand: { width: 0.5, length: 0.45, height: 0.5 },
        sofa: { width: 1.6, length: 0.8, height: 0.75 },
        table: { width: 0.8, length: 0.8, height: 0.5 },
      };

      const dim = rawAction.dimensions || defaultDims[objType] || { width: 0.8, length: 0.8, height: 0.75 };
      let safePos = clampInsideRoom(rawAction.position?.x ?? 0, rawAction.position?.z ?? 0, dim);

      // Check collision with existing objects
      let collisionDetected = false;
      for (const obj of objects) {
        if (checkFurnitureOverlap(safePos, dim, obj.position, obj.dimensions)) {
          collisionDetected = true;
          // Offset slightly to resolve collision
          safePos = clampInsideRoom(safePos.x + 0.6, safePos.z + 0.6, dim);
          break;
        }
      }

      // Check door corridor
      if (isDoorCorridorBlocked(safePos, dim)) {
        safePos.x -= 0.8; // Shift away from doorway
      }

      const sanitized: AICommand = {
        type: 'add_object',
        objectType: objType,
        name: rawAction.name || (objType === 'desk' ? 'Bàn học/làm việc' : objType === 'chair' ? 'Ghế công thái học' : objType === 'plant' ? 'Cây xanh phong thủy' : 'Đồ vật mới'),
        dimensions: dim,
        position: safePos,
        rotationY: Number(rawAction.rotationY) || 0,
        description: rawAction.description || `Thêm ${objType} vào phòng`,
      };

      return {
        valid: true,
        warning: collisionDetected ? 'Vị trí đã được AI tinh chỉnh nhẹ để tránh va chạm với đồ đạc sẵn có.' : undefined,
        sanitizedCommand: sanitized,
      };
    }

    case 'move_object': {
      if (!rawAction.objectId) {
        return { valid: false, error: 'Thiếu objectId cho thao tác di chuyển.' };
      }

      const existing = objects.find((o) => o.id === rawAction.objectId);
      if (!existing) {
        return { valid: false, error: `Không tìm thấy đồ vật với ID: "${rawAction.objectId}".` };
      }

      const rawX = rawAction.position?.x ?? existing.position.x;
      const rawZ = rawAction.position?.z ?? existing.position.z;
      let safePos = clampInsideRoom(rawX, rawZ, existing.dimensions);

      // Check collision with other objects (excluding self)
      for (const other of objects) {
        if (other.id !== existing.id) {
          if (checkFurnitureOverlap(safePos, existing.dimensions, other.position, other.dimensions)) {
            // Nudge safe position away from collision
            const dx = safePos.x - other.position.x;
            const dz = safePos.z - other.position.z;
            const signX = dx >= 0 ? 1 : -1;
            const signZ = dz >= 0 ? 1 : -1;
            safePos = clampInsideRoom(
              safePos.x + signX * 0.35,
              safePos.z + signZ * 0.35,
              existing.dimensions
            );
          }
        }
      }

      // Check door corridor
      if (isDoorCorridorBlocked(safePos, existing.dimensions)) {
        safePos.x = Math.max(-halfW + 0.5, safePos.x - 0.7);
      }

      const sanitized: AICommand = {
        type: 'move_object',
        objectId: rawAction.objectId,
        position: safePos,
        description: rawAction.description || `Di chuyển ${existing.name}`,
      };

      return { valid: true, sanitizedCommand: sanitized };
    }

    case 'rotate_object': {
      if (!rawAction.objectId) {
        return { valid: false, error: 'Thiếu objectId cho thao tác xoay.' };
      }

      const existing = objects.find((o) => o.id === rawAction.objectId);
      if (!existing) {
        return { valid: false, error: `Không tìm thấy đồ vật với ID: "${rawAction.objectId}".` };
      }

      let delta = rawAction.rotationDelta !== undefined ? Number(rawAction.rotationDelta) : undefined;
      let rotY = rawAction.rotationY !== undefined ? Number(rawAction.rotationY) : undefined;

      if (delta === undefined && rotY === undefined) {
        delta = Math.PI / 2; // Default 90 deg rotation
      }

      const sanitized: AICommand = {
        type: 'rotate_object',
        objectId: rawAction.objectId,
        rotationDelta: delta,
        rotationY: rotY,
        description: rawAction.description || `Xoay ${existing.name}`,
      };

      return { valid: true, sanitizedCommand: sanitized };
    }

    case 'delete_object': {
      if (!rawAction.objectId) {
        return { valid: false, error: 'Thiếu objectId cho thao tác xóa.' };
      }

      const existing = objects.find((o) => o.id === rawAction.objectId);
      if (!existing) {
        return { valid: false, error: `Không tìm thấy đồ vật với ID: "${rawAction.objectId}".` };
      }

      return {
        valid: true,
        sanitizedCommand: {
          type: 'delete_object',
          objectId: rawAction.objectId,
          description: rawAction.description || `Xóa ${existing.name}`,
        },
      };
    }

    case 'update_object': {
      if (!rawAction.objectId) {
        return { valid: false, error: 'Thiếu objectId cho thao tác cập nhật.' };
      }
      return {
        valid: true,
        sanitizedCommand: {
          type: 'update_object',
          objectId: rawAction.objectId,
          name: rawAction.name,
          dimensions: rawAction.dimensions,
        },
      };
    }

    default:
      return { valid: false, error: `Thao tác không được hỗ trợ: ${type}` };
  }
}
