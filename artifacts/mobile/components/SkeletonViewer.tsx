/**
 * SkeletonViewer — Medical-illustration-style interactive skeleton.
 * Drawn in react-native-svg (works in Expo Go + web).
 * Each bone is individually tappable; selected bone highlights orange.
 * Drag left/right to rotate (simulates 3D via perspective skew).
 */
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";
import Svg, {
  Defs, G, LinearGradient, Stop,
  Path, Ellipse, Rect, Circle, Line,
} from "react-native-svg";

// ─── Public types ────────────────────────────────────────────────────────────
export interface BoneInfo {
  name: string;
  latinName: string;
  region: string;
  boneId: string;
}
export interface SkeletonViewerRef {
  resetView: () => void;
  setMode: (m: string) => void;
}

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  bg:      "#1e1e2e",
  stroke:  "#b89840",
  dark:    "#8c6c20",
  cavity:  "#1a1530",   // eye sockets, nasal opening
  cart:    "#7cc8c8",   // cartilage
  sel:     "#ff8800",   // selected
  selDark: "#cc6600",
};
const SW = 0.8; // default stroke-width

// ─── Gradient helpers ─────────────────────────────────────────────────────────
function BoneGrads() {
  return (
    <Defs>
      {/* Default bone: warm ivory, light on left, shadow on right */}
      <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0"   stopColor="#f8edcc" stopOpacity="1" />
        <Stop offset="0.4" stopColor="#edd9a3" stopOpacity="1" />
        <Stop offset="1"   stopColor="#c9a870" stopOpacity="1" />
      </LinearGradient>
      {/* Selected: orange */}
      <LinearGradient id="sel" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0"   stopColor="#ffb040" stopOpacity="1" />
        <Stop offset="0.5" stopColor="#ff8800" stopOpacity="1" />
        <Stop offset="1"   stopColor="#cc5500" stopOpacity="1" />
      </LinearGradient>
      {/* Cartilage: cyan */}
      <LinearGradient id="cart" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor="#a0e0e0" stopOpacity="1" />
        <Stop offset="1" stopColor="#5cb8b8" stopOpacity="1" />
      </LinearGradient>
    </Defs>
  );
}

// ─── Bone component ────────────────────────────────────────────────────────--
interface BProps {
  info: BoneInfo;
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
}
function Bone({ info, selected, onPress, children }: BProps) {
  const fill = selected ? "url(#sel)" : "url(#bg)";
  const stroke = selected ? C.selDark : C.stroke;
  return (
    <G
      fill={fill}
      stroke={stroke}
      strokeWidth={selected ? SW * 1.4 : SW}
      onPress={onPress}
    >
      {children}
    </G>
  );
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────
// Long bone: rounded rect shaft + circles for epiphyses
function LongBone({
  x, y, w, h, headR, footR,
  angle = 0,
}: { x: number; y: number; w: number; h: number; headR: number; footR: number; angle?: number }) {
  return (
    <G transform={angle ? `rotate(${angle},${x},${y})` : undefined}>
      <Rect x={x - w / 2} y={y} width={w} height={h} rx={w / 2} />
      <Circle cx={x} cy={y}     r={headR} />
      <Circle cx={x} cy={y + h} r={footR} />
    </G>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const SkeletonViewer = forwardRef<SkeletonViewerRef, { onBoneSelect: (b: BoneInfo | null) => void }>(
  function SkeletonViewer({ onBoneSelect }, ref) {
    const [sel, setSel] = useState<string | null>(null);
    const rotX = useRef(new Animated.Value(0)).current;
    const panRef = useRef({ dx: 0 });
    const isTapRef = useRef(false);

    useImperativeHandle(ref, () => ({
      resetView: () => { setSel(null); onBoneSelect(null); Animated.spring(rotX, { toValue: 0, useNativeDriver: true }).start(); },
      setMode: () => {},
    }));

    const pan = useRef(PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { isTapRef.current = true; panRef.current.dx = 0; },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > 4) isTapRef.current = false;
        rotX.setValue(g.dx * 0.4);
      },
      onPanResponderRelease: (_, g) => {
        Animated.spring(rotX, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
      },
    })).current;

    function select(info: BoneInfo) {
      const key = info.boneId + info.region;
      if (sel === key) {
        setSel(null);
        onBoneSelect(null);
      } else {
        setSel(key);
        onBoneSelect(info);
      }
    }

    function isSelected(info: BoneInfo) {
      return sel === info.boneId + info.region;
    }

    function B(info: BoneInfo, children: React.ReactNode) {
      return (
        <Bone key={info.boneId + info.region} info={info} selected={isSelected(info)} onPress={() => select(info)}>
          {children}
        </Bone>
      );
    }

    // ── SVG viewport: 200 × 730, skeleton from y=0 (head) to y=710 (feet) ──
    return (
      <View style={styles.root} {...pan.panHandlers}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ perspective: 800 }, { rotateY: rotX.interpolate({ inputRange: [-180, 180], outputRange: ["-22deg", "22deg"] }) }] }]}>
          <Svg viewBox="0 0 200 730" style={StyleSheet.absoluteFill} preserveAspectRatio="xMidYMid meet">
            <BoneGrads />

            {/* ── SKULL ── */}
            {B({ name: "Skull", latinName: "Calvaria", region: "skull", boneId: "skull" },
              <>
                {/* Cranium */}
                <Path d="M100,4 C130,4 154,18 158,42 C162,66 155,86 142,94 C134,99 120,103 100,104 C80,103 66,99 58,94 C45,86 38,66 42,42 C46,18 70,4 100,4 Z" />
                {/* Zygomatic arches (cheekbones) */}
                <Path d="M56,72 C50,70 44,70 40,74 C38,77 40,82 48,83 C52,84 57,82 60,79 Z" />
                <Path d="M144,72 C150,70 156,70 160,74 C162,77 160,82 152,83 C148,84 143,82 140,79 Z" />
                {/* Eye sockets */}
                <Ellipse cx={83} cy={67} rx={15} ry={12} fill={C.cavity} stroke={C.dark} />
                <Ellipse cx={117} cy={67} rx={15} ry={12} fill={C.cavity} stroke={C.dark} />
                {/* Nasal aperture */}
                <Path d="M94,80 C94,88 96,92 100,93 C104,92 106,88 106,80 L103,76 L100,74 L97,76 Z" fill={C.cavity} stroke={C.dark} />
                {/* Maxilla / upper jaw ridge */}
                <Path d="M68,100 C78,108 88,110 100,110 C112,110 122,108 132,100 Z" />
                {/* Mandible */}
                <Path d="M66,103 C56,106 49,114 50,124 L54,142 L72,152 L100,156 L128,152 L146,142 L150,124 C151,114 144,106 134,103 L122,100 L100,102 L78,100 Z" />
              </>
            )}

            {/* ── CERVICAL SPINE (7) ── */}
            {([...Array(7)].map((_, i) =>
              B({ name: `C${i + 1} Vertebra`, latinName: `Vertebra cervicalis ${i + 1}`, region: "vertebral-column", boneId: i === 0 ? "atlas" : i === 1 ? "axis" : "typical-cervical" },
                <>
                  <Rect x={87} y={159 + i * 9.5} width={26} height={7} rx={2} />
                  <Path d={`M100,${163 + i * 9.5} L100,${168 + i * 9.5}`} stroke={C.dark} strokeWidth={0.6} />
                  {/* Transverse processes */}
                  <Path d={`M87,${162 + i * 9.5} L78,${163 + i * 9.5}`} strokeWidth={0.5} />
                  <Path d={`M113,${162 + i * 9.5} L122,${163 + i * 9.5}`} strokeWidth={0.5} />
                </>
              )
            ))}

            {/* ── THORACIC SPINE (12) ── */}
            {([...Array(12)].map((_, i) =>
              B({ name: `T${i + 1} Vertebra`, latinName: `Vertebra thoracica ${i + 1}`, region: "vertebral-column", boneId: "typical-thoracic" },
                <>
                  <Rect x={86} y={225 + i * 11} width={28} height={8.5} rx={2} />
                  <Path d={`M100,${231 + i * 11} L100,${239 + i * 11}`} stroke={C.dark} strokeWidth={0.6} />
                </>
              )
            ))}

            {/* ── LUMBAR SPINE (5) ── */}
            {([...Array(5)].map((_, i) =>
              B({ name: `L${i + 1} Vertebra`, latinName: `Vertebra lumbalis ${i + 1}`, region: "vertebral-column", boneId: "typical-lumbar" },
                <>
                  <Rect x={84} y={358 + i * 13} width={32} height={10} rx={2} />
                  <Path d={`M100,${365 + i * 13} L100,${373 + i * 13}`} stroke={C.dark} strokeWidth={0.7} />
                </>
              )
            ))}

            {/* ── SACRUM ── */}
            {B({ name: "Sacrum", latinName: "Os sacrum", region: "vertebral-column", boneId: "sacrum" },
              <Path d="M84,423 C83,430 87,450 92,466 C94,472 100,475 100,475 C100,475 106,472 108,466 C113,450 117,430 116,423 Z" />
            )}

            {/* ── COCCYX ── */}
            {B({ name: "Coccyx", latinName: "Os coccygis", region: "vertebral-column", boneId: "sacrum" },
              <Path d="M96,475 C97,480 98,490 100,495 C102,490 103,480 104,475 Z" />
            )}

            {/* ── RIBS — 12 pairs, drawn as arcs using Path ── */}
            {([
              { w: 34, d: 6, y: 228 }, { w: 42, d: 8,  y: 239 }, { w: 50, d: 10, y: 250 },
              { w: 57, d: 12, y: 261 }, { w: 62, d: 14, y: 272 }, { w: 65, d: 16, y: 283 },
              { w: 66, d: 18, y: 294 }, { w: 65, d: 18, y: 305 }, { w: 62, d: 16, y: 316 },
              { w: 57, d: 14, y: 327 }, { w: 50, d: 12, y: 338 }, { w: 42, d: 10, y: 349 },
            ].map((rib, i) =>
              <G key={`rib${i}`}>
                {/* Left rib */}
                {B({ name: i < 2 ? "First Rib" : "Rib", latinName: `Costa ${i + 1}`, region: "thorax", boneId: i === 0 ? "first-rib" : "typical-rib" },
                  <Path d={`M92,${rib.y} C80,${rib.y} ${100 - rib.w},${rib.y + rib.d * 0.5} ${100 - rib.w + 4},${rib.y + rib.d} C${100 - rib.w + 10},${rib.y + rib.d + 2} 88,${rib.y + rib.d * 0.8} 92,${rib.y + 3}`}
                    fill="none" strokeWidth={i < 2 ? 2 : 1.8} />
                )}
                {/* Right rib */}
                {B({ name: i < 2 ? "First Rib" : "Rib", latinName: `Costa ${i + 1}`, region: "thorax", boneId: i === 0 ? "first-rib" : "typical-rib" },
                  <Path d={`M108,${rib.y} C120,${rib.y} ${100 + rib.w},${rib.y + rib.d * 0.5} ${100 + rib.w - 4},${rib.y + rib.d} C${100 + rib.w - 10},${rib.y + rib.d + 2} 112,${rib.y + rib.d * 0.8} 108,${rib.y + 3}`}
                    fill="none" strokeWidth={1.8} />
                )}
              </G>
            ))}

            {/* ── STERNUM ── */}
            {B({ name: "Sternum", latinName: "Sternum", region: "thorax", boneId: "sternum" },
              <>
                {/* Manubrium */}
                <Path d="M90,220 C90,216 92,212 100,210 C108,212 110,216 110,220 L110,240 L90,240 Z" />
                {/* Body */}
                <Rect x={91} y={240} width={18} height={110} rx={2} />
                {/* Xiphoid */}
                <Path d="M96,350 L100,365 L104,350 Z" />
              </>
            )}

            {/* ── CLAVICLES ── */}
            {B({ name: "Clavicle", latinName: "Clavicula", region: "upper-limb", boneId: "clavicle" },
              <Path d="M94,218 C84,215 70,217 58,221 C48,224 42,222 38,219" fill="none" strokeWidth={3.5} strokeLinecap="round" />
            )}
            {B({ name: "Clavicle", latinName: "Clavicula", region: "upper-limb", boneId: "clavicle" },
              <Path d="M106,218 C116,215 130,217 142,221 C152,224 158,222 162,219" fill="none" strokeWidth={3.5} strokeLinecap="round" />
            )}

            {/* ── SCAPULAE (triangular, behind ribs) ── */}
            {B({ name: "Scapula", latinName: "Scapula", region: "upper-limb", boneId: "scapula" },
              <Path d="M32,222 C28,232 24,280 30,310 C42,312 56,290 60,260 C64,234 60,220 52,218 Z" fill="none" strokeWidth={1.2} />
            )}
            {B({ name: "Scapula", latinName: "Scapula", region: "upper-limb", boneId: "scapula" },
              <Path d="M168,222 C172,232 176,280 170,310 C158,312 144,290 140,260 C136,234 140,220 148,218 Z" fill="none" strokeWidth={1.2} />
            )}

            {/* ── HUMERI ── */}
            {B({ name: "Humerus", latinName: "Humerus", region: "upper-limb", boneId: "humerus" },
              <Path d="
                M46,222 C40,218 34,219 32,226
                C30,234 34,242 40,246
                L34,340 C33,348 34,356 36,360
                C39,368 46,372 52,370
                C58,368 62,362 62,354
                L56,254 C62,250 66,242 64,234
                C62,226 54,218 46,222 Z
              " />
            )}
            {B({ name: "Humerus", latinName: "Humerus", region: "upper-limb", boneId: "humerus" },
              <Path d="
                M154,222 C160,218 166,219 168,226
                C170,234 166,242 160,246
                L166,340 C167,348 166,356 164,360
                C161,368 154,372 148,370
                C142,368 138,362 138,354
                L144,254 C138,250 134,242 136,234
                C138,226 146,218 154,222 Z
              " />
            )}

            {/* ── RADII ── */}
            {B({ name: "Radius", latinName: "Radius", region: "upper-limb", boneId: "radius" },
              <Path d="
                M44,374 C40,372 36,374 35,378
                L32,466 C32,472 35,476 40,477
                C45,478 49,474 50,468
                L52,380 C52,375 48,374 44,374 Z
              " />
            )}
            {B({ name: "Radius", latinName: "Radius", region: "upper-limb", boneId: "radius" },
              <Path d="
                M156,374 C160,372 164,374 165,378
                L168,466 C168,472 165,476 160,477
                C155,478 151,474 150,468
                L148,380 C148,375 152,374 156,374 Z
              " />
            )}

            {/* ── ULNAE ── */}
            {B({ name: "Ulna", latinName: "Ulna", region: "upper-limb", boneId: "ulna" },
              <Path d="
                M54,372 C50,368 46,367 46,372
                L44,380 C44,380 50,382 52,385
                L50,468 C50,474 52,478 55,479
                C58,480 62,476 62,470
                L62,380 C62,374 58,370 54,372 Z
              " />
            )}
            {B({ name: "Ulna", latinName: "Ulna", region: "upper-limb", boneId: "ulna" },
              <Path d="
                M146,372 C150,368 154,367 154,372
                L156,380 C156,380 150,382 148,385
                L150,468 C150,474 148,478 145,479
                C142,480 138,476 138,470
                L138,380 C138,374 142,370 146,372 Z
              " />
            )}

            {/* ── HANDS (simplified) ── */}
            {B({ name: "Hand Bones", latinName: "Ossa manus", region: "upper-limb", boneId: "radius" },
              <>
                {/* Carpals */}
                <Rect x={29} y={479} width={28} height={14} rx={4} />
                {/* Metacarpals (5) */}
                {[0, 1, 2, 3, 4].map(j => (
                  <Rect key={j} x={29 + j * 6} y={494} width={5} height={24} rx={2} />
                ))}
                {/* Phalanges (simplified) */}
                {[0, 1, 2, 3, 4].map(j => (
                  <Rect key={j} x={29 + j * 6} y={519} width={5} height={16} rx={2} />
                ))}
              </>
            )}
            {B({ name: "Hand Bones", latinName: "Ossa manus", region: "upper-limb", boneId: "radius" },
              <>
                <Rect x={143} y={479} width={28} height={14} rx={4} />
                {[0, 1, 2, 3, 4].map(j => (
                  <Rect key={j} x={143 + j * 6} y={494} width={5} height={24} rx={2} />
                ))}
                {[0, 1, 2, 3, 4].map(j => (
                  <Rect key={j} x={143 + j * 6} y={519} width={5} height={16} rx={2} />
                ))}
              </>
            )}

            {/* ── PELVIS ── */}
            {B({ name: "Pelvis", latinName: "Pelvis", region: "lower-limb", boneId: "hip-bone" },
              <>
                {/* Iliac blades (butterfly shape) */}
                <Path d="
                  M100,425 C100,425 92,420 80,418
                  C64,416 48,418 38,428
                  C28,438 28,452 36,460
                  C44,468 58,470 68,466
                  C78,462 86,456 90,450
                  C94,444 96,440 100,438
                  C104,440 106,444 110,450
                  C114,456 122,462 132,466
                  C142,470 156,468 164,460
                  C172,452 172,438 162,428
                  C152,418 136,416 120,418
                  C108,420 100,425 100,425 Z
                " />
                {/* Pubic symphysis */}
                <Path d="M86,462 C88,468 92,472 100,474 C108,472 112,468 114,462 L110,458 L100,460 L90,458 Z" />
                {/* Acetabula (hip sockets - cartilage) */}
                <Circle cx={68} cy={466} r={10} fill="url(#cart)" stroke={C.cart} />
                <Circle cx={132} cy={466} r={10} fill="url(#cart)" stroke={C.cart} />
              </>
            )}

            {/* ── FEMORA — the most iconic bone ── */}
            {B({ name: "Femur", latinName: "Femur", region: "lower-limb", boneId: "femur" },
              <Path d="
                M66,468 C58,460 54,462 54,470
                C54,478 60,484 66,484
                L58,574 C57,584 58,594 62,600
                C66,608 74,612 80,610
                C86,608 90,602 90,594
                L84,504 C90,498 94,490 92,482
                C90,474 82,466 74,466
                C72,466 68,467 66,468 Z
              " />
            )}
            {/* Femoral head bump (medial) - left */}
            {B({ name: "Femur", latinName: "Femur", region: "lower-limb", boneId: "femur" },
              <Circle cx={60} cy={475} r={10} />
            )}
            {B({ name: "Femur", latinName: "Femur", region: "lower-limb", boneId: "femur" },
              <Path d="
                M134,468 C142,460 146,462 146,470
                C146,478 140,484 134,484
                L142,574 C143,584 142,594 138,600
                C134,608 126,612 120,610
                C114,608 110,602 110,594
                L116,504 C110,498 106,490 108,482
                C110,474 118,466 126,466
                C128,466 132,467 134,468 Z
              " />
            )}
            {/* Right femoral head */}
            {B({ name: "Femur", latinName: "Femur", region: "lower-limb", boneId: "femur" },
              <Circle cx={140} cy={475} r={10} />
            )}

            {/* ── PATELLAE ── */}
            {B({ name: "Patella", latinName: "Patella", region: "lower-limb", boneId: "patella" },
              <Ellipse cx={72} cy={606} rx={10} ry={8} />
            )}
            {B({ name: "Patella", latinName: "Patella", region: "lower-limb", boneId: "patella" },
              <Ellipse cx={128} cy={606} rx={10} ry={8} />
            )}

            {/* ── TIBIAE ── */}
            {B({ name: "Tibia", latinName: "Tibia", region: "lower-limb", boneId: "tibia" },
              <Path d="
                M62,614 C55,612 50,618 50,626
                L50,700 C50,708 54,714 60,715
                C66,716 72,710 72,704
                L72,628 C76,624 76,616 72,614
                C69,613 65,613 62,614 Z
              " />
            )}
            {/* Tibial plateau */}
            {B({ name: "Tibia", latinName: "Tibia", region: "lower-limb", boneId: "tibia" },
              <Path d="M50,626 C52,618 58,614 72,614 C74,622 74,628 72,628 L50,628 Z" />
            )}
            {B({ name: "Tibia", latinName: "Tibia", region: "lower-limb", boneId: "tibia" },
              <Path d="
                M138,614 C145,612 150,618 150,626
                L150,700 C150,708 146,714 140,715
                C134,716 128,710 128,704
                L128,628 C124,624 124,616 128,614
                C131,613 135,613 138,614 Z
              " />
            )}
            {B({ name: "Tibia", latinName: "Tibia", region: "lower-limb", boneId: "tibia" },
              <Path d="M150,626 C148,618 142,614 128,614 C126,622 126,628 128,628 L150,628 Z" />
            )}

            {/* ── FIBULAE ── */}
            {B({ name: "Fibula", latinName: "Fibula", region: "lower-limb", boneId: "fibula" },
              <Path d="M78,622 C76,620 74,622 74,628 L74,700 C74,706 76,710 80,710 C84,710 86,706 86,700 L86,628 C86,622 82,620 78,622 Z" />
            )}
            {B({ name: "Fibula", latinName: "Fibula", region: "lower-limb", boneId: "fibula" },
              <Path d="M122,622 C124,620 126,622 126,628 L126,700 C126,706 124,710 120,710 C116,710 114,706 114,700 L114,628 C114,622 118,620 122,622 Z" />
            )}

            {/* ── FEET ── */}
            {B({ name: "Foot Bones", latinName: "Ossa pedis", region: "lower-limb", boneId: "tibia" },
              <>
                {/* Calcaneus */}
                <Rect x={46} y={716} width={28} height={12} rx={5} />
                {/* Talus */}
                <Rect x={50} y={704} width={22} height={12} rx={3} />
                {/* Metatarsals (5) */}
                {[0, 1, 2, 3, 4].map(j => (
                  <Path key={j} d={`M${48 + j * 5},715 L${46 + j * 5},700`} strokeWidth={2.5} strokeLinecap="round" />
                ))}
              </>
            )}
            {B({ name: "Foot Bones", latinName: "Ossa pedis", region: "lower-limb", boneId: "tibia" },
              <>
                <Rect x={126} y={716} width={28} height={12} rx={5} />
                <Rect x={128} y={704} width={22} height={12} rx={3} />
                {[0, 1, 2, 3, 4].map(j => (
                  <Path key={j} d={`M${152 - j * 5},715 L${154 - j * 5},700`} strokeWidth={2.5} strokeLinecap="round" />
                ))}
              </>
            )}

          </Svg>
        </Animated.View>
      </View>
    );
  },
);

export default SkeletonViewer;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1e1e2e" },
});
