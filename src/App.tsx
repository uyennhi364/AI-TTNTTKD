import { useState, useMemo } from 'react';
import {
  Gender,
  RoomConfig,
  RoomObject,
  ProposedAdjustment,
  LayoutOptimizationProposal,
  UserFengShuiProfile,
} from './types/fengshui';
import { getUserFengShuiProfile } from './engine/batTrach';
import { evaluateRoomFengShui } from './engine/fengshuiRules';
import { ROOM_PRESETS } from './engine/presets';
import {
  generateFengShuiConsultation,
  generateDeepFengShuiReport,
  DeepFengShuiReportData,
} from './engine/geminiFengShuiAI';
import { ThreeRoomCanvas } from './components/ThreeRoomCanvas';
import { AIChatConsultant } from './components/AIChatConsultant';
import { ObjectLibraryDock, LIBRARY_ITEMS } from './components/ObjectLibraryDock';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebarPanel } from './components/RightSidebarPanel';
import { RoomCompassWidget } from './components/RoomCompassWidget';
import { UserProfileModal } from './components/UserProfileModal';
import { LayoutComparisonModal } from './components/LayoutComparisonModal';
import { AIAnalysisReportModal } from './components/AIAnalysisReportModal';
import { validateAICommand } from './services/aiCommandHandler';

export default function App() {
  // 1. User Profile State (Defaults to 2004 Female = Khôn Thổ / Tây Tứ Mệnh as in Mockup)
  const [birthYear, setBirthYear] = useState<number>(2004);
  const [gender, setGender] = useState<Gender>('female');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Compute Feng Shui Profile dynamically
  const userProfile = useMemo<UserFengShuiProfile>(() => {
    return getUserFengShuiProfile(birthYear, gender);
  }, [birthYear, gender]);

  // 2. Room Configuration & Objects State
  const [roomConfig, setRoomConfig] = useState<RoomConfig>(ROOM_PRESETS.master.config);
  const [objects, setObjects] = useState<RoomObject[]>(ROOM_PRESETS.master.objects);

  // 3. Selection & Viewport State (Default bed_01 selected to match mockup)
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>('bed_01');
  const [cameraViewMode, setCameraViewMode] = useState<'3d' | '2d' | 'iso' | 'top' | 'front'>('3d');
  const [showFengShuiOverlay, setShowFengShuiOverlay] = useState<boolean>(true);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');
  const [lightingMode, setLightingMode] = useState<'day' | 'night'>('day');

  // 4. Panels & UI States
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [chatTriggerPrompt, setChatTriggerPrompt] = useState<string | null>(null);
  const [activeVisualConnection, setActiveVisualConnection] = useState<{
    sourceId: string;
    targetId: string;
    label: string;
    distance: string;
  } | null>(null);

  // 5. AI Proposal, Ghost Preview & Modals
  const [proposedAdjustment, setProposedAdjustment] = useState<ProposedAdjustment | null>(null);
  const [previewAdjustments, setPreviewAdjustments] = useState<ProposedAdjustment[]>([]);
  const [isPreviewingProposal, setIsPreviewingProposal] = useState<boolean>(false);
  const [activeOptimizationProposal, setActiveOptimizationProposal] = useState<LayoutOptimizationProposal | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [aiReportData, setAiReportData] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Calculate Real-Time Feng Shui Evaluation
  const evaluation = useMemo(() => {
    return evaluateRoomFengShui(userProfile, roomConfig, objects);
  }, [roomConfig, objects, userProfile]);

  // Toast auto-clear
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Handler: Update Object Position
  const handleUpdateObjectPosition = (id: string, x: number, z: number) => {
    const halfW = roomConfig.width / 2;
    const halfL = roomConfig.length / 2;
    const padding = 0.25;

    const clampedX = Math.max(-halfW + padding, Math.min(halfW - padding, x));
    const clampedZ = Math.max(-halfL + padding, Math.min(halfL - padding, z));

    setObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, position: { ...obj.position, x: clampedX, z: clampedZ } } : obj))
    );
  };

  // Handler: Rotate Object
  const handleRotateObject = (id: string, deltaRad: number) => {
    setObjects((prev) =>
      prev.map((obj) =>
        obj.id === id ? { ...obj, rotation: { ...obj.rotation, y: (obj.rotation.y + deltaRad) % (Math.PI * 2) } } : obj
      )
    );
  };

  // Handler: Set Object Rotation directly (from 3D gizmo)
  const handleSetObjectRotation = (id: string, rotationY: number) => {
    setObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, rotation: { ...obj.rotation, y: rotationY } } : obj))
    );
  };

  // Handler: Delete Object
  const handleDeleteObject = (id: string) => {
    setObjects((prev) => prev.filter((obj) => obj.id !== id));
    if (selectedObjectId === id) {
      setSelectedObjectId(null);
    }
    showToast('✓ Đã xóa đồ vật khỏi phòng.');
  };

  // Handler: Duplicate Object
  const handleDuplicateObject = (id: string) => {
    const target = objects.find((o) => o.id === id);
    if (!target) return;

    const newObj: RoomObject = {
      ...target,
      id: `${target.type}_${Date.now()}`,
      position: {
        x: Math.min(roomConfig.width / 2 - 0.4, target.position.x + 0.35),
        y: target.position.y,
        z: Math.min(roomConfig.length / 2 - 0.4, target.position.z + 0.35),
      },
    };

    setObjects((prev) => [...prev, newObj]);
    setSelectedObjectId(newObj.id);
    showToast(`✓ Đã nhân bản ${target.name}.`);
  };

  // Handler: Add object from library
  const handleAddObjectFromLibrary = (item: {
    type: any;
    name: string;
    dimensions: { width: number; length: number; height: number };
  }) => {
    const newId = `${item.type}_${Date.now()}`;
    const newObj: RoomObject = {
      id: newId,
      type: item.type,
      name: item.name,
      dimensions: item.dimensions,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    };

    setObjects((prev) => [...prev, newObj]);
    setSelectedObjectId(newId);
    showToast(`✓ Đã thêm ${newObj.name} vào phòng.`);
  };

  // Handler: Drop from library to coordinates
  const handleDropFromLibrary = (item: any, clientX: number, clientY: number) => {
    const normX = (clientX / window.innerWidth - 0.5) * roomConfig.width * 0.7;
    const normZ = (clientY / window.innerHeight - 0.5) * roomConfig.length * 0.7;

    const newId = `${item.type}_${Date.now()}`;
    const newObj: RoomObject = {
      id: newId,
      type: item.type,
      name: item.name,
      dimensions: item.dimensions,
      position: { x: normX, y: 0, z: normZ },
      rotation: { x: 0, y: 0, z: 0 },
    };

    setObjects((prev) => [...prev, newObj]);
    setSelectedObjectId(newId);
    showToast(`✓ Đã đặt ${newObj.name} vào vị trí.`);
  };

  // Handler: Execute AI Action Command
  const handleExecuteAIAction = (rawAction: any) => {
    const validation = validateAICommand(rawAction, roomConfig, objects);
    if (!validation.valid || !validation.sanitizedCommand) {
      showToast(`⚠ Lệnh AI không hợp lệ: ${validation.error || 'Dữ liệu sai định dạng'}`);
      return;
    }

    const action = validation.sanitizedCommand;

    if (action.type === 'add_object') {
      const matchedLib = LIBRARY_ITEMS.find((it) => it.type === action.objectType);
      const newId = `${action.objectType || 'item'}_${Date.now()}`;
      const newObj: RoomObject = {
        id: newId,
        type: (action.objectType as any) || 'bed',
        name: action.name || matchedLib?.name || 'Đồ vật mới',
        dimensions: action.dimensions || matchedLib?.dimensions || { width: 1.2, length: 0.8, height: 0.75 },
        position: {
          x: action.position?.x ?? 0,
          y: 0,
          z: action.position?.z ?? 0,
        },
        rotation: {
          x: 0,
          y: action.rotationY ?? 0,
          z: 0,
        },
      };
      setObjects((prev) => [...prev, newObj]);
      setSelectedObjectId(newId);
      showToast(`✓ AI đã thêm ${newObj.name} vào phòng.`);
    } else if (action.type === 'move_object' && action.objectId) {
      if (action.position) {
        handleUpdateObjectPosition(action.objectId, action.position.x, action.position.z);
        showToast(`✓ AI đã di chuyển đồ vật.`);
      }
    } else if (action.type === 'rotate_object' && action.objectId) {
      if (action.rotationDelta !== undefined) {
        handleRotateObject(action.objectId, action.rotationDelta);
        showToast(`✓ AI đã xoay đồ vật.`);
      } else if (action.rotationY !== undefined) {
        setObjects((prev) =>
          prev.map((o) => (o.id === action.objectId ? { ...o, rotation: { ...o.rotation, y: action.rotationY! } } : o))
        );
        showToast(`✓ AI đã chỉnh góc xoay.`);
      }
    } else if (action.type === 'delete_object' && action.objectId) {
      handleDeleteObject(action.objectId);
    }
  };

  // Handler: Preview Proposal
  const handlePreviewProposal = (single: ProposedAdjustment | null, adjustments?: ProposedAdjustment[]) => {
    if (adjustments && adjustments.length > 0) {
      setPreviewAdjustments(adjustments);
      setProposedAdjustment(null);
      setIsPreviewingProposal(true);
      showToast(`👁 Đang hiển thị bóng mờ phương án tối ưu.`);
    } else if (single) {
      setProposedAdjustment(single);
      setPreviewAdjustments([]);
      setIsPreviewingProposal(true);
      const objName = objects.find((o) => o.id === single.objectId)?.name || 'đồ vật';
      showToast(`👁 Đang xem trước vị trí mới của ${objName}.`);
    } else {
      setIsPreviewingProposal(false);
      setProposedAdjustment(null);
      setPreviewAdjustments([]);
    }
  };

  // Handler: Apply Proposal
  const handleApplyProposal = (adj: ProposedAdjustment) => {
    const objName = objects.find((o) => o.id === adj.objectId)?.name || 'đồ vật';
    setObjects((prev) =>
      prev.map((o) => {
        if (o.id === adj.objectId) {
          return {
            ...o,
            position: { ...o.position, x: adj.suggestedX, z: adj.suggestedZ },
            rotation: { ...o.rotation, y: adj.suggestedRotationY },
          };
        }
        return o;
      })
    );
    setIsPreviewingProposal(false);
    setProposedAdjustment(null);
    showToast(`✓ Đã áp dụng vị trí tối ưu cho ${objName}!`);
  };

  // Handler: Apply Multiple Adjustments
  const handleApplyMultipleAdjustments = (adjs: ProposedAdjustment[]) => {
    setObjects((prev) => {
      let updated = [...prev];
      adjs.forEach((adj) => {
        updated = updated.map((o) => {
          if (o.id === adj.objectId) {
            return {
              ...o,
              position: { ...o.position, x: adj.suggestedX, z: adj.suggestedZ },
              rotation: { ...o.rotation, y: adj.suggestedRotationY },
            };
          }
          return o;
        });
      });
      return updated;
    });
    setIsPreviewingProposal(false);
    setPreviewAdjustments([]);
    setIsComparisonModalOpen(false);
    showToast(`✓ Đã áp dụng toàn bộ phương án tối ưu phong thủy!`);
  };

  // Handler: Trigger Deep AI Feng Shui Report
  const handleTriggerAiAnalysis = async () => {
    setIsAiAnalyzing(true);
    showToast('✨ AI đang trích xuất dữ liệu 3D và tổng hợp báo cáo phong thủy...');
    try {
      const report = await generateDeepFengShuiReport(
        userProfile,
        roomConfig,
        objects,
        evaluation
      );
      setAiReportData(report);
      setIsReportModalOpen(true);
    } catch (e) {
      console.error(e);
      showToast('⚠ Không thể tạo báo cáo AI vào lúc này.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleFocusObjects = (sourceId: string, targetId: string, label: string, distance: string) => {
    setActiveVisualConnection({ sourceId, targetId, label, distance });
    setSelectedObjectId(sourceId);
    showToast(`👁 Đang phân tích liên kết 3D: ${label} (${distance})`);
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#14171A] font-sans antialiased select-none">
      {/* =========================================================================
          1. TOP APP BAR (Professional Interior Architecture Toolbar)
         ========================================================================= */}
      <header className="h-14 bg-[#14171A] border-b border-stone-800/80 px-4 flex items-center justify-between shrink-0 z-30 shadow-md text-stone-200">
        {/* Left: Lotus Icon & Studio Title */}
        <div className="flex items-center gap-3">
          <div className="w-8.5 h-8.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shadow-xs">
            <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C12 3 7.5 8 7.5 13.5C7.5 16.5 9.5 18.5 12 18.5C14.5 18.5 16.5 16.5 16.5 13.5C16.5 8 12 3 12 3Z" fill="#10B981" fillOpacity="0.85" />
              <path d="M12 8.5C12 8.5 4.5 10.5 3.5 15.5C3 18 5 19.5 7.5 19.5C10 19.5 11.5 17.5 12 15.5" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 8.5C12 8.5 19.5 10.5 20.5 15.5C21 18 19 19.5 16.5 19.5C14 19.5 12.5 17.5 12 15.5" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-none">
              AI Feng Shui Studio
            </h1>
            <p className="text-[11px] text-stone-400 mt-0.5 leading-none font-medium">
              Thiết kế không gian sống hài hòa
            </p>
          </div>
        </div>

        {/* Center: Camera View Modes & Day/Night Toggle (Exact match to reference photo) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-[#1E2124] rounded-xl border border-stone-800 text-xs">
          <button
            onClick={() => setCameraViewMode('3d')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 ${
              cameraViewMode === '3d'
                ? 'bg-[#005C4A] text-white shadow-xs border border-emerald-500/50'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>3D Phối Cảnh</span>
          </button>
          <button
            onClick={() => setCameraViewMode('2d')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 ${
              cameraViewMode === '2d'
                ? 'bg-[#005C4A] text-white shadow-xs border border-emerald-500/50'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            <span>Mặt Bằng 2D</span>
          </button>
          <button
            onClick={() => setCameraViewMode('iso')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 ${
              cameraViewMode === 'iso'
                ? 'bg-[#005C4A] text-white shadow-xs border border-emerald-500/50'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m12 3-8 4.5v9L12 21l8-4.5v-9L12 3Z" />
            </svg>
            <span>Isometric</span>
          </button>
        </div>

        {/* Day / Night Button matching reference layout */}
        {lightingMode === 'day' ? (
          <button
            onClick={() => setLightingMode('night')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#26221A] border border-amber-600/40 text-amber-300 hover:bg-[#2e2a1e] transition-all text-xs font-semibold shadow-xs select-none active:scale-95 cursor-pointer"
            title="Nhấp để chuyển sang chế độ Ban đêm"
          >
            <span className="text-amber-400 text-sm">☼</span>
            <span>Ban ngày</span>
          </button>
        ) : (
          <button
            onClick={() => setLightingMode('day')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#191D24] border border-amber-500/35 text-amber-200 hover:bg-[#20252e] transition-all text-xs font-semibold shadow-xs select-none active:scale-95 cursor-pointer"
            title="Nhấp để chuyển sang chế độ Ban ngày"
          >
            <span className="text-amber-300 text-sm">☾</span>
            <span>Ban đêm</span>
          </button>
        )}
      </div>

      {/* Right: Report, Avatar */}
      <div className="flex items-center gap-2">
        {/* High-Contrast Report Button */}
          <button
            onClick={() => handleTriggerAiAnalysis()}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-stone-100 text-stone-900 border border-stone-200 text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5"
            title="Tạo & xem báo cáo phong thủy mới nhất"
          >
            <span>📄</span>
            <span>Báo cáo</span>
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-7.5 h-7.5 rounded-full bg-[#005C4A] text-white flex items-center justify-center font-bold text-xs shadow-2xs"
            title="Hồ sơ người dùng"
          >
            N
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. 3D STUDIO CANVAS (65–70% SCREEN OCCUPANCY) & FLOATING OVERLAYS
         ========================================================================= */}
      <div className="flex-1 w-full h-[calc(100vh-56px)] overflow-hidden bg-[#181B1E] relative select-none">
        {/* Full-bleed 3D Canvas occupying the visual focal point */}
        <div className="absolute inset-0 z-0">
          <ThreeRoomCanvas
            roomConfig={roomConfig}
            objects={objects}
            userProfile={userProfile}
            evaluation={evaluation}
            selectedObjectId={selectedObjectId}
            onSelectObject={(id) => setSelectedObjectId(id)}
            onUpdateObjectPosition={handleUpdateObjectPosition}
            onRotateObject={handleRotateObject}
            onSetObjectRotation={handleSetObjectRotation}
            onDeleteObject={handleDeleteObject}
            onDuplicateObject={handleDuplicateObject}
            proposedAdjustment={proposedAdjustment}
            previewAdjustments={previewAdjustments}
            isPreviewingProposal={isPreviewingProposal}
            onApplyPreview={() => {
              if (previewAdjustments.length > 0) {
                handleApplyMultipleAdjustments(previewAdjustments);
              } else if (proposedAdjustment) {
                handleApplyProposal(proposedAdjustment);
              }
            }}
            onCancelPreview={() => {
              setIsPreviewingProposal(false);
              setProposedAdjustment(null);
              setPreviewAdjustments([]);
            }}
            cameraViewMode={cameraViewMode}
            onChangeCameraViewMode={setCameraViewMode}
            onResetCamera={() => setCameraViewMode('3d')}
            showFengShuiOverlay={showFengShuiOverlay}
            onToggleFengShuiOverlay={() => setShowFengShuiOverlay(!showFengShuiOverlay)}
            transformMode={transformMode}
            onChangeTransformMode={setTransformMode}
            onDropFromLibrary={handleDropFromLibrary}
            activeVisualConnection={activeVisualConnection}
            onClearVisualConnection={() => setActiveVisualConnection(null)}
            lightingMode={lightingMode}
          />
        </div>

        {/* TOP FLOATING CONTROLS: Di chuyển / Xoay (Thu phóng removed as requested) */}
        <div className="absolute top-3 left-[360px] z-20 flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1 p-1 bg-[#1E2124]/90 backdrop-blur-md rounded-xl border border-stone-800 text-xs text-stone-300 shadow-lg">
            <button
              onClick={() => setTransformMode('translate')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                transformMode === 'translate'
                  ? 'bg-[#005C4A] text-white shadow-xs border border-emerald-500/50'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
              title="Chế độ di chuyển đồ vật"
            >
              <span>✥</span>
              <span>Di chuyển</span>
            </button>
            <button
              onClick={() => setTransformMode('rotate')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                transformMode === 'rotate'
                  ? 'bg-[#005C4A] text-white shadow-xs border border-emerald-500/50'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
              title="Chế độ xoay đồ vật"
            >
              <span>↻</span>
              <span>Xoay</span>
            </button>
          </div>
        </div>

        {/* LEFT COLUMN: Floating Dark Card "Hồ sơ gia chủ" */}
        <div className="absolute top-3 left-3 z-20">
          <LeftSidebar
            userProfile={userProfile}
            onEditProfile={() => setIsProfileModalOpen(true)}
            roomDirection={roomConfig.direction}
          />
        </div>

        {/* BOTTOM-LEFT: Room Compass Widget */}
        <div className="absolute bottom-3 left-3 z-20">
          <RoomCompassWidget roomDirection={roomConfig.direction} rotationAngle={0} />
        </div>

        {/* BOTTOM DOCK: Shorter & Cleaner "Thư viện nội thất" */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[740px] max-w-[calc(100vw-700px)] pointer-events-auto">
          <ObjectLibraryDock onAddObject={handleAddObjectFromLibrary} />
        </div>

        {/* RIGHT COLUMN: Floating Alabaster White Card "Trợ lý Phong Thủy" */}
        <div className="absolute top-3 right-3 z-20">
          <RightSidebarPanel
            userProfile={userProfile}
            roomConfig={roomConfig}
            objects={objects}
            evaluation={evaluation}
            selectedObjectId={selectedObjectId}
            onPreviewProposal={handlePreviewProposal}
            onApplyProposal={handleApplyProposal}
            onApplyMultipleAdjustments={handleApplyMultipleAdjustments}
            onExecuteAIAction={handleExecuteAIAction}
            onOpenOptimizationModal={(prop) => {
              setActiveOptimizationProposal(prop);
              setIsComparisonModalOpen(true);
            }}
            externalTriggerPrompt={chatTriggerPrompt}
            onClearExternalTriggerPrompt={() => setChatTriggerPrompt(null)}
            onFocusObjects={handleFocusObjects}
            isPreviewingProposal={isPreviewingProposal}
          />
        </div>

        {/* Toast Notification Alert */}
        {toastMessage && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-stone-900/95 backdrop-blur-md text-white text-xs font-semibold shadow-2xl border border-stone-700/80 animate-in fade-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}
      </div>

      {/* =========================================================================
          3. COMPREHENSIVE MODALS & REPORTS
         ========================================================================= */}
      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onChangeBirthYear={setBirthYear}
        onChangeGender={setGender}
        roomConfig={roomConfig}
        onChangeRoomConfig={(cfg) => setRoomConfig((prev) => ({ ...prev, ...cfg }))}
      />

      {/* Before / After Layout Comparison Modal */}
      <LayoutComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        proposal={activeOptimizationProposal}
        currentObjects={objects}
        onApply={handleApplyMultipleAdjustments}
      />

      {/* Deep AI Feng Shui Report Modal */}
      <AIAnalysisReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportData={aiReportData}
        userProfile={userProfile}
        evaluation={evaluation}
        roomConfig={roomConfig}
        objects={objects}
        onTriggerOptimization={() => {
          setIsRightPanelOpen(true);
          setChatTriggerPrompt('Tối ưu phòng ngủ cho tôi');
        }}
      />
    </div>
  );
}
