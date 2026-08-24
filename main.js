import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.getElementById("world");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fd7fb);
scene.fog = new THREE.Fog(0xb9e8f8, 28, 66);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.45;

const camera = new THREE.PerspectiveCamera(47, innerWidth/innerHeight, .1, 140);
camera.position.set(14.5, 10.5, 16.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.5, 0);
controls.enableDamping = true;
controls.dampingFactor = .055;
controls.enablePan = true;
controls.minDistance = 8.5;
controls.maxDistance = 28;
controls.minPolarAngle = THREE.MathUtils.degToRad(26);
controls.maxPolarAngle = THREE.MathUtils.degToRad(79);
controls.maxTargetRadius = 4.7;

document.getElementById("resetCamera").addEventListener("click", () => {
  camera.position.set(14.5, 10.5, 16.5);
  controls.target.set(0, 1.5, 0);
  controls.update();
});

function rng(seed=1){
  let s = seed >>> 0;
  return () => ((s = Math.imul(1664525,s)+1013904223>>>0)/4294967296);
}

function makePaintTexture(base, accents, seed=1, size=256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d");
  x.fillStyle = base;
  x.fillRect(0,0,size,size);
  const r = rng(seed);

  for (let i=0;i<2400;i++){
    const px=r()*size, py=r()*size, rad=.3+r()*2.4;
    x.globalAlpha=.025+r()*.07;
    x.fillStyle=accents[Math.floor(r()*accents.length)];
    x.beginPath(); x.arc(px,py,rad,0,Math.PI*2); x.fill();
  }

  for (let i=0;i<80;i++){
    x.globalAlpha=.035+r()*.05;
    x.strokeStyle=accents[Math.floor(r()*accents.length)];
    x.lineWidth=.3+r()*1.1;
    x.beginPath();
    x.moveTo(r()*size,r()*size);
    x.quadraticCurveTo(r()*size,r()*size,r()*size,r()*size);
    x.stroke();
  }
  x.globalAlpha=1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(2.4,2.4);
  return tex;
}

const textures = {
  grass: makePaintTexture("#8fc567",["#6eaa58","#b7d980","#d8e49c"],2),
  rock: makePaintTexture("#cbb997",["#a99878","#e3d6b9","#857b66"],3),
  wood: makePaintTexture("#9a6a47",["#704a34","#b9835a","#d0a06f"],4),
  stucco: makePaintTexture("#efe1c4",["#d6c5a8","#fff3da","#baa88d"],5),
  paper: makePaintTexture("#fff4d8",["#eadbb9","#fffaf0","#d4c39f"],6),
  red: makePaintTexture("#bd653f",["#8e4934","#d8875c","#e1a37a"],7),
  chalk: makePaintTexture("#2d3935",["#1f2926","#3c4a45","#738078"],8),
  terracotta: makePaintTexture("#bb704a",["#8e4c34","#d29168","#e0aa7b"],9),
  sea: makePaintTexture("#55b9d3",["#78d0df","#2f9fbe","#bceaf1"],10),
  foliage: makePaintTexture("#5f8d4d",["#3f6b3c","#7ca75e","#9aba75"],11)
};

function pmat(map, rough=.92, color=0xffffff, metal=0){
  return new THREE.MeshStandardMaterial({map,color,roughness:rough,metalness:metal});
}
function solid(color, rough=.9, metal=0){
  return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
}
function add(mesh,parent=scene){
  mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
}
function box(w,h,d,mat,x,y,z,ry=0,parent=scene){
  const m=add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat),parent);
  m.position.set(x,y,z); m.rotation.y=ry; return m;
}
function cyl(rt,rb,h,mat,x,y,z,seg=32,parent=scene){
  const m=add(new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat),parent);
  m.position.set(x,y,z); return m;
}
function sphere(r,mat,x,y,z,parent=scene){
  const m=add(new THREE.Mesh(new THREE.SphereGeometry(r,24,18),mat),parent);
  m.position.set(x,y,z); return m;
}

// lighting
scene.add(new THREE.HemisphereLight(0xffffff,0x76905d,2.3));
const sun = new THREE.DirectionalLight(0xffedbb,4.8);
sun.position.set(11,18,8);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-20; sun.shadow.camera.right=20;
sun.shadow.camera.top=20; sun.shadow.camera.bottom=-20;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xffd48e,1.0);
fill.position.set(-12,8,-10);
scene.add(fill);

// sea
const seaMat = pmat(textures.sea,.35);
seaMat.transparent=true; seaMat.opacity=.97;
const sea = add(new THREE.Mesh(new THREE.CircleGeometry(62,128),seaMat));
sea.rotation.x=-Math.PI/2; sea.position.y=-1.25;

// island base
const island = new THREE.Group(); scene.add(island);
const cliff = add(new THREE.Mesh(new THREE.CylinderGeometry(8.0,7.05,2.35,72),pmat(textures.rock,.95)),island);
cliff.position.y=.05;
const grass = add(new THREE.Mesh(new THREE.CylinderGeometry(8.08,7.85,.38,72),pmat(textures.grass,.92)),island);
grass.position.y=1.38;

// rocks around edge
for(let i=0;i<44;i++){
  const a=i/44*Math.PI*2, rr=7.52+Math.sin(i*1.91)*.22;
  const m=add(new THREE.Mesh(new THREE.DodecahedronGeometry(.28+(i%5)*.045,0),pmat(textures.rock,.98)),island);
  m.position.set(Math.cos(a)*rr,.56+Math.sin(i)*.05,Math.sin(a)*rr);
  m.rotation.set(i*.3,i*.22,i*.1);
  m.scale.set(1,.7+(i%3)*.14,1);
}

// stone path
for(let i=0;i<10;i++){
  const z=5.35-i*.78, x=Math.sin(i*.75)*.5;
  const s=box(1.18+(i%2)*.12,.11,.58,pmat(textures.rock),x,1.61,z,(i%2?.13:-.08));
  s.rotation.z=(i%3-1)*.025;
}

// message wall with tiled stone border
const wallGroup=new THREE.Group(); wallGroup.position.set(-3.7,1.46,.25); wallGroup.rotation.y=.08; scene.add(wallGroup);
const wall=box(4.3,2.5,.34,pmat(textures.stucco),0,1.3,0,0,wallGroup);
wall.userData.label="Message Board";
for(let x=-2.05;x<=2.05;x+=.5){
  const stone=box(.46,.18,.48,pmat(textures.rock),x,2.62,0,0,wallGroup);
  stone.rotation.z=(Math.sin(x*3)*.06);
}
for(let y=.25;y<=2.35;y+=.45){
  box(.2,.38,.47,pmat(textures.rock),-2.17,y,0,0,wallGroup);
  box(.2,.38,.47,pmat(textures.rock), 2.17,y,0,0,wallGroup);
}
const board=box(3.45,1.62,.09,pmat(textures.wood),0,1.32,-.2,0,wallGroup);
board.userData.label="Message Board";

function canvasLabel(text,w=512,h=140,bg="#6f5138",fg="#fff3d6",font="bold 62px Georgia"){
  const c=document.createElement("canvas"); c.width=w;c.height=h;
  const x=c.getContext("2d"); x.fillStyle=bg;x.fillRect(0,0,w,h);
  x.fillStyle=fg;x.textAlign="center";x.textBaseline="middle";x.font=font;x.fillText(text,w/2,h/2);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const messageLabelMat=new THREE.MeshBasicMaterial({map:canvasLabel("Message Board",640,150),transparent:false});
const messageLabel=add(new THREE.Mesh(new THREE.PlaneGeometry(2.8,.65),messageLabelMat),wallGroup);
messageLabel.position.set(0,2.22,-.235);

const noteColors=[0xfff1ac,0xf5d7dc,0xd7e9f3,0xe4efc8,0xf7e6c6];
for(let r=0;r<3;r++)for(let c=0;c<5;c++){
  const n=box(.5,.39,.025,solid(noteColors[(r+c)%noteColors.length]),-1.1+c*.55,1.72-r*.5,-.26,0,wallGroup);
  n.rotation.z=((r+c)%3-1)*.06;
  const pin=sphere(.035,solid(0xb95942,.45,0),n.position.x,n.position.y+.14,-.285,wallGroup);
}

// foliage + flowers
function flower(x,z,color=0xffffff,s=.9){
  const g=new THREE.Group();
  const stem=cyl(.023,.028,.5*s,solid(0x4f7a44),0,.25*s,0,8,g);
  for(let i=0;i<6;i++){
    const p=sphere(.072*s,solid(color),Math.cos(i/6*Math.PI*2)*.09*s,.55*s,Math.sin(i/6*Math.PI*2)*.09*s,g);
    p.scale.set(1.5,.72,1);
  }
  sphere(.055*s,solid(0xe0b545),0,.55*s,0,g);
  g.position.set(x,1.57,z); scene.add(g);
}
const fp=[0xffffff,0xf2a8b9,0xf7cc62,0xcbb0e9,0xf3a06b];
for(let i=0;i<72;i++){
  const a=i*2.399, r=3.7+(i%10)*.38, x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(Math.abs(x)<1.25 && z>-1.2 && z<5.8) continue;
  flower(x,z,fp[i%fp.length],.72+(i%3)*.14);
}

// bench
const bench=new THREE.Group();bench.position.set(3.8,1.58,3.55);bench.rotation.y=-.75;scene.add(bench);
for(let i=0;i<4;i++) box(2.15,.12,.18,pmat(textures.wood),0,.54+i*.18,0,0,bench);
for(const x of [-.85,.85]) box(.12,.7,.18,pmat(textures.wood),x,.22,0,0,bench);

// table
cyl(.54,.54,.12,pmat(textures.wood),2.45,2.12,3.25,28);
cyl(.1,.14,.77,pmat(textures.wood),2.45,1.72,3.25,18);

// mailbox
const mailbox=new THREE.Group(); mailbox.position.set(-.6,1.55,5.9); scene.add(mailbox);
box(.85,1.05,.58,pmat(textures.red),0,.58,0,0,mailbox);
const top=add(new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.6,24,1,false,0,Math.PI),pmat(textures.red)),mailbox);
top.rotation.z=Math.PI/2;top.position.set(0,1.08,0);
box(.47,.05,.05,solid(0x623d2e),0,.78,.31,0,mailbox);

// gacha
const gacha=new THREE.Group();gacha.position.set(2.7,1.62,.75);scene.add(gacha);gacha.userData.label="Gacha Machine";
box(1.35,1.5,1.05,pmat(textures.red),0,.75,0,0,gacha);
const glass=new THREE.MeshPhysicalMaterial({color:0xe6fbff,roughness:.08,transmission:.25,transparent:true,opacity:.48});
sphere(.83,glass,0,2.05,0,gacha);
const ballColors=[0xe99b9b,0xefc369,0x8ec4dd,0x92c27d,0xd3a7d7,0xf5dd93];
for(let i=0;i<18;i++){
  const a=i*2.42,rad=.55*Math.sqrt((i+2)/20);
  sphere(.16,solid(ballColors[i%ballColors.length]),Math.cos(a)*rad,1.77+(i%4)*.15,Math.sin(a)*rad,gacha);
}
const gachaTop=new THREE.MeshBasicMaterial({map:canvasLabel("TRY YOUR LUCK!",700,160,"#f7e3b8","#7a4a2d","bold 64px Georgia")});
const sign=add(new THREE.Mesh(new THREE.PlaneGeometry(1.75,.45),gachaTop),gacha);
sign.position.set(0,2.9,.05);
sign.rotation.x=-.05;

// rocking horse
const horse=new THREE.Group();horse.position.set(-2.2,1.58,3.1);horse.rotation.y=.3;scene.add(horse);horse.userData.label="Rocking Horse";
for(const z of [-.38,.38]){
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.95,0,z),new THREE.Vector3(0,-.18,z),new THREE.Vector3(.95,0,z)]);
  const tube=add(new THREE.Mesh(new THREE.TubeGeometry(curve,26,.07,8,false),pmat(textures.wood)),horse);
}
const body=add(new THREE.Mesh(new THREE.CapsuleGeometry(.38,.82,6,12),solid(0xf3e7d2)),horse);
body.rotation.z=Math.PI/2;body.position.y=.57;
sphere(.34,solid(0xf3e7d2),.67,.9,0,horse);
box(.35,.2,.28,solid(0xdfcfb3),.93,.8,0,0,horse);
for(const z of [-.22,.22]){
  const leg=cyl(.07,.08,.64,solid(0xe9dcc6),-.16,.2,z,10,horse);leg.rotation.z=.13;
}

// lamppost
const lamp=new THREE.Group();lamp.position.set(4.8,1.6,1.0);scene.add(lamp);
cyl(.08,.11,2.65,solid(0x31312c,.5,.28),0,1.32,0,16,lamp);
sphere(.23,new THREE.MeshStandardMaterial({color:0xffefad,emissive:0xffd86d,emissiveIntensity:.8,roughness:.4}),0,2.78,0,lamp);
const lampLight=new THREE.PointLight(0xffd98a,1.2,5);lampLight.position.set(0,2.8,0);lamp.add(lampLight);

// trees
function tree(x,z,s=1){
  cyl(.16*s,.23*s,2.2*s,pmat(textures.wood),x,2.55*s,z,16);
  const greens=[0x547d44,0x6e9951,0x82a960];
  for(let i=0;i<11;i++){
    const c=sphere((.62+(i%3)*.11)*s,solid(greens[i%greens.length]),x+Math.cos(i*2.13)*.55*s,3.55*s+(i%4)*.2*s,z+Math.sin(i*2.13)*.48*s);
    c.scale.set(1.05,1.1,.95);
  }
}
tree(-5.5,-2.45,1.12); tree(5.1,-2.75,.95);

// balloons
function balloon(x,y,z,color){
  const g=new THREE.Group();scene.add(g);
  const b=sphere(.5,solid(color),0,0,0,g);b.scale.y=1.25;
  const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-.6,0),new THREE.Vector3(.05,-2.1,0)]);
  g.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x756857})));
  g.position.set(x,y,z);return g;
}
const balloons=[balloon(-6.5,7,-4.5,0xe48a7f),balloon(4.8,8,-7,0xf2c968),balloon(8,6.6,-1,0xe6a7a4),balloon(-1,8.5,-9,0x8db8d4)];

// clouds
function cloud(x,y,z,s=1){
  const g=new THREE.Group();scene.add(g);
  const cm=solid(0xffffff,1);
  [[-.8,0,.7],[0,0,.96],[.8,0,.7],[-.2,.45,.76],[.45,.42,.64]].forEach(([px,py,r])=>{
    const c=sphere(r*s,cm,px*s,py*s,0,g);c.castShadow=false;
  });
  g.position.set(x,y,z);return g;
}
const clouds=[cloud(-10,8,-14,1.6),cloud(6,9,-18,1.85),cloud(14,7,-10,1.2)];

// distant islands
function distantIsland(x,z){
  const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);
  cyl(2.3,1.9,.8,pmat(textures.rock),0,-.3,0,40,g);
  cyl(2.32,2.2,.18,pmat(textures.grass),0,.18,0,40,g);
}
distantIsland(-13,-12);distantIsland(0,-17);distantIsland(13,-11);

// interaction labels
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),label=document.getElementById("label"),toast=document.getElementById("toast");
function labeled(obj){let o=obj;while(o){if(o.userData?.label)return o;o=o.parent}return null}
renderer.domElement.addEventListener("pointermove",e=>{
  pointer.x=e.clientX/innerWidth*2-1;pointer.y=-(e.clientY/innerHeight)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const h=raycaster.intersectObjects(scene.children,true).map(v=>labeled(v.object)).find(Boolean);
  if(h){label.hidden=false;label.textContent=h.userData.label;label.style.left=e.clientX+"px";label.style.top=e.clientY+"px";renderer.domElement.style.cursor="pointer"}
  else{label.hidden=true;renderer.domElement.style.cursor="grab"}
});
renderer.domElement.addEventListener("click",e=>{
  pointer.x=e.clientX/innerWidth*2-1;pointer.y=-(e.clientY/innerHeight)*2+1;raycaster.setFromCamera(pointer,camera);
  const h=raycaster.intersectObjects(scene.children,true).map(v=>labeled(v.object)).find(Boolean);
  if(!h)return;
  toast.hidden=false;
  toast.textContent=h.userData.label==="Gacha Machine"?"You got a tiny botanical card 🌷":h.userData.label==="Rocking Horse"?"creak… creak… 🎠":"Message Board — visitor notes will live here.";
  clearTimeout(window.__toast);window.__toast=setTimeout(()=>toast.hidden=true,1600);
});

const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const t=clock.getElapsedTime();
  balloons.forEach((b,i)=>{b.position.y+=Math.sin(t*.7+i)*.0018;b.rotation.y=Math.sin(t*.3+i)*.08});
  clouds.forEach((c,i)=>{c.position.x+=.001*(i+1);if(c.position.x>18)c.position.x=-18});
  horse.rotation.z=Math.sin(t*1.15)*.018;
  sea.rotation.z+=.00005;
  controls.update();renderer.render(scene,camera);
}
animate();

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
});

setTimeout(()=>document.getElementById("loading").classList.add("hide"),1500);
