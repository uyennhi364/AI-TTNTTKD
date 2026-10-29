// =============================================================================
// sceneCommandExecutor.ts
// Receives SceneCommand + current objects + roomConfig → executes → returns
// updated objects and ExecutorOutput.
// Does NOT call AI. Pure engine logic.
// =============================================================================

import { RoomConfig, RoomObject, RoomObjectType } from '../types/fengshui';
import {
  AddCommand,
  CommandExecutionResult,
  DeleteCommand,
  MoveCommand,
  RotateCommand,
  SceneCommand,
  SwapCommand,
  SelectCommand,
  ClarifyCommand,
} from './sceneCommandTypes';

export interface ExecutorOutput {
  result: CommandExecutionResult;
  updatedObjects: RoomObject[];
  newSelectedId: string | null;
}

// ---------------------------------------------------------------------------
// Region → 3D coordinate mapping
// ---------------------------------------------------------------------------
function regionToCoords(
  region: string,
  roomConfig: RoomConfig,
  objects: RoomObject[]
): { x: number; z: number } {
  const hw = roomConfig.width / 2;
  const hl = roomConfig.length / 2;

  switch (region) {
    case 'left_corner':
      return { x: -(hw - 0.8), z: -(hl - 0.8) };
    case 'right_corner':
      return { x: hw - 0.8, z: -(hl - 0.8) };
    case 'center':
      return { x: 0, z: 0 };
    case 'against_wall':
      return { x: 0, z: -(hl - 0.4) };
    case 'near_window': {
      const win = objects.find((o) => o.type === 'window');
      return win ? { x: win.position.x, z: win.position.z + 0.6 } : { x: -(hw - 0.8), z: -(hl - 0.8) };
    }
    case 'near_door': {
      const door = objects.find((o) => o.type === 'door');
      return door ? { x: door.position.x, z: door.position.z - 0.8 } : { x: 0, z: hl - 0.8 };
    }
    default:
      return { x: 0, z: 0 };
  }
}

// ---------------------------------------------------------------------------
// Clamp position inside room bounds
// ---------------------------------------------------------------------------
function clampPosition(
  x: number,
  z: number,
  objDims: { width: number; length: number },
  roomConfig: RoomConfig
): { x: number; z: number } {
  const hw = roomConfig.width / 2 - objDims.width / 2 - 0.1;
  const hl = roomConfig.length / 2 - objDims.length / 2 - 0.1;
  return {
    x: Math.max(-hw, Math.min(hw, x)),
    z: Math.max(-hl, Math.min(hl, z)),
  };
}

// ---------------------------------------------------------------------------
// Generate unique ID counter for new objects
// ---------------------------------------------------------------------------
function generateId(type: string, existing: RoomObject[]): string {
  let counter = 1;
  while (existing.some((o) => o.id === `${type}_${String(counter).padStart(2, '0')}`)) {
    counter++;
  }
  return `${type}_${String(counter).padStart(2, '0')}`;
}

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
  nightstand: { width: 0.5, length: 0.4, height: 0.55 },
  tv: { width: 1.2, length: 0.1, height: 0.7 },
  bookshelf: { width: 0.9, length: 0.3, height: 1.8 },
  kitchen: { width: 1.5, length: 0.6, height: 0.9 },
  painting: { width: 0.8, length: 0.05, height: 0.6 },
  curtain: { width: 1.2, length: 0.1, height: 2.0 },
};

// ---------------------------------------------------------------------------
// Execute: delete_object
// ---------------------------------------------------------------------------
function executeDelete(
  cmd: DeleteCommand,
  objects: RoomObject[]
): ExecutorOutput {
  const found = objects.filter((o) => cmd.object_ids.includes(o.id));
  if (found.length === 0) {
    return {
      result: {
        success: false,
        command: cmd,
        affected_object_ids: [],
        error: 'Không tìm thấy đồ vật cần xóa',
      },
      updatedObjects: objects,
      newSelectedId: null,
    };
  }

  const updatedObjects = objects.filter((o) => !cmd.object_ids.includes(o.id));
  return {
    result: {
      success: true,
      command: cmd,
      affected_object_ids: found.map((o) => o.id),
    },
    updatedObjects,
    newSelectedId: null,
  };
}

// ---------------------------------------------------------------------------
// Execute: move_object
// ---------------------------------------------------------------------------
function executeMove(
  cmd: MoveCommand,
  objects: RoomObject[],
  roomConfig: RoomConfig
): ExecutorOutput {
  const target = objects.find((o) => o.id === cmd.object_id);
  if (!target) {
    return {
      result: { success: false, command: cmd, affected_object_ids: [], error: 'Không tìm thấy đồ vật' },
      updatedObjects: objects,
      newSelectedId: null,
    };
  }

  let newX = target.position.x;
  let newZ = target.position.z;

  if (cmd.target_region) {
    const coords = regionToCoords(cmd.target_region, roomConfig, objects);
    newX = coords.x;
    newZ = coords.z;
  } else if (cmd.target_direction) {
    const step = 0.85;
    switch (cmd.target_direction) {
      case 'left': newX = Math.max(-(roomConfig.width / 2) + 0.5, newX - step); break;
      case 'right': newX = Math.min(roomConfig.width / 2 - 0.5, newX + step); break;
      case 'forward': newZ = Math.max(-(roomConfig.length / 2) + 0.5, newZ - step); break;
      case 'backward': newZ = Math.min(roomConfig.length / 2 - 0.5, newZ + step); break;
    }
  } else if (cmd.target_object_proximity) {
    const ref = objects.find((o) => o.id === cmd.target_object_proximity);
    if (ref) {
      newX = ref.position.x;
      newZ = ref.position.z + 0.8;
    }
  }

  const clamped = clampPosition(newX, newZ, target.dimensions, roomConfig);
  const updatedObjects = objects.map((o) =>
    o.id === cmd.object_id
      ? { ...o, position: { ...o.position, x: clamped.x, z: clamped.z } }
      : o
  );

  return {
    result: { success: true, command: cmd, affected_object_ids: [cmd.object_id] },
    updatedObjects,
    newSelectedId: cmd.object_id,
  };
}

// ---------------------------------------------------------------------------
// Execute: rotate_object
// ---------------------------------------------------------------------------
function executeRotate(
  cmd: RotateCommand,
  objects: RoomObject[]
): ExecutorOutput {
  const target = objects.find((o) => o.id === cmd.object_id);
  if (!target) {
    return {
      result: { success: false, command: cmd, affected_object_ids: [], error: 'Không tìm thấy đồ vật' },
      updatedObjects: objects,
      newSelectedId: null,
    };
  }

  const deltaRad = (cmd.rotation.degrees * Math.PI) / 180;
  const newRotY = (target.rotation.y + deltaRad) % (Math.PI * 2);
  const updatedObjects = objects.map((o) =>
    o.id === cmd.object_id ? { ...o, rotation: { ...o.rotation, y: newRotY } } : o
  );

  return {
    result: { success: true, command: cmd, affected_object_ids: [cmd.object_id] },
    updatedObjects,
    newSelectedId: cmd.object_id,
  };
}

// ---------------------------------------------------------------------------
// Execute: add_object
// ---------------------------------------------------------------------------
function executeAdd(
  cmd: AddCommand,
  objects: RoomObject[],
  roomConfig: RoomConfig
): ExecutorOutput {
  const type = cmd.object_type as RoomObjectType;
  const dims = cmd.dimensions || DEFAULT_DIMS[type] || { width: 1.0, length: 1.0, height: 1.0 };
  const newId = generateId(type, objects);

  let posX = 0;
  let posZ = 0;

  if (cmd.target_region) {
    const coords = regionToCoords(cmd.target_region, roomConfig, objects);
    posX = coords.x;
    posZ = coords.z;
  } else {
    // Default smart placement per type
    const hw = roomConfig.width / 2;
    const hl = roomConfig.length / 2;
    switch (type) {
      case 'plant': posX = -(hw - 0.55); posZ = hl - 0.55; break;
      case 'lamp': posX = hw - 0.4; posZ = -(hl - 0.8); break;
      case 'rug': posX = 0; posZ = 0.5; break;
      case 'desk': posX = -(hw - 0.85); posZ = 0.4; break;
      case 'chair': posX = -(hw - 0.85); posZ = 0.85; break;
      case 'wardrobe': posX = 0; posZ = -(hl - 0.4); break;
      case 'mirror': posX = hw - 0.25; posZ = 0; break;
      case 'sofa': posX = 0; posZ = hl - 0.6; break;
      default: posX = 0; posZ = 0;
    }
  }

  const clamped = clampPosition(posX, posZ, dims, roomConfig);

  const subType = cmd.attributes?.subType;
  const newObj: RoomObject = {
    id: newId,
    type,
    name: cmd.object_name,
    dimensions: dims,
    position: { x: clamped.x, y: 0, z: clamped.z },
    rotation: { x: 0, y: 0, z: 0 },
    ...(subType ? { subType } : {}),
  };

  return {
    result: { success: true, command: cmd, affected_object_ids: [newId] },
    updatedObjects: [...objects, newObj],
    newSelectedId: newId,
  };
}

// ---------------------------------------------------------------------------
// Execute: swap_objects
// ---------------------------------------------------------------------------
function executeSwap(
  cmd: SwapCommand,
  objects: RoomObject[]
): ExecutorOutput {
  const [idA, idB] = cmd.object_ids;
  const objA = objects.find((o) => o.id === idA);
  const objB = objects.find((o) => o.id === idB);

  if (!objA || !objB) {
    return {
      result: { success: false, command: cmd, affected_object_ids: [], error: 'Không tìm thấy một hoặc cả hai đồ vật' },
      updatedObjects: objects,
      newSelectedId: null,
    };
  }

  const posA = { ...objA.position };
  const posB = { ...objB.position };

  const updatedObjects = objects.map((o) => {
    if (o.id === idA) return { ...o, position: posB };
    if (o.id === idB) return { ...o, position: posA };
    return o;
  });

  return {
    result: { success: true, command: cmd, affected_object_ids: [idA, idB] },
    updatedObjects,
    newSelectedId: idA,
  };
}

// ---------------------------------------------------------------------------
// Execute: select_object
// ---------------------------------------------------------------------------
function executeSelect(
  cmd: SelectCommand,
  objects: RoomObject[]
): ExecutorOutput {
  const target = objects.find((o) => o.id === cmd.object_id);
  return {
    result: {
      success: !!target,
      command: cmd,
      affected_object_ids: target ? [cmd.object_id] : [],
      error: target ? undefined : 'Không tìm thấy đồ vật',
    },
    updatedObjects: objects,
    newSelectedId: target ? cmd.object_id : null,
  };
}

// ---------------------------------------------------------------------------
// Execute: clarify (no-op)
// ---------------------------------------------------------------------------
function executeClarify(cmd: ClarifyCommand, objects: RoomObject[]): ExecutorOutput {
  return {
    result: {
      success: false,
      command: cmd,
      affected_object_ids: cmd.candidates || [],
      error: 'Cần thêm thông tin từ người dùng',
    },
    updatedObjects: objects,
    newSelectedId: null,
  };
}

// ---------------------------------------------------------------------------
// MAIN EXPORT: executeSceneCommand
// ---------------------------------------------------------------------------
export function executeSceneCommand(
  command: SceneCommand,
  objects: RoomObject[],
  roomConfig: RoomConfig
): ExecutorOutput {
  switch (command.action) {
    case 'delete_object':
      return executeDelete(command as DeleteCommand, objects);
    case 'move_object':
      return executeMove(command as MoveCommand, objects, roomConfig);
    case 'rotate_object':
      return executeRotate(command as RotateCommand, objects);
    case 'add_object':
      return executeAdd(command as AddCommand, objects, roomConfig);
    case 'swap_objects':
      return executeSwap(command as SwapCommand, objects);
    case 'select_object':
      return executeSelect(command as SelectCommand, objects);
    case 'clarify':
      return executeClarify(command as ClarifyCommand, objects);
    default:
      return {
        result: {
          success: false,
          command,
          affected_object_ids: [],
          error: 'Lệnh không được hỗ trợ',
        },
        updatedObjects: objects,
        newSelectedId: null,
      };
  }
}
