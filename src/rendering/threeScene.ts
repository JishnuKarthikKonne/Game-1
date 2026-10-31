/**
 * PARADOX - Three.js 3D Procedural Renderer
 * Features modular sci-fi laboratory architecture, 3-12 part composite models,
 * holographic Echoes, animated blast doors, volumetric lasers, and smooth camera damping.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Direction,
  LevelDefinition,
  MovableBlock,
  SimulationState,
} from '../game/types';

// Pre-allocated module-level math scratchpad
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();

export interface ThreeSceneManager {
  render: () => void;
  loadLevel: (level: LevelDefinition) => void;
  updateScene: (state: SimulationState, level: LevelDefinition, delta: number) => void;
  rotateCamera: (angleDelta: number) => void;
  zoomCamera: (zoomDelta: number) => void;
  resetCamera: () => void;
  dispose: () => void;
}

export function initThreeScene(
  container: HTMLDivElement,
  level: LevelDefinition
): ThreeSceneManager {
  // Software WebGL detection guard
  const isSoftwareGl = (() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  })();

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06080c);
  scene.fog = new THREE.FogExp2(0x06080c, 0.035);

  // Isometric / elevated three-quarter perspective camera
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 120);
  let camAngle = Math.PI / 4;
  let camDistance = Math.max(level.width, level.height) * 1.7;
  let targetCamAngle = camAngle;
  let targetCamDistance = camDistance;

  const roomCenter = new THREE.Vector3(level.width / 2, 0, level.height / 2);
  const lookTarget = new THREE.Vector3().copy(roomCenter);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container.replaceChildren(renderer.domElement);

  // Procedural Studio Environment Reflection
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  // Studio 3-Point Lighting Rig
  const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x090d16, 0.9);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
  keyLight.position.set(level.width + 4, 14, -6);
  keyLight.castShadow = !isSoftwareGl;
  if (!isSoftwareGl) {
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 40;
    const d = Math.max(level.width, level.height) * 1.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
  }
  scene.add(keyLight);

  // Atmospheric rim light
  const rimLight = new THREE.DirectionalLight(0x00e5ff, 0.7);
  rimLight.position.set(-6, 8, level.height + 4);
  scene.add(rimLight);

  // Groups
  const staticGroup = new THREE.Group();
  scene.add(staticGroup);

  const dynamicGroup = new THREE.Group();
  scene.add(dynamicGroup);

  const laserGroup = new THREE.Group();
  scene.add(laserGroup);

  // Reusable Materials & Procedural Textures
  const floorTileTex = createGridTexture();
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTileTex,
    roughness: 0.45,
    metalness: 0.75,
  });

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x181e28,
    roughness: 0.65,
    metalness: 0.6,
  });

  const wallTrimMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.9,
  });

  // Actor / dynamic mesh references
  let playerGroup: THREE.Group | null = null;
  const echoGroups = new Map<string, THREE.Group>();
  const doorGroups = new Map<string, { group: THREE.Group; leftPanel: THREE.Mesh; rightPanel: THREE.Mesh }>();
  const plateMeshes = new Map<string, { mesh: THREE.Mesh; core: THREE.Mesh }>();
  const switchMeshes = new Map<string, { group: THREE.Group; lever: THREE.Mesh; light: THREE.Mesh }>();
  const blockGroups = new Map<string, THREE.Group>();
  const receiverMeshes = new Map<string, { mesh: THREE.Mesh; beacon: THREE.Mesh }>();

  function loadLevel(lvl: LevelDefinition) {
    lastLaserSignature = '';
    staticGroup.clear();
    dynamicGroup.clear();
    laserGroup.clear();
    doorGroups.clear();
    plateMeshes.clear();
    switchMeshes.clear();
    blockGroups.clear();
    receiverMeshes.clear();
    echoGroups.clear();

    roomCenter.set(lvl.width / 2, 0, lvl.height / 2);
    lookTarget.copy(roomCenter);
    targetCamDistance = Math.max(lvl.width, lvl.height) * 1.7;
    camDistance = targetCamDistance;
    targetCamAngle = Math.PI / 4;
    camAngle = targetCamAngle;

    keyLight.position.set(lvl.width + 4, 14, -6);
    rimLight.position.set(-6, 8, lvl.height + 4);

    buildStaticRoom(lvl, staticGroup, floorMat, wallMat, wallTrimMat);
    initInteractiveProps(
      lvl,
      staticGroup,
      doorGroups,
      plateMeshes,
      switchMeshes,
      receiverMeshes
    );

    playerGroup = createCompositeActor(0x00e5ff, false);
    playerGroup.position.set(lvl.spawn.x, 0, lvl.spawn.y);
    playerGroup.rotation.y = getRotationForDirection(lvl.spawnFacing);
    dynamicGroup.add(playerGroup);

    updateCameraPosition(true);
  }

  // Load initial level
  loadLevel(level);

  // Initial camera position setup
  updateCameraPosition(true);

  // Resize handler
  const handleResize = () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', handleResize);

  function updateCameraPosition(immediate = false) {
    if (immediate) {
      camAngle = targetCamAngle;
      camDistance = targetCamDistance;
    }
    const elevation = Math.PI / 5.5; // ~32 degree elevated view
    const x = lookTarget.x + Math.sin(camAngle) * Math.cos(elevation) * camDistance;
    const y = Math.sin(elevation) * camDistance + 2.5;
    const z = lookTarget.z + Math.cos(camAngle) * Math.cos(elevation) * camDistance;

    camera.position.set(x, y, z);
    camera.lookAt(lookTarget);
  }

  // Animation & state sync loop
  let animTime = 0;

  function updateScene(state: SimulationState, lvl: LevelDefinition, delta: number) {
    animTime += delta;

    // Smooth camera damping
    camAngle = THREE.MathUtils.damp(camAngle, targetCamAngle, 8, delta);
    camDistance = THREE.MathUtils.damp(camDistance, targetCamDistance, 8, delta);

    // Camera target softly tracks midpoint between room center and player
    const desiredLookX = (roomCenter.x * 0.4) + (state.player.x * 0.6);
    const desiredLookZ = (roomCenter.z * 0.4) + (state.player.y * 0.6);
    lookTarget.x = THREE.MathUtils.damp(lookTarget.x, desiredLookX, 6, delta);
    lookTarget.z = THREE.MathUtils.damp(lookTarget.z, desiredLookZ, 6, delta);

    updateCameraPosition();

    // 1. Sync Player Mesh Position & Rotation
    if (playerGroup) {
      const targetX = state.player.x;
      const targetZ = state.player.y;
      playerGroup.position.x = THREE.MathUtils.damp(playerGroup.position.x, targetX, 14, delta);
      playerGroup.position.z = THREE.MathUtils.damp(playerGroup.position.z, targetZ, 14, delta);

      // Subtle breath / hover bob
      playerGroup.position.y = Math.sin(animTime * 3) * 0.04;

      const targetRotY = getRotationForDirection(state.player.facing);
      playerGroup.rotation.y = THREE.MathUtils.damp(playerGroup.rotation.y, targetRotY, 12, delta);

      playerGroup.visible = state.player.alive;
    }

    // 2. Sync Echo Meshes
    // Remove stale Echoes
    for (const [id, grp] of echoGroups.entries()) {
      if (!state.echoes.some((e) => e.id === id)) {
        dynamicGroup.remove(grp);
        echoGroups.delete(id);
      }
    }
    // Add/Update Echoes
    for (let i = 0; i < state.echoes.length; i++) {
      const echo = state.echoes[i];
      let grp = echoGroups.get(echo.id);
      if (!grp) {
        const echoColor = i === 0 ? 0x00e5ff : 0xff2d55;
        grp = createCompositeActor(echoColor, true);
        echoGroups.set(echo.id, grp);
        dynamicGroup.add(grp);
      }

      grp.position.x = THREE.MathUtils.damp(grp.position.x, echo.x, 14, delta);
      grp.position.z = THREE.MathUtils.damp(grp.position.z, echo.y, 14, delta);
      grp.position.y = Math.sin(animTime * 4 + i) * 0.06;

      const rotY = getRotationForDirection(echo.facing);
      grp.rotation.y = THREE.MathUtils.damp(grp.rotation.y, rotY, 12, delta);

      // Holographic flicker / glitch effect
      if (echo.glitched) {
        grp.position.x += (Math.random() - 0.5) * 0.06;
        grp.position.z += (Math.random() - 0.5) * 0.06;
      }
    }

    // 3. Sync Doors (Sliding blast doors)
    for (const [doorId, doorObj] of doorGroups.entries()) {
      const isOpen = state.doors[doorId] ?? false;
      const targetSlide = isOpen ? 0.46 : 0.0;
      doorObj.leftPanel.position.x = THREE.MathUtils.damp(doorObj.leftPanel.position.x, -targetSlide, 10, delta);
      doorObj.rightPanel.position.x = THREE.MathUtils.damp(doorObj.rightPanel.position.x, targetSlide, 10, delta);
    }

    // 4. Sync Pressure Plates
    for (const plate of lvl.plates) {
      const pObj = plateMeshes.get(plate.id);
      if (pObj) {
        // Check if currently occupied
        const isOccupied =
          (state.player.alive && state.player.x === plate.x && state.player.y === plate.y) ||
          state.echoes.some((e) => e.alive && e.x === plate.x && e.y === plate.y) ||
          Object.values(state.blocks).some((b) => b.x === plate.x && b.y === plate.y);

        const targetY = isOccupied ? 0.02 : 0.06;
        pObj.core.position.y = THREE.MathUtils.damp(pObj.core.position.y, targetY, 14, delta);
        (pObj.core.material as THREE.MeshStandardMaterial).emissiveIntensity = isOccupied ? 1.6 : 0.5;
      }
    }

    // 5. Sync Switches
    for (const sw of lvl.switches) {
      const sObj = switchMeshes.get(sw.id);
      if (sObj) {
        const isOn = state.switches[sw.id] ?? sw.isOn;
        const targetRot = isOn ? -Math.PI / 4 : Math.PI / 4;
        sObj.lever.rotation.x = THREE.MathUtils.damp(sObj.lever.rotation.x, targetRot, 12, delta);
        (sObj.light.material as THREE.MeshStandardMaterial).color.setHex(isOn ? 0x22c55e : 0xef4444);
        (sObj.light.material as THREE.MeshStandardMaterial).emissive.setHex(isOn ? 0x22c55e : 0xef4444);
      }
    }

    // 6. Sync Blocks / Mirrors
    for (const block of Object.values(state.blocks)) {
      let bGrp = blockGroups.get(block.id);
      if (!bGrp) {
        bGrp = createBlockMesh(block);
        blockGroups.set(block.id, bGrp);
        dynamicGroup.add(bGrp);
      }
      bGrp.position.x = THREE.MathUtils.damp(bGrp.position.x, block.x, 14, delta);
      bGrp.position.z = THREE.MathUtils.damp(bGrp.position.z, block.y, 14, delta);
    }

    // 7. Sync Laser Receivers
    for (const [recId, rObj] of receiverMeshes.entries()) {
      const isLit = state.receivers[recId] ?? false;
      (rObj.beacon.material as THREE.MeshStandardMaterial).emissiveIntensity = isLit ? 2.5 : 0.3;
      (rObj.beacon.material as THREE.MeshStandardMaterial).color.setHex(isLit ? 0x00e5ff : 0x334155);
      (rObj.beacon.material as THREE.MeshStandardMaterial).emissive.setHex(isLit ? 0x00e5ff : 0x0f172a);
    }

    // 8. Rebuild Laser Beams
    updateLasers(laserGroup, state.laserSegments, animTime);
  }

  function rotateCamera(deltaAngle: number) {
    targetCamAngle += deltaAngle;
  }

  function zoomCamera(deltaZoom: number) {
    const minZoom = Math.max(level.width, level.height) * 1.0;
    const maxZoom = Math.max(level.width, level.height) * 2.8;
    targetCamDistance = THREE.MathUtils.clamp(targetCamDistance + deltaZoom, minZoom, maxZoom);
  }

  function resetCamera() {
    targetCamAngle = Math.PI / 4;
    targetCamDistance = Math.max(level.width, level.height) * 1.7;
  }

  function render() {
    renderer.render(scene, camera);
  }

  function dispose() {
    window.removeEventListener('resize', handleResize);
    renderer.dispose();
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    });
    scene.clear();
  }

  return {
    render,
    loadLevel,
    updateScene,
    rotateCamera,
    zoomCamera,
    resetCamera,
    dispose,
  };
}

// -------------------------------------------------------------
// Helper: Procedural Grid Albedo Texture
// -------------------------------------------------------------
function createGridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f141c';
  ctx.fillRect(0, 0, 512, 512);

  // Tile border
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 504, 504);

  // Inner beveled seam
  ctx.strokeStyle = '#00e5ff22';
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, 480, 480);

  // Center tech cross
  ctx.strokeStyle = '#38bdf833';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(256, 180);
  ctx.lineTo(256, 332);
  ctx.moveTo(180, 256);
  ctx.lineTo(332, 256);
  ctx.stroke();

  // Corner tech circuit dots
  ctx.fillStyle = '#00e5ff55';
  ctx.fillRect(32, 32, 12, 12);
  ctx.fillRect(468, 32, 12, 12);
  ctx.fillRect(32, 468, 12, 12);
  ctx.fillRect(468, 468, 12, 12);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// -------------------------------------------------------------
// Builder: Static Room Geometry
// -------------------------------------------------------------
function buildStaticRoom(
  level: LevelDefinition,
  group: THREE.Group,
  floorMat: THREE.Material,
  wallMat: THREE.Material,
  wallTrimMat: THREE.Material
) {
  const floorGeo = new THREE.BoxGeometry(1, 0.2, 1);
  const wallGeo = new THREE.BoxGeometry(0.96, 1.4, 0.96);
  const wallTrimGeo = new THREE.BoxGeometry(0.98, 0.1, 0.98);

  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const tile = level.tiles[y][x];

      if (tile === 'FLOOR') {
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.position.set(x, -0.1, y);
        floorMesh.receiveShadow = true;
        group.add(floorMesh);
      } else if (tile === 'WALL') {
        // Modular Wall Block (3-part composite)
        const wallBlock = new THREE.Group();
        wallBlock.position.set(x, 0, y);

        const mainWall = new THREE.Mesh(wallGeo, wallMat);
        mainWall.position.y = 0.7;
        mainWall.castShadow = true;
        mainWall.receiveShadow = true;
        wallBlock.add(mainWall);

        // Top emissive trim band
        const trimMesh = new THREE.Mesh(wallTrimGeo, wallTrimMat);
        trimMesh.position.y = 1.35;
        wallBlock.add(trimMesh);

        group.add(wallBlock);
      }
    }
  }

  // Build Exit Portal at level.exit
  const exitBeacon = createExitBeacon(level.exit.x, level.exit.y);
  group.add(exitBeacon);
}

// -------------------------------------------------------------
// Builder: Interactive Props (Doors, Plates, Switches, Emitters)
// -------------------------------------------------------------
function initInteractiveProps(
  level: LevelDefinition,
  group: THREE.Group,
  doorGroups: Map<string, { group: THREE.Group; leftPanel: THREE.Mesh; rightPanel: THREE.Mesh }>,
  plateMeshes: Map<string, { mesh: THREE.Mesh; core: THREE.Mesh }>,
  switchMeshes: Map<string, { group: THREE.Group; lever: THREE.Mesh; light: THREE.Mesh }>,
  receiverMeshes: Map<string, { mesh: THREE.Mesh; beacon: THREE.Mesh }>
) {
  // 1. Doors (Sliding blast doors with hydraulic frame)
  for (const door of level.doors) {
    const doorGrp = new THREE.Group();
    doorGrp.position.set(door.x, 0, door.y);
    if (door.orientation === 'horizontal') {
      doorGrp.rotation.y = Math.PI / 2;
    }

    // Heavy frame pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.8 });
    const pillarGeo = new THREE.BoxGeometry(0.18, 1.4, 0.28);
    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(-0.48, 0.7, 0);
    doorGrp.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
    rightPillar.position.set(0.48, 0.7, 0);
    doorGrp.add(rightPillar);

    // Header beam
    const headerGeo = new THREE.BoxGeometry(1.1, 0.18, 0.3);
    const header = new THREE.Mesh(headerGeo, pillarMat);
    header.position.set(0, 1.35, 0);
    doorGrp.add(header);

    // Left and Right sliding door blast leaves
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.85,
    });
    const panelGeo = new THREE.BoxGeometry(0.46, 1.25, 0.12);

    const leftPanel = new THREE.Mesh(panelGeo, panelMat);
    leftPanel.position.set(-0.23, 0.65, 0);
    doorGrp.add(leftPanel);

    const rightPanel = new THREE.Mesh(panelGeo, panelMat);
    rightPanel.position.set(0.23, 0.65, 0);
    doorGrp.add(rightPanel);

    group.add(doorGrp);
    doorGroups.set(door.id, { group: doorGrp, leftPanel, rightPanel });
  }

  // 2. Pressure Plates
  for (const plate of level.plates) {
    const plateGrp = new THREE.Group();
    plateGrp.position.set(plate.x, 0, plate.y);

    // Outer beveled ring
    const rimGeo = new THREE.CylinderGeometry(0.44, 0.46, 0.04, 8);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.7 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 0.02;
    plateGrp.add(rim);

    // Glowing active core
    const coreColor = new THREE.Color(plate.color);
    const coreGeo = new THREE.CylinderGeometry(0.36, 0.38, 0.05, 8);
    const coreMat = new THREE.MeshStandardMaterial({
      color: coreColor,
      emissive: coreColor,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.5,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.06;
    plateGrp.add(core);

    group.add(plateGrp);
    plateMeshes.set(plate.id, { mesh: plateGrp as unknown as THREE.Mesh, core });
  }

  // 3. Switches / Consoles
  for (const sw of level.switches) {
    const swGrp = new THREE.Group();
    swGrp.position.set(sw.x, 0, sw.y);

    // Base console pedestal
    const pedGeo = new THREE.BoxGeometry(0.4, 0.5, 0.4);
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.7 });
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.position.y = 0.25;
    swGrp.add(pedestal);

    // Toggle lever
    const leverGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8);
    const leverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.9 });
    const lever = new THREE.Mesh(leverGeo, leverMat);
    lever.position.set(0, 0.55, 0);
    swGrp.add(lever);

    // Status indicator LED
    const lightGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const lightMat = new THREE.MeshStandardMaterial({
      color: sw.isOn ? 0x22c55e : 0xef4444,
      emissive: sw.isOn ? 0x22c55e : 0xef4444,
      emissiveIntensity: 1.2,
    });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(0, 0.45, 0.18);
    swGrp.add(light);

    group.add(swGrp);
    switchMeshes.set(sw.id, { group: swGrp, lever, light });
  }

  // 4. Laser Emitters
  for (const em of level.emitters) {
    const emGrp = new THREE.Group();
    emGrp.position.set(em.x, 0, em.y);
    emGrp.rotation.y = getRotationForDirection(em.direction);

    // Emitter Cannon Pod
    const podGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.45, 12);
    const podMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.85 });
    const pod = new THREE.Mesh(podGeo, podMat);
    pod.rotation.x = Math.PI / 2;
    pod.position.set(0, 0.45, 0);
    emGrp.add(pod);

    // Focusing lens
    const lensGeo = new THREE.RingGeometry(0.05, 0.16, 12);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 0.45, 0.24);
    emGrp.add(lens);

    group.add(emGrp);
  }

  // 5. Laser Receivers
  for (const rec of level.receivers) {
    const recGrp = new THREE.Group();
    recGrp.position.set(rec.x, 0, rec.y);

    // Sensor Dish
    const dishGeo = new THREE.CylinderGeometry(0.35, 0.2, 0.2, 12);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.8 });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(0, 0.35, 0);
    recGrp.add(dish);

    // Sensor Target Beacon
    const beaconGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      emissive: 0x0f172a,
      emissiveIntensity: 0.4,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 0.48, 0);
    recGrp.add(beacon);

    group.add(recGrp);
    receiverMeshes.set(rec.id, { mesh: recGrp as unknown as THREE.Mesh, beacon });
  }
}

// -------------------------------------------------------------
// Builder: Composite Actor (Player & Echoes)
// Follows Three.js Skill Directive: 3–12 distinct parts composite
// -------------------------------------------------------------
function createCompositeActor(glowColorHex: number, isEcho: boolean): THREE.Group {
  const actor = new THREE.Group();

  const glowColor = new THREE.Color(glowColorHex);
  const opacity = isEcho ? 0.6 : 1.0;
  const transparent = isEcho;

  // Primary Silhouette: Armor Torso
  const torsoGeo = new THREE.BoxGeometry(0.44, 0.48, 0.32);
  const armorMat = new THREE.MeshStandardMaterial({
    color: isEcho ? 0x0f172a : 0x1e293b,
    roughness: 0.35,
    metalness: 0.85,
    transparent,
    opacity,
  });
  const torso = new THREE.Mesh(torsoGeo, armorMat);
  torso.position.y = 0.52;
  torso.castShadow = !isEcho;
  actor.add(torso);

  // Core Arc Reactor on chest
  const reactorGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12);
  const reactorMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 1.5,
    roughness: 0.1,
    transparent,
    opacity,
  });
  const reactor = new THREE.Mesh(reactorGeo, reactorMat);
  reactor.rotation.x = Math.PI / 2;
  reactor.position.set(0, 0.54, 0.17);
  actor.add(reactor);

  // Secondary Read: Cybernetic Visor Helmet
  const headGeo = new THREE.BoxGeometry(0.28, 0.26, 0.28);
  const head = new THREE.Mesh(headGeo, armorMat);
  head.position.y = 0.88;
  actor.add(head);

  // Visor Slit
  const visorGeo = new THREE.BoxGeometry(0.24, 0.08, 0.06);
  const visorMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 2.0,
    transparent,
    opacity,
  });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 0.88, 0.15);
  actor.add(visor);

  // Accent Details: Shoulder Pauldrons
  const pauldronGeo = new THREE.BoxGeometry(0.12, 0.2, 0.2);
  const leftPauldron = new THREE.Mesh(pauldronGeo, armorMat);
  leftPauldron.position.set(-0.28, 0.62, 0);
  actor.add(leftPauldron);

  const rightPauldron = new THREE.Mesh(pauldronGeo, armorMat);
  rightPauldron.position.set(0.28, 0.62, 0);
  actor.add(rightPauldron);

  // Thruster Backpack Unit
  const packGeo = new THREE.BoxGeometry(0.26, 0.36, 0.14);
  const pack = new THREE.Mesh(packGeo, armorMat);
  pack.position.set(0, 0.54, -0.21);
  actor.add(pack);

  // Thruster Glow Ports
  const thrusterGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.08, 8);
  const thruster1 = new THREE.Mesh(thrusterGeo, reactorMat);
  thruster1.position.set(-0.08, 0.38, -0.21);
  actor.add(thruster1);

  const thruster2 = new THREE.Mesh(thrusterGeo, reactorMat);
  thruster2.position.set(0.08, 0.38, -0.21);
  actor.add(thruster2);

  // Ground Contact Shadow Disc (Offset y = 0.015 to avoid Z-fighting)
  const shadowGeo = new THREE.CircleGeometry(0.38, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: isEcho ? 0.25 : 0.5,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  actor.add(shadow);

  return actor;
}

// -------------------------------------------------------------
// Builder: Movable Block / Optical Mirror Prism
// -------------------------------------------------------------
function createBlockMesh(block: MovableBlock): THREE.Group {
  const grp = new THREE.Group();
  grp.position.set(block.x, 0, block.y);

  // Heavy containment crate hull
  const crateMat = new THREE.MeshStandardMaterial({
    color: 0x243042,
    roughness: 0.45,
    metalness: 0.8,
  });
  const crateGeo = new THREE.BoxGeometry(0.72, 0.72, 0.72);
  const crate = new THREE.Mesh(crateGeo, crateMat);
  crate.position.y = 0.36;
  crate.castShadow = true;
  crate.receiveShadow = true;
  grp.add(crate);

  // Beveled corner reinforcement brackets
  const bracketMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3, metalness: 0.9 });
  const bracketGeo = new THREE.BoxGeometry(0.76, 0.1, 0.76);
  const bracketTop = new THREE.Mesh(bracketGeo, bracketMat);
  bracketTop.position.y = 0.68;
  grp.add(bracketTop);

  if (block.type === 'mirror') {
    // Optical 45-degree prism crystal on top
    const prismMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.95,
    });
    const prismGeo = new THREE.BoxGeometry(0.6, 0.12, 0.12);
    const prism = new THREE.Mesh(prismGeo, prismMat);
    prism.position.y = 0.76;
    // Rotate 45 degrees along optical angle
    prism.rotation.y = block.mirrorAngle === '/' ? Math.PI / 4 : -Math.PI / 4;
    grp.add(prism);
  }

  // Contact shadow
  const shadowGeo = new THREE.CircleGeometry(0.45, 16);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  grp.add(shadow);

  return grp;
}

// -------------------------------------------------------------
// Builder: Exit Portal Beacon
// -------------------------------------------------------------
function createExitBeacon(x: number, y: number): THREE.Group {
  const grp = new THREE.Group();
  grp.position.set(x, 0, y);

  // Hexagonal extraction floor plate
  const hexGeo = new THREE.CylinderGeometry(0.48, 0.5, 0.06, 6);
  const hexMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.8,
  });
  const hex = new THREE.Mesh(hexGeo, hexMat);
  hex.position.y = 0.03;
  grp.add(hex);

  // Vertical light beacon beam
  const beamGeo = new THREE.CylinderGeometry(0.12, 0.25, 2.5, 12, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = 1.25;
  grp.add(beam);

  return grp;
}

// -------------------------------------------------------------
// Builder: Volumetric Laser Beams
// -------------------------------------------------------------
let lastLaserSignature = '';

function updateLasers(
  laserGroup: THREE.Group,
  segments: { startX: number; startY: number; endX: number; endY: number; color: string }[],
  _time: number
) {
  const signature = segments
    .map((s) => `${s.startX},${s.startY}->${s.endX},${s.endY}#${s.color}`)
    .join('|');

  if (signature === lastLaserSignature) {
    return;
  }
  lastLaserSignature = signature;

  // Cleanly dispose existing laser meshes and geometries
  while (laserGroup.children.length > 0) {
    const child = laserGroup.children[0];
    laserGroup.remove(child);
    child.traverse((c) => {
      if (c instanceof THREE.Mesh) {
        c.geometry.dispose();
        if (Array.isArray(c.material)) {
          c.material.forEach((m) => m.dispose());
        } else {
          c.material.dispose();
        }
      }
    });
  }

  for (const seg of segments) {
    _vec3A.set(seg.startX, 0.45, seg.startY);
    _vec3B.set(seg.endX, 0.45, seg.endY);

    const length = _vec3A.distanceTo(_vec3B);
    if (length <= 0.01) continue;

    const laserSeg = new THREE.Group();
    laserSeg.position.copy(_vec3A);
    laserSeg.lookAt(_vec3B);

    // Inner bright beam tube
    const innerGeo = new THREE.CylinderGeometry(0.03, 0.03, length, 8);
    innerGeo.rotateX(Math.PI / 2);
    innerGeo.translate(0, 0, length / 2);

    const innerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    laserSeg.add(innerMesh);

    // Outer neon glow sheath
    const outerGeo = new THREE.CylinderGeometry(0.08, 0.08, length, 8);
    outerGeo.rotateX(Math.PI / 2);
    outerGeo.translate(0, 0, length / 2);

    const outerMat = new THREE.MeshBasicMaterial({
      color: seg.color,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    laserSeg.add(outerMesh);

    laserGroup.add(laserSeg);
  }
}

function getRotationForDirection(dir: Direction): number {
  switch (dir) {
    case 'north': return Math.PI;
    case 'south': return 0;
    case 'east': return Math.PI / 2;
    case 'west': return -Math.PI / 2;
  }
}
