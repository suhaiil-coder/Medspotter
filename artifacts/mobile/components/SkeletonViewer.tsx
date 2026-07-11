/**
 * SkeletonViewer — Full-body 3D skeleton.
 * Native (iOS/Android): expo-gl + Three.js with anatomically correct geometry.
 * Web (preview only): interactive 2D diagram fallback.
 */
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { Platform, PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GLView } from "expo-gl";
import * as THREE from "three";

// ─── Public types ────────────────────────────────────────────────────────────

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

// ─── Material helpers ────────────────────────────────────────────────────────

const BONE_COLOR  = 0xEDD9A3; // warm ivory/bone
const CART_COLOR  = 0x7CC8C8; // cartilage: cyan
const SEL_COLOR   = 0xFF8800; // orange highlight

function boneMat(color = BONE_COLOR): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color, roughness: 0.62, metalness: 0.04,
  });
}
function cartMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: CART_COLOR, roughness: 0.4, metalness: 0.0,
  });
}

// ─── Geometry helpers ────────────────────────────────────────────────────────

/**
 * Long bone via LatheGeometry — gives the real tapered shaft with flared ends.
 * profile: array of [radius, heightFraction] from bottom (0) to top (1).
 */
function latheBone(height: number, profile: [r: number, t: number][], segs = 22): THREE.Mesh {
  const pts = profile.map(([r, t]) => new THREE.Vector2(r, t * height));
  const geo = new THREE.LatheGeometry(pts, segs);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, boneMat());
}

/** Small cartilage disc between bones */
function cart(r: number, h = 0.07): THREE.Mesh {
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14), cartMat());
}

/** Sphere mesh */
function sph(r: number, ws = 16, hs = 12): THREE.Mesh {
  return new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), boneMat());
}

/** Box mesh */
function bx(w: number, h: number, d: number): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), boneMat());
}

/** Curved rib via TubeGeometry on a CatmullRom spline */
function createRib(side: 1 | -1, width: number, drop: number): THREE.Mesh {
  const s = side;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(s * 0.22, 0, 0.05),
    new THREE.Vector3(s * width * 0.55, drop * 0.3, 0.35),
    new THREE.Vector3(s * width * 0.95, drop * 0.65, 0.62),
    new THREE.Vector3(s * width * 0.82, drop, 0.88),
    new THREE.Vector3(s * 0.28, drop * 1.05, 1.05),
  ]);
  const geo = new THREE.TubeGeometry(curve, 18, 0.055, 7, false);
  return new THREE.Mesh(geo, boneMat());
}

// ─── Skeleton build ──────────────────────────────────────────────────────────

interface BoneEntry { group: THREE.Group; info: BoneInfo; meshes: THREE.Mesh[] }

function buildSkeleton(): { root: THREE.Group; entries: BoneEntry[] } {
  const root = new THREE.Group();
  const entries: BoneEntry[] = [];

  function addBone(info: BoneInfo, build: (g: THREE.Group) => void): THREE.Group {
    const g = new THREE.Group();
    build(g);
    root.add(g);
    const meshes: THREE.Mesh[] = [];
    g.traverse(o => { if (o instanceof THREE.Mesh) meshes.push(o); });
    entries.push({ group: g, info, meshes });
    return g;
  }

  // ─── SKULL ─────────────────────────────────────────────────────────────────
  addBone({ name: "Skull", latinName: "Calvaria", region: "skull", boneId: "skull" }, g => {
    // Cranium — sphere with forehead flattening
    const cranium = sph(0.9, 20, 16);
    cranium.scale.set(1, 1.12, 0.92);
    cranium.position.set(0, 0.3, -0.05);

    // Zygomatic arches
    for (const sx of [-1, 1]) {
      const zarch = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.055, 5, 16, Math.PI * 0.5),
        boneMat(),
      );
      zarch.rotation.x = Math.PI / 2;
      zarch.position.set(sx * 0.68, -0.08, 0.28);
      g.add(zarch);
    }

    // Nasal bone ridge
    const nasal = bx(0.18, 0.3, 0.18);
    nasal.position.set(0, 0.05, 0.82);

    // Mandible
    const mand = bx(0.86, 0.3, 0.68);
    mand.position.set(0, -0.62, 0.15);
    // Rami
    for (const sx of [-1, 1]) {
      const ramus = bx(0.16, 0.55, 0.22);
      ramus.position.set(sx * 0.38, -0.45, -0.15);
      g.add(ramus);
    }

    g.add(cranium, nasal, mand);
    g.position.set(0, 9.4, 0);
  });

  // ─── VERTEBRAL COLUMN ──────────────────────────────────────────────────────

  // Cervical (7) — small, slightly lordotic
  const cervicoProfile: [number, number][] = [[0.26,0],[0.28,0.45],[0.27,0.55],[0.26,1]];
  for (let i = 0; i < 7; i++) {
    addBone({ name: `C${i+1} Vertebra`, latinName: `Vertebra cervicalis ${i+1}`, region: "vertebral-column", boneId: i===0?"atlas":i===1?"axis":"typical-cervical" }, g => {
      const body = latheBone(0.22, cervicoProfile, 10);
      const proc = bx(0.62, 0.08, 0.46); proc.position.set(0, 0, -0.28);
      const spinous = bx(0.1, 0.08, 0.34); spinous.position.set(0, 0, -0.55);
      g.add(body, proc, spinous);
      g.position.set(0, 8.0 - i * 0.36, i * 0.04); // slight lordosis
    });
  }

  // Thoracic (12) — medium, kyphotic
  const thoraProfile: [number, number][] = [[0.28,0],[0.30,0.4],[0.31,0.6],[0.28,1]];
  for (let i = 0; i < 12; i++) {
    addBone({ name: `T${i+1} Vertebra`, latinName: `Vertebra thoracica ${i+1}`, region: "vertebral-column", boneId: "typical-thoracic" }, g => {
      const body = latheBone(0.25, thoraProfile, 10);
      const proc = bx(0.68, 0.09, 0.52); proc.position.set(0, 0, -0.3);
      const spinous = bx(0.1, 0.42, 0.1); spinous.position.set(0, -0.22, -0.55);
      g.add(body, proc, spinous);
      g.position.set(0, 5.5 - i * 0.34, -(i * 0.03)); // slight kyphosis
    });
  }

  // Lumbar (5) — large, lordotic
  const lumbarProfile: [number, number][] = [[0.33,0],[0.36,0.4],[0.37,0.6],[0.34,1]];
  for (let i = 0; i < 5; i++) {
    addBone({ name: `L${i+1} Vertebra`, latinName: `Vertebra lumbalis ${i+1}`, region: "vertebral-column", boneId: "typical-lumbar" }, g => {
      const body = latheBone(0.3, lumbarProfile, 10);
      const proc = bx(0.78, 0.1, 0.58); proc.position.set(0, 0, -0.35);
      const spinous = bx(0.14, 0.45, 0.14); spinous.position.set(0, -0.2, -0.58);
      g.add(body, proc, spinous);
      g.position.set(0, 1.45 - i * 0.38, i * 0.02);
    });
  }

  // Sacrum
  addBone({ name: "Sacrum", latinName: "Os sacrum", region: "vertebral-column", boneId: "sacrum" }, g => {
    const s = latheBone(1.0, [[0.42,0],[0.44,0.3],[0.38,0.7],[0.26,1]], 12);
    g.add(s);
    g.position.set(0, -0.6, 0);
  });

  // ─── RIBCAGE ───────────────────────────────────────────────────────────────
  const ribWidths = [1.05,1.22,1.38,1.50,1.60,1.66,1.68,1.65,1.58,1.48,1.32,1.1];
  const ribDrops  = [0.1, 0.15,0.2, 0.28,0.35,0.4, 0.42,0.42,0.4, 0.38,0.32,0.25];
  for (let i = 0; i < 12; i++) {
    const y = 5.38 - i * 0.34;
    for (const sx of [-1, 1] as (1|-1)[]) {
      addBone({ name: i < 2 ? "First Rib" : "Rib", latinName: `Costa ${i+1}`, region: "thorax", boneId: i===0?"first-rib":"typical-rib" }, g => {
        const rib = createRib(sx, ribWidths[i]!, ribDrops[i]!);
        g.add(rib);
        g.position.set(0, y, 0);
      });
    }
  }

  // ─── STERNUM ───────────────────────────────────────────────────────────────
  addBone({ name: "Sternum", latinName: "Sternum", region: "thorax", boneId: "sternum" }, g => {
    const manu = latheBone(0.62, [[0.32,0],[0.36,0.4],[0.34,1]], 12); manu.position.y = 1.0;
    const body  = latheBone(1.55, [[0.26,0],[0.28,0.5],[0.25,1]], 12); body.position.y = 0.22;
    const xiph  = latheBone(0.38, [[0.14,0],[0.18,0.5],[0.08,1]], 8); xiph.position.y = -1.0;
    g.add(manu, body, xiph);
    g.position.set(0, 5.55, 1.0);
  });

  // ─── CLAVICLES ─────────────────────────────────────────────────────────────
  for (const sx of [-1, 1] as (1|-1)[]) {
    addBone({ name: "Clavicle", latinName: "Clavicula", region: "upper-limb", boneId: "clavicle" }, g => {
      // S-shaped clavicle using TubeGeometry
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(sx * 0.5, 0.05, -0.08),
        new THREE.Vector3(sx * 1.2, 0.0,  0.12),
        new THREE.Vector3(sx * 1.7, -0.06, 0.05),
      ]);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.1, 9, false), boneMat());
      g.add(tube);
      g.position.set(0, 7.35, 0.2);
    });
  }

  // ─── SCAPULAE ──────────────────────────────────────────────────────────────
  for (const sx of [-1, 1] as (1|-1)[]) {
    addBone({ name: "Scapula", latinName: "Scapula", region: "upper-limb", boneId: "scapula" }, g => {
      const blade = bx(1.15, 1.45, 0.1); blade.rotation.y = sx * 0.15;
      const spine = bx(1.0, 0.1, 0.32); spine.position.set(0, 0.6, -0.2);
      const acromion = bx(0.35, 0.1, 0.28); acromion.position.set(sx * 0.52, 0.7, -0.08);
      const coracoid = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.12,0.45,8), boneMat());
      coracoid.rotation.x = Math.PI / 4;
      coracoid.position.set(sx * 0.35, 0.4, 0.3);
      g.add(blade, spine, acromion, coracoid);
      g.position.set(sx * 2.28, 6.4, -0.5);
    });
  }

  // ─── HUMERI ────────────────────────────────────────────────────────────────
  // Proper profile: wide head → surgical neck → shaft → condyles
  const humerusProfile: [number, number][] = [
    [0.30,0],[0.34,0.05],[0.22,0.12],   // condyle→shaft
    [0.18,0.3],[0.18,0.55],[0.19,0.75], // shaft
    [0.24,0.86],[0.28,0.92],             // greater tubercle
    [0.16,0.95],[0.35,1.0],              // neck + head
  ];
  for (const sx of [-1, 1] as (1|-1)[]) {
    addBone({ name: "Humerus", latinName: "Humerus", region: "upper-limb", boneId: "humerus" }, g => {
      const bone = latheBone(2.6, humerusProfile, 20);
      bone.position.y = -1.3;
      g.add(bone);
      g.position.set(sx * 2.35, 6.2, 0);
      g.rotation.z = sx * 0.14;
    });
  }

  // ─── RADII ─────────────────────────────────────────────────────────────────
  const radiusProfile: [number, number][] = [
    [0.24,0],[0.20,0.05],[0.13,0.14],[0.12,0.45],[0.12,0.75],[0.15,0.9],[0.2,1.0],
  ];
  for (const sx of [-1, 1] as (1|-1)[]) {
    addBone({ name: "Radius", latinName: "Radius", region: "upper-limb", boneId: "radius" }, g => {
      const bone = latheBone(1.9, radiusProfile, 16);
      bone.position.y = -0.95;
      g.add(bone);
      g.position.set(sx * 2.42, 3.4, 0);
    });
  }

  // ─── ULNAE ─────────────────────────────────────────────────────────────────
  const ulnaProfile: [number, number][] = [
    [0.12,0],[0.14,0.08],[0.10,0.18],[0.09,0.5],[0.09,0.8],[0.10,0.92],[0.24,1.0],
  ];
  for (const sx of [-1, 1] as (1|-1)[]) {
    addBone({ name: "Ulna", latinName: "Ulna", region: "upper-limb", boneId: "ulna" }, g => {
      const bone = latheBone(2.0, ulnaProfile, 14);
      bone.position.y = -1.0;
      // Olecranon
      const olec = bx(0.22, 0.32, 0.2); olec.position.set(0, 0.18, -0.12);
      g.add(bone, olec);
      g.position.set(sx * (2.42 - sx * 0.22), 3.4, 0);
    });
  }

  // ─── HANDS (simplified) ───────────────────────────────────────────────────
  for (const sx of [-1, 1] as (1|-1)[]) {
    addBone({ name: "Hand Bones", latinName: "Ossa manus", region: "upper-limb", boneId: "radius" }, g => {
      // Carpals
      const carp = bx(0.58, 0.28, 0.45); carp.position.set(0, 0, 0);
      // Metacarpals
      for (let i = -2; i <= 2; i++) {
        const mc = latheBone(0.65, [[0.06,0],[0.08,0.5],[0.07,1]], 8);
        mc.position.set(i * 0.11, -0.5, 0);
        g.add(mc);
      }
      // Proximal phalanges
      for (let i = -2; i <= 2; i++) {
        const pp = latheBone(0.4, [[0.055,0],[0.065,0.5],[0.055,1]], 8);
        pp.position.set(i * 0.11, -0.95, 0);
        g.add(pp);
      }
      g.add(carp);
      g.position.set(sx * 2.5, 1.2, 0);
    });
  }

  // ─── PELVIS ────────────────────────────────────────────────────────────────
  addBone({ name: "Pelvis", latinName: "Pelvis", region: "lower-limb", boneId: "hip-bone" }, g => {
    // Iliac body
    const ilium = bx(2.5, 0.75, 0.85); ilium.position.y = 0.35;
    // Iliac crest — use torus segment
    const crest = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.12, 6, 24, Math.PI),
      boneMat(),
    );
    crest.rotation.x = Math.PI / 2;
    crest.position.set(0, 0.75, 0);
    // Ischium / pubis
    const isch = bx(0.72, 0.65, 0.72); isch.position.set(0, -0.42, 0);
    // Pubic symphysis
    const pub = bx(0.3, 0.45, 0.3); pub.position.set(0, -0.3, 0.5);
    // Acetabula (hip sockets)
    for (const sx of [-1, 1]) {
      const ace = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6),
        cartMat(),
      );
      ace.position.set(sx * 1.05, -0.15, 0);
      g.add(ace);
    }
    g.add(ilium, crest, isch, pub);
    g.position.set(0, -0.95, 0);
  });

  // ─── FEMORA ────────────────────────────────────────────────────────────────
  // The most visually important bone — use a very detailed profile
  const femurProfile: [number, number][] = [
    [0.36,0.00],[0.38,0.04],[0.28,0.08], // distal condyle
    [0.20,0.14],[0.19,0.35],              // shaft lower
    [0.19,0.55],[0.20,0.72],              // shaft upper
    [0.24,0.80],[0.38,0.88],              // greater trochanter
    [0.16,0.94],[0.34,1.00],              // neck + head
  ];
  for (const sx of [-1, 1] as (1|-1)[]) {
    addBone({ name: "Femur", latinName: "Femur", region: "lower-limb", boneId: "femur" }, g => {
      const bone = latheBone(4.0, femurProfile, 24);
      bone.position.y = -2.0;
      // Femoral neck rotated in
      bone.rotation.z = sx * 0.08;
      // Lesser trochanter bump
      const lt = sph(0.14); lt.position.set(sx * -0.2, -0.5, 0);
      g.add(bone, lt);
      g.position.set(sx * 0.76, -0.5, 0);
    });
  }

  // ─── PATELLAE ──────────────────────────────────────────────────────────────
  for (const sx of [-1, 1] as (1|-1)[]) {
    addBone({ name: "Patella", latinName: "Patella", region: "lower-limb", boneId: "patella" }, g => {
      const p = sph(0.22, 12, 10); p.scale.set(1.1, 0.9, 0.55);
      g.add(p);
      g.position.set(sx * 0.8, -4.7, 0.4);
    });
  }

  // ─── TIBIAE ────────────────────────────────────────────────────────────────
  const tibiaProfile: [number, number][] = [
    [0.30,0],[0.34,0.04],[0.26,0.10], // malleolus + distal
    [0.20,0.18],[0.19,0.45],           // shaft lower/mid
    [0.21,0.72],[0.30,0.88],           // shaft upper + metaphysis
    [0.42,0.96],[0.44,1.00],           // tibial plateau
  ];
  for (const sx of [-1, 1] as (1|-1)[]) {
    addBone({ name: "Tibia", latinName: "Tibia", region: "lower-limb", boneId: "tibia" }, g => {
      const bone = latheBone(3.6, tibiaProfile, 22);
      bone.position.y = -1.8;
      // Tibial tuberosity
      const tt = bx(0.15, 0.28, 0.16); tt.position.set(0, -0.55, 0.23);
      // Medial malleolus
      const mm = sph(0.17); mm.position.set(sx * -0.1, -3.5, 0);
      g.add(bone, tt, mm);
      g.position.set(sx * 0.76, -4.55, 0);
    });
  }

  // ─── FIBULAE ───────────────────────────────────────────────────────────────
  const fibulaProfile: [number, number][] = [
    [0.16,0],[0.18,0.04],[0.08,0.1],[0.07,0.5],[0.07,0.9],[0.14,1.0],
  ];
  for (const sx of [-1, 1] as (1|-1)[]) {
    addBone({ name: "Fibula", latinName: "Fibula", region: "lower-limb", boneId: "fibula" }, g => {
      const bone = latheBone(3.4, fibulaProfile, 12);
      bone.position.y = -1.7;
      g.add(bone);
      g.position.set(sx * (0.76 + sx * 0.26), -4.55, 0);
    });
  }

  // ─── FEET (simplified but recognizable) ────────────────────────────────────
  for (const sx of [-1, 1] as (1|-1)[]) {
    addBone({ name: "Foot Bones", latinName: "Ossa pedis", region: "lower-limb", boneId: "tibia" }, g => {
      // Calcaneus
      const calc = bx(0.6, 0.36, 0.9); calc.position.set(0, 0, 0.2);
      // Talus
      const talus = sph(0.25); talus.position.set(0, 0.22, 0.5);
      // Navicular/cuboid
      const mid = bx(0.54, 0.25, 0.5); mid.position.set(0, 0.1, 0.95);
      // Metatarsals
      for (let i = -2; i <= 2; i++) {
        const mt = latheBone(0.8, [[0.055,0],[0.07,0.5],[0.065,1]], 8);
        mt.rotation.x = -Math.PI / 2 - 0.15;
        mt.position.set(i * 0.1, 0.08, 1.45 + Math.abs(i) * 0.05);
        g.add(mt);
      }
      g.add(calc, talus, mid);
      g.position.set(sx * 0.76, -8.2, 0.25);
    });
  }

  return { root, entries };
}

// ─── Web 2D Fallback ────────────────────────────────────────────────────────

const WEB_BONES: { info: BoneInfo; style: object }[] = [
  { info: { name: "Skull", latinName: "Calvaria", region: "skull", boneId: "skull" }, style: { top: "1%", left: "38%", width: "22%", height: "10%" } },
  { info: { name: "Clavicle", latinName: "Clavicula", region: "upper-limb", boneId: "clavicle" }, style: { top: "11%", left: "22%", width: "55%", height: "3%" } },
  { info: { name: "Sternum", latinName: "Sternum", region: "thorax", boneId: "sternum" }, style: { top: "14%", left: "44%", width: "12%", height: "14%" } },
  { info: { name: "Rib", latinName: "Costa", region: "thorax", boneId: "typical-rib" }, style: { top: "14%", left: "22%", width: "54%", height: "14%" } },
  { info: { name: "Humerus", latinName: "Humerus", region: "upper-limb", boneId: "humerus" }, style: { top: "14%", left: "14%", width: "9%", height: "18%" } },
  { info: { name: "Humerus", latinName: "Humerus", region: "upper-limb", boneId: "humerus" }, style: { top: "14%", right: "14%", width: "9%", height: "18%" } },
  { info: { name: "Radius", latinName: "Radius", region: "upper-limb", boneId: "radius" }, style: { top: "32%", left: "10%", width: "9%", height: "16%" } },
  { info: { name: "Radius", latinName: "Radius", region: "upper-limb", boneId: "radius" }, style: { top: "32%", right: "10%", width: "9%", height: "16%" } },
  { info: { name: "Pelvis", latinName: "Pelvis", region: "lower-limb", boneId: "hip-bone" }, style: { top: "40%", left: "28%", width: "42%", height: "10%" } },
  { info: { name: "Femur", latinName: "Femur", region: "lower-limb", boneId: "femur" }, style: { top: "50%", left: "28%", width: "16%", height: "22%" } },
  { info: { name: "Femur", latinName: "Femur", region: "lower-limb", boneId: "femur" }, style: { top: "50%", right: "28%", width: "16%", height: "22%" } },
  { info: { name: "Tibia", latinName: "Tibia", region: "lower-limb", boneId: "tibia" }, style: { top: "72%", left: "30%", width: "13%", height: "22%" } },
  { info: { name: "Tibia", latinName: "Tibia", region: "lower-limb", boneId: "tibia" }, style: { top: "72%", right: "30%", width: "13%", height: "22%" } },
];

function WebFallback({ onBoneSelect }: { onBoneSelect: (b: BoneInfo | null) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  function tap(info: BoneInfo) {
    const key = info.boneId + info.region;
    if (sel === key) { setSel(null); onBoneSelect(null); }
    else { setSel(key); onBoneSelect(info); }
  }
  return (
    <View style={{ flex: 1, backgroundColor: "#1e1e2e", position: "relative" }}>
      {WEB_BONES.map((b, i) => {
        const key = b.info.boneId + b.info.region + i;
        const active = sel === b.info.boneId + b.info.region;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => tap(b.info)}
            style={[
              styles.webBone,
              b.style as any,
              active && styles.webBoneActive,
            ]}
          >
            {active && (
              <Text style={styles.webBoneLabel} numberOfLines={1}>
                {b.info.name}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
      <Text style={styles.webHint}>3D rendering active on device (Expo Go)</Text>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const SkeletonViewer = forwardRef<SkeletonViewerRef, { onBoneSelect: (b: BoneInfo | null) => void }>(
  function SkeletonViewer({ onBoneSelect }, ref) {

    // Web fallback (expo-gl needs native WebGL not available in the preview iframe)
    if (Platform.OS === "web") {
      return <WebFallback onBoneSelect={onBoneSelect} />;
    }

    return <NativeViewer onBoneSelect={onBoneSelect} ref={ref} />;
  },
);

// Inner native component (uses hooks freely)
const NativeViewer = forwardRef<SkeletonViewerRef, { onBoneSelect: (b: BoneInfo | null) => void }>(
  function NativeViewer({ onBoneSelect }, ref) {
    const skeletonRef  = useRef<THREE.Group | null>(null);
    const cameraRef    = useRef<THREE.PerspectiveCamera | null>(null);
    const entriesRef   = useRef<BoneEntry[]>([]);
    const selectedRef  = useRef<BoneEntry | null>(null);
    const rotRef       = useRef({ x: 0.05, y: 0.5 });
    const autoRef      = useRef(true);
    const idleRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
    const viewSizeRef  = useRef({ w: 1, h: 1 });
    const prevDeltaRef = useRef({ dx: 0, dy: 0 });
    const isTapRef     = useRef(false);

    useImperativeHandle(ref, () => ({
      resetView: () => {
        rotRef.current = { x: 0.05, y: 0.5 };
        autoRef.current = true;
        deselectAll();
        selectedRef.current = null;
        onBoneSelect(null);
      },
      setMode: () => {},
    }));

    function deselectAll() {
      entriesRef.current.forEach(e =>
        e.meshes.forEach(m => {
          const mat = m.material as THREE.MeshStandardMaterial;
          mat.color.setHex(BONE_COLOR);
        }),
      );
    }

    function selectEntry(entry: BoneEntry | null) {
      deselectAll();
      selectedRef.current = entry;
      if (entry) {
        entry.meshes.forEach(m =>
          (m.material as THREE.MeshStandardMaterial).color.setHex(SEL_COLOR),
        );
        onBoneSelect(entry.info);
      } else {
        onBoneSelect(null);
      }
    }

    const handleTap = useCallback((lx: number, ly: number) => {
      if (!cameraRef.current) return;
      const { w, h } = viewSizeRef.current;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(
        new THREE.Vector2((lx / w) * 2 - 1, -(ly / h) * 2 + 1),
        cameraRef.current,
      );
      const allMeshes = entriesRef.current.flatMap(e => e.meshes);
      const hits = raycaster.intersectObjects(allMeshes);
      if (hits.length > 0) {
        const hitMesh = hits[0]!.object as THREE.Mesh;
        const entry = entriesRef.current.find(e => e.meshes.includes(hitMesh)) ?? null;
        selectEntry(entry === selectedRef.current ? null : entry);
      } else {
        selectEntry(null);
      }
    }, []);

    const panResponder = useRef(PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => {
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
      onPanResponderRelease: (e) => {
        if (isTapRef.current) {
          handleTap(e.nativeEvent.locationX, e.nativeEvent.locationY);
        }
        idleRef.current = setTimeout(() => { autoRef.current = true; }, 5000);
      },
    })).current;

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
        antialias: true,
      });
      renderer.setSize(w, h);
      renderer.setPixelRatio(1);
      renderer.setClearColor(0x1e1e2e, 1);
      renderer.shadowMap.enabled = true;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x1e1e2e, 0.025);

      const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
      camera.position.set(0, 2.0, 22);
      cameraRef.current = camera;

      // Warm operating-room lighting
      const ambient = new THREE.AmbientLight(0xfff8f0, 0.42);
      const keyLight = new THREE.DirectionalLight(0xfff5e8, 1.5);
      keyLight.position.set(5, 12, 10);
      const fillLight = new THREE.DirectionalLight(0x8899cc, 0.4);
      fillLight.position.set(-8, 0, -5);
      const rimLight = new THREE.DirectionalLight(0xffeedd, 0.3);
      rimLight.position.set(0, -8, -10);
      scene.add(ambient, keyLight, fillLight, rimLight);

      // Skeleton
      const { root, entries } = buildSkeleton();
      root.position.set(0, -1.2, 0);
      scene.add(root);
      skeletonRef.current = root;
      entriesRef.current = entries;

      // RAF loop
      const animate = () => {
        requestAnimationFrame(animate);
        if (autoRef.current && root) rotRef.current.y += 0.007;
        if (root) {
          root.rotation.x = rotRef.current.x;
          root.rotation.y = rotRef.current.y;
        }
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      animate();
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
  },
);

export default SkeletonViewer;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  webBone: {
    position: "absolute",
    backgroundColor: "rgba(237, 217, 163, 0.12)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(237, 217, 163, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  webBoneActive: {
    backgroundColor: "rgba(255, 136, 0, 0.25)",
    borderColor: "#ff8800",
  },
  webBoneLabel: {
    fontSize: 9,
    color: "#ff8800",
    fontWeight: "700",
    textAlign: "center",
  },
  webHint: {
    position: "absolute",
    bottom: 200,
    left: 0, right: 0,
    textAlign: "center",
    color: "rgba(255,255,255,0.18)",
    fontSize: 11,
  },
});
