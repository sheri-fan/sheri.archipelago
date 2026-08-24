import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.getElementById("world");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fdcff);
scene.fog = new THREE.Fog(0xa7def5, 22, 52);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(13, 10, 15);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.4, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = true;
controls.minDistance = 8;
controls.maxDistance = 27;
controls.minPolarAngle = THREE.MathUtils.degToRad(28);
controls.maxPolarAngle = THREE.MathUtils.degToRad(78);
controls.maxTargetRadius = 4.5;

const resetCamera = () => {
  camera.position.set(13, 10, 15);
  controls.target.set(0, 1.4, 0);
  controls.update();
};
document.getElementById("resetCamera").addEventListener("click", resetCamera);

// ---------- helpers ----------
const roughness = 0.9;

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? roughness,
    metalness: opts.metalness ?? 0,
    flatShading: opts.flatShading ?? false
  });
}

function mesh(geometry, material, x=0, y=0, z=0) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

function addBox(w,h,d,color,x,y,z,ry=0) {
  const m = mesh(new THREE.BoxGeometry(w,h,d), mat(color), x,y,z);
  m.rotation.y = ry;
  return m;
}

function addCylinder(rTop,rBot,h,color,x,y,z,segments=32) {
  return mesh(new THREE.CylinderGeometry(rTop,rBot,h,segments), mat(color), x,y,z);
}

function addSphere(r,color,x,y,z) {
  return mesh(new THREE.SphereGeometry(r,24,18), mat(color), x,y,z);
}

// ---------- lighting ----------
const hemi = new THREE.HemisphereLight(0xffffff, 0x6a7658, 2.2);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff1c9, 4.2);
sun.position.set(9, 15, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
sun.shadow.camera.top = 18;
sun.shadow.camera.bottom = -18;
scene.add(sun);

const warmFill = new THREE.DirectionalLight(0xffc979, 0.75);
warmFill.position.set(-10, 7, -9);
scene.add(warmFill);

// ---------- sea ----------
const sea = mesh(
  new THREE.CircleGeometry(55, 96),
  new THREE.MeshStandardMaterial({
    color: 0x57bad3,
    roughness: 0.35,
    metalness: 0.04,
    transparent: true,
    opacity: 0.96
  }),
  0, -1.15, 0
);
sea.rotation.x = -Math.PI/2;
sea.receiveShadow = true;

// faint sea rings for watercolor-like rhythm
for (let i = 0; i < 8; i++) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(9 + i*3.2, 9.06 + i*3.2, 96),
    new THREE.MeshBasicMaterial({ color: 0xcff6ff, transparent: true, opacity: 0.14, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI/2;
  ring.position.y = -1.12;
  scene.add(ring);
}

// ---------- island ----------
const islandGroup = new THREE.Group();
scene.add(islandGroup);

const base = new THREE.Mesh(
  new THREE.CylinderGeometry(7.8, 6.8, 2.1, 64),
  [
    mat(0x6f7753, {flatShading:false}),
    mat(0x7eb15d),
    mat(0x5f6747)
  ]
);
base.position.y = 0;
base.castShadow = true;
base.receiveShadow = true;
islandGroup.add(base);

const grassTop = new THREE.Mesh(
  new THREE.CylinderGeometry(7.9, 7.65, 0.34, 64),
  mat(0x8fc868),
);
grassTop.position.y = 1.18;
grassTop.castShadow = true;
grassTop.receiveShadow = true;
islandGroup.add(grassTop);

// irregular rocks around edge
const rockMat = mat(0xcab594);
for (let i=0;i<36;i++) {
  const a = (i/36)*Math.PI*2;
  const rr = 7.25 + Math.sin(i*1.9)*0.25;
  const r = 0.32 + (i%4)*0.05;
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r,0), rockMat);
  rock.position.set(Math.cos(a)*rr, 0.48 + Math.sin(i)*0.07, Math.sin(a)*rr);
  rock.rotation.set(Math.random(),Math.random(),Math.random());
  rock.scale.y = 0.75 + (i%3)*0.15;
  rock.castShadow = true;
  rock.receiveShadow = true;
  islandGroup.add(rock);
}

// ---------- stone path ----------
for (let i=0;i<9;i++) {
  const z = 4.8 - i*0.75;
  const x = Math.sin(i*.75)*0.45;
  const s = addBox(1.05 + (i%2)*0.15, 0.12, 0.54, 0xd9caa7, x, 1.42, z, (i%2?0.12:-0.08));
  s.rotation.z = (i%3-1)*0.03;
}

// ---------- message wall ----------
const wall = addBox(4.3, 2.55, 0.34, 0xe9dcc1, -3.6, 2.55, 0.2, 0.08);
wall.userData.label = "Message Board";
const wallCap = addBox(4.55, 0.18, 0.52, 0xd8c8a9, -3.6, 3.88, 0.2, 0.08);

const board = addBox(3.4, 1.55, 0.09, 0xc59d6d, -3.55, 2.55, 0.01, 0.08);
board.userData.label = "Message Board";

// pinned notes
const noteColors = [0xfff4c2,0xf3d8df,0xd6ecf5,0xf7e6c7,0xe5efca];
for (let r=0;r<3;r++) {
  for (let c=0;c<5;c++) {
    const n = addBox(0.48,0.38,0.025,noteColors[(r+c)%noteColors.length],
      -4.55 + c*0.5, 3.02-r*0.48, -0.02, 0.08);
    n.rotation.z = ((r+c)%3-1)*0.06;
  }
}

// vines on wall
function addLeafCluster(x,y,z,scale=1) {
  const g = new THREE.Group();
  for (let i=0;i<8;i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.13*scale,10,8), mat(i%2?0x4f7b43:0x668d4f));
    const a = i/8*Math.PI*2;
    leaf.position.set(Math.cos(a)*0.2*scale, Math.sin(a)*0.22*scale, (i%2)*0.03);
    leaf.scale.set(1,1.6,0.7);
    g.add(leaf);
  }
  g.position.set(x,y,z);
  scene.add(g);
}
addLeafCluster(-5.55,3.65,0.03,1.4);
addLeafCluster(-1.6,3.35,-0.02,1.15);

// ---------- gacha machine ----------
const gachaGroup = new THREE.Group();
gachaGroup.position.set(2.7,1.45,0.7);
scene.add(gachaGroup);

const gachaBase = new THREE.Mesh(new THREE.BoxGeometry(1.3,1.5,1.0), mat(0xb85f3f));
gachaBase.position.y = 0.75;
gachaBase.castShadow = gachaBase.receiveShadow = true;
gachaGroup.add(gachaBase);

const globe = new THREE.Mesh(
  new THREE.SphereGeometry(0.82,32,22),
  new THREE.MeshPhysicalMaterial({
    color: 0xdff8ff,
    roughness: 0.05,
    metalness: 0,
    transmission: 0.2,
    transparent: true,
    opacity: 0.5
  })
);
globe.position.y = 2.0;
globe.castShadow = true;
gachaGroup.add(globe);
gachaGroup.userData.label = "Gacha Machine";

const ballColors = [0xeaa0a0,0xf0c36b,0x8fc6df,0x94c67d,0xd6a6d8,0xf6df93];
for (let i=0;i<16;i++) {
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.16,14,10), mat(ballColors[i%ballColors.length]));
  const a = i*2.4;
  const rad = 0.52*Math.sqrt((i+2)/18);
  b.position.set(Math.cos(a)*rad, 1.75 + (i%4)*0.15, Math.sin(a)*rad);
  gachaGroup.add(b);
}
const crank = new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.35,16), mat(0xd2a658,{metalness:.25}));
crank.rotation.z = Math.PI/2;
crank.position.set(0.78,0.82,0);
gachaGroup.add(crank);

// ---------- rocking horse ----------
const horseGroup = new THREE.Group();
horseGroup.position.set(-2.0,1.45,3.0);
horseGroup.rotation.y = 0.25;
scene.add(horseGroup);
horseGroup.userData.label = "Rocking Horse";

const rockerMat = mat(0x8f5a39);
for (const z of [-0.38,0.38]) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.9,0,z),
    new THREE.Vector3(0, -0.18,z),
    new THREE.Vector3(0.9,0,z)
  ]);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve,24,0.07,8,false), rockerMat);
  tube.castShadow = true;
  horseGroup.add(tube);
}
const horseBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.38,0.8,6,12), mat(0xf0e6cf));
horseBody.rotation.z = Math.PI/2;
horseBody.position.y = 0.55;
horseBody.castShadow = true;
horseGroup.add(horseBody);

const horseHead = new THREE.Mesh(new THREE.SphereGeometry(0.34,18,14), mat(0xf0e6cf));
horseHead.position.set(0.65,0.88,0);
horseHead.castShadow = true;
horseGroup.add(horseHead);

const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.35,0.2,0.28), mat(0xe3d2b1));
muzzle.position.set(0.92,0.78,0);
horseGroup.add(muzzle);

for (const z of [-0.22,0.22]) {
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(.07,.08,.62,10), mat(0xe8dcc5));
  leg.position.set(-0.15,0.18,z);
  leg.rotation.z = 0.12;
  horseGroup.add(leg);
}

// ---------- benches / little table ----------
const bench = new THREE.Group();
bench.position.set(3.6,1.4,3.4);
bench.rotation.y = -0.7;
scene.add(bench);
for (let i=0;i<4;i++) {
  const slat = new THREE.Mesh(new THREE.BoxGeometry(2.1,0.12,0.18), mat(0x9a6c4b));
  slat.position.set(0,0.55+i*0.18,0);
  bench.add(slat);
}
for (const x of [-0.85,0.85]) {
  const leg = new THREE.Mesh(new THREE.BoxGeometry(.12,.65,.16), mat(0x7e573f));
  leg.position.set(x,.2,0);
  bench.add(leg);
}

const littleTable = addCylinder(0.55,0.55,0.12,0x9a6c4b,2.25,1.95,3.15,24);
addCylinder(0.09,0.12,0.75,0x81583f,2.25,1.55,3.15,16);

// ---------- plants / flowers ----------
function flower(x,z,color=0xffffff,scale=1) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.025,.03,.52*scale,8), mat(0x4f7a44));
  stem.position.y = .26*scale;
  g.add(stem);
  for(let i=0;i<6;i++){
    const p = new THREE.Mesh(new THREE.SphereGeometry(.075*scale,10,8), mat(color));
    const a = i/6*Math.PI*2;
    p.position.set(Math.cos(a)*.095*scale,.56*scale,Math.sin(a)*.095*scale);
    p.scale.set(1.4,.75,1);
    g.add(p);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(.06*scale,10,8), mat(0xe4b74d));
  center.position.y = .56*scale;
  g.add(center);
  g.position.set(x,1.34,z);
  scene.add(g);
}

const flowerPalette = [0xffffff,0xf3a8b8,0xf6d068,0xcab0e9,0xf2a46f];
for (let i=0;i<55;i++) {
  const a = i*2.399;
  const r = 3.8 + (i%8)*0.38;
  const x = Math.cos(a)*r;
  const z = Math.sin(a)*r;
  if (Math.abs(x) < 1.2 && z > -1 && z < 5.5) continue;
  flower(x,z,flowerPalette[i%flowerPalette.length],0.75+(i%3)*0.18);
}

// ---------- trees ----------
function makeTree(x,z,s=1) {
  const trunk = addCylinder(.15*s,.22*s,2.2*s,0x806044,x,2.25*s,z,16);
  const crown = new THREE.Group();
  const greens=[0x6a964f,0x78a85b,0x598343];
  for(let i=0;i<9;i++){
    const c = new THREE.Mesh(new THREE.SphereGeometry((.7+(i%3)*.12)*s,18,14), mat(greens[i%greens.length]));
    c.position.set(
      x + Math.cos(i*2.1)*.55*s,
      3.35*s + (i%4)*.22*s,
      z + Math.sin(i*2.1)*.48*s
    );
    c.castShadow = true;
    scene.add(c);
  }
}
makeTree(-5.4,-2.2,1.15);
makeTree(5.15,-2.8,.95);

// ---------- balloons ----------
function balloon(x,y,z,color) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(.5,20,16), mat(color));
  b.scale.y = 1.25;
  g.add(b);
  const stringGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0,-.6,0),
    new THREE.Vector3(.05,-2.1,0)
  ]);
  const string = new THREE.Line(stringGeo, new THREE.LineBasicMaterial({color:0x7c6c5b}));
  g.add(string);
  g.position.set(x,y,z);
  scene.add(g);
  return g;
}
const balloons = [
  balloon(-6.2,7,-5,0xe48c82),
  balloon(4.8,8,-7,0xf0c366),
  balloon(8.2,6.5,-1,0xe4a3a3),
  balloon(-1.2,8.5,-9,0x86b3d4)
];

// ---------- clouds ----------
function cloud(x,y,z,s=1) {
  const g = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({color:0xffffff,roughness:1});
  const parts = [
    [-.8,0,0,.7],[0,0,0,.95],[.8,0,0,.7],[-.2,.45,0,.75],[.45,.42,0,.62]
  ];
  parts.forEach(([px,py,pz,r])=>{
    const c = new THREE.Mesh(new THREE.SphereGeometry(r*s,18,14),cloudMat);
    c.position.set(px*s,py*s,pz);
    g.add(c);
  });
  g.position.set(x,y,z);
  scene.add(g);
  return g;
}
const clouds = [
  cloud(-10,8,-14,1.5),
  cloud(6,9,-18,1.8),
  cloud(14,7,-10,1.2)
];

// ---------- distant placeholder islands ----------
function distantIsland(x,z,color) {
  const grp = new THREE.Group();
  const land = new THREE.Mesh(new THREE.CylinderGeometry(2.2,1.85,.7,32),mat(0x7ea45c));
  land.position.y = -.35;
  grp.add(land);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(2.22,2.15,.18,32),mat(color));
  grp.add(top);
  grp.position.set(x,0,z);
  scene.add(grp);
}
distantIsland(-13,-12,0x8fbe68);
distantIsland(0,-17,0x92c96b);
distantIsland(13,-11,0x8db868);

// ---------- hover labels ----------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const label = document.getElementById("label");
const clickable = [wall, board, gachaGroup, horseGroup];

function getLabelObject(obj) {
  let current = obj;
  while (current) {
    if (current.userData && current.userData.label) return current;
    current = current.parent;
  }
  return null;
}

function updatePointer(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

renderer.domElement.addEventListener("pointermove", (e) => {
  updatePointer(e);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  const hit = hits.map(h => getLabelObject(h.object)).find(Boolean);

  if (hit) {
    label.hidden = false;
    label.textContent = hit.userData.label;
    label.style.left = `${e.clientX}px`;
    label.style.top = `${e.clientY}px`;
    renderer.domElement.style.cursor = "pointer";
  } else {
    label.hidden = true;
    renderer.domElement.style.cursor = "grab";
  }
});

// ---------- animate ----------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  balloons.forEach((b,i) => {
    b.position.y += Math.sin(t*.7 + i)*0.0018;
    b.rotation.y = Math.sin(t*.3+i)*0.08;
  });

  clouds.forEach((c,i) => {
    c.position.x += 0.0012*(i+1);
    if (c.position.x > 18) c.position.x = -18;
  });

  horseGroup.rotation.z = Math.sin(t*1.2)*0.015;

  controls.update();
  renderer.render(scene,camera);
}
animate();

// ---------- resize ----------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- loading ----------
setTimeout(() => {
  document.getElementById("loading").classList.add("hide");
}, 1500);
