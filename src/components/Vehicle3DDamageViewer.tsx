import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  VehicleBodyView,
  VehicleDamageMarker,
  BodyDamageType,
  BodyDamageSeverity,
  VehicleBodyPanel,
} from '../types/consignment';
import {
  buildToyotaCamry3DModel,
  CAMRY_CAMERA_PRESETS,
  create3DMarkerPin,
  create3DHoverReticle,
  resolveBodyPanelFromCoordinates,
} from './camry3DModel';
import {
  Rotate3d,
  Trash2,
  Eye,
  Camera,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Edit2,
  Undo2,
  X,
  AlertTriangle,
  Info,
  CheckCircle2,
  Crosshair,
  MapPin,
  Move,
} from 'lucide-react';

interface Vehicle3DDamageViewerProps {
  markers: VehicleDamageMarker[];
  onAddMarker?: (marker: Omit<VehicleDamageMarker, 'id' | 'createdAt'>) => void;
  onUpdateMarker?: (marker: VehicleDamageMarker) => void;
  onDeleteMarker?: (id: string) => void;
  readOnly?: boolean;
  vehicleName?: string;
  plateNumber?: string;
}

// Persian translations and badge styles for damage types (strictly preserved for entire app)
export const DAMAGE_TYPE_CONFIG: Record<
  BodyDamageType,
  { label: string; color: string; bg: string; border: string; markerColor: string }
> = {
  impact: {
    label: 'ضربه / تصادف',
    color: 'text-rose-400',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
    markerColor: '#f43f5e',
  },
  dent: {
    label: 'فرورفتگی / قری',
    color: 'text-sky-400',
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/30',
    markerColor: '#38bdf8',
  },
  scratch: {
    label: 'خط و خش',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    markerColor: '#fbbf24',
  },
  repaint: {
    label: 'رنگ‌شدگی / لکه‌گیری',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-500/30',
    markerColor: '#eab308',
  },
  replaced_part: {
    label: 'تعویض قطعه',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/30',
    markerColor: '#c084fc',
  },
  crack: {
    label: 'ترک / مویی',
    color: 'text-pink-400',
    bg: 'bg-pink-500/15',
    border: 'border-pink-500/30',
    markerColor: '#f472b6',
  },
  broken: {
    label: 'شکستگی',
    color: 'text-red-500',
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    markerColor: '#ef4444',
  },
  rust: {
    label: 'زنگ‌زدگی / خوردگی',
    color: 'text-amber-600',
    bg: 'bg-amber-600/15',
    border: 'border-amber-600/30',
    markerColor: '#d97706',
  },
  other: {
    label: 'سایر موارد',
    color: 'text-zinc-400',
    bg: 'bg-zinc-700/30',
    border: 'border-zinc-600/40',
    markerColor: '#a1a1aa',
  },
};

export const BODY_PANEL_CONFIG: Record<VehicleBodyPanel, string> = {
  hood: 'کاپوت جلو',
  roof: 'سقف خودرو',
  trunk: 'درب صندوق عقب',
  front_bumper: 'سپر جلو',
  rear_bumper: 'سپر عقب',
  front_left_fender: 'گلگیر جلو چپ (سمت راننده)',
  front_right_fender: 'گلگیر جلو راست (سمت شاگرد)',
  rear_left_fender: 'گلگیر عقب چپ',
  rear_right_fender: 'گلگیر عقب راست',
  front_left_door: 'درب جلو چپ',
  front_right_door: 'درب جلو راست',
  rear_left_door: 'درب عقب چپ',
  rear_right_door: 'درب عقب راست',
  left_rocker_panel: 'رکاب چپ',
  right_rocker_panel: 'رکاب راست',
  windshield: 'شیشه جلو',
  rear_windshield: 'شیشه عقب',
  sunroof: 'سانروف / پانوراما',
  left_mirror: 'آینه چپ',
  right_mirror: 'آینه راست',
  wheel_rim: 'رینگ و لاستیک',
  other: 'سایر بخش‌های بدنه',
};

// Convert 3D local coordinate to legacy 2D view + percentage for backward compatibility with 2D printouts
function project3DTo2DView(
  point: { x: number; y: number; z: number },
  normal?: { x: number; y: number; z: number }
): { view: VehicleBodyView; x: number; y: number } {
  const nx = normal ? normal.x : 0;
  const ny = normal ? normal.y : 0;
  const nz = normal ? normal.z : 0;

  if (ny > 0.65) {
    // Top view
    const normX = Math.min(100, Math.max(0, ((point.x + 2.44) / 4.88) * 100));
    const normY = Math.min(100, Math.max(0, ((point.z + 0.92) / 1.84) * 100));
    return { view: 'top', x: Math.round(normX), y: Math.round(normY) };
  } else if (nx > 0.6) {
    // Front view
    const normX = Math.min(100, Math.max(0, ((-point.z + 0.92) / 1.84) * 100));
    const normY = Math.min(100, Math.max(0, (1 - (point.y - 0.15) / 1.3) * 100));
    return { view: 'front', x: Math.round(normX), y: Math.round(normY) };
  } else if (nx < -0.6) {
    // Rear view
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

// Map legacy 2D marker to estimated 3D position if 3D coordinates were missing
function project2DTo3DEstimate(marker: VehicleDamageMarker): { x: number; y: number; z: number } {
  if (marker.point3D) {
    return marker.point3D;
  }
  const u = marker.x / 100;
  const v = marker.y / 100;

  switch (marker.view) {
    case 'left':
      // Left is -Z (Driver side)
      return { x: -2.44 + u * 4.88, y: 0.2 + (1 - v) * 1.25, z: -0.88 };
    case 'right':
      // Right is +Z (Passenger side)
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

export const Vehicle3DDamageViewer: React.FC<Vehicle3DDamageViewerProps> = ({
  markers,
  onAddMarker,
  onUpdateMarker,
  onDeleteMarker,
  readOnly = false,
  vehicleName = 'تویوتا کمری سدان (Toyota Camry)',
  plateNumber,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const hoverReticleRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Mouse interaction state to distinguish drag from click
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);

  // Camera animation target for smooth damping
  const cameraTargetPosRef = useRef<THREE.Vector3 | null>(null);
  const controlsTargetPosRef = useRef<THREE.Vector3 | null>(null);

  // UI state
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>('perspective');
  const [severityFilter, setSeverityFilter] = useState<'all' | BodyDamageSeverity>('all');
  const [hoveredPanelName, setHoveredPanelName] = useState<string | null>(null);
  const [hoveredCoordinates, setHoveredCoordinates] = useState<string | null>(null);
  const [isRepositioningId, setIsRepositioningId] = useState<string | null>(null);

  // Modal State for adding/editing damage marker
  const [isMarkerModalOpen, setIsMarkerModalOpen] = useState(false);
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [pending3DPoint, setPending3DPoint] = useState<{ x: number; y: number; z: number } | null>(null);
  const [pendingNormal, setPendingNormal] = useState<{ x: number; y: number; z: number } | null>(null);

  // Marker form fields
  const [formPanel, setFormPanel] = useState<VehicleBodyPanel>('hood');
  const [formDamageType, setFormDamageType] = useState<BodyDamageType>('scratch');
  const [formSeverity, setFormSeverity] = useState<BodyDamageSeverity>('minor');
  const [formNotes, setFormNotes] = useState('');
  const [formPhotos, setFormPhotos] = useState<string[]>([]);

  // Deletion confirmation state
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // Undo history stack
  const [lastDeletedMarker, setLastDeletedMarker] = useState<VehicleDamageMarker | null>(null);

  // Filtered markers by severity
  const filteredMarkers = markers.filter((m) => {
    if (severityFilter === 'all') return true;
    return m.severity === severityFilter;
  });

  // -------------------------------------------------------------
  // 1. Initialize Three.js Scene, Camera, Lights, and Full-Surface Model
  // -------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10); // Technical CAD dark slate
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.045);
    sceneRef.current = scene;

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    const initialPreset = CAMRY_CAMERA_PRESETS.perspective;
    camera.position.set(...initialPreset.position);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.6;
    controls.maxDistance = 12.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.02; // Prevent going underneath floor
    controls.target.set(...initialPreset.target);
    controlsRef.current = controls;

    // Lighting (Studio Technical Rig)
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.95);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(5, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
    rimLight.position.set(-5, 4, -5);
    scene.add(rimLight);

    // Ground Grid (Engineering CAD Blueprint Grid)
    const gridHelper = new THREE.GridHelper(12, 24, 0x1e293b, 0x111827);
    gridHelper.position.y = 0.001;
    scene.add(gridHelper);

    // Add Watertight 3D Toyota Camry Model
    const carModel = buildToyotaCamry3DModel();
    scene.add(carModel);
    carGroupRef.current = carModel;

    // Markers Container Group (attached directly to carModel so markers rotate synchronously)
    const markersGroup = new THREE.Group();
    markersGroup.name = 'DamageMarkersGroup';
    carModel.add(markersGroup);
    markersGroupRef.current = markersGroup;

    // 3D Hover Reticle for instant surface feedback
    const hoverReticle = create3DHoverReticle();
    carModel.add(hoverReticle);
    hoverReticleRef.current = hoverReticle;

    // Animation Loop
    let isRunning = true;
    const animate = () => {
      if (!isRunning) return;
      animFrameIdRef.current = requestAnimationFrame(animate);

      // Smooth camera damping if a preset or focus is targeted
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

    // Resize Handler
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

  // -------------------------------------------------------------
  // 2. Synchronize 3D Markers with markers prop (Rock-solid local positioning)
  // -------------------------------------------------------------
  useEffect(() => {
    const markersGroup = markersGroupRef.current;
    if (!markersGroup) return;

    // Clear previous marker meshes
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

    // Build 3D pin for each marker
    markers.forEach((marker, index) => {
      const cfg = DAMAGE_TYPE_CONFIG[marker.damageType] || DAMAGE_TYPE_CONFIG.other;
      const isSelected = selectedMarkerId === marker.id;
      const pin = create3DMarkerPin(index + 1, cfg.markerColor, isSelected);

      // Extract 3D position
      const pos3D = project2DTo3DEstimate(marker);
      pin.position.set(pos3D.x, pos3D.y, pos3D.z);

      // Orient pin along surface normal
      if (marker.normal3D) {
        const norm = new THREE.Vector3(marker.normal3D.x, marker.normal3D.y, marker.normal3D.z).normalize();
        pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), norm);
      }

      pin.userData = {
        markerId: marker.id,
        markerIndex: index + 1,
        markerData: marker,
      };

      markersGroup.add(pin);
    });
  }, [markers, selectedMarkerId]);

  // -------------------------------------------------------------
  // 3. Hover Handler: Real-time 3D Surface Reticle & Tooltip
  // -------------------------------------------------------------
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
    const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);
    if (dx > 5 || dy > 5) {
      isDraggingRef.current = true;
    }

    // Raycast for hover feedback
    const container = mountRef.current;
    const camera = cameraRef.current;
    const carModel = carGroupRef.current;
    const hoverReticle = hoverReticleRef.current;
    if (!container || !camera || !carModel || !hoverReticle) return;

    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    const intersects = raycaster.intersectObjects(carModel.children, true);
    const validHit = intersects.find(
      (hit) => hit.object.userData && hit.object.userData.isClickableSurface === true
    );

    if (validHit && validHit.point) {
      const localPoint = carModel.worldToLocal(validHit.point.clone());
      const localNormal = validHit.face?.normal
        ? validHit.face.normal.clone().normalize()
        : new THREE.Vector3(0, 1, 0);

      // Position hover reticle slightly above surface along normal
      hoverReticle.position.copy(localPoint).add(localNormal.clone().multiplyScalar(0.008));
      hoverReticle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), localNormal);
      hoverReticle.visible = true;

      // Identify panel
      let panelName = validHit.object.userData.panelLabelFa;
      if (!panelName) {
        const resolved = resolveBodyPanelFromCoordinates(localPoint, localNormal);
        panelName = resolved.labelFa;
      }
      setHoveredPanelName(panelName);
      setHoveredCoordinates(`X:${localPoint.x.toFixed(2)} Y:${localPoint.y.toFixed(2)} Z:${localPoint.z.toFixed(2)}`);
    } else {
      hoverReticle.visible = false;
      setHoveredPanelName(null);
      setHoveredCoordinates(null);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  };

  // -------------------------------------------------------------
  // 4. Raycasting Click Handler: Full-Surface Damage Pinning
  // -------------------------------------------------------------
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) return; // User was orbiting, not clicking
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

    // 1. Check if user clicked an existing 3D marker pin first
    if (!isRepositioningId) {
      const markersGroup = markersGroupRef.current;
      if (markersGroup) {
        const markerHits = raycaster.intersectObjects(markersGroup.children, true);
        if (markerHits.length > 0) {
          let curr: THREE.Object3D | null = markerHits[0].object;
          while (curr && !curr.userData?.markerId && curr.parent) {
            curr = curr.parent;
          }
          if (curr?.userData?.markerId) {
            const clickedId = curr.userData.markerId;
            setSelectedMarkerId(clickedId);
            return;
          }
        }
      }
    }

    // 2. Raycast against entire car body surface
    const intersects = raycaster.intersectObjects(carModel.children, true);

    const validHit = intersects.find(
      (hit) => hit.object.userData && hit.object.userData.isClickableSurface === true
    );

    if (validHit && validHit.point) {
      // Local coordinate on car
      const localPoint = carModel.worldToLocal(validHit.point.clone());

      // Normal vector
      const localNormal = validHit.face?.normal
        ? validHit.face.normal.clone().normalize()
        : new THREE.Vector3(0, 1, 0);

      // Auto-detect panel from hit mesh userData or fallback spatial resolver
      let detectedPanel: VehicleBodyPanel =
        (validHit.object.userData.panel as VehicleBodyPanel) || 'hood';

      if (!validHit.object.userData.panel) {
        const resolved = resolveBodyPanelFromCoordinates(localPoint, localNormal);
        detectedPanel = resolved.panel;
      }

      const point3D = {
        x: Number(localPoint.x.toFixed(3)),
        y: Number(localPoint.y.toFixed(3)),
        z: Number(localPoint.z.toFixed(3)),
      };
      const normal3D = {
        x: Number(localNormal.x.toFixed(3)),
        y: Number(localNormal.y.toFixed(3)),
        z: Number(localNormal.z.toFixed(3)),
      };

      // If in repositioning mode, update marker directly
      if (isRepositioningId && onUpdateMarker) {
        const target = markers.find((m) => m.id === isRepositioningId);
        if (target) {
          const proj = project3DTo2DView(point3D, normal3D);
          onUpdateMarker({
            ...target,
            point3D,
            normal3D,
            panel: detectedPanel,
            panelLabelFa: BODY_PANEL_CONFIG[detectedPanel] || 'نامشخص',
            view: proj.view,
            x: proj.x,
            y: proj.y,
          });
        }
        setIsRepositioningId(null);
        return;
      }

      // Normal Add Flow
      setPending3DPoint(point3D);
      setPendingNormal(normal3D);
      setFormPanel(detectedPanel);
      setFormDamageType('scratch');
      setFormSeverity('minor');
      setFormNotes('');
      setFormPhotos([]);
      setEditingMarkerId(null);
      setIsMarkerModalOpen(true);
    }
  };

  // -------------------------------------------------------------
  // 5. Camera View Angle Switcher & Zoom
  // -------------------------------------------------------------
  const switchCameraView = (presetId: string) => {
    const preset = CAMRY_CAMERA_PRESETS[presetId];
    if (!preset) return;
    setActivePreset(presetId);

    cameraTargetPosRef.current = new THREE.Vector3(...preset.position);
    controlsTargetPosRef.current = new THREE.Vector3(...preset.target);
  };

  const focusOnMarker = (marker: VehicleDamageMarker) => {
    setSelectedMarkerId(marker.id);
    const pos = project2DTo3DEstimate(marker);
    const carModel = carGroupRef.current;
    if (!carModel) return;

    const worldPos = carModel.localToWorld(new THREE.Vector3(pos.x, pos.y, pos.z));
    const normalVec = marker.normal3D
      ? new THREE.Vector3(marker.normal3D.x, marker.normal3D.y, marker.normal3D.z).normalize()
      : new THREE.Vector3(0, 1, 0);

    const cameraPos = worldPos.clone().add(normalVec.multiplyScalar(2.0));
    if (cameraPos.y < 0.4) cameraPos.y = 0.5;

    cameraTargetPosRef.current = cameraPos;
    controlsTargetPosRef.current = worldPos;
  };

  const handleZoom = (factor: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const direction = camera.position.clone().sub(controls.target);
    direction.multiplyScalar(factor);
    camera.position.copy(controls.target).add(direction);
  };

  // -------------------------------------------------------------
  // 6. Marker Save / Edit / Delete / Undo Actions
  // -------------------------------------------------------------
  const handleSaveMarker = () => {
    if (!pending3DPoint) return;
    const proj = project3DTo2DView(pending3DPoint, pendingNormal || undefined);

    if (editingMarkerId && onUpdateMarker) {
      const existing = markers.find((m) => m.id === editingMarkerId);
      if (existing) {
        onUpdateMarker({
          ...existing,
          panel: formPanel,
          panelLabelFa: BODY_PANEL_CONFIG[formPanel] || 'نامشخص',
          damageType: formDamageType,
          severity: formSeverity,
          notes: formNotes.trim() || undefined,
          photos: formPhotos,
          point3D: pending3DPoint,
          normal3D: pendingNormal || existing.normal3D,
          view: proj.view,
          x: proj.x,
          y: proj.y,
        });
      }
    } else if (onAddMarker) {
      onAddMarker({
        view: proj.view,
        x: proj.x,
        y: proj.y,
        z: pending3DPoint.y,
        point3D: pending3DPoint,
        normal3D: pendingNormal || undefined,
        panel: formPanel,
        panelLabelFa: BODY_PANEL_CONFIG[formPanel] || 'نامشخص',
        damageType: formDamageType,
        severity: formSeverity,
        notes: formNotes.trim() || undefined,
        photos: formPhotos,
      });
    }

    setIsMarkerModalOpen(false);
    setEditingMarkerId(null);
    setPending3DPoint(null);
  };

  const handleEditMarker = (marker: VehicleDamageMarker) => {
    setEditingMarkerId(marker.id);
    setPending3DPoint(project2DTo3DEstimate(marker));
    setPendingNormal(marker.normal3D || null);
    setFormPanel(marker.panel);
    setFormDamageType(marker.damageType);
    setFormSeverity(marker.severity);
    setFormNotes(marker.notes || '');
    setFormPhotos(marker.photos || []);
    setIsMarkerModalOpen(true);
  };

  const handleDeleteWithConfirmation = (id: string) => {
    const target = markers.find((m) => m.id === id);
    if (target) {
      setLastDeletedMarker(target);
    }
    if (onDeleteMarker) {
      onDeleteMarker(id);
    }
    setDeleteCandidateId(null);
    if (selectedMarkerId === id) setSelectedMarkerId(null);
  };

  const handleUndoDelete = () => {
    if (!lastDeletedMarker || !onAddMarker) return;
    const { id, createdAt, ...rest } = lastDeletedMarker;
    onAddMarker(rest);
    setLastDeletedMarker(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const url = evt.target?.result as string;
        if (url) {
          setFormPhotos((prev) => [...prev, url]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4 select-none font-sans" dir="rtl">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#131418] p-3.5 rounded-2xl border border-[#262833] shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Rotate3d className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-zinc-100">{vehicleName}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700 font-en-num">
                TOYOTA CAMRY 3D CAD
              </span>
              {plateNumber && (
                <span className="text-[11px] font-en-num px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700">
                  {plateNumber}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {readOnly
                ? 'نمای کارشناسی سه‌بعدی وایرفریم با مختصات پایدار CAD و بدون انحراف زاویه'
                : 'برای ثبت آسیب، ماوس را روی هر نقطه از بدنه بچرخانید و کلیک نمایید (انتخاب آزاد تمام سطوح).'}
            </p>
          </div>
        </div>

        {/* Global Action Tools: Repositioning Status or Undo */}
        <div className="flex items-center gap-2">
          {isRepositioningId && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-semibold animate-pulse">
              <Move className="w-3.5 h-3.5" />
              <span>روی نقطه جدید روی بدنه کلیک کنید</span>
              <button
                onClick={() => setIsRepositioningId(null)}
                className="mr-1 text-zinc-400 hover:text-white"
              >
                ×
              </button>
            </div>
          )}

          {lastDeletedMarker && (
            <button
              onClick={handleUndoDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-colors cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>بازگردانی آسیب حذف‌شده</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: 8 cols for 3D Viewport, 4 cols for Damage Register Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ========================================================= */}
        {/* LEFT / CENTER: Interactive 3D Three.js Viewport (8 Cols)  */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 bg-[#0b0c10] border border-[#232734] rounded-2xl p-2 sm:p-3 flex flex-col justify-between relative overflow-hidden min-h-[460px] sm:min-h-[520px] shadow-2xl">
          {/* Top Viewport Header */}
          <div className="flex items-center justify-between text-xs text-zinc-400 px-3 py-2 border-b border-[#1c202d] z-10 bg-[#0e1017]/80 backdrop-blur-md rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-zinc-200">
                زاویه فعال: {CAMRY_CAMERA_PRESETS[activePreset]?.labelFa || 'نمای آزاد ۳۶۰ درجه'}
              </span>
            </div>

            {/* Hovered Surface Real-Time Feedback */}
            <div className="flex items-center gap-2">
              {hoveredPanelName ? (
                <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span className="font-bold">{hoveredPanelName}</span>
                  {hoveredCoordinates && (
                    <span className="text-[10px] text-zinc-400 font-en-num hidden sm:inline">
                      ({hoveredCoordinates})
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-300">· کلیک برای ثبت</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] font-en-num text-cyan-400">
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>{filteredMarkers.length} آسیب ثبت‌شده</span>
                </div>
              )}
            </div>
          </div>

          {/* Three.js Canvas Container */}
          <div
            ref={mountRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`relative w-full h-[360px] sm:h-[420px] rounded-xl overflow-hidden ${
              readOnly ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair active:cursor-grabbing'
            }`}
          />

          {/* Floating Glassmorphic Camera Controls Toolbar (Centered Bottom) */}
          <div className="z-10 mt-2 flex flex-wrap items-center justify-between gap-2 p-2 bg-[#12141c]/90 backdrop-blur-md rounded-xl border border-[#262a3a]">
            {/* Quick View Presets (Strictly Verified with Geometry) */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {Object.entries(CAMRY_CAMERA_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => switchCameraView(key)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                    activePreset === key
                      ? 'bg-amber-500 text-black font-bold shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-[#202433]'
                  }`}
                >
                  {preset.labelFa}
                </button>
              ))}
            </div>

            {/* Camera Zoom & Reset Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleZoom(0.85)}
                className="p-1.5 rounded-lg bg-[#1c202d] hover:bg-[#282d3f] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="بزرگنمایی (Zoom In)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom(1.15)}
                className="p-1.5 rounded-lg bg-[#1c202d] hover:bg-[#282d3f] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="کوچکنمایی (Zoom Out)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => switchCameraView('perspective')}
                className="p-1.5 rounded-lg bg-[#1c202d] hover:bg-[#282d3f] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="بازنشانی دوربین به نمای اولیه ۳/۴"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CAD Hint Banner */}
          <div className="text-[11px] text-zinc-500 flex items-center justify-between px-2 pt-1">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-zinc-400" />
              <span>چرخش: درگ چپ | زوم: اسکرول | جابجایی: درگ راست | ثبت: کلیک روی هر نقطه از بدنه</span>
            </span>
            <span className="font-en-num text-zinc-500">Full-Surface Raycast · Zero Coordinate Drift</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT: Damage Register & Inspection Sidebar (4 Cols)     */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 flex flex-col space-y-3 bg-[#131418] border border-[#262833] rounded-2xl p-4 shadow-xl">
          {/* Sidebar Title & Filter */}
          <div className="flex items-center justify-between pb-3 border-b border-[#232633]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Crosshair className="w-3.5 h-3.5" />
              </div>
              <h5 className="text-xs font-bold text-zinc-200">فهرست آسیب‌های بدنه</h5>
            </div>
            <span className="text-xs font-en-num px-2 py-0.5 rounded-full bg-zinc-800 text-amber-300 font-bold border border-zinc-700">
              {filteredMarkers.length} مورد
            </span>
          </div>

          {/* Severity Filter Tabs */}
          <div className="grid grid-cols-4 gap-1 bg-[#1a1c24] p-1 rounded-xl text-[11px]">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`py-1 rounded-lg text-center font-medium transition-all cursor-pointer ${
                severityFilter === 'all'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              همه ({markers.length})
            </button>
            <button
              onClick={() => setSeverityFilter('severe')}
              className={`py-1 rounded-lg text-center font-medium transition-all cursor-pointer ${
                severityFilter === 'severe'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-zinc-400 hover:text-rose-400'
              }`}
            >
              شدید
            </button>
            <button
              onClick={() => setSeverityFilter('moderate')}
              className={`py-1 rounded-lg text-center font-medium transition-all cursor-pointer ${
                severityFilter === 'moderate'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-zinc-400 hover:text-amber-400'
              }`}
            >
              متوسط
            </button>
            <button
              onClick={() => setSeverityFilter('minor')}
              className={`py-1 rounded-lg text-center font-medium transition-all cursor-pointer ${
                severityFilter === 'minor'
                  ? 'bg-sky-500 text-white font-bold'
                  : 'text-zinc-400 hover:text-sky-400'
              }`}
            >
              جزئی
            </button>
          </div>

          {/* Marker List Container */}
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[380px] pr-0.5">
            {filteredMarkers.length === 0 ? (
              <div className="text-center py-10 px-4 text-zinc-500 space-y-2 bg-[#171922] rounded-xl border border-dashed border-[#272b3b]">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto" />
                <p className="text-xs">هیچ آسیبی در این دسته‌بندی ثبت نشده است.</p>
                {!readOnly && (
                  <p className="text-[11px] text-zinc-400">
                    برای ثبت آسیب، روی بدنه سه‌بعدی خودرو کلیک نمایید.
                  </p>
                )}
              </div>
            ) : (
              filteredMarkers.map((marker) => {
                const cfg = DAMAGE_TYPE_CONFIG[marker.damageType] || DAMAGE_TYPE_CONFIG.other;
                const isSelected = selectedMarkerId === marker.id;
                const markerNumber = markers.findIndex((m) => m.id === marker.id) + 1;

                return (
                  <div
                    key={marker.id}
                    onClick={() => focusOnMarker(marker)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-[#1e2333] border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                        : 'bg-[#181a23] border-[#292c3a] hover:border-zinc-500 hover:bg-[#1d202c]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Number Badge with matching color */}
                        <div
                          style={{ backgroundColor: cfg.markerColor }}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-black font-black text-[11px] font-en-num shrink-0 shadow"
                        >
                          {markerNumber}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-zinc-100 block">
                            {marker.panelLabelFa}
                          </span>
                          <span className={`text-[11px] font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </div>

                      {/* Severity Label */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          marker.severity === 'severe'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : marker.severity === 'moderate'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        }`}
                      >
                        {marker.severity === 'severe'
                          ? 'شدید'
                          : marker.severity === 'moderate'
                          ? 'متوسط'
                          : 'جزئی'}
                      </span>
                    </div>

                    {/* Coordinates metadata */}
                    {marker.point3D && (
                      <div className="text-[10px] font-en-num text-zinc-500 mt-1">
                        X: {marker.point3D.x}m · Y: {marker.point3D.y}m · Z: {marker.point3D.z}m
                      </div>
                    )}

                    {/* Notes if available */}
                    {marker.notes && (
                      <p className="text-[11px] text-zinc-400 mt-1.5 bg-[#12131a] p-2 rounded-lg border border-[#222533]">
                        {marker.notes}
                      </p>
                    )}

                    {/* Photos Preview Thumbnails */}
                    {marker.photos && marker.photos.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                        {marker.photos.map((photoUrl, pIdx) => (
                          <img
                            key={pIdx}
                            src={photoUrl}
                            alt="Damage attachment"
                            className="w-10 h-10 object-cover rounded-lg border border-zinc-700 hover:scale-110 transition-transform"
                          />
                        ))}
                        <span className="text-[10px] text-zinc-400 font-en-num">
                          {marker.photos.length} تصویر
                        </span>
                      </div>
                    )}

                    {/* Action Buttons: Focus, Reposition, Edit, Delete */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#232635] text-[11px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          focusOnMarker(marker);
                        }}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                        title="تمرکز زاویه دوربین بر روی این نقطه"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>تمرکز ۳D</span>
                      </button>

                      {!readOnly && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsRepositioningId(marker.id);
                            }}
                            className="p-1 rounded text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="تغییر مکان این علامت بر روی بدنه"
                          >
                            <Move className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditMarker(marker);
                            }}
                            className="p-1 rounded text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="ویرایش مشخصات آسیب"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteCandidateId(marker.id);
                            }}
                            className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="حذف این آسیب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ADD / EDIT DAMAGE MARKER MODAL (Glassmorphic)              */}
      {/* ========================================================= */}
      {isMarkerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#14161f] border border-[#2b3042] rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#232736]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Crosshair className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">
                    {editingMarkerId ? 'ویرایش اطلاعات آسیب بدنه' : 'ثبت آسیب جدید روی بدنه'}
                  </h4>
                  {pending3DPoint && (
                    <span className="text-[10px] font-en-num text-cyan-400">
                      مختصات سه‌بعدی: X={pending3DPoint.x}m · Y={pending3DPoint.y}m · Z={pending3DPoint.z}m
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMarkerModalOpen(false);
                  setEditingMarkerId(null);
                  setPending3DPoint(null);
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Auto-detected Body Panel with Manual Override */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>قطعه یا محل بدنه خودرو:</span>
                <span className="text-[10px] text-emerald-400 font-normal">تشخیص هوشمند سطح ۳D</span>
              </label>
              <select
                value={formPanel}
                onChange={(e) => setFormPanel(e.target.value as VehicleBodyPanel)}
                className="w-full bg-[#1b1e2a] border border-[#2b3044] rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {Object.entries(BODY_PANEL_CONFIG).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Damage Type Selection Grid (All 9 types from prompt) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">نوع آسیب بدنه:</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(DAMAGE_TYPE_CONFIG).map(([key, cfg]) => {
                  const isSelected = formDamageType === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormDamageType(key as BodyDamageType)}
                      className={`p-2 rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        isSelected
                          ? `${cfg.bg} ${cfg.border} ${cfg.color} font-bold ring-2 ring-amber-400/50 shadow-md`
                          : 'bg-[#181a24] border-[#292c3a] text-zinc-400 hover:text-zinc-200 hover:bg-[#1f2230]'
                      }`}
                    >
                      <span
                        style={{ backgroundColor: cfg.markerColor }}
                        className="w-2.5 h-2.5 rounded-full"
                      />
                      <span className="text-center leading-tight">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Severity Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">شدت آسیب:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'minor', label: 'جزئی', color: 'border-sky-500/40 text-sky-400 bg-sky-500/10' },
                  { id: 'moderate', label: 'متوسط', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
                  { id: 'severe', label: 'شدید', color: 'border-rose-500/40 text-rose-400 bg-rose-500/10' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFormSeverity(s.id as BodyDamageSeverity)}
                    className={`py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      formSeverity === s.id
                        ? `${s.color} font-bold ring-2 ring-amber-400/40`
                        : 'bg-[#181a24] border-[#292c3a] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description / Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">توضیحات و جزئیات تکمیلی:</label>
              <textarea
                rows={2}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="مثلا: خط عمقی به طول ۱۰ سانتیمتر بالای دستگیره درب، نیاز به لیسه‌گیری..."
                className="w-full bg-[#1b1e2a] border border-[#2b3044] rounded-xl p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>عکس‌های ضمیمه آسیب ({formPhotos.length} فایل):</span>
                <label className="text-xs text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" />
                  <span>افزودن تصویر</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </label>

              {formPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-[#171924] rounded-xl border border-[#282c3c] max-h-24 overflow-y-auto">
                  {formPhotos.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
                        alt="Damage Preview"
                        className="w-12 h-12 object-cover rounded-lg border border-zinc-700"
                      />
                      <button
                        type="button"
                        onClick={() => setFormPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#232736]">
              <button
                type="button"
                onClick={() => {
                  setIsMarkerModalOpen(false);
                  setEditingMarkerId(null);
                  setPending3DPoint(null);
                }}
                className="px-4 py-2 rounded-xl text-xs text-zinc-300 hover:bg-[#1f2230] transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveMarker}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                {editingMarkerId ? 'ذخیره تغییرات' : 'ثبت قطعی آسیب در مدل ۳D'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE CONFIRMATION MODAL                                  */}
      {/* ========================================================= */}
      {deleteCandidateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#161822] border border-[#2e3344] rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100">حذف علامت آسیب از مدل؟</h4>
              <p className="text-xs text-zinc-400 mt-1">
                آیا از حذف این آسیب ثبت‌شده اطمینان دارید؟ در صورت حذف تصادفی، امکان بازگردانی سریع وجود دارد.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteCandidateId(null)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-300 hover:bg-[#202331] transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={() => handleDeleteWithConfirmation(deleteCandidateId)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                بله، حذف شود
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
