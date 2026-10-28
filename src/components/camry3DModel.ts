import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VehicleBodyPanel } from '../types/consignment';
import { BODY_PANEL_CONFIG } from './Vehicle3DDamageViewer';

/**
 * Standardized Technical CAD Wireframe Specification for Toyota Camry Sedan
 *
 * Coordinate System (Right-Handed Standard):
 * - X Axis (Longitudinal): +X is Forward (Front), -X is Backward (Rear)
 * - Y Axis (Vertical): +Y is Up, -Y is Down (Ground = 0.0)
 * - Z Axis (Lateral): -Z is Left (Driver Side in LHD), +Z is Right (Passenger Side)
 *
 * Real Toyota Camry Proportions (Meters):
 * - Length: 4.885m (Front tip: +2.44m, Rear tip: -2.445m)
 * - Width: 1.840m (Left: -0.92m, Right: +0.92m, with mirrors: ±1.05m)
 * - Height: 1.445m (Roof peak: 1.445m, Ground clearance: 0.15m)
 * - Wheelbase: 2.825m (Front axle: +1.40m, Rear axle: -1.425m)
 */

export interface PanelMeshUserData {
  panel: VehicleBodyPanel;
  panelLabelFa: string;
  isClickableSurface: boolean;
}

// Technical CAD Materials (Pure monochrome with subtle translucent volumetric depth)
export const CAD_MATERIALS = {
  // Translucent body shell (Provides solid depth, raycast target, and backface occlusion)
  bodyTranslucent: new THREE.MeshStandardMaterial({
    color: 0x141a29,
    roughness: 0.35,
    metalness: 0.1,
    transparent: true,
    opacity: 0.36,
    side: THREE.DoubleSide, // Crucial: allows clicks from any angle without face culling
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  }),
  // Glass panels (windshield, rear glass, side windows)
  glassTranslucent: new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  }),
  // Wheels & mechanical components
  mechanicalTranslucent: new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.6,
    metalness: 0.4,
    transparent: true,
    opacity: 0.48,
    side: THREE.DoubleSide,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  }),
  // Primary CAD Wireframe Line Material (Monochrome engineering silver)
  cadLinePrimary: new THREE.LineBasicMaterial({
    color: 0xe2e8f0,
    transparent: true,
    opacity: 0.90,
    linewidth: 1,
  }),
  // Accent CAD Wireframe Line Material (Blueprint cyan detail lines)
  cadLineAccent: new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.70,
    linewidth: 1,
  }),
  // Window outline lines
  cadLineGlass: new THREE.LineBasicMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.85,
    linewidth: 1,
  }),
  // Panel cutlines (doors, hood, trunk boundaries)
  cadCutline: new THREE.LineBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.95,
    linewidth: 1.5,
  }),
};

/**
 * Creates a CAD panel with solid double-sided picking mesh + precision edge lines
 */
export function createCadPanel(
  geometry: THREE.BufferGeometry,
  panel: VehicleBodyPanel,
  material: THREE.Material = CAD_MATERIALS.bodyTranslucent,
  lineMaterial: THREE.Material = CAD_MATERIALS.cadLinePrimary,
  thresholdAngle: number = 20
): THREE.Group {
  const group = new THREE.Group();

  // Solid picking mesh
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const userData: PanelMeshUserData = {
    panel,
    panelLabelFa: BODY_PANEL_CONFIG[panel] || 'نامشخص',
    isClickableSurface: true,
  };
  mesh.userData = userData;
  group.add(mesh);

  // Precision CAD wireframe edges
  const edgesGeometry = new THREE.EdgesGeometry(geometry, thresholdAngle);
  const wireframeLines = new THREE.LineSegments(edgesGeometry, lineMaterial);
  wireframeLines.userData = { isLine: true, isClickableSurface: false };
  group.add(wireframeLines);

  group.userData = userData;
  return group;
}

/**
 * Spatial Panel Resolver: Infers the precise automotive panel from (X, Y, Z) coordinates
 * Used as an ultra-reliable fallback for full-surface raycasting.
 */
export function resolveBodyPanelFromCoordinates(
  point: { x: number; y: number; z: number },
  normal?: { x: number; y: number; z: number }
): { panel: VehicleBodyPanel; labelFa: string } {
  const { x, y, z } = point;
  const isLeft = z < 0; // -Z is Left (Driver side), +Z is Right (Passenger side)

  // 1. Front Bumper
  if (x > 2.05 && y < 0.78) {
    return { panel: 'front_bumper', labelFa: BODY_PANEL_CONFIG.front_bumper };
  }

  // 2. Rear Bumper
  if (x < -2.15 && y < 0.82) {
    return { panel: 'rear_bumper', labelFa: BODY_PANEL_CONFIG.rear_bumper };
  }

  // 3. Roof & Sunroof
  if (y >= 1.25 && x >= -1.05 && x <= 0.75) {
    if (x >= -0.15 && x <= 0.45 && Math.abs(z) <= 0.42) {
      return { panel: 'sunroof', labelFa: BODY_PANEL_CONFIG.sunroof };
    }
    return { panel: 'roof', labelFa: BODY_PANEL_CONFIG.roof };
  }

  // 4. Windshield (Front glass)
  if (x >= 0.70 && x <= 1.05 && y >= 0.92 && Math.abs(z) <= 0.68) {
    return { panel: 'windshield', labelFa: BODY_PANEL_CONFIG.windshield };
  }

  // 5. Rear Windshield (Rear glass)
  if (x >= -1.55 && x <= -0.95 && y >= 0.94 && Math.abs(z) <= 0.66) {
    return { panel: 'rear_windshield', labelFa: BODY_PANEL_CONFIG.rear_windshield };
  }

  // 6. Hood
  if (x >= 0.90 && y >= 0.70 && Math.abs(z) <= 0.72) {
    return { panel: 'hood', labelFa: BODY_PANEL_CONFIG.hood };
  }

  // 7. Trunk
  if (x <= -1.45 && y >= 0.78 && Math.abs(z) <= 0.70) {
    return { panel: 'trunk', labelFa: BODY_PANEL_CONFIG.trunk };
  }

  // 8. Mirrors
  if (x >= 0.65 && x <= 0.85 && y >= 0.90 && y <= 1.15 && Math.abs(z) >= 0.92) {
    return isLeft
      ? { panel: 'left_mirror', labelFa: BODY_PANEL_CONFIG.left_mirror }
      : { panel: 'right_mirror', labelFa: BODY_PANEL_CONFIG.right_mirror };
  }

  // 9. Wheels & Rims
  if (y <= 0.45 && Math.abs(z) >= 0.70) {
    const isFrontWheel = Math.abs(x - 1.40) < 0.45;
    const isRearWheel = Math.abs(x - -1.425) < 0.45;
    if (isFrontWheel || isRearWheel) {
      return { panel: 'wheel_rim', labelFa: BODY_PANEL_CONFIG.wheel_rim };
    }
  }

  // 10. Rocker Panels (Side Skirts)
  if (y <= 0.30 && x >= -0.75 && x <= 0.88 && Math.abs(z) >= 0.75) {
    return isLeft
      ? { panel: 'left_rocker_panel', labelFa: BODY_PANEL_CONFIG.left_rocker_panel }
      : { panel: 'right_rocker_panel', labelFa: BODY_PANEL_CONFIG.right_rocker_panel };
  }

  // 11. Side Panels: Doors vs Fenders
  if (isLeft) {
    // Left Side (-Z)
    if (x > 0.85) {
      return { panel: 'front_left_fender', labelFa: BODY_PANEL_CONFIG.front_left_fender };
    } else if (x >= 0.10 && x <= 0.85) {
      return { panel: 'front_left_door', labelFa: BODY_PANEL_CONFIG.front_left_door };
    } else if (x >= -0.70 && x < 0.10) {
      return { panel: 'rear_left_door', labelFa: BODY_PANEL_CONFIG.rear_left_door };
    } else {
      return { panel: 'rear_left_fender', labelFa: BODY_PANEL_CONFIG.rear_left_fender };
    }
  } else {
    // Right Side (+Z)
    if (x > 0.85) {
      return { panel: 'front_right_fender', labelFa: BODY_PANEL_CONFIG.front_right_fender };
    } else if (x >= 0.10 && x <= 0.85) {
      return { panel: 'front_right_door', labelFa: BODY_PANEL_CONFIG.front_right_door };
    } else if (x >= -0.70 && x < 0.10) {
      return { panel: 'rear_right_door', labelFa: BODY_PANEL_CONFIG.rear_right_door };
    } else {
      return { panel: 'rear_right_fender', labelFa: BODY_PANEL_CONFIG.rear_right_fender };
    }
  }
}

/**
 * Builds the Complete, Full-Surface Watertight Toyota Camry 3D CAD Model
 * Every component has complete geometry ensuring 100% surface raycast coverage.
 */
export function buildToyotaCamry3DModel(): THREE.Group {
  const carGroup = new THREE.Group();
  carGroup.name = 'Toyota_Camry_2024_CAD_FullSurface';

  // ==========================================
  // 1. HOOD (کاپوت جلو)
  // Continuous aerodynamic curved surface with dual power creases
  // ==========================================
  const hoodGeom = new THREE.BufferGeometry();
  const hoodLength = 1.35; // from X = 0.95 to X = 2.30
  const hoodWidth = 1.40;
  const hoodSegX = 18;
  const hoodSegZ = 18;

  const hoodPositions: number[] = [];
  const hoodIndices: number[] = [];

  for (let i = 0; i <= hoodSegX; i++) {
    const u = i / hoodSegX; // 0 = base at windshield (X=0.95), 1 = nose (X=2.30)
    const x = 0.95 + u * hoodLength;
    // Aerodynamic parabolic drop toward the front nose
    const baseY = 0.97 - Math.pow(u, 1.25) * 0.24;

    for (let j = 0; j <= hoodSegZ; j++) {
      const v = j / hoodSegZ; // 0 to 1 across width (-Z to +Z)
      const z = (v - 0.5) * (hoodWidth * (1 - u * 0.14));

      // Camry center crown + prominent side power domes at |z| = 0.32
      const crown = Math.cos((v - 0.5) * Math.PI) * 0.055;
      const distFromCrease = Math.abs(Math.abs(z) - 0.32);
      const crease = distFromCrease < 0.09 ? (0.09 - distFromCrease) * 0.16 : 0;
      const y = baseY + crown + crease;

      hoodPositions.push(x, y, z);
    }
  }

  for (let i = 0; i < hoodSegX; i++) {
    for (let j = 0; j < hoodSegZ; j++) {
      const a = i * (hoodSegZ + 1) + j;
      const b = (i + 1) * (hoodSegZ + 1) + j;
      const c = (i + 1) * (hoodSegZ + 1) + (j + 1);
      const d = i * (hoodSegZ + 1) + (j + 1);
      hoodIndices.push(a, b, d);
      hoodIndices.push(b, c, d);
    }
  }

  hoodGeom.setAttribute('position', new THREE.Float32BufferAttribute(hoodPositions, 3));
  hoodGeom.setIndex(hoodIndices);
  hoodGeom.computeVertexNormals();

  const hoodPanel = createCadPanel(hoodGeom, 'hood');
  carGroup.add(hoodPanel);

  // ==========================================
  // 2. ROOF (سقف خودرو) & SUNROOF (سانروف)
  // Continuous aerodynamic roof arc
  // ==========================================
  const roofGeom = new THREE.BufferGeometry();
  const roofLength = 1.74; // from X = -1.02 to X = 0.72
  const roofWidth = 1.28;
  const roofSegX = 16;
  const roofSegZ = 14;

  const roofPositions: number[] = [];
  const roofIndices: number[] = [];

  for (let i = 0; i <= roofSegX; i++) {
    const u = i / roofSegX; // 0 = rear header (X=-1.02), 1 = front header (X=0.72)
    const x = -1.02 + u * roofLength;
    // Parabolic arc (peak at center 1.445m)
    const y = 1.39 + Math.sin(u * Math.PI) * 0.055;

    for (let j = 0; j <= roofSegZ; j++) {
      const v = j / roofSegZ;
      const z = (v - 0.5) * roofWidth;
      const crown = Math.cos((v - 0.5) * Math.PI) * 0.038;
      roofPositions.push(x, y + crown, z);
    }
  }

  for (let i = 0; i < roofSegX; i++) {
    for (let j = 0; j < roofSegZ; j++) {
      const a = i * (roofSegZ + 1) + j;
      const b = (i + 1) * (roofSegZ + 1) + j;
      const c = (i + 1) * (roofSegZ + 1) + (j + 1);
      const d = i * (roofSegZ + 1) + (j + 1);
      roofIndices.push(a, b, d);
      roofIndices.push(b, c, d);
    }
  }

  roofGeom.setAttribute('position', new THREE.Float32BufferAttribute(roofPositions, 3));
  roofGeom.setIndex(roofIndices);
  roofGeom.computeVertexNormals();

  const roofPanel = createCadPanel(roofGeom, 'roof');
  carGroup.add(roofPanel);

  // Sunroof Glass Insert
  const sunroofGeom = new THREE.PlaneGeometry(0.78, 0.76, 6, 6);
  sunroofGeom.rotateX(-Math.PI / 2);
  sunroofGeom.translate(0.12, 1.448, 0);
  const sunroofPanel = createCadPanel(
    sunroofGeom,
    'sunroof',
    CAD_MATERIALS.glassTranslucent,
    CAD_MATERIALS.cadLineGlass,
    15
  );
  carGroup.add(sunroofPanel);

  // ==========================================
  // 3. TRUNK (درب صندوق عقب)
  // Rear decklid with Camry ducktail lip
  // ==========================================
  const trunkGeom = new THREE.BufferGeometry();
  const trunkLength = 0.88; // from X = -1.48 to X = -2.36
  const trunkWidth = 1.34;
  const trunkSegX = 14;
  const trunkSegZ = 14;

  const trunkPositions: number[] = [];
  const trunkIndices: number[] = [];

  for (let i = 0; i <= trunkSegX; i++) {
    const u = i / trunkSegX; // 0 = base of rear glass, 1 = trunk rear tip
    const x = -1.48 - u * trunkLength;
    // Aerodynamic curve ending in an upturned ducktail spoiler
    const spoiler = u > 0.78 ? Math.pow((u - 0.78) / 0.22, 2) * 0.035 : 0;
    const y = 0.98 - u * 0.06 + spoiler;

    for (let j = 0; j <= trunkSegZ; j++) {
      const v = j / trunkSegZ;
      const z = (v - 0.5) * (trunkWidth * (1 - u * 0.05));
      const crown = Math.cos((v - 0.5) * Math.PI) * 0.032;
      trunkPositions.push(x, y + crown, z);
    }
  }

  for (let i = 0; i < trunkSegX; i++) {
    for (let j = 0; j < trunkSegZ; j++) {
      const a = i * (trunkSegZ + 1) + j;
      const b = (i + 1) * (trunkSegZ + 1) + j;
      const c = (i + 1) * (trunkSegZ + 1) + (j + 1);
      const d = i * (trunkSegZ + 1) + (j + 1);
      trunkIndices.push(a, b, d);
      trunkIndices.push(b, c, d);
    }
  }

  trunkGeom.setAttribute('position', new THREE.Float32BufferAttribute(trunkPositions, 3));
  trunkGeom.setIndex(trunkIndices);
  trunkGeom.computeVertexNormals();

  const trunkPanel = createCadPanel(trunkGeom, 'trunk');
  carGroup.add(trunkPanel);

  // ==========================================
  // 4. FRONT BUMPER & GRILLE (سپر جلو و جلوپنجره)
  // Complete Camry front fascia: upper beak, lower trapezoidal grille, front lip
  // ==========================================
  const fBumperGeom = new THREE.BufferGeometry();
  const fbSegH = 12; // vertical slices
  const fbSegRad = 24; // curved around front
  const fbPos: number[] = [];
  const fbIdx: number[] = [];

  for (let i = 0; i <= fbSegH; i++) {
    const u = i / fbSegH; // 0 = bottom lip (Y=0.18), 1 = upper nose (Y=0.75)
    const y = 0.18 + u * 0.57;
    // Camry nose protrusion profile
    const nosePush = Math.sin(u * Math.PI) * 0.12;

    for (let j = 0; j <= fbSegRad; j++) {
      const v = j / fbSegRad; // 0 (-Z) to 1 (+Z)
      const angle = (v - 0.5) * Math.PI * 0.85; // curved wrap around nose
      const radius = 0.92 * (1 - u * 0.08);

      const z = Math.sin(angle) * radius;
      const x = 2.22 + Math.cos(angle) * 0.22 + nosePush;

      fbPos.push(x, y, z);
    }
  }

  for (let i = 0; i < fbSegH; i++) {
    for (let j = 0; j < fbSegRad; j++) {
      const a = i * (fbSegRad + 1) + j;
      const b = (i + 1) * (fbSegRad + 1) + j;
      const c = (i + 1) * (fbSegRad + 1) + (j + 1);
      const d = i * (fbSegRad + 1) + (j + 1);
      fbIdx.push(a, b, d);
      fbIdx.push(b, c, d);
    }
  }

  fBumperGeom.setAttribute('position', new THREE.Float32BufferAttribute(fbPos, 3));
  fBumperGeom.setIndex(fbIdx);
  fBumperGeom.computeVertexNormals();

  const fBumperPanel = createCadPanel(
    fBumperGeom,
    'front_bumper',
    CAD_MATERIALS.bodyTranslucent,
    CAD_MATERIALS.cadLinePrimary,
    16
  );
  carGroup.add(fBumperPanel);

  // Front Grille Mesh Lines (Camry signature spindle-style horizontal slats)
  for (let k = 0; k < 5; k++) {
    const slatY = 0.32 + k * 0.07;
    const slatGeom = new THREE.BufferGeometry();
    const slatPts = [
      2.38 - k * 0.015, slatY, -0.65 + k * 0.05,
      2.43 - k * 0.01, slatY, 0,
      2.38 - k * 0.015, slatY, 0.65 - k * 0.05,
    ];
    slatGeom.setAttribute('position', new THREE.Float32BufferAttribute(slatPts, 3));
    const slat = new THREE.Line(slatGeom, CAD_MATERIALS.cadLineAccent);
    carGroup.add(slat);
  }

  // ==========================================
  // 5. REAR BUMPER (سپر عقب)
  // Sculpted rear fascia with diffuser profile & dual exhaust outlets
  // ==========================================
  const rBumperGeom = new THREE.BufferGeometry();
  const rbSegH = 12;
  const rbSegRad = 24;
  const rbPos: number[] = [];
  const rbIdx: number[] = [];

  for (let i = 0; i <= rbSegH; i++) {
    const u = i / rbSegH; // 0 = bottom diffuser (Y=0.22), 1 = trunk seam (Y=0.88)
    const y = 0.22 + u * 0.66;
    const rearPush = Math.sin(u * Math.PI) * 0.10;

    for (let j = 0; j <= rbSegRad; j++) {
      const v = j / rbSegRad;
      const angle = (v - 0.5) * Math.PI * 0.85;
      const radius = 0.90 * (1 - u * 0.06);

      const z = Math.sin(angle) * radius;
      const x = -2.32 - Math.cos(angle) * 0.16 - rearPush;

      rbPos.push(x, y, z);
    }
  }

  for (let i = 0; i < rbSegH; i++) {
    for (let j = 0; j < rbSegRad; j++) {
      const a = i * (rbSegRad + 1) + j;
      const b = (i + 1) * (rbSegRad + 1) + j;
      const c = (i + 1) * (rbSegRad + 1) + (j + 1);
      const d = i * (rbSegRad + 1) + (j + 1);
      rbIdx.push(a, b, d);
      rbIdx.push(b, c, d);
    }
  }

  rBumperGeom.setAttribute('position', new THREE.Float32BufferAttribute(rbPos, 3));
  rBumperGeom.setIndex(rbIdx);
  rBumperGeom.computeVertexNormals();

  const rBumperPanel = createCadPanel(
    rBumperGeom,
    'rear_bumper',
    CAD_MATERIALS.bodyTranslucent,
    CAD_MATERIALS.cadLinePrimary,
    16
  );
  carGroup.add(rBumperPanel);

  // Dual Exhaust Outlets (-X rear, both sides Z = ±0.58)
  for (const side of [-1, 1]) {
    const exhaustGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.14, 16);
    exhaustGeom.rotateZ(Math.PI / 2);
    exhaustGeom.translate(-2.44, 0.28, side * 0.58);
    const exhaust = createCadPanel(
      exhaustGeom,
      'rear_bumper',
      CAD_MATERIALS.mechanicalTranslucent,
      CAD_MATERIALS.cadLineAccent
    );
    carGroup.add(exhaust);
  }

  // ==========================================
  // 6. WINDSHIELDS (FRONT & REAR)
  // Complete curved glass geometry
  // ==========================================
  // Front Windshield
  const wsGeom = new THREE.BufferGeometry();
  const wsLength = 0.25; // X from 0.72 to 0.95
  const wsSeg = 8;
  const wsPos: number[] = [];
  const wsIdx: number[] = [];

  for (let i = 0; i <= wsSeg; i++) {
    const u = i / wsSeg;
    const x = 0.72 + u * 0.23;
    const y = 1.40 - u * 0.42;
    const w = 0.58 + u * 0.09;

    for (let j = 0; j <= wsSeg; j++) {
      const v = j / wsSeg;
      const z = (v - 0.5) * (w * 2);
      const crown = Math.cos((v - 0.5) * Math.PI) * 0.035;
      wsPos.push(x, y + crown, z);
    }
  }

  for (let i = 0; i < wsSeg; i++) {
    for (let j = 0; j < wsSeg; j++) {
      const a = i * (wsSeg + 1) + j;
      const b = (i + 1) * (wsSeg + 1) + j;
      const c = (i + 1) * (wsSeg + 1) + (j + 1);
      const d = i * (wsSeg + 1) + (j + 1);
      wsIdx.push(a, b, d);
      wsIdx.push(b, c, d);
    }
  }

  wsGeom.setAttribute('position', new THREE.Float32BufferAttribute(wsPos, 3));
  wsGeom.setIndex(wsIdx);
  wsGeom.computeVertexNormals();

  const windshieldPanel = createCadPanel(
    wsGeom,
    'windshield',
    CAD_MATERIALS.glassTranslucent,
    CAD_MATERIALS.cadLineGlass,
    12
  );
  carGroup.add(windshieldPanel);

  // Rear Windshield
  const rwsGeom = new THREE.BufferGeometry();
  const rwsPos: number[] = [];
  const rwsIdx: number[] = [];

  for (let i = 0; i <= wsSeg; i++) {
    const u = i / wsSeg;
    const x = -1.02 - u * 0.46;
    const y = 1.39 - u * 0.41;
    const w = 0.58 + u * 0.08;

    for (let j = 0; j <= wsSeg; j++) {
      const v = j / wsSeg;
      const z = (v - 0.5) * (w * 2);
      const crown = Math.cos((v - 0.5) * Math.PI) * 0.032;
      rwsPos.push(x, y + crown, z);
    }
  }

  for (let i = 0; i < wsSeg; i++) {
    for (let j = 0; j < wsSeg; j++) {
      const a = i * (wsSeg + 1) + j;
      const b = (i + 1) * (wsSeg + 1) + j;
      const c = (i + 1) * (wsSeg + 1) + (j + 1);
      const d = i * (wsSeg + 1) + (j + 1);
      rwsIdx.push(a, b, d);
      rwsIdx.push(b, c, d);
    }
  }

  rwsGeom.setAttribute('position', new THREE.Float32BufferAttribute(rwsPos, 3));
  rwsGeom.setIndex(rwsIdx);
  rwsGeom.computeVertexNormals();

  const rearWsPanel = createCadPanel(
    rwsGeom,
    'rear_windshield',
    CAD_MATERIALS.glassTranslucent,
    CAD_MATERIALS.cadLineGlass,
    12
  );
  carGroup.add(rearWsPanel);

  // ==========================================
  // 7. SIDE PANELS: DOORS, FENDERS, PILLARS, ROCKERS, WINDOWS
  // Standardized Lateral Axis:
  // -Z = Left side (Driver in LHD / Iran)
  // +Z = Right side (Passenger)
  // ==========================================
  const sideConfigs: { side: 'left' | 'right'; signZ: number }[] = [
    { side: 'left', signZ: -1 }, // Left is -Z
    { side: 'right', signZ: 1 },  // Right is +Z
  ];

  sideConfigs.forEach(({ side, signZ }) => {
    const isLeft = side === 'left';
    const zOuter = signZ * 0.90; // outer door & fender skin
    const zInner = signZ * 0.64; // roof rail & window header
    const zWheel = signZ * 0.88; // wheel arch peak

    // ----------------------------------------
    // A. FRONT FENDER (گلگیر جلو)
    // Continuous multi-quad geometry from front bumper to A-pillar
    // ----------------------------------------
    const ffGeom = new THREE.BufferGeometry();
    const ffPts: number[] = [
      // Row 0 (Top hood seam)
      2.25, 0.76, signZ * 0.68,
      1.55, 0.91, signZ * 0.70,
      0.88, 0.96, signZ * 0.70,

      // Row 1 (Fender shoulder & wheel arch flare)
      2.26, 0.58, zOuter,
      1.40, 0.76, zWheel, // Wheel arch apex
      0.88, 0.64, zOuter,

      // Row 2 (Lower fender body & wheel cutout)
      2.20, 0.30, zOuter * 0.95,
      1.05, 0.30, zOuter * 0.95,
      0.88, 0.28, zOuter * 0.92,
    ];
    const ffIdx = [
      0, 1, 4,  0, 4, 3,
      1, 2, 5,  1, 5, 4,
      3, 4, 7,  3, 7, 6,
      4, 5, 8,  4, 8, 7,
    ];
    ffGeom.setAttribute('position', new THREE.Float32BufferAttribute(ffPts, 3));
    ffGeom.setIndex(ffIdx);
    ffGeom.computeVertexNormals();

    const fFenderPanel = createCadPanel(
      ffGeom,
      isLeft ? 'front_left_fender' : 'front_right_fender',
      CAD_MATERIALS.bodyTranslucent,
      CAD_MATERIALS.cadLinePrimary,
      15
    );
    carGroup.add(fFenderPanel);

    // ----------------------------------------
    // B. REAR FENDER / QUARTER PANEL (گلگیر عقب)
    // Spans from rear door seam (-0.68) to rear bumper (-2.32)
    // ----------------------------------------
    const rfGeom = new THREE.BufferGeometry();
    const rfPts: number[] = [
      // Row 0 (Top C-pillar / trunk seam)
      -0.68, 1.05, signZ * 0.68,
      -1.45, 0.98, signZ * 0.68,
      -2.32, 0.88, signZ * 0.68,

      // Row 1 (Shoulder flare & rear wheel arch)
      -0.68, 0.66, zOuter,
      -1.42, 0.78, zWheel,
      -2.34, 0.60, zOuter,

      // Row 2 (Lower quarter panel)
      -0.68, 0.28, zOuter * 0.92,
      -1.08, 0.30, zOuter * 0.95,
      -2.34, 0.32, zOuter * 0.95,
    ];
    const rfIdx = [
      0, 1, 4,  0, 4, 3,
      1, 2, 5,  1, 5, 4,
      3, 4, 7,  3, 7, 6,
      4, 5, 8,  4, 8, 7,
    ];
    rfGeom.setAttribute('position', new THREE.Float32BufferAttribute(rfPts, 3));
    rfGeom.setIndex(rfIdx);
    rfGeom.computeVertexNormals();

    const rFenderPanel = createCadPanel(
      rfGeom,
      isLeft ? 'rear_left_fender' : 'rear_right_fender',
      CAD_MATERIALS.bodyTranslucent,
      CAD_MATERIALS.cadLinePrimary,
      15
    );
    carGroup.add(rFenderPanel);

    // Fuel Door (left side only, on rear quarter panel)
    if (isLeft) {
      const fuelDoorGeom = new THREE.CircleGeometry(0.075, 16);
      fuelDoorGeom.rotateY(-Math.PI / 2);
      fuelDoorGeom.translate(-1.75, 0.82, zOuter - 0.01);
      const fuelDoor = createCadPanel(fuelDoorGeom, 'rear_left_fender', CAD_MATERIALS.bodyTranslucent, CAD_MATERIALS.cadLineAccent);
      carGroup.add(fuelDoor);
    }

    // ----------------------------------------
    // C. FRONT DOOR (درب جلو)
    // Spans from X = 0.88 to X = 0.10 (Driver door on Left, Passenger door on Right)
    // ----------------------------------------
    const fdGeom = new THREE.BufferGeometry();
    const fdPts: number[] = [
      // Top window sill / A-pillar & B-pillar header
      0.72, 1.39, zInner,
      0.10, 1.42, zInner,
      // Beltline (bottom of window glass)
      0.88, 0.94, zOuter * 0.96,
      0.10, 0.94, zOuter * 0.96,
      // Character crease line
      0.88, 0.62, zOuter,
      0.10, 0.62, zOuter,
      // Lower door edge (meets rocker panel)
      0.88, 0.28, zOuter * 0.94,
      0.10, 0.28, zOuter * 0.94,
    ];
    const fdIdx = [
      0, 1, 3,  0, 3, 2, // window area
      2, 3, 5,  2, 5, 4, // upper door sheet metal
      4, 5, 7,  4, 7, 6, // lower door sheet metal
    ];
    fdGeom.setAttribute('position', new THREE.Float32BufferAttribute(fdPts, 3));
    fdGeom.setIndex(fdIdx);
    fdGeom.computeVertexNormals();

    const fDoorPanel = createCadPanel(
      fdGeom,
      isLeft ? 'front_left_door' : 'front_right_door',
      CAD_MATERIALS.bodyTranslucent,
      CAD_MATERIALS.cadLinePrimary,
      12
    );
    carGroup.add(fDoorPanel);

    // Front Door Handle
    const fHandleGeom = new THREE.BoxGeometry(0.12, 0.032, 0.03);
    fHandleGeom.translate(0.24, 0.88, zOuter + signZ * 0.02);
    const fHandle = createCadPanel(
      fHandleGeom,
      isLeft ? 'front_left_door' : 'front_right_door',
      CAD_MATERIALS.bodyTranslucent,
      CAD_MATERIALS.cadLineAccent
    );
    carGroup.add(fHandle);

    // ----------------------------------------
    // D. REAR DOOR (درب عقب)
    // Spans from X = 0.10 (B-pillar) to X = -0.68 (C-pillar)
    // ----------------------------------------
    const rdGeom = new THREE.BufferGeometry();
    const rdPts: number[] = [
      // Top window header / B & C pillar
      0.10, 1.42, zInner,
      -0.68, 1.34, zInner,
      // Beltline
      0.10, 0.94, zOuter * 0.96,
      -0.68, 0.93, zOuter * 0.96,
      // Character crease
      0.10, 0.62, zOuter,
      -0.68, 0.62, zOuter,
      // Lower door threshold
      0.10, 0.28, zOuter * 0.94,
      -0.68, 0.28, zOuter * 0.94,
    ];
    const rdIdx = [
      0, 1, 3,  0, 3, 2, // rear window area
      2, 3, 5,  2, 5, 4, // upper door panel
      4, 5, 7,  4, 7, 6, // lower door panel
    ];
    rdGeom.setAttribute('position', new THREE.Float32BufferAttribute(rdPts, 3));
    rdGeom.setIndex(rdIdx);
    rdGeom.computeVertexNormals();

    const rDoorPanel = createCadPanel(
      rdGeom,
      isLeft ? 'rear_left_door' : 'rear_right_door',
      CAD_MATERIALS.bodyTranslucent,
      CAD_MATERIALS.cadLinePrimary,
      12
    );
    carGroup.add(rDoorPanel);

    // Rear Door Handle
    const rHandleGeom = new THREE.BoxGeometry(0.12, 0.032, 0.03);
    rHandleGeom.translate(-0.46, 0.88, zOuter + signZ * 0.02);
    const rHandle = createCadPanel(
      rHandleGeom,
      isLeft ? 'rear_left_door' : 'rear_right_door',
      CAD_MATERIALS.bodyTranslucent,
      CAD_MATERIALS.cadLineAccent
    );
    carGroup.add(rHandle);

    // ----------------------------------------
    // E. STRUCTURAL PILLARS (A-PILLAR, B-PILLAR, C-PILLAR)
    // Connects side body to roof rail ensuring continuous picking
    // ----------------------------------------
    // A-Pillar (connecting front fender/door to roof header)
    const aPillarGeom = new THREE.BufferGeometry();
    const apPts = [
      0.88, 0.95, zInner,
      0.72, 1.40, zInner,
      0.74, 1.39, zInner * 1.05,
      0.90, 0.94, zInner * 1.05,
    ];
    aPillarGeom.setAttribute('position', new THREE.Float32BufferAttribute(apPts, 3));
    aPillarGeom.setIndex([0, 1, 2, 0, 2, 3]);
    aPillarGeom.computeVertexNormals();
    const aPillar = createCadPanel(
      aPillarGeom,
      isLeft ? 'front_left_door' : 'front_right_door',
      CAD_MATERIALS.bodyTranslucent,
      CAD_MATERIALS.cadCutline
    );
    carGroup.add(aPillar);

    // B-Pillar (center vertical pillar between doors)
    const bPillarGeom = new THREE.BoxGeometry(0.06, 0.48, 0.025);
    bPillarGeom.translate(0.10, 1.18, zInner * 0.98);
    const bPillar = createCadPanel(
      bPillarGeom,
      isLeft ? 'front_left_door' : 'front_right_door',
      CAD_MATERIALS.mechanicalTranslucent,
      CAD_MATERIALS.cadCutline
    );
    carGroup.add(bPillar);

    // C-Pillar (swept rear quarter pillar)
    const cPillarGeom = new THREE.BufferGeometry();
    const cpPts = [
      -0.68, 1.34, zInner,
      -1.02, 1.38, zInner,
      -1.48, 0.98, zInner * 1.05,
      -0.68, 0.93, zInner * 1.05,
    ];
    cPillarGeom.setAttribute('position', new THREE.Float32BufferAttribute(cpPts, 3));
    cPillarGeom.setIndex([0, 1, 2, 0, 2, 3]);
    cPillarGeom.computeVertexNormals();
    const cPillar = createCadPanel(
      cPillarGeom,
      isLeft ? 'rear_left_fender' : 'rear_right_fender',
      CAD_MATERIALS.bodyTranslucent,
      CAD_MATERIALS.cadCutline
    );
    carGroup.add(cPillar);

    // ----------------------------------------
    // F. ROCKER PANEL / SIDE SKIRT (رکاب)
    // Continuous lower body sill beneath doors
    // ----------------------------------------
    const rockerGeom = new THREE.BoxGeometry(2.35, 0.12, 0.08);
    rockerGeom.translate(0.10, 0.22, signZ * 0.88);
    const rockerPanel = createCadPanel(
      rockerGeom,
      isLeft ? 'left_rocker_panel' : 'right_rocker_panel',
      CAD_MATERIALS.bodyTranslucent,
      CAD_MATERIALS.cadLineAccent,
      18
    );
    carGroup.add(rockerPanel);

    // ----------------------------------------
    // G. SIDE MIRRORS (آینه جانبی)
    // Aerodynamic pedestal-mounted mirror assembly
    // ----------------------------------------
    const mirrorHousingGeom = new THREE.BoxGeometry(0.18, 0.12, 0.10);
    mirrorHousingGeom.translate(0.74, 1.02, signZ * 1.02);
    const mirrorStemGeom = new THREE.CylinderGeometry(0.015, 0.02, 0.10);
    mirrorStemGeom.rotateX(signZ * (Math.PI / 4));
    mirrorStemGeom.translate(0.76, 0.96, signZ * 0.94);

    const mirrorGroup = new THREE.Group();
    mirrorGroup.add(
      createCadPanel(
        mirrorHousingGeom,
        isLeft ? 'left_mirror' : 'right_mirror',
        CAD_MATERIALS.bodyTranslucent,
        CAD_MATERIALS.cadLinePrimary
      )
    );
    mirrorGroup.add(
      createCadPanel(
        mirrorStemGeom,
        isLeft ? 'left_mirror' : 'right_mirror',
        CAD_MATERIALS.mechanicalTranslucent,
        CAD_MATERIALS.cadLineAccent
      )
    );
    carGroup.add(mirrorGroup);
  });

  // ==========================================
  // 8. 4 ALLOY WHEELS & BRAKE CALIPERS (رینگ و لاستیک)
  // Front axle: X = +1.40m, Rear axle: X = -1.425m
  // Left wheels at Z = -0.82m, Right wheels at Z = +0.82m
  // ==========================================
  const wheelPositions = [
    { x: 1.40, z: -0.82, label: 'front_left' },
    { x: 1.40, z: 0.82, label: 'front_right' },
    { x: -1.425, z: -0.82, label: 'rear_left' },
    { x: -1.425, z: 0.82, label: 'rear_right' },
  ];

  wheelPositions.forEach((pos) => {
    const wheelGroup = new THREE.Group();
    const signZ = pos.z > 0 ? 1 : -1;
    const tireRadius = 0.33;
    const rimRadius = 0.23;
    const tireWidth = 0.22;

    // Tire Outer Geometry
    const tireGeom = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 24, 2, false);
    tireGeom.rotateX(Math.PI / 2);
    const tireMesh = createCadPanel(
      tireGeom,
      'wheel_rim',
      CAD_MATERIALS.mechanicalTranslucent,
      CAD_MATERIALS.cadLinePrimary,
      18
    );
    wheelGroup.add(tireMesh);

    // Alloy Rim Outer Ring
    const rimRingGeom = new THREE.TorusGeometry(rimRadius, 0.02, 8, 24);
    rimRingGeom.translate(0, 0, signZ * (tireWidth / 2));
    const rimRing = new THREE.LineSegments(new THREE.EdgesGeometry(rimRingGeom, 15), CAD_MATERIALS.cadLineAccent);
    wheelGroup.add(rimRing);

    // 10-Spoke Alloy Rim Spokes
    const spokeCount = 10;
    for (let k = 0; k < spokeCount; k++) {
      const angle = (k / spokeCount) * Math.PI * 2;
      const spokeGeom = new THREE.BoxGeometry(rimRadius * 0.9, 0.022, 0.02);
      spokeGeom.rotateZ(angle);
      spokeGeom.translate(
        (Math.cos(angle) * rimRadius) / 2,
        (Math.sin(angle) * rimRadius) / 2,
        signZ * (tireWidth / 2 - 0.01)
      );
      const spoke = createCadPanel(
        spokeGeom,
        'wheel_rim',
        CAD_MATERIALS.mechanicalTranslucent,
        CAD_MATERIALS.cadLineAccent
      );
      wheelGroup.add(spoke);
    }

    // Ventilated Brake Rotor Disk
    const rotorGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.025, 16);
    rotorGeom.rotateX(Math.PI / 2);
    rotorGeom.translate(0, 0, signZ * (tireWidth / 2 - 0.05));
    const rotor = createCadPanel(
      rotorGeom,
      'wheel_rim',
      CAD_MATERIALS.mechanicalTranslucent,
      CAD_MATERIALS.cadLineAccent
    );
    wheelGroup.add(rotor);

    // Brake Caliper
    const caliperGeom = new THREE.BoxGeometry(0.08, 0.12, 0.05);
    caliperGeom.translate(0.08, 0.08, signZ * (tireWidth / 2 - 0.04));
    const caliper = createCadPanel(
      caliperGeom,
      'wheel_rim',
      CAD_MATERIALS.mechanicalTranslucent,
      CAD_MATERIALS.cadLineAccent
    );
    wheelGroup.add(caliper);

    wheelGroup.position.set(pos.x, tireRadius + 0.02, pos.z);
    carGroup.add(wheelGroup);
  });

  // ==========================================
  // 9. HEADLIGHTS & TAILLIGHTS
  // Distinct Camry triple-LED headlamps & wraparound taillamps
  // ==========================================
  // Front Headlamps
  for (const signZ of [-1, 1]) {
    const hlGeom = new THREE.BufferGeometry();
    const hlPts = [
      2.22, 0.72, signZ * 0.42,
      2.26, 0.68, signZ * 0.82,
      2.05, 0.76, signZ * 0.86,
      2.02, 0.78, signZ * 0.46,
    ];
    hlGeom.setAttribute('position', new THREE.Float32BufferAttribute(hlPts, 3));
    hlGeom.setIndex([0, 1, 2, 0, 2, 3]);
    hlGeom.computeVertexNormals();

    const hl = createCadPanel(
      hlGeom,
      'front_bumper',
      CAD_MATERIALS.glassTranslucent,
      CAD_MATERIALS.cadLineAccent,
      10
    );
    carGroup.add(hl);
  }

  // Rear Taillamps
  for (const signZ of [-1, 1]) {
    const tlGeom = new THREE.BufferGeometry();
    const tlPts = [
      -2.32, 0.85, signZ * 0.45,
      -2.36, 0.82, signZ * 0.84,
      -2.15, 0.78, signZ * 0.88,
      -2.12, 0.82, signZ * 0.48,
    ];
    tlGeom.setAttribute('position', new THREE.Float32BufferAttribute(tlPts, 3));
    tlGeom.setIndex([0, 1, 2, 0, 2, 3]);
    tlGeom.computeVertexNormals();

    const tl = createCadPanel(
      tlGeom,
      'rear_bumper',
      CAD_MATERIALS.glassTranslucent,
      CAD_MATERIALS.cadLineAccent,
      10
    );
    carGroup.add(tl);
  }

  // ==========================================
  // 10. UNDERBODY CONTACT SHADOW PLANE
  // Anchors vehicle to studio floor preventing floating
  // ==========================================
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const ctx = shadowCanvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeom = new THREE.PlaneGeometry(5.2, 2.3);
  shadowGeom.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
  shadowMesh.position.y = 0.01;
  shadowMesh.userData = { isFloorShadow: true, isClickableSurface: false };
  carGroup.add(shadowMesh);

  return carGroup;
}

/**
 * Standardized Camera Presets (Strictly Verified with Geometry)
 * - Front: Camera looks at +X (Front Bumper & Grille)
 * - Rear: Camera looks at -X (Trunk & Rear Bumper)
 * - Left: Camera looks at -Z (Driver Side)
 * - Right: Camera looks at +Z (Passenger Side)
 * - Top: Camera looks at +Y (Overhead)
 * - Perspective: Classic Front-Left 3/4 Engineering View
 */
export interface CameraPreset {
  id: string;
  labelFa: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const CAMRY_CAMERA_PRESETS: Record<string, CameraPreset> = {
  perspective: {
    id: 'perspective',
    labelFa: 'نمای ۳/۴ (جلو-چپ)',
    position: [4.2, 2.2, -4.2], // Front-Left (+X, -Z)
    target: [0, 0.7, 0],
  },
  front: {
    id: 'front',
    labelFa: 'نمای جلو (سپر و کاپوت)',
    position: [5.2, 0.95, 0], // Straight at +X
    target: [0, 0.7, 0],
  },
  rear: {
    id: 'rear',
    labelFa: 'نمای عقب (صندوق و سپر)',
    position: [-5.2, 0.95, 0], // Straight at -X
    target: [0, 0.7, 0],
  },
  left: {
    id: 'left',
    labelFa: 'نمای جانبی چپ (سمت راننده)',
    position: [0, 0.85, -5.0], // Straight at -Z
    target: [0, 0.7, 0],
  },
  right: {
    id: 'right',
    labelFa: 'نمای جانبی راست (سمت شاگرد)',
    position: [0, 0.85, 5.0], // Straight at +Z
    target: [0, 0.7, 0],
  },
  top: {
    id: 'top',
    labelFa: 'نمای سقف و بالا',
    position: [0, 5.8, 0.001], // Overhead (+Y)
    target: [0, 0.7, 0],
  },
};

/**
 * Creates a High-Visibility 3D Marker Pin anchored to the car surface
 */
export function create3DMarkerPin(
  markerNumber: number,
  colorHex: string,
  isSelected: boolean = false
): THREE.Group {
  const pinGroup = new THREE.Group();
  pinGroup.name = `MarkerPin_${markerNumber}`;

  // 1. Center Sphere
  const sphereGeom = new THREE.SphereGeometry(0.065, 16, 16);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    emissive: new THREE.Color(colorHex),
    emissiveIntensity: isSelected ? 0.7 : 0.35,
    roughness: 0.2,
    metalness: 0.3,
  });
  const sphere = new THREE.Mesh(sphereGeom, sphereMat);
  sphere.position.y = 0.08;
  pinGroup.add(sphere);

  // 2. Anchor pointer cone pointing directly at surface
  const coneGeom = new THREE.ConeGeometry(0.04, 0.08, 12);
  coneGeom.rotateX(Math.PI);
  coneGeom.translate(0, 0.04, 0);
  const coneMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex) });
  const cone = new THREE.Mesh(coneGeom, coneMat);
  pinGroup.add(cone);

  // 3. Ground target ring
  const ringGeom = new THREE.RingGeometry(0.06, 0.08, 20);
  ringGeom.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colorHex),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.position.y = 0.005;
  pinGroup.add(ring);

  // 4. Numbered Badge Sprite (Billboard)
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = isSelected ? 5 : 3;
    ctx.strokeStyle = colorHex;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Yekan, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${markerNumber}`, 32, 34);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    transparent: true,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(0, 0.22, 0);
  sprite.scale.set(0.24, 0.24, 1);
  pinGroup.add(sprite);

  // Selection Highlight Halo
  if (isSelected) {
    const pulseRingGeom = new THREE.RingGeometry(0.10, 0.13, 24);
    pulseRingGeom.rotateX(-Math.PI / 2);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
    });
    const pulseRing = new THREE.Mesh(pulseRingGeom, pulseMat);
    pulseRing.position.y = 0.006;
    pinGroup.add(pulseRing);
  }

  return pinGroup;
}

/**
 * 3D Hover Reticle Mesh: Gives instantaneous visual feedback of where the cursor is targeting on the 3D body
 */
export function create3DHoverReticle(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'HoverReticle';

  const ringGeom = new THREE.RingGeometry(0.06, 0.08, 24);
  ringGeom.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  group.add(ring);

  const dotGeom = new THREE.SphereGeometry(0.02, 12, 12);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const dot = new THREE.Mesh(dotGeom, dotMat);
  dot.position.y = 0.02;
  group.add(dot);

  group.visible = false;
  return group;
}
