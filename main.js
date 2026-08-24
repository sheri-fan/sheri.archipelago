import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas=document.getElementById("world");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.42;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8fd8f7);
scene.fog=new THREE.Fog(0xbceafa,32,72);

const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,140);
camera.position.set(16,12,17);

const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,1.4,0);
controls.enableDamping=true;
controls.dampingFactor=.055;
controls.enablePan=true;
controls.minDistance=8.5;
controls.maxDistance=30;
controls.minPolarAngle=THREE.MathUtils.degToRad(24);
controls.maxPolarAngle=THREE.MathUtils.degToRad(82);
controls.maxTargetRadius=5;

document.getElementById("reset").addEventListener("click",()=>{camera.position.set(16,12,17);controls.target.set(0,1.4,0);controls.update()});

function tex(base,strokes,seed=1,size=256){
 const c=document.createElement("canvas");c.width=c.height=size;const x=c.getContext("2d");x.fillStyle=base;x.fillRect(0,0,size,size);
 let s=seed>>>0;const rnd=()=>((s=(Math.imul(1664525,s)+1013904223)>>>0)/4294967296);
 for(let i=0;i<2600;i++){x.globalAlpha=.025+rnd()*.055;x.fillStyle=strokes[Math.floor(rnd()*strokes.length)];x.beginPath();x.arc(rnd()*size,rnd()*size,.25+rnd()*2.2,0,Math.PI*2);x.fill()}
 x.globalAlpha=1;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2.4,2.4);return t
}
const TX={grass:tex("#91c767",["#6fa956","#b9db80","#dbe8a4"],2),rock:tex("#cbb99b",["#9e8f76","#e3d8bf","#83745f"],3),wood:tex("#9b6a49",["#704b36","#be8b60","#d4aa79"],4),stucco:tex("#efe2c7",["#d4c2a5","#fff4db","#b8a486"],5),paper:tex("#fff5da",["#ead9b7","#fffaf0","#d2c09d"],6),red:tex("#bd6542",["#8b4936","#d4865d","#e1a077"],7),sea:tex("#54b9d3",["#78cfdf","#319dbb","#b9e8ef"],10)};
const pm=(t,r=.92,m=0)=>new THREE.MeshStandardMaterial({map:t,roughness:r,metalness:m});
const sm=(c,r=.9,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const M={grass:pm(TX.grass),rock:pm(TX.rock,.98),wood:pm(TX.wood,.88),stucco:pm(TX.stucco,.96),paper:pm(TX.paper,.95),red:pm(TX.red,.82),brass:sm(0xb28a45,.45,.32),iron:sm(0x393a35,.55,.2),white:sm(0xf5ead5,.9),darkwood:sm(0x6e4934,.9)};
function add(m,p=scene){m.castShadow=true;m.receiveShadow=true;p.add(m);return m}
function box(w,h,d,mat,x=0,y=0,z=0,p=scene){const m=add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat),p);m.position.set(x,y,z);return m}
function cyl(rt,rb,h,mat,x=0,y=0,z=0,seg=24,p=scene){const m=add(new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat),p);m.position.set(x,y,z);return m}
function sphere(r,mat,x=0,y=0,z=0,p=scene,seg=22){const m=add(new THREE.Mesh(new THREE.SphereGeometry(r,seg,Math.max(12,seg-4)),mat),p);m.position.set(x,y,z);return m}

scene.add(new THREE.HemisphereLight(0xffffff,0x78925e,2.35));
const sun=new THREE.DirectionalLight(0xffefc0,4.6);sun.position.set(12,19,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;scene.add(sun);
const fill=new THREE.DirectionalLight(0xffd293,1);fill.position.set(-10,8,-9);scene.add(fill);

const sea=add(new THREE.Mesh(new THREE.CircleGeometry(65,128),pm(TX.sea,.32)));sea.rotation.x=-Math.PI/2;sea.position.y=-1.35;

const island=new THREE.Group();scene.add(island);
const cliff=add(new THREE.Mesh(new THREE.CylinderGeometry(8.8,7.8,2.55,80),M.rock),island);cliff.position.y=0;
const grass=add(new THREE.Mesh(new THREE.CylinderGeometry(8.92,8.58,.42,80),M.grass),island);grass.position.y=1.48;
for(let i=0;i<52;i++){const a=i/52*Math.PI*2,rr=8.2+Math.sin(i*1.73)*.24,r=.27+(i%5)*.045,m=add(new THREE.Mesh(new THREE.DodecahedronGeometry(r,0),M.rock),island);m.position.set(Math.cos(a)*rr,.55+Math.sin(i*.7)*.06,Math.sin(a)*rr);m.rotation.set(i*.17,i*.29,i*.13);m.scale.set(1,.72+(i%3)*.12,1)}
for(let i=0;i<12;i++){const z=6.3-i*.82,x=Math.sin(i*.72)*.48,s=box(1.18+(i%2)*.12,.1,.58,M.rock,x,1.73,z);s.rotation.y=(i%2?.13:-.08)}

const wall=new THREE.Group();wall.position.set(-4.25,1.64,.25);wall.rotation.y=.12;scene.add(wall);wall.userData.label="Message Board";
box(4.4,2.6,.44,M.stucco,0,1.35,0,wall);
for(let y=.25;y<=2.45;y+=.45){box(.2,.38,.52,M.rock,-2.2,y,0,wall);box(.2,.38,.52,M.rock,2.2,y,0,wall)}
box(3.55,1.63,.08,M.wood,0,1.4,-.265,wall);
const noteColors=[0xfff1aa,0xf6d8de,0xd8e9f4,0xe5efcc,0xf8e5c5];
for(let r=0;r<3;r++)for(let c=0;c<5;c++){const n=box(.5,.38,.026,sm(noteColors[(r+c)%noteColors.length]),-1.12+c*.56,1.78-r*.48,-.315,wall);n.rotation.z=((r+c)%3-1)*.06}
box(.22,2.2,.18,M.darkwood,-1.25,1.25,.34,wall);box(.22,2.2,.18,M.darkwood,1.25,1.25,.34,wall);box(2.8,.18,.18,M.darkwood,0,1.45,.34,wall);

const gacha=new THREE.Group();gacha.position.set(2.85,1.73,.55);scene.add(gacha);gacha.userData.label="Gacha Machine";
box(1.5,1.6,1.12,M.red,0,.8,0,gacha);
const glass=new THREE.MeshPhysicalMaterial({color:0xe9fbff,roughness:.06,transmission:.25,transparent:true,opacity:.5});
sphere(.9,glass,0,2.16,0,gacha,32);
const ballColors=[0xe89d9d,0xf0c46a,0x8ec5df,0x93c57e,0xd3a6d6,0xf4de92];
for(let i=0;i<22;i++){const a=i*2.38,rad=.61*Math.sqrt((i+2)/24);sphere(.17,sm(ballColors[i%ballColors.length]),Math.cos(a)*rad,1.85+(i%5)*.14,Math.sin(a)*rad,gacha,14)}
cyl(.62,.62,.18,M.red,0,3.02,0,32,gacha);
const cb=cyl(.24,.24,.12,M.brass,0,.95,-.62,20,gacha);cb.rotation.x=Math.PI/2;const cr=cyl(.08,.08,.55,M.brass,0,.95,-.82,16,gacha);cr.rotation.x=Math.PI/2;
box(.48,.42,.06,M.iron,-.25,.34,-.59,gacha);

const horse=new THREE.Group();horse.position.set(-2.45,1.77,3.45);horse.rotation.y=.35;scene.add(horse);horse.userData.label="Rocking Horse";
for(const z of [-.42,.42]){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-1,0,z),new THREE.Vector3(0,-.19,z),new THREE.Vector3(1,0,z)]);add(new THREE.Mesh(new THREE.TubeGeometry(curve,28,.075,10,false),M.wood),horse)}
const body=add(new THREE.Mesh(new THREE.CapsuleGeometry(.42,.92,8,14),M.white),horse);body.rotation.z=Math.PI/2;body.position.set(-.02,.72,0);
sphere(.36,M.white,.72,1.1,0,horse,22);box(.38,.22,.3,M.white,1,.98,0,horse);
for(const x of [-.35,.36])for(const z of [-.24,.24]){const leg=cyl(.075,.085,.65,M.white,x,.28,z,12,horse);leg.rotation.z=(x>0?-.08:.08);box(.18,.12,.22,M.iron,x,.02,z,horse)}
box(.62,.12,.6,M.red,-.1,1.02,0,horse);

const mailbox=new THREE.Group();mailbox.position.set(-.6,1.74,6.25);scene.add(mailbox);mailbox.userData.label="Mailbox";
cyl(.16,.22,1.45,M.wood,0,.73,0,16,mailbox);box(.68,.12,.72,M.wood,0,1.43,0,mailbox);box(.9,.55,.75,M.stucco,0,1.78,0,mailbox);
const mbTop=add(new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.75,24,1,false,0,Math.PI),M.stucco),mailbox);mbTop.rotation.z=Math.PI/2;mbTop.position.set(0,2.05,0);
box(.05,.78,.05,M.red,.52,2,0,mailbox);box(.28,.18,.05,M.red,.64,2.32,0,mailbox);

const bench=new THREE.Group();bench.position.set(4.2,1.7,3.25);bench.rotation.y=-.72;scene.add(bench);bench.userData.label="Bench / Tea Table";
for(let i=0;i<4;i++)box(2.15,.12,.18,M.wood,0,.55+i*.18,0,bench);
box(2.25,.16,.72,M.wood,0,.42,-.18,bench);
for(const x of [-.88,.88]){box(.14,.8,.18,M.wood,x,.18,-.2,bench);box(.14,.92,.18,M.wood,x,.63,.14,bench)}
const tea=new THREE.Group();tea.position.set(2.7,1.73,3.45);scene.add(tea);tea.userData.label="Tea Table";
cyl(.58,.58,.12,M.wood,0,.47,0,28,tea);cyl(.1,.14,.78,M.wood,0,.07,0,16,tea);cyl(.18,.22,.22,M.white,-.1,.68,0,16,tea);

function floweringTree(x,z,s=1){cyl(.18*s,.27*s,2.4*s,M.wood,x,2.85*s,z,18);const pinks=[0xf3b7c2,0xf6c7ce,0xf0a7b8];for(let i=0;i<16;i++){const a=i*2.11,c=sphere((.52+(i%4)*.08)*s,sm(pinks[i%pinks.length]),x+Math.cos(a)*.9*s,4*s+(i%5)*.18*s,z+Math.sin(a)*.72*s,scene,16);c.scale.set(1.05,.9,1)}}
function shadeTree(x,z,s=1){cyl(.2*s,.3*s,2.5*s,M.wood,x,2.9*s,z,18);const greens=[0x5c8648,0x739b56,0x89ad66];for(let i=0;i<14;i++){const a=i*2,c=sphere((.58+(i%3)*.09)*s,sm(greens[i%greens.length]),x+Math.cos(a)*.85*s,4.05*s+(i%4)*.18*s,z+Math.sin(a)*.72*s,scene,16);c.scale.set(1.05,.92,1)}}
function pineTree(x,z,s=1){cyl(.14*s,.22*s,2.8*s,M.wood,x,3*s,z,16);const green=sm(0x4e753d);for(let i=0;i<5;i++){const cone=add(new THREE.Mesh(new THREE.ConeGeometry((1.05-i*.14)*s,1.55*s,18),green));cone.position.set(x,2.9*s+i*.72*s,z)}}
floweringTree(-6,-2.1,1);shadeTree(5.6,-2.6,.95);pineTree(2,-5.7,.9);

function flower(x,z,color=0xffffff,s=.9){const g=new THREE.Group();scene.add(g);g.position.set(x,1.7,z);cyl(.02,.026,.48*s,sm(0x4f7b43),0,.24*s,0,8,g);for(let i=0;i<6;i++){const a=i/6*Math.PI*2,p=sphere(.065*s,sm(color),Math.cos(a)*.09*s,.5*s,Math.sin(a)*.09*s,g,10);p.scale.set(1.4,.7,1)}sphere(.05*s,sm(0xe0b34d),0,.5*s,0,g,10)}
const fp=[0xffffff,0xf2a8b9,0xf7cc62,0xcbb0e9,0xf3a06b,0x83a9d6,0x8e76bd];
for(let i=0;i<100;i++){const a=i*2.399,r=3.9+(i%12)*.34,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<1.2&&z>-1.5&&z<6.8)continue;flower(x,z,fp[i%fp.length],.75+(i%3)*.14)}

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),label=document.getElementById("label"),toast=document.getElementById("toast");
function labeled(obj){let o=obj;while(o){if(o.userData?.label)return o;o=o.parent}return null}
renderer.domElement.addEventListener("pointermove",e=>{pointer.x=e.clientX/innerWidth*2-1;pointer.y=-(e.clientY/innerHeight)*2+1;raycaster.setFromCamera(pointer,camera);const h=raycaster.intersectObjects(scene.children,true).map(v=>labeled(v.object)).find(Boolean);if(h){label.hidden=false;label.textContent=h.userData.label;label.style.left=e.clientX+"px";label.style.top=e.clientY+"px";renderer.domElement.style.cursor="pointer"}else{label.hidden=true;renderer.domElement.style.cursor="grab"}});
renderer.domElement.addEventListener("click",e=>{pointer.x=e.clientX/innerWidth*2-1;pointer.y=-(e.clientY/innerHeight)*2+1;raycaster.setFromCamera(pointer,camera);const h=raycaster.intersectObjects(scene.children,true).map(v=>labeled(v.object)).find(Boolean);if(!h)return;const msg={"Message Board":"Visitor notes will live here 📌","Gacha Machine":"A tiny island charm drops out ✨","Rocking Horse":"creak… creak… 🎠","Mailbox":"A little letter is waiting inside 📮","Bench / Tea Table":"A quiet place for tea ☕","Tea Table":"Tea time ☕"};toast.hidden=false;toast.textContent=msg[h.userData.label]||h.userData.label;clearTimeout(window.__toast);window.__toast=setTimeout(()=>toast.hidden=true,1700)});

const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);const t=clock.getElapsedTime();horse.rotation.z=Math.sin(t*1.1)*.016;sea.rotation.z+=.00004;controls.update();renderer.render(scene,camera)}
animate();
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
setTimeout(()=>document.getElementById("loading").classList.add("hide"),1600);
