import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { StyleSheet, View } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";

export interface BoneViewer3DRef {
  setMarkers: (show: boolean) => void;
  resetView: () => void;
}

interface Props {
  boneId: string;
  showMarkers?: boolean;
  onMarkerTap?: (label: string) => void;
}

function buildHtml(boneId: string, showMarkers: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#111827;overflow:hidden;touch-action:none}
canvas{display:block;width:100vw;height:100vh}
#labels{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none}
.lbl{position:absolute;display:flex;align-items:center;gap:5px;
  background:rgba(8,12,30,0.88);color:#c8d8ff;
  padding:4px 9px;border-radius:12px;font-size:10px;
  font-family:-apple-system,sans-serif;white-space:nowrap;
  border:1px solid rgba(99,102,241,0.45);transform:translate(-50%,-110%)}
.lbl .n{background:#6366f1;color:#fff;border-radius:50%;
  width:16px;height:16px;display:flex;align-items:center;justify-content:center;
  font-size:9px;font-weight:700;flex-shrink:0}
#loading{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
  flex-direction:column;gap:12px;background:#111827;color:#818cf8;
  font-family:-apple-system,sans-serif;font-size:14px}
.spin{width:36px;height:36px;border:3px solid #1e293b;border-top-color:#6366f1;
  border-radius:50%;animation:s 0.8s linear infinite}
@keyframes s{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div id="loading"><div class="spin"></div>Loading 3D bone…</div>
<canvas id="c" style="display:none"></canvas>
<div id="labels"></div>
<script src="https://unpkg.com/three@0.158.0/build/three.min.js"
  onload="init()" onerror="document.getElementById('loading').innerHTML='<span style=color:#ef4444>Could not load 3D viewer — check internet</span>'">
</script>
<script>
const BONE_ID = '${boneId}';
let showMarkers = ${showMarkers ? "true" : "false"};

// ── BONE_DEFS (marker positions) ─────────────────────────────────────────────
const BONE_DEFS = {
  'humerus':{ camZ:11, markers:[
    [0,3.2,0.9,'Head',1],
    [1.05,2.6,0.5,'Greater Tubercle',2],
    [-0.78,2.3,0.55,'Lesser Tubercle',3],
    [0,2.6,0,'Anatomical Neck',4],
    [0,2.1,0,'Surgical Neck',5],
    [0.6,0.3,0.6,'Deltoid Tuberosity',6],
    [0.4,0.0,-0.82,'Radial Groove',7],
    [1.3,-2.92,0.1,'Lateral Epicondyle',8],
    [-1.3,-2.92,0.1,'Medial Epicondyle',9],
    [0.58,-2.62,0.9,'Capitulum',10],
    [-0.42,-2.6,0.9,'Trochlea',11],
    [0,-2.1,-0.85,'Olecranon Fossa',12],
  ]},
  'femur':{ camZ:14, markers:[
    [-2.0,4.65,0,'Head',1],[-1.0,3.95,0,'Neck',2],
    [0.85,3.2,0,'Greater Trochanter',3],[-0.62,2.6,-0.45,'Lesser Trochanter',4],
    [0,0,-0.8,'Linea Aspera',5],[0.8,-3.75,0.3,'Lateral Condyle',6],
    [-0.8,-3.85,0.3,'Medial Condyle',7],[0,-3.2,0.95,'Patellar Surface',8],
    [0,-3.0,-0.72,'Intercondylar Fossa',9],
  ]},
  'skull':{ camZ:9, markers:[
    [0,2.2,0,'Parietal Bone',1],[0,0.85,2.1,'Frontal Bone',2],
    [0,-0.5,-2.2,'Occipital Bone',3],[2.2,0,0,'Temporal Bone',4],
    [0,0.28,2.15,'Orbital Margin',5],[0,-0.42,2.28,'Nasal Aperture',6],
    [2.05,-0.4,0.85,'Zygomatic Arch',7],[0,-2.2,0.55,'Mandible',8],
  ]},
  'tibia':{ camZ:12, markers:[
    [0,3.05,0,'Medial Condyle',1],[0.8,3.05,0,'Lateral Condyle',2],
    [0.22,2.35,0.72,'Tibial Tuberosity',3],[0.42,0.15,0.42,'Anterior Border (Shin)',4],
    [-0.52,-3.15,0.1,'Medial Malleolus',5],[0,-3.2,0,'Inferior Articular Surface',6],
  ]},
  'radius':{ camZ:10, markers:[
    [0,2.3,0,'Head',1],[0,1.8,0,'Neck',2],[-0.32,1.6,0.25,'Radial Tuberosity',3],
    [0,0,0,'Interosseous Border',4],[0.55,-2.5,0,'Styloid Process',5],
  ]},
  'ulna':{ camZ:10, markers:[
    [0,2.6,-0.5,'Olecranon',1],[0,2.05,0.55,'Coronoid Process',2],
    [0,2.3,0.1,'Trochlear Notch',3],[0,0,0,'Interosseous Border',4],
    [-0.22,-2.55,0,'Styloid Process',5],
  ]},
  'scapula':{ camZ:10, markers:[
    [1.8,0.5,0.4,'Glenoid Cavity',1],[1.2,1.7,0.55,'Acromion',2],
    [0.5,2.6,0.7,'Coracoid Process',3],[-0.2,0.5,0.45,'Spine of Scapula',4],
    [-1.5,-1.0,0,'Subscapular Fossa',5],[0,-1.5,0,'Infraspinous Fossa',6],
  ]},
  'sacrum':{ camZ:9, markers:[
    [0,3.0,0,'Base',1],[0,2.6,0.3,'Sacral Promontory',2],
    [0.9,1.5,0.32,'Anterior Sacral Foramina',3],[0,0,-0.28,'Sacral Canal',4],
    [0,-2.2,0,'Apex',5],[1.5,0.5,-0.1,'Auricular Surface',6],
  ]},
  'clavicle':{ camZ:8, markers:[
    [-2.0,0,0,'Sternal End',1],[2.0,0,0,'Acromial End',2],
    [0.2,0.1,0.2,'Conoid Tubercle',3],[0,-0.1,0,'Subclavian Groove',4],
  ]},
  'hip-bone':{ camZ:12, markers:[
    [-0.3,3.2,0,'Iliac Crest',1],[-1.5,3.0,0,'ASIS',2],
    [0.5,-0.8,1.0,'Acetabulum',3],[0.2,-2.6,-0.3,'Ischial Tuberosity',4],
    [-0.8,-2.0,0.8,'Pubic Tubercle',5],[0.2,-1.8,0.6,'Obturator Foramen',6],
  ]},
  'patella':{ camZ:6, markers:[
    [0,1.1,0,'Base',1],[0,-0.9,0,'Apex',2],[0,0,0.6,'Articular Surface',3],
  ]},
  'fibula':{ camZ:12, markers:[
    [0,3.0,0,'Head',1],[0,2.5,0,'Neck',2],[0,0,-0.2,'Interosseous Border',3],
    [0.15,-3.05,0,'Lateral Malleolus',4],
  ]},
  'sternum':{ camZ:9, markers:[
    [0,2.5,0,'Manubrium',1],[0,1.75,0,'Sternal Angle (of Louis)',2],
    [0,0.2,0,'Body (Gladiolus)',3],[0,-1.85,0,'Xiphoid Process',4],
    [0.6,2.5,0,'Clavicular Notch',5],[0.5,1.9,0,'2nd Costal Notch',6],
  ]},
  'typical-rib':{ camZ:9, markers:[
    [-3.2,0,0,'Head',1],[-2.6,0.6,0.4,'Tubercle',2],
    [-2.0,0.4,0.3,'Neck',3],[0,1.2,0.7,'Shaft (Body)',4],
    [-2.5,0.4,0.2,'Angle',5],[3.15,-0.5,-0.4,'Costal Cartilage',6],
  ]},
  'atlas':{ camZ:7, markers:[
    [0,0,0.95,'Anterior Arch',1],[0,0,-0.98,'Posterior Arch',2],
    [1.2,0,0,'Lateral Mass',3],[1.85,0,0,'Transverse Process (R)',4],
    [1.1,0.22,0.1,'Superior Articular Facet',5],
  ]},
  'axis':{ camZ:7, markers:[
    [0,2.0,0,'Apex of Dens',1],[0,1.2,0,'Dens (Odontoid Process)',2],
    [0.7,0.55,0.05,'Superior Articular Facet',3],[0,-0.1,-1.6,'Spinous Process (Bifid)',4],
  ]},
  'mandible':{ camZ:9, markers:[
    [1.9,2.2,-0.6,'Condylar Process',1],[1.5,2.0,-0.5,'Coronoid Process',2],
    [0,-0.2,1.5,'Mental Protuberance',3],[1.4,-0.1,-0.1,'Mental Foramen',4],
    [0,-0.6,-0.6,'Mylohyoid Line',5],
  ]},
  'typical-cervical':{ camZ:7, markers:[
    [0,0,0,'Body',1],[0,0,-0.9,'Vertebral Canal',2],
    [0.9,0,-0.3,'Transverse Process',3],[0,0,-1.5,'Spinous Process (Bifid)',4],
  ]},
  'typical-thoracic':{ camZ:7, markers:[
    [0,0,0,'Body',1],[0.75,0,0,'Costal Demi-facet',2],
    [0.9,0,-0.35,'Transverse Process (costal facet)',3],[0,0,-1.5,'Spinous Process',4],
  ]},
  'typical-lumbar':{ camZ:7, markers:[
    [0,0,0,'Body',1],[0.65,0,0,'Pedicle',2],
    [1.0,0,-0.35,'Transverse Process',3],[0,0,-1.4,'Spinous Process',4],
    [0.5,0.2,-0.6,'Superior Articular Facet',5],
  ]},
  'first-rib':{ camZ:8, markers:[
    [-1.8,0,0,'Head',1],[0.2,0.8,1.0,'Scalene Tubercle',2],
    [-0.3,0.4,0.9,'Groove for Subclavian Vein',3],[0.5,0.6,0.9,'Groove for Subclavian Artery',4],
  ]},
};
// skull bones share skull geometry
['frontal','temporal','occipital','sphenoid'].forEach(k => {
  BONE_DEFS[k] = BONE_DEFS['skull'];
});

function init() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('c').style.display = 'block';

  const W = window.innerWidth, H = window.innerHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111827);
  scene.fog = new THREE.FogExp2(0x111827, 0.028);

  const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
  const def = BONE_DEFS[BONE_ID];
  camera.position.z = def ? def.camZ : 12;

  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  // Lights
  scene.add(new THREE.AmbientLight(0x303450, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.3);
  sun.position.set(5, 8, 6);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x3d60dd, 0.5);
  rim.position.set(-6, -2, -4);
  scene.add(rim);
  scene.add(Object.assign(new THREE.DirectionalLight(0xfff8e8, 0.25), {position: {x:0,y:-5,z:4,set(){},clone(){return this}}}));

  // Materials
  const BM = new THREE.MeshPhongMaterial({ color:0xd4b896, shininess:22, specular:0x2a1a0a });
  const CM = new THREE.MeshPhongMaterial({ color:0x96b4d4, shininess:80, specular:0x4060a0, transparent:true, opacity:0.92 });
  const DM = new THREE.MeshBasicMaterial({ color:0x060810 });

  // Helpers
  const Me = (g, m) => new THREE.Mesh(g, m);
  const Sp = (r, s=24) => new THREE.SphereGeometry(r, s, Math.round(s*0.65));
  const Cy = (rt, rb, h, s=20) => new THREE.CylinderGeometry(rt, rb, h, s);
  const Bx = (x, y, z) => new THREE.BoxGeometry(x, y, z);

  function longBone(p) {
    const g = new THREE.Group();
    g.add(Me(Cy(p.st, p.sb, p.L, 24), BM));
    if (p.hR) {
      const h = Me(Sp(p.hR, 28), CM);
      h.position.y = p.L/2 + p.hR*0.55;
      h.scale.set(p.hx||1, p.hy||1, p.hz||1);
      g.add(h);
      if (p.cR) {
        const c = Me(Cy(p.cR, p.st, p.ch||0.4, 20), BM);
        c.position.y = p.L/2 - (p.ch||0.4)/2 + 0.1;
        g.add(c);
      }
    }
    if (p.dR) {
      const d = Me(Sp(p.dR, 24), CM);
      d.position.y = -p.L/2;
      d.scale.set(p.dx||1, p.dy||0.45, p.dz||1);
      g.add(d);
      const dc = Me(Cy(p.sb, p.sb, p.ch||0.4, 20), BM);
      dc.position.y = -p.L/2 + (p.ch||0.4)/2;
      g.add(dc);
    }
    return g;
  }

  function makeVertebra(L, st, spType) {
    const g = new THREE.Group();
    g.add(Me(Cy(st, st*0.92, L, 20), BM));
    [-1,1].forEach(s => {
      const ped = Me(Cy(0.25, 0.22, 0.6, 10), BM);
      ped.position.set(s*st*0.9, 0, -0.4); ped.rotation.x = Math.PI/2;
      g.add(ped);
      const lam = Me(Bx(0.22, L*0.6, 0.72), BM);
      lam.position.set(s*0.3, 0, -0.9); g.add(lam);
      const tp = Me(Cy(0.14, 0.1, 0.85, 8), BM);
      tp.position.set(s*(st+0.45), 0, -0.3); tp.rotation.z = Math.PI/2;
      g.add(tp);
      const saf = Me(Sp(0.24, 10), CM);
      saf.position.set(s*0.42, L/2+0.1, -0.62); saf.scale.set(0.6, 0.25, 0.82);
      g.add(saf);
    });
    const spH = spType==='long'?1.3 : spType==='broad'?0.9:0.65;
    const spW = spType==='broad'?0.95:0.42;
    const sp = Me(Bx(spW, 0.3, spH), BM);
    sp.position.set(0, 0, -1.0 - spH/2); g.add(sp);
    if (spType==='bifid') {
      [-0.2,0.2].forEach(x => {
        const tip = Me(Sp(0.12, 8), BM); tip.position.set(x, 0, -1.0-spH-0.1); g.add(tip);
      });
    }
    [L/2,-L/2].forEach(y => { const ep = Me(Cy(st, st, 0.12, 20), CM); ep.position.y = y; g.add(ep); });
    return g;
  }

  // ── Per-bone geometry ───────────────────────────────────────────────────────
  const BONES = {
    'humerus': () => {
      const g = longBone({ L:5.8, st:0.52, sb:0.44, hR:1.25, hy:1.0, hx:0.95, hz:0.9, cR:0.82, ch:0.55, dR:1.05, dx:1.55, dy:0.45, dz:1.1 });
      [[1.05,2.55,0.3,0.7,0.85,0.8],[- 0.78,2.3,0.55,0.75,0.7,0.8]].forEach(([x,y,z,sx,sy,sz]) => {
        const t = Me(Sp(x>0?0.52:0.36,14), BM); t.position.set(x,y,z); t.scale.set(sx,sy,sz); g.add(t);
      });
      const dt = Me(Sp(0.22,10), BM); dt.position.set(0.58,0.3,0.38); dt.scale.set(1,1.9,0.7); g.add(dt);
      const me2 = Me(Sp(0.45,12), BM); me2.position.set(-1.3,-2.92,0.1); me2.scale.set(0.62,0.55,0.7); g.add(me2);
      const le = Me(Sp(0.4,12), BM); le.position.set(1.3,-2.92,0.1); le.scale.set(0.62,0.55,0.7); g.add(le);
      const cap = Me(Sp(0.42,14), CM); cap.position.set(0.58,-2.62,0.82); g.add(cap);
      const troc = Me(Sp(0.5,14), CM); troc.position.set(-0.42,-2.6,0.82); troc.scale.set(0.75,0.82,0.9); g.add(troc);
      return g;
    },
    'radius': () => {
      const g = longBone({ L:4.5, st:0.36, sb:0.28, hR:0.42, hy:0.35, hx:1.08, hz:1.08, cR:0.5, ch:0.3, dR:0.7, dx:1.2, dy:0.4, dz:0.85 });
      const rt = Me(Sp(0.22,10), BM); rt.position.set(-0.32,1.6,0.25); rt.scale.set(0.65,1.3,0.7); g.add(rt);
      const sp = Me(Cy(0.1,0.05,0.4,8), BM); sp.position.set(0.55,-2.5,0); sp.rotation.z=-0.3; g.add(sp);
      return g;
    },
    'ulna': () => {
      const g = longBone({ L:4.8, st:0.34, sb:0.25, hR:0, cR:0, dR:0.42, dx:0.85, dy:0.58, dz:0.8 });
      const olec = Me(Sp(0.52,16), BM); olec.position.set(0,2.6,-0.5); olec.scale.set(0.75,0.9,0.9); g.add(olec);
      const cor = Me(Sp(0.35,12), BM); cor.position.set(0,2.05,0.55); cor.scale.set(0.7,0.7,0.65); g.add(cor);
      const tn = Me(new THREE.TorusGeometry(0.38,0.12,8,20,Math.PI*0.9), CM); tn.position.set(0,2.3,0.1); tn.rotation.x=Math.PI*0.15; g.add(tn);
      const sp2 = Me(Cy(0.09,0.05,0.35,8), BM); sp2.position.set(-0.22,-2.55,0); g.add(sp2);
      return g;
    },
    'femur': () => {
      const g = longBone({ L:7.5, st:0.65, sb:0.58, hR:0, cR:0, dR:1.38, dx:1.7, dy:0.48, dz:1.25 });
      const neck = Me(Cy(0.45,0.58,1.7,18), BM); neck.position.set(-1.0,3.95,0); neck.rotation.z=-0.55; g.add(neck);
      const fhead = Me(Sp(1.4,28), CM); fhead.position.set(-2.0,4.65,0); g.add(fhead);
      const gt = Me(Sp(0.75,16), BM); gt.position.set(0.85,3.2,0); gt.scale.set(0.82,1.1,0.75); g.add(gt);
      const lts = Me(Sp(0.45,12), BM); lts.position.set(-0.62,2.6,-0.45); g.add(lts);
      const mc = Me(Sp(0.72,14), CM); mc.position.set(-0.8,-3.85,0.3); mc.scale.set(0.8,0.9,1.0); g.add(mc);
      const lc = Me(Sp(0.72,14), CM); lc.position.set(0.8,-3.75,0.3); g.add(lc);
      return g;
    },
    'tibia': () => {
      const g = longBone({ L:6.0, st:0.5, sb:0.36, hR:0, cR:0, dR:0.68, dx:1.1, dy:0.5, dz:0.82 });
      const prox = Me(Sp(1.38,24), CM); prox.position.y=3.05; prox.scale.set(1.18,0.3,1.05); g.add(prox);
      const pm = Me(Cy(1.05,0.5,0.7,22), BM); pm.position.y=2.65; g.add(pm);
      const tt = Me(Sp(0.3,12), BM); tt.position.set(0.22,2.35,0.7); tt.scale.set(0.8,1.3,0.65); g.add(tt);
      const mm = Me(Sp(0.38,12), BM); mm.position.set(-0.52,-3.15,0.1); mm.scale.set(0.68,1.1,0.72); g.add(mm);
      return g;
    },
    'fibula': () => {
      const g = longBone({ L:5.8, st:0.24, sb:0.18, hR:0.35, hy:0.72, hx:0.8, hz:0.8, cR:0.28, ch:0.22, dR:0.45, dx:1.05, dy:0.55, dz:0.78 });
      const lm = Me(Sp(0.38,12), BM); lm.position.set(0.15,-3.05,0); lm.scale.set(0.72,1.1,0.82); g.add(lm);
      return g;
    },
    'clavicle': () => {
      const g = new THREE.Group();
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.0,0,0), new THREE.Vector3(-0.8,0.1,0.2),
        new THREE.Vector3(0.2,0,0), new THREE.Vector3(1.2,-0.15,-0.1), new THREE.Vector3(2.0,0,0),
      ]);
      g.add(Me(new THREE.TubeGeometry(curve, 32, 0.28, 12, false), BM));
      const se = Me(Sp(0.38,12), CM); se.position.set(-2.0,0,0); g.add(se);
      const ae = Me(Sp(0.3,10), BM); ae.position.set(2.0,0,0); ae.scale.set(0.7,0.45,1.1); g.add(ae);
      return g;
    },
    'patella': () => {
      const g = new THREE.Group();
      const pGeo = Sp(0.9,20);
      const pp = pGeo.attributes.position;
      for (let i=0;i<pp.count;i++) {
        if(pp.getZ(i)>0) pp.setZ(i,pp.getZ(i)*0.45);
        if(pp.getY(i)<-0.5) pp.setY(i,pp.getY(i)*0.6);
      }
      pGeo.computeVertexNormals();
      g.add(Me(pGeo, BM));
      const art = Me(Sp(0.82,18), CM); art.position.z=0.3; art.scale.set(0.95,1.2,0.3); g.add(art);
      return g;
    },
    'sternum': () => {
      const g = new THREE.Group();
      g.add(Object.assign(Me(Bx(1.4,1.2,0.42),BM), {position:{y:2.5,set(){},x:0,z:0}}));
      const man = Me(Bx(1.4,1.2,0.42), BM); man.position.y=2.5; g.add(man);
      const body = Me(Bx(0.9,3.5,0.38), BM); body.position.y=0.2; g.add(body);
      const angle = Me(Bx(1.15,0.22,0.52), BM); angle.position.y=1.7; g.add(angle);
      const xiph = Me(Cy(0.25,0.08,0.9,8), BM); xiph.position.y=-1.85; g.add(xiph);
      [-1,1].forEach(s => {
        [0.5,-0.2,-0.9,-1.6].forEach(y => {
          const n = Me(Bx(0.18,0.15,0.52),BM); n.position.set(s*0.52,y,0.15); g.add(n);
        });
      });
      return g;
    },
    'typical-rib': () => {
      const g = new THREE.Group();
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-3.2,0,0), new THREE.Vector3(-1.5,0.8,0.5),
        new THREE.Vector3(0,1.4,0.8), new THREE.Vector3(1.5,1.0,0.3),
        new THREE.Vector3(2.8,0,0), new THREE.Vector3(3.0,-0.4,-0.3),
      ]);
      g.add(Me(new THREE.TubeGeometry(curve,36,0.22,10,false), BM));
      const h = Me(Sp(0.32,12), BM); h.position.set(-3.2,0,0); g.add(h);
      const tb = Me(Sp(0.25,10), BM); tb.position.set(-2.6,0.6,0.4); g.add(tb);
      const cart = Me(Cy(0.18,0.15,0.6,10), new THREE.MeshPhongMaterial({color:0xc0d8c8,shininess:40,transparent:true,opacity:0.9}));
      cart.position.set(3.15,-0.5,-0.4); cart.rotation.z=0.4; g.add(cart);
      return g;
    },
    'first-rib': () => {
      const g = new THREE.Group();
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.8,0,0), new THREE.Vector3(-0.5,0.4,0.8),
        new THREE.Vector3(0.5,0.7,1.0), new THREE.Vector3(1.5,0.4,0.6), new THREE.Vector3(2.0,0,0),
      ]);
      g.add(Me(new THREE.TubeGeometry(curve,24,0.3,10,false), BM));
      const st2 = Me(Sp(0.2,10), BM); st2.position.set(0.2,0.8,1.0); g.add(st2);
      const h = Me(Sp(0.3,10), BM); h.position.set(-1.8,0,0); g.add(h);
      return g;
    },
    'scapula': () => {
      const g = new THREE.Group();
      const shape = new THREE.Shape();
      shape.moveTo(-0.5,3.0); shape.lineTo(-2.5,-2.5); shape.lineTo(2.0,-2.5);
      shape.lineTo(2.0,0.5); shape.lineTo(0.8,1.2); shape.closePath();
      g.add(Me(new THREE.ExtrudeGeometry(shape,{depth:0.22,bevelEnabled:false}), BM));
      const spine = Me(Cy(0.22,0.12,3.2,12), BM); spine.position.set(-0.2,0.5,0.3); spine.rotation.z=0.5; g.add(spine);
      const acrom = Me(Bx(1.0,0.35,0.38), BM); acrom.position.set(1.2,1.7,0.35); acrom.rotation.z=-0.35; g.add(acrom);
      const cor = Me(Cy(0.18,0.12,1.0,8), BM); cor.position.set(0.5,2.6,0.5); cor.rotation.x=0.6; g.add(cor);
      const glen = Me(Sp(0.65,14), CM); glen.position.set(1.8,0.5,0.3); glen.scale.set(0.55,0.85,0.5); g.add(glen);
      const gt = Me(new THREE.TorusGeometry(0.6,0.09,8,20), BM); gt.position.set(1.8,0.5,0.28); gt.scale.set(0.55,0.85,0.35); g.add(gt);
      return g;
    },
    'hip-bone': () => {
      const g = new THREE.Group();
      const blade = Me(Sp(2.8,32), BM); blade.scale.set(0.85,1.0,0.25); blade.position.set(-0.3,1.8,0); g.add(blade);
      const crest = Me(new THREE.TorusGeometry(2.3,0.2,10,28,Math.PI*0.85), BM); crest.position.set(-0.3,2.8,0); crest.rotation.z=0.1; g.add(crest);
      const acet = Me(Sp(1.1,20), CM); acet.position.set(0.5,-0.8,1.0); acet.scale.set(0.55,0.55,0.45); g.add(acet);
      const aRim = Me(new THREE.TorusGeometry(0.88,0.18,10,24), BM); aRim.position.set(0.5,-0.8,0.9); aRim.rotation.x=Math.PI*0.08; g.add(aRim);
      const it = Me(Sp(0.65,16), BM); it.position.set(0.2,-2.6,-0.3); it.scale.set(1.0,0.8,0.85); g.add(it);
      const pub = Me(Sp(0.55,14), BM); pub.position.set(-0.8,-2.0,0.8); pub.scale.set(0.7,0.65,0.8); g.add(pub);
      const obf = Me(Sp(0.7,14), DM); obf.position.set(0.2,-1.8,0.6); obf.scale.set(0.9,1.2,0.35); g.add(obf);
      return g;
    },
    'sacrum': () => {
      const g = new THREE.Group();
      const shape = new THREE.Shape();
      shape.moveTo(0,3); shape.lineTo(-2.0,0.5); shape.lineTo(-1.5,-2.0);
      shape.lineTo(0,-2.5); shape.lineTo(1.5,-2.0); shape.lineTo(2.0,0.5); shape.closePath();
      g.add(Me(new THREE.ExtrudeGeometry(shape,{depth:0.55,bevelEnabled:true,bevelSize:0.1,bevelThickness:0.1,bevelSegments:2}), BM));
      [-1,1].forEach(s => {
        [1.5,0.5,-0.5,-1.3].forEach(y => {
          const f = Me(Sp(0.18,8), DM); f.position.set(s*0.9,y,0.32); f.scale.set(1,1,0.3); g.add(f);
        });
      });
      for(let i=0;i<4;i++){const k=Me(Sp(0.15,8),BM);k.position.set(0,1.5-i*0.8,0.35);g.add(k);}
      return g;
    },
    'atlas': () => {
      const g = new THREE.Group();
      g.add(Me(new THREE.TorusGeometry(1.1,0.35,14,30), BM));
      [-1,1].forEach(s => {
        const mass = Me(Sp(0.5,14), BM); mass.position.set(s*1.2,0,0); mass.scale.set(0.6,0.4,0.8); g.add(mass);
        const tp = Me(Cy(0.2,0.15,0.8,10), BM); tp.position.set(s*1.8,0,0); tp.rotation.z=Math.PI/2; g.add(tp);
        const saf = Me(Sp(0.38,12), CM); saf.position.set(s*1.1,0.22,0.1); saf.scale.set(0.6,0.28,0.9); g.add(saf);
      });
      const aa = Me(Cy(0.2,0.2,0.6,12), BM); aa.position.set(0,0,0.95); aa.rotation.x=Math.PI/2; g.add(aa);
      const pa = Me(Cy(0.2,0.2,0.8,12), BM); pa.position.set(0,0,-0.98); pa.rotation.x=Math.PI/2; g.add(pa);
      return g;
    },
    'axis': () => {
      const g = new THREE.Group();
      g.add(Me(Cy(0.7,0.7,1.0,18), BM));
      const dens = Me(Cy(0.32,0.25,1.5,12), BM); dens.position.y=1.2; g.add(dens);
      const dTip = Me(Sp(0.28,10), BM); dTip.position.y=2.0; g.add(dTip);
      const af = Me(Sp(0.3,10), CM); af.position.set(0,1.0,0.32); af.scale.set(0.8,0.3,0.4); g.add(af);
      const spProc = Me(Bx(0.8,0.4,1.2), BM); spProc.position.set(0,-0.1,-0.9); g.add(spProc);
      [-0.3,0.3].forEach(x => {const tip=Me(Sp(0.18,8),BM);tip.position.set(x,-0.1,-1.55);g.add(tip);});
      [-1,1].forEach(s=>{const tp=Me(Cy(0.18,0.15,0.8,10),BM);tp.position.set(s*0.95,0,0);tp.rotation.z=Math.PI/2;g.add(tp);
        const saf=Me(Sp(0.38,12),CM);saf.position.set(s*0.7,0.55,0.05);saf.scale.set(0.7,0.28,0.85);g.add(saf);});
      return g;
    },
    'skull': () => makeSkull(),
    'mandible': () => {
      const g = new THREE.Group();
      const curve = new THREE.CatmullRomCurve3(
        Array.from({length:9},(_,i)=>{const a=(i/8)*Math.PI;return new THREE.Vector3(Math.cos(a)*2.2,0,Math.sin(a)*1.4);})
      );
      g.add(Me(new THREE.TubeGeometry(curve,28,0.32,12,false), BM));
      [-1,1].forEach(s=>{
        const ram=Me(Bx(0.85,2.2,0.3),BM);ram.position.set(s*1.9,1.0,-0.6);ram.rotation.z=s*0.12;g.add(ram);
        const cond=Me(Sp(0.38,12),CM);cond.position.set(s*1.9,2.2,-0.6);cond.scale.set(0.6,0.45,0.9);g.add(cond);
        const cor=Me(Cy(0.18,0.05,0.8,8),BM);cor.position.set(s*1.5,2.0,-0.5);cor.rotation.z=s*0.3;g.add(cor);
      });
      const chin=Me(Sp(0.35,12),BM);chin.position.set(0,-0.2,1.5);chin.scale.set(0.9,0.6,0.55);g.add(chin);
      return g;
    },
  };

  function makeSkull() {
    const g = new THREE.Group();
    const cGeo = Sp(2.2, 44);
    const pp = cGeo.attributes.position;
    for (let i=0;i<pp.count;i++) {
      const y=pp.getY(i), z=pp.getZ(i);
      if(y<-0.6){const t=(-y-0.6)/1.5;pp.setY(i,y*(1-0.38*t));pp.setX(i,pp.getX(i)*(1+0.08*t));}
      if(z<-1.2) pp.setZ(i,z*0.75);
      if(y>1.0){const t=(y-1.0)/1.2;pp.setX(i,pp.getX(i)*(1-0.12*t));pp.setZ(i,pp.getZ(i)*(1-0.08*t));}
    }
    cGeo.computeVertexNormals();
    g.add(Me(cGeo, BM));
    const front=Me(Sp(1.1,20),BM);front.position.set(0,0.85,1.9);front.scale.set(1.55,0.62,0.48);g.add(front);
    [-1,1].forEach(s=>{
      const arch=Me(new THREE.TorusGeometry(0.85,0.13,8,18,Math.PI*0.65),BM);
      arch.position.set(s*2.0,-0.4,0.7);arch.rotation.x=0.32;arch.rotation.y=s*0.28;g.add(arch);
    });
    [-0.72,0.72].forEach(x=>{
      const orb=Me(new THREE.TorusGeometry(0.62,0.09,8,18,Math.PI*1.1),BM);orb.position.set(x,0.25,2.08);orb.rotation.x=0.12;g.add(orb);
      const fill=Me(new THREE.CircleGeometry(0.5,16),DM);fill.position.set(x,0.28,2.1);g.add(fill);
    });
    const nasal=Me(Bx(0.52,0.62,0.3),DM);nasal.position.set(0,-0.42,2.28);g.add(nasal);
    const jCurve=new THREE.CatmullRomCurve3(Array.from({length:9},(_,i)=>{const a=(i/8)*Math.PI;return new THREE.Vector3(Math.cos(a)*1.62,0,Math.sin(a)*0.95);}));
    const jaw=Me(new THREE.TubeGeometry(jCurve,24,0.17,10,false),BM);jaw.position.set(0,-2.2,-0.15);jaw.rotation.x=0.22;g.add(jaw);
    const jf=Me(Bx(2.8,0.3,1.1),BM);jf.position.set(0,-2.35,0.3);g.add(jf);
    [-1.45,1.45].forEach(x=>{const c=Me(Sp(0.3,12),CM);c.position.set(x,-1.35,-0.35);g.add(c);});
    return g;
  }

  // Add skull bones aliases
  ['frontal','temporal','occipital','sphenoid'].forEach(k => { if(!BONES[k]) BONES[k] = BONES['skull']; });
  BONES['typical-cervical'] = () => makeVertebra(3.0, 0.65, 'bifid');
  BONES['typical-thoracic'] = () => makeVertebra(3.2, 0.75, 'long');
  BONES['typical-lumbar']   = () => makeVertebra(3.5, 1.05, 'broad');

  // Build
  const boneGroup = (BONES[BONE_ID] || (() => longBone({L:5,st:0.5,sb:0.4,hR:0.8,hx:1,hy:1,hz:1,cR:0.65,ch:0.4,dR:0.9,dx:1.3,dy:0.45,dz:1})))();
  scene.add(boneGroup);

  const bbox = new THREE.Box3().setFromObject(boneGroup);
  const center = bbox.getCenter(new THREE.Vector3());
  boneGroup.position.sub(center);

  // Markers
  const markerGroup = new THREE.Group();
  scene.add(markerGroup);
  const labelsEl = document.getElementById('labels');

  function buildMarkers(show) {
    markerGroup.clear();
    labelsEl.innerHTML = '';
    if (!show) return;
    const bd = BONE_DEFS[BONE_ID];
    if (!bd) return;
    bd.markers.forEach(([x,y,z,label,num]) => {
      const m = Me(Sp(0.18,10), new THREE.MeshPhongMaterial({color:0x6366f1,emissive:0x202080,shininess:80}));
      m.position.set(x-center.x, y-center.y, z-center.z);
      m.userData = {label,num};
      markerGroup.add(m);
    });
  }
  buildMarkers(showMarkers);

  function updateLabels() {
    if (!showMarkers) return;
    labelsEl.innerHTML = '';
    const Wp = W, Hp = H;
    markerGroup.children.forEach(m => {
      const wp = new THREE.Vector3(); m.getWorldPosition(wp); wp.project(camera);
      if (Math.abs(wp.z)>1) return;
      const x=(wp.x*0.5+0.5)*Wp, y=(-wp.y*0.5+0.5)*Hp;
      const div = document.createElement('div');
      div.className = 'lbl';
      div.innerHTML = '<span class="n">'+m.userData.num+'</span>'+m.userData.label;
      div.style.left = x+'px'; div.style.top = (y-26)+'px';
      labelsEl.appendChild(div);
    });
  }

  // Touch
  let rotY=0.4, rotX=0.05, tRotY=0.4, tRotX=0.05;
  let lx=0, ly=0, dragging=false, autoRot=true, autoTmr;
  const cv = document.getElementById('c');

  cv.addEventListener('touchstart',e=>{e.preventDefault();dragging=true;autoRot=false;clearTimeout(autoTmr);lx=e.touches[0].clientX;ly=e.touches[0].clientY;},{passive:false});
  cv.addEventListener('touchmove',e=>{e.preventDefault();if(!dragging||e.touches.length!==1)return;
    const dx=e.touches[0].clientX-lx,dy=e.touches[0].clientY-ly;lx=e.touches[0].clientX;ly=e.touches[0].clientY;
    tRotY+=dx*0.013;tRotX=Math.max(-1.1,Math.min(1.1,tRotX+dy*0.006));},{passive:false});
  cv.addEventListener('touchend',()=>{dragging=false;autoTmr=setTimeout(()=>{autoRot=true;},5000);});

  let lp=0;
  cv.addEventListener('touchstart',e=>{if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;lp=Math.sqrt(dx*dx+dy*dy);}},{passive:false});
  cv.addEventListener('touchmove',e=>{if(e.touches.length===2){e.preventDefault();const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY,d=Math.sqrt(dx*dx+dy*dy);camera.position.z=Math.max(5,Math.min(28,camera.position.z+(lp-d)*0.05));lp=d;}},{passive:false});

  // RN messages
  const handleMsg = e => {
    try{
      const msg=JSON.parse(e.data);
      if(msg.type==='markers'){showMarkers=msg.show;buildMarkers(showMarkers);}
      if(msg.type==='reset'){tRotY=0.4;tRotX=0.05;camera.position.z=def?def.camZ:12;}
    }catch{}
  };
  document.addEventListener('message',handleMsg);
  window.addEventListener('message',handleMsg);

  // Render
  (function animate(){
    requestAnimationFrame(animate);
    if(autoRot) tRotY+=0.006;
    rotY+=(tRotY-rotY)*0.1; rotX+=(tRotX-rotX)*0.1;
    boneGroup.rotation.y=rotY; boneGroup.rotation.x=rotX;
    markerGroup.rotation.y=rotY; markerGroup.rotation.x=rotX;
    updateLabels();
    renderer.render(scene,camera);
  })();
}
</script>
</body>
</html>`;
}

const BoneViewer3D = forwardRef<BoneViewer3DRef, Props>(function BoneViewer3D(
  { boneId, showMarkers = false, onMarkerTap },
  ref
) {
  const webviewRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    setMarkers(show: boolean) {
      webviewRef.current?.injectJavaScript(
        `showMarkers=${show};buildMarkers(${show});true;`
      );
    },
    resetView() {
      webviewRef.current?.postMessage(JSON.stringify({ type: "reset" }));
    },
  }));

  useEffect(() => {
    webviewRef.current?.postMessage(
      JSON.stringify({ type: "markers", show: showMarkers })
    );
  }, [showMarkers]);

  const html = buildHtml(boneId, showMarkers);

  function handleMessage(e: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === "markerTap" && onMarkerTap) onMarkerTap(msg.label);
    } catch {}
  }

  return (
    <WebView
      ref={webviewRef}
      source={{ html }}
      style={StyleSheet.absoluteFill}
      originWhitelist={["*"]}
      scrollEnabled={false}
      bounces={false}
      allowFileAccess
      mixedContentMode="always"
      onMessage={handleMessage}
    />
  );
});

export default BoneViewer3D;
