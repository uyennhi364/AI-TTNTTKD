# 3D Bedroom Feng Shui AI Studio (Phong Thủy Phòng Ngủ 3D)

An interactive, desktop-first 3D bedroom design and Feng Shui diagnostic platform. Users customize room dimensions, arrange realistic 3D bedroom furniture, and receive real-time Eight Mansions (Bát Trạch) spatial analysis paired with a server-side Gemini AI Feng Shui Master offering in-depth root cause explanations, cures, and interactive layout preview proposals.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following core design decisions have been confirmed from user preferences:
> 1. **Procedural 3D Models**: Furniture and architectural elements will be rendered using composite procedural Three.js geometries with physically-based materials (fine wood grains, woven fabrics, metal hardware, glass reflections, and ambient contact shadows) ensuring instant load times and zero broken external asset links.
> 2. **Preset Bedrooms + Custom Creator**: Users can immediately launch into 3 curated presets (*Master Bedroom*, *Compact Modern Bedroom*, *Studio Apartment*) or build a custom room from scratch with custom dimensions ($L \times W \times H$) and compass orientation.
> 3. **Consultation Tone**: The AI expert delivers an authoritative yet respectful "Feng Shui Master" tone (*Chuyên gia Bát Trạch phong thủy*), diagnosing energy bottlenecks, providing classical grounding, and formulating actionable remedies.

---

## 1. Overview & Core Concept

### What It Does
- **Bát Trạch Quái Mệnh Calculation**: Computes exact Kua number (Quái số 1–9), Element (Ngũ Hành: Kim, Mộc, Thủy, Hỏa, Thổ), and Group (Đông Tứ Mệnh vs Tây Tứ Mệnh) from birth year and gender.
- **Dynamic 8-Direction Compass & Floor Projection**: Calculates the 4 Auspicious sectors (*Sinh Khí, Thiên Y, Diên Niên, Phục Vị*) and 4 Inauspicious sectors (*Tuyệt Mệnh, Ngũ Quỷ, Lục Sát, Họa Hại*) customized per user, projected as an interactive ring and floor overlay onto the 3D room.
- **Interactive 3D Furniture Placement**: Full 3D canvas with OrbitControls, drag-and-drop movement along the floor grid, 45°/90° rotation controls, multi-select inspection, duplicate, and delete.
- **Deterministic Feng Shui Rule Engine**: Computes spatial relationships (bed headboard direction, door alignment / xung môn, mirror reflections / gương chiếu giường, bathroom adjacency, desk command position, circulation clearances) and outputs scores (0–100).
- **Gemini AI Feng Shui Master Integration**: Connects via server-side Express API to analyze the full room configuration, explain the reasoning behind low/high scores, and suggest layout improvements.
- **Before-and-After Preview & Apply**: AI proposals can be previewed in 3D (comparing current layout vs suggested layout) and applied with a single click.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Profile & Room Onboarding**:
   - User inputs Birth Year (e.g. `2004`) and selects Gender (`Nam` / `Nữ`).
   - Instant calculation displays Kua Quái (e.g. *Khảm Thủy - Đông Tứ Mệnh*) and preferred compass directions.
   - User selects a room preset or enters dimensions (e.g., $5\text{m} \times 4\text{m} \times 2.8\text{m}$) and Room Orientation (e.g., *Bắc*).
2. **Interactive 3D Arrangement**:
   - 3D room renders with floorboards, walls, main door, windows, and en-suite WC.
   - Users drag items from the bottom Object Library (Beds, Desks, Wardrobes, Chairs, Mirrors, Nightstands, Plants, Lights).
   - Selecting any object highlights its bounding box, shows its facing vector, current sector, and score.
   - 3D conflict icons (🔴 warning flags) float directly above violating objects (e.g., mirror facing bed, bed in line with door).
3. **✨ Phân Tích Phong Thủy (Full Diagnostic)**:
   - Evaluates overall room score (0–100) and itemized scores.
   - Shows overall verdict: *Đại Cát* (90–100), *Cát* (75–89), *Bình Hòa* (60–74), *Hung / Cần Điều Chỉnh* (<60).
4. **AI Master Chat & Proposed Layout**:
   - Interactive chat panel allows free-form inquiry ("*Tại sao gương lại bị trừ điểm?*", "*Đầu giường quay về Tây có được không?*").
   - AI generates structured proposal cards with a **[Xem trước]** (preview ghost layout / side-by-side) and **[Áp dụng phương án]** (smoothly moves items into proposed coords).

### Visual Identity & Theme
- **Color Palette**:
  - Neutral canvas: Soft rice paper / architectural alabaster (`#FBFBFA` / `#F3F4F6`), dark slate (`#1E293B`) for typography.
  - Auspicious Jade Green (`#059669` / `#10B981`): Used for Sinh Khí / Thiên Y / good placements.
  - Warning Cinnabar Red (`#DC2626` / `#EF4444`): Used for Tuyệt Mệnh / Ngũ Quỷ / direct door clashes.
  - Warm Earth & Wood tones (`#D97706`, `#B45309`, `#78350F`): Natural bamboo, walnut, oak, and brass finishes.
- **Typography**:
  - Display / Headings: `Plus Jakarta Sans` font.
  - Body & Data: `DM Sans` paired with `tabular-nums` for precise dimensions and degrees.
- **Top Bar Contract**:
  - Single-row header: Wordmark `AI Feng Shui Studio` — Navigation links (`3D View`, `Mặt Bằng 2D`, `Quy Tắc Bát Trạch`, `Thư Viện`) — Primary Action (`✨ Phân Tích`).
- **Collapsible Control Dock**:
  - Bottom docked library with quick category pills (Giường, Bàn, Tủ, Gương, Cấu Trúc).
  - Can be collapsed into "Zen / Inspection Mode" to view the 3D room in full glory.

---

## 3. Key Product Decisions & Trade-Offs

- **Procedural 3D Meshes vs External GLTF Models**:
  - *Chosen*: Composite multi-part procedural geometries with high-detail Three.js materials (wood textures via procedural CanvasTexture, beveled mattresses, pillows, reflective mirror materials, soft shadow planes).
  - *Why*: Eliminates 404 network failures, guarantees instantaneous asset rendering, and allows dynamic dimensional scaling (1m6 vs 1m8 bed) without mesh distortion.
- **Client-Side Rule Engine + Server-Side Gemini AI**:
  - *Chosen*: A dedicated TypeScript rule engine calculates exact angles, dot products, bounding box raycasts, and scores locally in $\approx 2\text{ms}$. The server-side Gemini 3.8 Flash model synthesizes this structured spatial payload into eloquent, master-grade analysis and conversational chat.
  - *Why*: Provides instant real-time feedback when dragging furniture, while leveraging Gemini's natural language comprehension and deep contextual reasoning.
- **Server Proxy Architecture**:
  - *Chosen*: Express backend proxy routes (`/api/gemini/analyze` and `/api/gemini/chat`) using `@google/genai` with `process.env.GEMINI_API_KEY`.
  - *Why*: Adheres strictly to security guidelines (no client-side API key leakage) and maintains full compatibility with Node.js/Vite fullstack environments.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT (REACT + THREE.JS)                       │
│                                                                             │
│  ┌───────────────────────┐  ┌────────────────────────────────────────────┐  │
│  │ UserProfile & RoomBar │  │              THREE.JS CANVAS               │  │
│  │ - Birth Year & Gender │  │ - Room walls, floor parquet, doors, windows│  │
│  │ - Kua & 8 Mansions    │  │ - Procedural furniture composite groups    │  │
│  │ - Room dimensions/dir │  │ - Drag/Drop raycaster & Rotation gizmos    │  │
│  └──────────┬────────────┘  │ - 8-Direction Bát Quái Compass projection  │  │
│             │               │ - 3D Warning Badges (🔴 / 🟢)              │  │
│             ▼               └─────────────────────┬──────────────────────┘  │
│  ┌───────────────────────┐                        │                         │
│  │   FENG SHUI ENGINE    │◄───────────────────────┘                         │
│  │ - Sector mapping      │                                                  │
│  │ - Bed / Door clashes  │  ┌────────────────────────────────────────────┐  │
│  │ - Mirror reflection   │  │             DIAGNOSTIC & AI DOCK           │  │
│  │ - Desk command pos    │  │ - Real-time score & itemized audit list    │  │
│  │ - Weighted scoring    │  │ - Gemini AI Master Chat & Layout Proposals │  │
│  └──────────┬────────────┘  │ - [Xem trước] & [Áp dụng] preview system   │  │
│             │               └─────────────────────▲──────────────────────┘  │
└─────────────┼─────────────────────────────────────┼─────────────────────────┘
              │                                     │
              ▼ (Structured JSON Payload)           │ (Streaming / JSON response)
┌───────────────────────────────────────────────────┼─────────────────────────┐
│                               SERVER (EXPRESS)    │                         │
│                                                   │                         │
│  POST /api/gemini/analyze ────────────────────────┘                         │
│  POST /api/gemini/chat                                                      │
│  - @google/genai (model: gemini-3.8-flash)                                  │
│  - System instructions: Bát Trạch Feng Shui Master & architectural expert   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Data Models

```typescript
export type Gender = 'male' | 'female';
export type CompassDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export type SectorType =
  | 'SINH_KHI'    // Auspicious: Vitality, Success
  | 'THIEN_Y'     // Auspicious: Health, Recovery
  | 'DIEN_NIEN'   // Auspicious: Longevity, Relationships
  | 'PHUC_VI'     // Auspicious: Harmony, Peace
  | 'HOA_HAI'     // Inauspicious: Mishaps, Quarrels
  | 'LUC_SAT'     // Inauspicious: Disputes, Scandals
  | 'NGU_QUY'     // Inauspicious: Conflicts, Ill-fortune
  | 'TUYET_MENH';  // Inauspicious: Severe Drain, Crisis

export interface UserFengShuiProfile {
  birthYear: number;
  gender: Gender;
  guaNumber: number;        // 1 to 9
  guaName: string;          // Khảm, Khôn, Chấn, Tốn, Càn, Đoài, Cấn, Ly
  element: string;          // Kim, Mộc, Thủy, Hỏa, Thổ
  group: 'Đông Tứ Mệnh' | 'Tây Tứ Mệnh';
  auspiciousDirections: CompassDirection[];
  inauspiciousDirections: CompassDirection[];
  directionMap: Record<CompassDirection, { name: string; type: SectorType; isGood: boolean }>;
}

export interface RoomObject {
  id: string;
  type: 'bed' | 'desk' | 'wardrobe' | 'mirror' | 'nightstand' | 'chair' | 'bookshelf' | 'plant' | 'tv' | 'door' | 'window' | 'wc';
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number }; // in radians (Y is yaw)
  dimensions: { width: number; length: number; height: number };
  color?: string;
}

export interface FengShuiItemEvaluation {
  objectId: string;
  objectName: string;
  score: number;
  sector: SectorType;
  facingDirection: CompassDirection;
  status: 'good' | 'warning' | 'bad';
  pros: string[];
  issues: string[];
  recommendation: string;
}

export interface FengShuiRoomEvaluation {
  overallScore: number;
  statusText: string;
  items: FengShuiItemEvaluation[];
  breakdown: {
    roomDirectionScore: number;
    bedPlacementScore: number;
    mirrorScore: number;
    deskScore: number;
    circulationScore: number;
  };
  keyIssues: string[];
}
```

---

## 5. Implementation Sequence & Plan

1. **Step 1: Dependencies & Configuration**
   - Add `three` and `@types/three` to `package.json` and install.
   - Set up Express backend in `server.ts` with Gemini API client (`@google/genai`, model `gemini-3.8-flash`) and endpoints for analysis and chat.
   - Update `metadata.json` with app title and description.

2. **Step 2: Feng Shui Engine (`src/engine/fengshui.ts`)**
   - Mathematical Kua calculation for both males and females across any lunar/solar year.
   - Bát Trạch 8 Mansions mapping matrix connecting each Kua to 8 directions.
   - Geometric analysis algorithms:
     - Sector positioning relative to room center.
     - Headboard orientation vector calculation.
     - Bed-to-Door line-of-sight test (Xung Môn).
     - Mirror reflection cone test (Gương chiếu vào giường).
     - Bed-to-Bathroom wall proximity & door facing test.
     - Desk command position (Tọa Sơn Hướng Thủy) & window light orientation.
     - Weighted composite scoring (0–100).

3. **Step 3: Three.js 3D Engine & Procedural Asset Library (`src/components/ThreeRoomCanvas.tsx`, `src/engine/proceduralModels.ts`)**
   - Scene setup with `WebGLRenderer`, `ACESFilmicToneMapping`, `SRGBColorSpace`, `RoomEnvironment` PMREM reflection, warm key directional light + cool fill hemisphere light.
   - Room shell generator: customizable floor dimensions ($L \times W$), walls with door/window cutouts, parquet wood shader/canvas texture.
   - 3D furniture procedural builders:
     - Beds (Double bed 1m6/1m8, Single bed with mattress, headboard, duvet, pillows).
     - Study / Work desks with computer display, keyboard, chair.
     - Wardrobes with sliding doors and handles.
     - Mirror with reflective chrome/glass and wooden frame.
     - Floor plants, nightstands with lamps, windows, entrance door.
   - 8-Compass rose ring (Bát Quái La Bàn) on the floor and wall markers showing auspicious/inauspicious sectors with color coding.
   - Interactive Raycasting: Drag-and-drop on the floor plane with boundaries, object selection, 45°/90° rotation handles, and 3D floating warning icons (🔴).

4. **Step 4: UI Layout & Control Overlays (`src/components/...`)**
   - **Header**: Top Bar Contract with 3 zones, room preset selectors (*Master, Small, Studio, Custom*), 3D vs 2D top-down switch, and Reset / Clear actions.
   - **Left Sidebar**: User Profile Form (Birth Year, Gender, Kua card) + Room Dimensions and Orientation controls.
   - **Center Viewport**: Full-bleed Three.js canvas with 3D compass rose, floating warning badges, and bottom collapsible Object Library dock.
   - **Right Sidebar**:
     - Real-time Feng Shui Scorecard (0–100, item badges).
     - Item Inspector (selected furniture score, pros, cons, and recommendations).
     - Gemini AI Feng Shui Master Chat (interactive Q&A, detailed root causes).
     - Layout Preview & Apply modal / comparison switch.

5. **Step 5: Testing & Verification**
   - Verify drag-and-drop, rotation, and selection responsiveness.
   - Verify Feng Shui calculations against classical Bát Trạch tables (e.g. 2004 female = Khảm Thủy; East group directions SE, E, S, N).
   - Test Gemini API endpoints for analysis generation and conversational chat.
   - Run `compile_applet` and test full build.
