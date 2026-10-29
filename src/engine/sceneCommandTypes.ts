// =============================================================================
// sceneCommandTypes.ts
// Defines the structured command types for the AI → 3D Engine pipeline.
// AI only parses intent and produces SceneCommand objects.
// The 3D Engine executes commands and returns CommandExecutionResult.
// =============================================================================

// Scene State snapshot sent to AI
export interface SceneState {
  room: { width: number; length: number; height: number; direction: string };
  objects: SceneObject[];
}

export interface SceneObject {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { y: number }; // degrees
  dimensions: { width: number; length: number; height: number };
  attributes?: Record<string, any>; // leafCount, subType, etc.
}

// Command types the AI can produce
export type SceneCommandType =
  | 'delete_object'
  | 'move_object'
  | 'rotate_object'
  | 'add_object'
  | 'swap_objects'
  | 'select_object'
  | 'clarify'; // AI needs more information

export interface BaseCommand {
  action: SceneCommandType;
  confidence: number; // 0-1
  reason: string; // AI's reasoning
}

export interface DeleteCommand extends BaseCommand {
  action: 'delete_object';
  object_ids: string[];
}

export interface MoveCommand extends BaseCommand {
  action: 'move_object';
  object_id: string;
  target_region?: 'left_corner' | 'right_corner' | 'center' | 'near_window' | 'near_door' | 'against_wall';
  target_direction?: 'left' | 'right' | 'forward' | 'backward';
  target_object_proximity?: string; // ID of nearby reference object
}

export interface RotateCommand extends BaseCommand {
  action: 'rotate_object';
  object_id: string;
  rotation: { axis: 'y'; degrees: number };
}

export interface AddCommand extends BaseCommand {
  action: 'add_object';
  object_type: string;
  object_name: string;
  target_region?: string;
  dimensions?: { width: number; length: number; height: number };
  attributes?: Record<string, any>;
}

export interface SwapCommand extends BaseCommand {
  action: 'swap_objects';
  object_ids: [string, string];
}

export interface SelectCommand extends BaseCommand {
  action: 'select_object';
  object_id: string;
}

export interface ClarifyCommand extends BaseCommand {
  action: 'clarify';
  question: string;
  candidates?: string[]; // IDs of candidate objects to highlight
}

export type SceneCommand =
  | DeleteCommand
  | MoveCommand
  | RotateCommand
  | AddCommand
  | SwapCommand
  | SelectCommand
  | ClarifyCommand;

// Result returned by the 3D Engine after executing a command
export interface CommandExecutionResult {
  success: boolean;
  command: SceneCommand;
  affected_object_ids: string[];
  error?: string;
  score_before?: number;
  score_after?: number;
}

// Final AI output: text for user + commands for Engine
export interface AIIntentResult {
  replyText: string; // Text displayed to user
  commands: SceneCommand[]; // Commands sent to Engine
  requiresPreview: boolean; // Needs user confirmation?
  requiresClarification: boolean; // Needs more info from user?
}
