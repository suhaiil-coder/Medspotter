/**
 * SkeletonViewer — full-body 3D skeleton using expo-gl + Three.js.
 * GPU-rendered, drag-to-rotate, tap-to-select a bone.
 * Works in Expo Go (no native build required).
 */
import React, { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import { GLView } from "expo-gl";
import * as THREE from "three";

export interface BoneInfo {
  name: string;
  latinName: string;
  region: string;
  boneId: string;
}

export interface SkeletonViewerRef {
  resetView: () => void;
  setMode: (mode: string) => void;
}

interface Props {
  onBoneSelect: (bone: BoneInfo | null) => void;
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function mat(hex = 0xdec89a): THREE.MeshPhongMaterial {
  return new THREE.MeshPhongMaterial({ color: hex, shininess: 38, specular: 0x444444 });
}

function cylinder(rTop: number, rBot: number, h: number, segs = 10): THREE.Mesh {
  return new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, segs), mat());
}

function sphere(r: number, ws = 14, hs = 10): THREE.Mesh {
  return new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), mat());
}

function box(w: number, h: number, d: number): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat());
}

// Long bone: cylinder shaft + sphere ends
function longBone(length: number, shaftR: number, proxR: number, distR: number): THREE.Group {
  const g = new THREE.Group();
  const shaft = cylinder(shaftR, shaftR * 0.9, length);
  g.add(shaft);
  const prox = sphere(proxR);
  prox.position.y = length / 2;
  g.add(prox);
  const dist = sphere(distR);
  dist.position.y = -length / 2;
  g.add(dist);
  return g;
}

// Cartilage disc (cyan)
function cartDisc(r: number, h = 0.08): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, h, 12),
    new THREE.MeshPhongMaterial({ color: 0x88cccc, shininess: 60 }),
  );
}

// ─── Skeleton builder ─────────────────────────────────────────────────────────

interface BoneEntry { group: THREE.Group; info: BoneInfo; meshes: THREE.Mesh[] }

function buildSkeleton(): { root: THREE.Group; entries: BoneEntry[] } {
  const root = new THREE.Group();
  const entries: BoneEntry[] = [];

  function addBone(info: BoneInfo, setup: (g: THREE.Group) => void): THREE.Group {
    const g = new THREE.Group();
    setup(g);
    root.add(g);
    const meshes: THREE.Mesh[] = [];
    g.traverse(o => { if (o instanceof THREE.Mesh) meshes.push(o); });
    entries.push({ group: g, info, meshes });
    return g;
  }

  // ── SKULL ──────────────────────────────────────────────
  addBone({ name: "Skull", latinName: "Calvaria", region: "skull", boneId: "skull" }, g => {
    const cranium = sphere(0.88);
    cranium.position.set(0, 0.25, 0);
    const mandible = box(0.82, 0.28, 0.68);
    mandible.position.set(0, -0.62, 0.18);
    g.add(cranium, mandible);
    g.position.set(0, 9.2, 0);
  });

  // ── VERTEBRAL COLUMN ───────────────────────────────────
  // Cervical (7)
  for (let i = 0; i < 7; i++) {
    const y = 8.1 - i * 0.36;
    addBone({ name: `C${i + 1} Vertebra`, latinName: `Vertebra cervicalis ${i + 1}`, region: "vertebral-column", boneId: i < 2 ? (i === 0 ? "atlas" : "axis") : "typical-cervical" }, g => {
      const disc = cylinder(0.28, 0.28, 0.22, 8);
      const proc = box(0.65, 0.1, 0.5);
      proc.position.set(0, 0, -0.3);
      g.add(disc, proc);
      g.position.set(0, y, 0);
    });
  }
  // Thoracic (12)
  for (let i = 0; i < 12; i++) {
    const y = 5.5 - i * 0.34;
    addBone({ name: `T${i + 1} Vertebra`, latinName: `Vertebra thoracica ${i + 1}`, region: "vertebral-column", boneId: "typical-thoracic" }, g => {
      const disc = cylinder(0.3, 0.3, 0.25, 8);
      const spinous = box(0.12, 0.5, 0.12);
      spinous.position.set(0, -0.3, -0.3);
      g.add(disc, spinous);
      g.position.set(0, y, 0);
    });
  }
  // Lumbar (5)
  for (let i = 0; i < 5; i++) {
    const y = 1.4 - i * 0.38;
    addBone({ name: `L${i + 1} Vertebra`, latinName: `Vertebra lumbalis ${i + 1}`, region: "vertebral-column", boneId: "typical-lumbar" }, g => {
      const disc = cylinder(0.36, 0.36, 0.28, 8);
      const spinous = box(0.16, 0.4, 0.16);
      spinous.position.set(0, -0.25, -0.35);
      g.add(disc, spinous);
      g.position.set(0, y, 0);
    });
  }
  // Sacrum
  addBone({ name: "Sacrum", latinName: "Os sacrum", region: "vertebral-column", boneId: "sacrum" }, g => {
    const body = cylinder(0.42, 0.28, 1.0, 8);
    g.add(body);
    g.position.set(0, -0.5, 0);
  });

  // ── RIBCAGE ────────────────────────────────────────────
  const ribWidths = [1.0, 1.2, 1.4, 1.55, 1.65, 1.72, 1.75, 1.72, 1.65, 1.55, 1.4, 1.2];
  for (let i = 0; i < 12; i++) {
    const y = 5.4 - i * 0.34;
    const w = ribWidths[i] ?? 1.4;
    for (const side of [-1, 1]) {
      addBone({
        name: i === 0 ? "First Rib" : "Rib",
        latinName: `Costa ${i + 1}`,
        region: "thorax",
        boneId: i === 0 ? "first-rib" : "typical-rib",
      }, g => {
        // Posterior segment (horizontal)
        const seg1 = cylinder(0.05, 0.05, w * 0.6, 5);
        seg1.rotation.z = Math.PI / 2;
        seg1.position.set(side * w * 0.3, 0, 0);
        // Anterior segment (angles slightly down/forward)
        const seg2 = cylinder(0.045, 0.04, w * 0.5, 5);
        seg2.rotation.z = Math.PI / 2;
        seg2.rotation.x = 0.3;
        seg2.position.set(side * w * 0.78, -0.15, 0.35);
        g.add(seg1, seg2);
        g.position.set(0, y, 0);
      });
    }
  }

  // ── STERNUM ────────────────────────────────────────────
  addBone({ name: "Sternum", latinName: "Sternum", region: "thorax", boneId: "sternum" }, g => {
    const manu = box(0.7, 0.6, 0.3);
    manu.position.y = 0.9;
    const body = box(0.55, 1.6, 0.25);
    const xiphoid = box(0.3, 0.35, 0.2);
    xiphoid.position.y = -1.0;
    g.add(manu, body, xiphoid);
    g.position.set(0, 5.5, 0.9);
  });

  // ── CLAVICLES ──────────────────────────────────────────
  for (const side of [-1, 1]) {
    addBone({ name: "Clavicle", latinName: "Clavicula", region: "upper-limb", boneId: "clavicle" }, g => {
      const bone = cylinder(0.1, 0.12, 1.8, 7);
      bone.rotation.z = Math.PI / 2;
      bone.position.set(side * 0.9, 0, 0.1);
      g.add(bone);
      g.position.set(0, 7.2, 0);
    });
  }

  // ── SCAPULAE ───────────────────────────────────────────
  for (const side of [-1, 1]) {
    addBone({ name: "Scapula", latinName: "Scapula", region: "upper-limb", boneId: "scapula" }, g => {
      const blade = box(1.1, 1.4, 0.12);
      blade.rotation.y = 0.2 * side;
      const spine = box(1.1, 0.12, 0.35);
      spine.position.y = 0.5;
      spine.position.z = -0.2;
      const acromion = box(0.4, 0.1, 0.3);
      acromion.position.set(side * 0.55, 0.55, -0.1);
      g.add(blade, spine, acromion);
      g.position.set(side * 2.3, 6.4, -0.5);
    });
  }

  // ── HUMERI ─────────────────────────────────────────────
  for (const side of [-1, 1]) {
    addBone({ name: "Humerus", latinName: "Humerus", region: "upper-limb", boneId: "humerus" }, g => {
      const bone = longBone(2.5, 0.2, 0.42, 0.35);
      bone.position.set(0, -1.25, 0);
      // deltoid tuberosity bump
      const dt = sphere(0.14);
      dt.position.set(side * 0.12, -0.3, 0);
      g.add(bone, dt);
      g.position.set(side * 2.3, 6.1, 0);
      g.rotation.z = side * 0.15;
    });
  }

  // ── FOREARMS ───────────────────────────────────────────
  for (const side of [-1, 1]) {
    // Radius
    addBone({ name: "Radius", latinName: "Radius", region: "upper-limb", boneId: "radius" }, g => {
      const bone = longBone(2.0, 0.14, 0.22, 0.28);
      bone.position.set(0, -1.0, 0);
      g.add(bone);
      g.position.set(side * (2.35 + 0.1), 3.4, 0);
      g.rotation.z = side * 0.1;
    });
    // Ulna
    addBone({ name: "Ulna", latinName: "Ulna", region: "upper-limb", boneId: "ulna" }, g => {
      const bone = longBone(2.1, 0.12, 0.28, 0.14);
      bone.position.set(0, -1.05, 0);
      const olecranon = box(0.22, 0.28, 0.2);
      olecranon.position.set(side * -0.06, 0.05, -0.12);
      g.add(bone, olecranon);
      g.position.set(side * (2.35 - 0.12), 3.4, 0);
      g.rotation.z = side * 0.1;
    });
  }

  // ── PELVIS ─────────────────────────────────────────────
  addBone({ name: "Pelvis", latinName: "Pelvis", region: "lower-limb", boneId: "hip-bone" }, g => {
    const body = box(2.4, 0.9, 1.0);
    const iliac = box(1.8, 0.3, 0.8);
    iliac.position.y = 0.5;
    const ischium = box(0.7, 0.5, 0.6);
    ischium.position.set(0, -0.5, 0);
    g.add(body, iliac, ischium);
    g.position.set(0, -1.1, 0);
  });

  // ── FEMORA ─────────────────────────────────────────────
  for (const side of [-1, 1]) {
    addBone({ name: "Femur", latinName: "Femur", region: "lower-limb", boneId: "femur" }, g => {
      const bone = longBone(3.6, 0.28, 0.55, 0.55);
      bone.position.y = -1.8;
      // greater trochanter
      const gt = sphere(0.22);
      gt.position.set(side * 0.28, -0.4, 0);
      // neck
      const neck = cylinder(0.16, 0.18, 0.6, 8);
      neck.rotation.z = -side * 0.9;
      neck.position.set(side * -0.25, 0.0, 0);
      // head (moves into acetabulum)
      const head = sphere(0.3);
      head.position.set(side * -0.55, 0.3, 0);
      g.add(bone, gt, neck, head);
      g.position.set(side * 0.75, -0.3, 0);
      g.rotation.z = side * 0.06;
    });
  }

  // ── PATELLAE ───────────────────────────────────────────
  for (const side of [-1, 1]) {
    addBone({ name: "Patella", latinName: "Patella", region: "lower-limb", boneId: "patella" }, g => {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 7), mat());
      p.scale.z = 0.5;
      g.add(p);
      g.position.set(side * 0.82, -4.45, 0.35);
    });
  }

  // ── TIBIAE ─────────────────────────────────────────────
  for (const side of [-1, 1]) {
    addBone({ name: "Tibia", latinName: "Tibia", region: "lower-limb", boneId: "tibia" }, g => {
      const bone = longBone(3.4, 0.24, 0.5, 0.38);
      bone.position.y = -1.7;
      // tibial tuberosity
      const tt = box(0.16, 0.25, 0.16);
      tt.position.set(0, -0.5, 0.22);
      // medial malleolus
      const mm = sphere(0.18);
      mm.position.set(side * -0.08, -3.35, 0);
      g.add(bone, tt, mm);
      g.position.set(side * 0.78, -4.3, 0);
    });
  }

  // ── FIBULAE ────────────────────────────────────────────
  for (const side of [-1, 1]) {
    addBone({ name: "Fibula", latinName: "Fibula", region: "lower-limb", boneId: "fibula" }, g => {
      const bone = longBone(3.2, 0.09, 0.18, 0.22);
      bone.position.y = -1.6;
      g.add(bone);
      g.position.set(side * (0.78 + side * 0.22), -4.3, 0);
    });
  }

  // ── FEET (simplified) ──────────────────────────────────
  for (const side of [-1, 1]) {
    addBone({ name: "Foot Bones", latinName: "Ossa pedis", region: "lower-limb", boneId: "tibia" }, g => {
      const tarsal = box(0.6, 0.35, 0.85);
      tarsal.position.set(0, 0, 0.3);
      const metatarsal = box(0.55, 0.2, 0.9);
      metatarsal.position.set(0, -0.12, 1.2);
      const toes = box(0.5, 0.15, 0.6);
      toes.position.set(0, -0.18, 1.8);
      g.add(tarsal, metatarsal, toes);
      g.position.set(side * 0.8, -7.75, 0.2);
    });
  }

  return { root, entries };
}

// ─── Component ────────────────────────────────────────────────────────────────

const SkeletonViewer = forwardRef<SkeletonViewerRef, Props>(function SkeletonViewer(
  { onBoneSelect },
  ref,
) {
  const skeletonRef  = useRef<THREE.Group | null>(null);
  const cameraRef    = useRef<THREE.PerspectiveCamera | null>(null);
  const entriesRef   = useRef<BoneEntry[]>([]);
  const selectedRef  = useRef<BoneEntry | null>(null);
  const rotRef       = useRef({ x: 0.06, y: 0.5 });
  const autoRef      = useRef(true);
  const idleRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewSizeRef  = useRef({ w: 1, h: 1 });
  const prevDeltaRef = useRef({ dx: 0, dy: 0 });
  const isTapRef     = useRef(false);

  useImperativeHandle(ref, () => ({
    resetView: () => {
      rotRef.current = { x: 0.06, y: 0.5 };
      autoRef.current = true;
      onBoneSelect(null);
      deselectAll();
      selectedRef.current = null;
    },
    setMode: (_mode: string) => { /* future: toggle x-ray etc */ },
  }));

  function deselectAll() {
    entriesRef.current.forEach(e => {
      e.meshes.forEach(m => {
        (m.material as THREE.MeshPhongMaterial).color.setHex(0xdec89a);
      });
    });
  }

  function selectEntry(entry: BoneEntry | null) {
    deselectAll();
    selectedRef.current = entry;
    if (entry) {
      entry.meshes.forEach(m => {
        (m.material as THREE.MeshPhongMaterial).color.setHex(0xff8800);
      });
      onBoneSelect(entry.info);
    } else {
      onBoneSelect(null);
    }
  }

  const handleTap = useCallback((lx: number, ly: number) => {
    if (!cameraRef.current) return;
    const { w, h } = viewSizeRef.current;
    const ndcX =  (lx / w) * 2 - 1;
    const ndcY = -(ly / h) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef.current);
    const allMeshes = entriesRef.current.flatMap(e => e.meshes);
    const hits = raycaster.intersectObjects(allMeshes);
    if (hits.length > 0) {
      const hitMesh = hits[0]!.object as THREE.Mesh;
      const entry = entriesRef.current.find(e => e.meshes.includes(hitMesh)) ?? null;
      if (entry === selectedRef.current) {
        selectEntry(null); // deselect on second tap
      } else {
        selectEntry(entry);
      }
    } else {
      selectEntry(null);
    }
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e) => {
        autoRef.current = false;
        isTapRef.current = true;
        prevDeltaRef.current = { dx: 0, dy: 0 };
        if (idleRef.current) clearTimeout(idleRef.current);
      },
      onPanResponderMove: (_, g) => {
        const ddx = g.dx - prevDeltaRef.current.dx;
        const ddy = g.dy - prevDeltaRef.current.dy;
        prevDeltaRef.current = { dx: g.dx, dy: g.dy };
        if (Math.abs(ddx) > 2 || Math.abs(ddy) > 2) isTapRef.current = false;
        rotRef.current.y += ddx * 0.011;
        rotRef.current.x = Math.max(-1.1, Math.min(1.1, rotRef.current.x + ddy * 0.011));
      },
      onPanResponderRelease: (e, g) => {
        if (isTapRef.current) {
          handleTap(e.nativeEvent.locationX, e.nativeEvent.locationY);
        }
        idleRef.current = setTimeout(() => { autoRef.current = true; }, 5000);
      },
    }),
  ).current;

  const onContextCreate = useCallback((gl: any) => {
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;

    const renderer = new THREE.WebGLRenderer({
      canvas: {
        width: w, height: h, style: {},
        addEventListener: () => {}, removeEventListener: () => {},
        clientWidth: w, clientHeight: h,
      } as unknown as HTMLCanvasElement,
      context: gl as unknown as WebGLRenderingContext,
      antialias: false,
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x1e1e2e);

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1e1e2e, 25, 50);

    // Camera
    const camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 100);
    camera.position.set(0, 1.5, 20);
    cameraRef.current = camera;

    // Lighting
    const ambient = new THREE.AmbientLight(0xfff5e0, 0.55);
    const key = new THREE.DirectionalLight(0xfff8f0, 1.3);
    key.position.set(4, 8, 10);
    const fill = new THREE.DirectionalLight(0x8888cc, 0.35);
    fill.position.set(-6, 2, -6);
    const rim = new THREE.DirectionalLight(0xffeedd, 0.25);
    rim.position.set(0, -10, -8);
    scene.add(ambient, key, fill, rim);

    // Skeleton
    const { root, entries } = buildSkeleton();
    root.position.y = -1;
    scene.add(root);
    skeletonRef.current = root;
    entriesRef.current = entries;

    // Render loop
    let raf: number;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (autoRef.current && root) {
        rotRef.current.y += 0.007;
      }
      if (root) {
        root.rotation.x = rotRef.current.x;
        root.rotation.y = rotRef.current.y;
      }
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
    // Cleanup handled by component unmount
  }, []);

  return (
    <View
      style={styles.root}
      {...panResponder.panHandlers}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        viewSizeRef.current = { w: width, h: height };
      }}
    >
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
    </View>
  );
});

export default SkeletonViewer;

const styles = StyleSheet.create({
  root: { flex: 1 },
});
