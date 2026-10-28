import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  VehicleDiagramView,
  VehicleDiagramMarker,
  DamageType,
} from '../types/customerSales';
import {
  buildToyotaCamry3DModel,
  CAMRY_CAMERA_PRESETS,
  create3DMarkerPin,
  resolveBodyPanelFromCoordinates,
} from './camry3DModel';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Info,
  Layers,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Crosshair,
  Rotate3d,
} from 'lucide-react';

interface VehicleDiagramViewerProps {
  markers: VehicleDiagramMarker[];
  onMarkersChange?: (newMarkers: VehicleDiagramMarker[]) => void;
  readOnly?: boolean;
}

const DAMAGE_TYPE_CONFIG: Record<
  DamageType,
  { label: string; color: string; bg: string; border: string; markerColor: string }
> = {
  scratch: {
    label: 'خط و خش',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40',
    markerColor: '#fbbf24',
  },
  damage: {
    label: 'آسیب و شکستگی',
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    border: 'border-red-500/40',
    markerColor: '#ef4444',
  },
  dent: {
    label: 'فرورفتگی / لیسه',
    color: 'text-sky-400',
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/40',
    markerColor: '#38bdf8',
  },
  missing_part: {
    label: 'کمبود قطعه',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/40',
    markerColor: '#c084fc',
  },
  note: {
    label: 'توضیحات و علامت',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    markerColor: '#10b981',
  },
};

function project3DToDiagramView(
  point: { x: number; y: number; z: number },
  normal?: { x: number; y: number; z: number }
): { view: VehicleDiagramView; x: number; y: number } {
  const ny = normal ? normal.y : 0;
  const nx = normal ? normal.x : 0;
  const nz = normal ? normal.z : 0;

  if (ny > 0.65) {
    const normX = Math.min(100, Math.max(0, ((point.x + 2.44) / 4.88) * 100));
    const normY = Math.min(100, Math.max(0, ((point.z + 0.92) / 1.84) * 100));
    return { view: 'top', x: Math.round(normX), y: Math.round(normY) };
  } else if (nx > 0.6) {
    const normX = Math.min(100, Math.max(0, ((-point.z + 0.92) / 1.84) * 100));
    const normY = Math.min(100, Math.max(0, (1 - (point.y - 0.15) / 1.3) * 100));
    return { view: 'front', x: Math.round(normX), y: Math.round(normY) };
  } else if (nx < -0.6) {
    const normX = Math.min(100, Math.max(0, ((point.z + 0.92) / 1.84) * 100));
    const normY = Math.min(100, Math.max(0, (1 - (point.y - 0.15) / 1.3) * 100));
    return { view: 'rear', x: Math.round(normX), y: Math.round(normY) };
  } else if (nz < 0) {
    // Left side view (-Z is Left / Driver)
    const normX = Math.min(100, Math.max(0, ((point.x + 2.44) / 4.88) * 100));
    const normY = Math.min(100, Math.max(0, (1 - (point.y - 0.15) / 1.3) * 100));
    return { view: 'left', x: Math.round(normX), y: Math.round(normY) };
  } else {
    // Right side view (+Z is Right / Passenger)
    const normX = Math.min(100, Math.max(0, ((-point.x + 2.44) / 4.88) * 100));
    const normY = Math.min(100, Math.max(0, (1 - (point.y - 0.15) / 1.3) * 100));
    return { view: 'right', x: Math.round(normX), y: Math.round(normY) };
  }
}

function projectDiagram2DTo3D(marker: VehicleDiagramMarker): { x: number; y: number; z: number } {
  if (marker.point3D) return marker.point3D;
  const u = marker.x / 100;
  const v = marker.y / 100;
  switch (marker.view) {
    case 'left':
      // Left is -Z
      return { x: -2.44 + u * 4.88, y: 0.2 + (1 - v) * 1.25, z: -0.88 };
    case 'right':
      // Right is +Z
      return { x: 2.44 - u * 4.88, y: 0.2 + (1 - v) * 1.25, z: 0.88 };
    case 'front':
      return { x: 2.30, y: 0.2 + (1 - v) * 1.1, z: 0.85 - u * 1.7 };
    case 'rear':
      return { x: -2.35, y: 0.2 + (1 - v) * 1.1, z: -0.85 + u * 1.7 };
    case 'top':
      return { x: -2.0 + u * 4.0, y: 1.40, z: -0.7 + v * 1.4 };
    default:
      return { x: 0, y: 0.8, z: -0.85 };
  }
}

export const VehicleDiagramViewer: React.FC<VehicleDiagramViewerProps> = ({
  markers,
  onMarkersChange,
  readOnly = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const cameraTargetPosRef = useRef<THREE.Vector3 | null>(null);
  const controlsTargetPosRef = useRef<THREE.Vector3 | null>(null);

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>('perspective');

  // Modal State for adding marker
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pending3DPoint, setPending3DPoint] = useState<{ x: number; y: number; z: number } | null>(null);
  const [pendingNormal, setPendingNormal] = useState<{ x: number; y: number; z: number } | null>(null);
  const [pendingDetectedPanel, setPendingDetectedPanel] = useState<string>('');
  const [pendingType, setPendingType] = useState<DamageType>('scratch');
  const [pendingDesc, setPendingDesc] = useState('');
  const [pendingSeverity, setPendingSeverity] = useState<'minor' | 'moderate' | 'major'>('minor');

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10);
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.05);
    sceneRef.current = scene;

    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    const initialPreset = CAMRY_CAMERA_PRESETS.perspective;
    camera.position.set(...initialPreset.position);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.8;
    controls.maxDistance = 12.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.02;
    controls.target.set(...initialPreset.target);
    controlsRef.current = controls;

    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.9);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(5, 7, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    rimLight.position.set(-5, 4, -5);
    scene.add(rimLight);

    const gridHelper = new THREE.GridHelper(12, 24, 0x1e293b, 0x111827);
    gridHelper.position.y = 0.001;
    scene.add(gridHelper);

    const carModel = buildToyotaCamry3DModel();
    scene.add(carModel);
    carGroupRef.current = carModel;

    const markersGroup = new THREE.Group();
    markersGroup.name = 'DiagramMarkersGroup';
    carModel.add(markersGroup);
    markersGroupRef.current = markersGroup;

    let isRunning = true;
    const animate = () => {
      if (!isRunning) return;
      animFrameIdRef.current = requestAnimationFrame(animate);

      if (cameraTargetPosRef.current && controlsTargetPosRef.current) {
        camera.position.lerp(cameraTargetPosRef.current, 0.08);
        controls.target.lerp(controlsTargetPosRef.current, 0.08);

        if (
          camera.position.distanceTo(cameraTargetPosRef.current) < 0.02 &&
          controls.target.distanceTo(controlsTargetPosRef.current) < 0.02
        ) {
          cameraTargetPosRef.current = null;
          controlsTargetPosRef.current = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update 3D Marker Pins
  useEffect(() => {
    const markersGroup = markersGroupRef.current;
    if (!markersGroup) return;

    while (markersGroup.children.length > 0) {
      const child = markersGroup.children[0];
      markersGroup.remove(child);
      if (child instanceof THREE.Group) {
        child.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            node.geometry.dispose();
            if (Array.isArray(node.material)) node.material.forEach((m) => m.dispose());
            else node.material.dispose();
          }
        });
      }
    }

    markers.forEach((marker, index) => {
      const cfg = DAMAGE_TYPE_CONFIG[marker.type] || DAMAGE_TYPE_CONFIG.note;
      const isSelected = selectedMarkerId === marker.id;
      const pin = create3DMarkerPin(index + 1, cfg.markerColor, isSelected);

      const pos3D = projectDiagram2DTo3D(marker);
      pin.position.set(pos3D.x, pos3D.y, pos3D.z);

      if (marker.normal3D) {
        const norm = new THREE.Vector3(marker.normal3D.x, marker.normal3D.y, marker.normal3D.z).normalize();
        pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), norm);
      }

      pin.userData = { markerId: marker.id };
      markersGroup.add(pin);
    });
  }, [markers, selectedMarkerId]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
    const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);
    if (dx > 5 || dy > 5) {
      isDraggingRef.current = true;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) return;
    if (readOnly) return;

    const container = mountRef.current;
    const camera = cameraRef.current;
    const carModel = carGroupRef.current;
    if (!container || !camera || !carModel) return;

    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    const markersGroup = markersGroupRef.current;
    if (markersGroup) {
      const markerHits = raycaster.intersectObjects(markersGroup.children, true);
      if (markerHits.length > 0) {
        let curr: THREE.Object3D | null = markerHits[0].object;
        while (curr && !curr.userData?.markerId && curr.parent) {
          curr = curr.parent;
        }
        if (curr?.userData?.markerId) {
          setSelectedMarkerId(curr.userData.markerId);
          return;
        }
      }
    }

    const intersects = raycaster.intersectObjects(carModel.children, true);
    const validHit = intersects.find(
      (hit) => hit.object.userData && hit.object.userData.isClickableSurface === true
    );

    if (validHit && validHit.point) {
      const localPoint = carModel.worldToLocal(validHit.point.clone());
      const localNormal = validHit.face?.normal
        ? validHit.face.normal.clone().normalize()
        : new THREE.Vector3(0, 1, 0);

      let panelLabel = validHit.object.userData.panelLabelFa;
      if (!panelLabel) {
        const resolved = resolveBodyPanelFromCoordinates(localPoint, localNormal);
        panelLabel = resolved.labelFa;
      }

      setPending3DPoint({
        x: Number(localPoint.x.toFixed(3)),
        y: Number(localPoint.y.toFixed(3)),
        z: Number(localPoint.z.toFixed(3)),
      });
      setPendingNormal({
        x: Number(localNormal.x.toFixed(3)),
        y: Number(localNormal.y.toFixed(3)),
        z: Number(localNormal.z.toFixed(3)),
      });
      setPendingDetectedPanel(panelLabel);
      setPendingType('scratch');
      setPendingDesc('');
      setPendingSeverity('minor');
      setIsModalOpen(true);
    }
  };

  const switchCameraView = (presetId: string) => {
    const preset = CAMRY_CAMERA_PRESETS[presetId];
    if (!preset) return;
    setActivePreset(presetId);
    cameraTargetPosRef.current = new THREE.Vector3(...preset.position);
    controlsTargetPosRef.current = new THREE.Vector3(...preset.target);
  };

  const handleZoom = (factor: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    const direction = camera.position.clone().sub(controls.target);
    direction.multiplyScalar(factor);
    camera.position.copy(controls.target).add(direction);
  };

  const handleSaveMarker = () => {
    if (!pending3DPoint || !onMarkersChange) return;
    const proj = project3DToDiagramView(pending3DPoint, pendingNormal || undefined);

    const newMarker: VehicleDiagramMarker = {
      id: `mark-${Date.now()}`,
      view: proj.view,
      x: proj.x,
      y: proj.y,
      point3D: pending3DPoint,
      normal3D: pendingNormal || undefined,
      type: pendingType,
      description: pendingDesc.trim() || `${pendingDetectedPanel} - ${DAMAGE_TYPE_CONFIG[pendingType].label}`,
      severity: pendingSeverity,
    };

    onMarkersChange([...markers, newMarker]);
    setIsModalOpen(false);
    setPending3DPoint(null);
  };

  const handleDeleteMarker = (id: string) => {
    if (readOnly || !onMarkersChange) return;
    onMarkersChange(markers.filter((m) => m.id !== id));
    if (selectedMarkerId === id) setSelectedMarkerId(null);
  };

  return (
    <div className="bg-[#16171b] border border-[#272930] rounded-xl overflow-hidden text-zinc-200">
      {/* View Presets & Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#121316] border-b border-[#24262c]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Rotate3d className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-100 block">
              کروکی سه‌بعدی وایرفریم تویوتا کمری
            </span>
            <span className="text-[10px] text-zinc-400">
              کلیک روی بدنه خودرو جهت ثبت دقیق علامت تحویل
            </span>
          </div>
        </div>

        {/* Camera Quick Presets */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {Object.entries(CAMRY_CAMERA_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => switchCameraView(key)}
              className={`px-2 py-1 text-[11px] rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                activePreset === key
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-[#20232e]'
              }`}
            >
              {preset.labelFa}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Canvas + Marker Side Register */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 p-2">
        {/* 3D Viewport (8 Cols) */}
        <div className="lg:col-span-8 bg-[#0a0c10] border border-[#202330] rounded-xl overflow-hidden relative min-h-[360px]">
          <div
            ref={mountRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`w-full h-[360px] ${readOnly ? 'cursor-grab' : 'cursor-crosshair'}`}
          />

          {/* Floating Zoom & Reset Toolbar */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 bg-[#12141c]/90 backdrop-blur-md p-1 rounded-xl border border-[#2b3040]">
            <button
              type="button"
              onClick={() => handleZoom(0.85)}
              className="p-1 rounded text-zinc-300 hover:text-white hover:bg-[#222736] cursor-pointer"
              title="بزرگنمایی"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom(1.15)}
              className="p-1 rounded text-zinc-300 hover:text-white hover:bg-[#222736] cursor-pointer"
              title="کوچکنمایی"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => switchCameraView('perspective')}
              className="p-1 rounded text-zinc-300 hover:text-white hover:bg-[#222736] cursor-pointer"
              title="بازنشانی زاویه"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Side Marker Register (4 Cols) */}
        <div className="lg:col-span-4 bg-[#121318] border border-[#222530] rounded-xl p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#222532] text-xs">
              <span className="font-bold text-zinc-200">علائم ثبت‌شده</span>
              <span className="font-en-num px-2 py-0.5 rounded bg-zinc-800 text-amber-300 text-[11px] font-bold">
                {markers.length} مورد
              </span>
            </div>

            <div className="mt-2 space-y-2 max-h-[290px] overflow-y-auto pr-0.5 text-xs">
              {markers.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 space-y-1">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500/30" />
                  <p className="text-[11px]">هیچ علامتی ثبت نشده است.</p>
                </div>
              ) : (
                markers.map((marker, idx) => {
                  const cfg = DAMAGE_TYPE_CONFIG[marker.type] || DAMAGE_TYPE_CONFIG.note;
                  const isSelected = selectedMarkerId === marker.id;
                  return (
                    <div
                      key={marker.id}
                      onClick={() => setSelectedMarkerId(marker.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1c202d] border-amber-400'
                          : 'bg-[#161720] border-[#252836] hover:border-zinc-500'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            style={{ backgroundColor: cfg.markerColor }}
                            className="w-4 h-4 rounded-full flex items-center justify-center text-black font-black text-[9px] font-en-num"
                          >
                            {idx + 1}
                          </span>
                          <span className={`text-[11px] font-bold ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMarker(marker.id);
                            }}
                            className="text-zinc-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-300 mt-1">{marker.description}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Marker Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#14161f] border border-[#2b3042] rounded-2xl w-full max-w-sm p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#25293a]">
              <span className="text-xs font-bold text-zinc-100">
                ثبت آسیب بر روی {pendingDetectedPanel}
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">نوع علامت:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(DAMAGE_TYPE_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPendingType(key as DamageType)}
                    className={`p-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                      pendingType === key
                        ? `${cfg.bg} ${cfg.border} ${cfg.color} font-bold ring-1 ring-amber-400`
                        : 'bg-[#181a24] border-[#292c3a] text-zinc-400'
                    }`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">توضیحات تکمیلی:</label>
              <input
                type="text"
                value={pendingDesc}
                onChange={(e) => setPendingDesc(e.target.value)}
                placeholder="توضیح مختصر در مورد خط یا آسیب..."
                className="w-full bg-[#1b1e2a] border border-[#2b3044] rounded-lg p-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#25293a]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveMarker}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold cursor-pointer"
              >
                ثبت علامت
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
