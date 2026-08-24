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
renderer.toneMappingExposure=1.55;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8ed7f4);
scene.fog=new THREE.Fog(0xbce9f5,34,80);

const camera=new THREE.PerspectiveCamera(47,innerWidth/innerHeight,.1,160);
camera.position.set(17,12,18);

const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,1.6,0);
controls.enableDamping=true;
controls.dampingFactor=.055;
controls.minDistance=8.5;
controls.maxDistance=31;
controls.minPolarAngle=THREE.MathUtils.degToRad(24);
controls.maxPolarAngle=THREE.MathUtils.degToRad(82);
controls.enablePan=true;

document.getElementById("reset").onclick=()=>{camera.position.set(17,12,18);controls.target.set(0,1.6,0);controls.update()};

// ------------------ painterly material helpers ------------------
function paintTexture(base, strokes, seed=1, size=512){
  const c=document.createElement("canvas"); c.width=c.height=size;
  const x=c.getContext("2d");
  x.fillStyle=base; x.fillRect(0,0,size,size);
  let s=seed>>>0; const r=()=>((s=(Math.imul(1664525,s)+1013904223)>>>0)/4294967296);

  for(let i=0;i<9000;i++){
    x.globalAlpha=.018+r()*.045;
    x.fillStyle=strokes[Math.floor(r()*strokes.length)];
    const px=r()*size,py=r()*size,rx=.5+r()*4,ry=.3+r()*2.4;
    x.beginPath();x.ellipse(px,py,rx,ry,r()*Math.PI,0,Math.PI*2);x.fill();
  }
  for(let i=0;i<280;i++){
    x.globalAlpha=.02+r()*.05;
    x.strokeStyle=strokes[Math.floor(r()*strokes.length)];
    x.lineWidth=.4+r()*1.6;
    x.beginPath();x.moveTo(r()*size,r()*size);
    x.bezierCurveTo(r()*size,r()*size,r()*size,r()*size,r()*size,r()*size);x.stroke();
  }
  x.globalAlpha=1;
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);return t;
}
function watercolorMat(base, strokes, seed, rough=.95, metal=0){
  return new THREE.MeshStandardMaterial({map:paintTexture(base,strokes,seed),roughness:rough,metalness:metal});
}
function solid(c,r=.9,m=0){return new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m})}

const MAT={
 grass:watercolorMat("#8fc466",["#6c9f50","#b7d77b","#dce8a2"],1),
 cliff:watercolorMat("#b8a27e",["#876f55","#d9c7a5","#71624f"],2),
 stone:watercolorMat("#cfbea0",["#9e896d","#e4d6ba","#8a7963"],3),
 wood:watercolorMat("#9a6846",["#704832","#bd865a","#d2a378"],4),
 woodDark:watercolorMat("#6f4b34",["#4e3326","#8b6346","#a77d59"],5),
 stucco:watercolorMat("#efe1c6",["#d5c3a5","#fff4dc","#b9a387"],6),
 red:watercolorMat("#bd6541",["#8c4934","#d8865c","#e2a076"],7,.86),
 cream:watercolorMat("#f3e7d1",["#dac7a9","#fff9e8","#c1a98a"],8),
 foliage:watercolorMat("#62894a",["#3e6737","#7aa45a","#a3bb78"],9),
 iron:solid(0x393833,.55,.18),
 brass:solid(0xb38b48,.45,.3),
 white:solid(0xf7ead4,.92)
};

function add(m,p=scene){m.castShadow=true;m.receiveShadow=true;p.add(m);return m}
function box(w,h,d,mat,x=0,y=0,z=0,p=scene){const m=add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat),p);m.position.set(x,y,z);return m}
function cyl(rt,rb,h,mat,x=0,y=0,z=0,seg=32,p=scene){const m=add(new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat),p);m.position.set(x,y,z);return m}
function sph(r,mat,x=0,y=0,z=0,p=scene,seg=24){const m=add(new THREE.Mesh(new THREE.SphereGeometry(r,seg,Math.max(14,seg-4)),mat),p);m.position.set(x,y,z);return m}

// ------------------ lighting ------------------
scene.add(new THREE.HemisphereLight(0xffffff,0x6d805a,2.55));
const sun=new THREE.DirectionalLight(0xffefc2,5.2);sun.position.set(13,20,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-24;sun.shadow.camera.right=24;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;scene.add(sun);
const fill=new THREE.DirectionalLight(0xffd596,1.2);fill.position.set(-12,9,-8);scene.add(fill);

// ------------------ sea ------------------
const seaMat=new THREE.MeshPhysicalMaterial({color:0x54b7d1,roughness:.3,metalness:.02,transparent:true,opacity:.98});
const sea=add(new THREE.Mesh(new THREE.CircleGeometry(70,160),seaMat));sea.rotation.x=-Math.PI/2;sea.position.y=-1.7;
for(let i=0;i<12;i++){const ring=new THREE.Mesh(new THREE.RingGeometry(10+i*4.1,10.05+i*4.1,128),new THREE.MeshBasicMaterial({color:0xd9f7ff,transparent:true,opacity:.12,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-1.68;scene.add(ring)}

// ------------------ sculpted island terrain ------------------
const island=new THREE.Group();scene.add(island);
const cliff=add(new THREE.Mesh(new THREE.CylinderGeometry(9.2,8.0,2.8,96),MAT.cliff),island);cliff.position.y=-.05;
const top=add(new THREE.Mesh(new THREE.CylinderGeometry(9.28,8.92,.5,96),MAT.grass),island);top.position.y=1.58;

// stepped / irregular edge
for(let i=0;i<72;i++){
 const a=i/72*Math.PI*2, rr=8.58+Math.sin(i*.83)*.28, sz=.25+(i%6)*.045;
 const rock=add(new THREE.Mesh(new THREE.DodecahedronGeometry(sz,0),MAT.stone),island);
 rock.position.set(Math.cos(a)*rr,.5+Math.sin(i*.5)*.08,Math.sin(a)*rr);
 rock.rotation.set(i*.18,i*.27,i*.12);rock.scale.set(1,.8+(i%3)*.13,1);
}

// stone path with irregular slabs
for(let i=0;i<13;i++){
 const z=6.7-i*.82,x=Math.sin(i*.68)*.55;
 const s=box(1.2+(i%3)*.12,.12,.62,MAT.stone,x,1.88,z);
 s.rotation.y=(i%2? .14:-.1);s.rotation.z=(i%3-1)*.025;
}

// ------------------ Message Board ------------------
const wall=new THREE.Group();wall.position.set(-4.4,1.82,.2);wall.rotation.y=.1;scene.add(wall);wall.userData.label="Message Board";
box(4.55,2.75,.5,MAT.stucco,0,1.4,0,wall);

// irregular side stones + top cap
for(let y=.2;y<2.6;y+=.42){box(.24,.36,.56,MAT.stone,-2.28,y,0,wall);box(.24,.36,.56,MAT.stone,2.28,y,0,wall)}
for(let x=-2.1;x<2.2;x+=.45){const s=box(.42,.18,.56,MAT.stone,x,2.82,0,wall);s.rotation.z=Math.sin(x*5)*.04}

const cork=box(3.6,1.7,.09,MAT.wood,0,1.45,-.3,wall);
const noteColors=[0xfff1ad,0xf6d8df,0xd8eaf5,0xe5efcc,0xf8e6c7];
for(let r=0;r<3;r++)for(let c=0;c<6;c++){
 const n=box(.45,.36,.025,solid(noteColors[(r+c)%noteColors.length]),-1.25+c*.5,1.86-r*.47,-.355,wall);
 n.rotation.z=((r+c)%4-1.5)*.045;
 sph(.03,MAT.brass,n.position.x,n.position.y+.13,-.38,wall,12);
}
// back bracing
box(.22,2.25,.18,MAT.woodDark,-1.25,1.25,.39,wall);box(.22,2.25,.18,MAT.woodDark,1.25,1.25,.39,wall);box(2.85,.18,.18,MAT.woodDark,0,1.4,.39,wall);
// ivy
for(let i=0;i<46;i++){
 const x=-2.2+(i%12)*.42,y=2.55+(i%5)*.17;
 const l=sph(.1+(i%3)*.025,MAT.foliage,x,y,-.1-(i%3)*.03,wall,14);l.scale.set(1,1.5,.7);
}

// ------------------ Gacha Machine ------------------
const gacha=new THREE.Group();gacha.position.set(2.8,1.9,.5);scene.add(gacha);gacha.userData.label="Gacha Machine";
box(1.6,1.65,1.2,MAT.red,0,.83,0,gacha);
for(const x of [-.76,.76])for(const z of [-.56,.56])cyl(.045,.045,1.58,MAT.brass,x,.82,z,12,gacha);
for(let y=.18;y<1.55;y+=.34){box(1.5,.035,.03,MAT.brass,0,y,-.61,gacha)}
const globeMat=new THREE.MeshPhysicalMaterial({color:0xe8fbff,roughness:.03,transmission:.32,transparent:true,opacity:.46,thickness:.12});
sph(.93,globeMat,0,2.17,0,gacha,40);
const caps=[0xe9a0a0,0xefc86b,0x8ec6df,0x94c67d,0xd7add8,0xf5dc91];
for(let i=0;i<28;i++){const a=i*2.37,rad=.64*Math.sqrt((i+2)/30);sph(.17,solid(caps[i%caps.length]),Math.cos(a)*rad,1.82+(i%6)*.13,Math.sin(a)*rad,gacha,16)}
cyl(.68,.68,.19,MAT.red,0,3.05,0,36,gacha);
box(1.75,.24,.28,MAT.wood,0,3.42,0,gacha);
const crankBase=cyl(.25,.25,.14,MAT.brass,0,.97,-.67,24,gacha);crankBase.rotation.x=Math.PI/2;
const crank=cyl(.075,.075,.58,MAT.brass,0,.97,-.9,16,gacha);crank.rotation.x=Math.PI/2;
box(.3,.15,.15,MAT.brass,.28,.97,-1.12,gacha);
box(.5,.44,.06,MAT.iron,-.22,.35,-.64,gacha);

// ------------------ Rocking Horse ------------------
const horse=new THREE.Group();horse.position.set(-2.6,1.95,3.65);horse.rotation.y=.38;scene.add(horse);horse.userData.label="Rocking Horse";
for(const z of [-.45,.45]){
 const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.08,0,z),new THREE.Vector3(-.5,-.18,z),new THREE.Vector3(0,-.24,z),new THREE.Vector3(.5,-.18,z),new THREE.Vector3(1.08,0,z)]);
 add(new THREE.Mesh(new THREE.TubeGeometry(curve,42,.08,12,false),MAT.woodDark),horse);
}
box(1.85,.1,.1,MAT.wood,-.02,.18,-.45,horse);box(1.85,.1,.1,MAT.wood,-.02,.18,.45,horse);
for(const x of [-.7,.7])box(.11,.58,.16,MAT.wood,x,.25,0,horse);

// torso & neck
const body=add(new THREE.Mesh(new THREE.CapsuleGeometry(.46,1.05,10,18),MAT.cream),horse);body.rotation.z=Math.PI/2;body.position.set(-.08,.82,0);
const neck=add(new THREE.Mesh(new THREE.CapsuleGeometry(.25,.72,8,16),MAT.cream),horse);neck.rotation.z=-.36;neck.position.set(.5,1.16,0);
const head=sph(.38,MAT.cream,.88,1.45,0,horse,28);head.scale.set(1.05,.92,.92);
box(.42,.24,.32,MAT.cream,1.15,1.35,0,horse);
for(const z of [-.16,.16]){const ear=add(new THREE.Mesh(new THREE.ConeGeometry(.09,.32,12),MAT.cream),horse);ear.position.set(.89,1.78,z);ear.rotation.z=-.12}
// mane & tail
for(let i=0;i<10;i++){const m=sph(.085,MAT.woodDark,.62-i*.08,1.52-i*.04,.15,horse,12);m.scale.set(.75,1.5,.75)}
for(let i=0;i<8;i++){const t=sph(.09,MAT.woodDark,-.72-i*.08,.9-i*.04,0,horse,12);t.scale.set(1.3,.65,.65)}
// legs + hooves
for(const x of [-.38,.38])for(const z of [-.25,.25]){const leg=cyl(.075,.09,.68,MAT.cream,x,.3,z,14,horse);leg.rotation.z=(x>0?-.08:.08);box(.2,.13,.22,MAT.iron,x,.02,z,horse)}
// saddle + brass
box(.7,.13,.62,MAT.red,-.12,1.12,0,horse);
box(.78,.055,.055,MAT.brass,-.12,1.12,-.34,horse);box(.78,.055,.055,MAT.brass,-.12,1.12,.34,horse);
const handle=cyl(.045,.045,.88,MAT.brass,.66,1.42,0,14,horse);handle.rotation.z=Math.PI/2;

// ------------------ Mailbox ------------------
const mb=new THREE.Group();mb.position.set(-.7,1.95,6.35);scene.add(mb);mb.userData.label="Mailbox";
cyl(.17,.24,1.5,MAT.wood,0,.75,0,18,mb);
box(.72,.12,.78,MAT.wood,0,1.48,0,mb);
box(.94,.58,.8,MAT.stucco,0,1.84,0,mb);
const mtop=add(new THREE.Mesh(new THREE.CylinderGeometry(.47,.47,.8,28,1,false,0,Math.PI),MAT.stucco),mb);mtop.rotation.z=Math.PI/2;mtop.position.set(0,2.13,0);
box(.7,.56,.045,MAT.stucco,0,1.84,-.43,mb);
box(.32,.055,.025,MAT.iron,0,1.97,-.46,mb);
box(.055,.8,.055,MAT.red,.54,2.05,0,mb);box(.28,.18,.055,MAT.red,.66,2.39,0,mb);

// ------------------ Bench + Tea Table ------------------
const bench=new THREE.Group();bench.position.set(4.3,1.9,3.3);bench.rotation.y=-.72;scene.add(bench);bench.userData.label="Bench / Tea Table";
box(2.3,.17,.78,MAT.wood,0,.48,-.16,bench);
for(let i=0;i<5;i++)box(2.2,.115,.17,MAT.wood,0,.72+i*.18,.14,bench);
for(const x of [-.92,.92]){box(.14,.86,.18,MAT.wood,x,.23,-.2,bench);box(.14,1.05,.18,MAT.wood,x,.75,.14,bench)}
// heart medallion
const hm=sph(.1,MAT.brass,0,1.52,.18,bench,18);hm.scale.set(1,.9,.3);

const tea=new THREE.Group();tea.position.set(2.7,1.95,3.4);scene.add(tea);tea.userData.label="Tea Table";
cyl(.62,.62,.13,MAT.wood,0,.5,0,30,tea);cyl(.11,.16,.82,MAT.wood,0,.08,0,18,tea);
const pot=cyl(.2,.24,.25,MAT.white,-.08,.72,0,20,tea);sph(.15,MAT.white,-.08,.9,0,tea,18);
const spout=cyl(.045,.075,.34,MAT.white,.14,.78,0,14,tea);spout.rotation.z=-Math.PI/2.6;
cyl(.11,.12,.12,MAT.white,.31,.67,.1,18,tea);

// ------------------ trees ------------------
function floweringTree(x,z,s=1){
 const trunk=cyl(.2*s,.3*s,2.6*s,MAT.wood,x,3.1*s,z,20);
 const pink=[0xf3b4c0,0xf8c8cf,0xf0a2b3,0xf8d4d8];
 for(let i=0;i<28;i++){const a=i*2.06,r=.7+(i%5)*.12,c=sph((.36+(i%4)*.07)*s,solid(pink[i%pink.length]),x+Math.cos(a)*r*s,4.25*s+(i%6)*.14*s,z+Math.sin(a)*r*.8*s,scene,16);c.scale.set(1.05,.9,1)}
}
function shadeTree(x,z,s=1){
 cyl(.22*s,.32*s,2.65*s,MAT.wood,x,3.15*s,z,20);
 const greens=[0x557d45,0x6f9852,0x86aa63,0x9aba73];
 for(let i=0;i<24;i++){const a=i*2.03,r=.7+(i%5)*.12,c=sph((.4+(i%3)*.08)*s,solid(greens[i%greens.length]),x+Math.cos(a)*r*s,4.3*s+(i%5)*.16*s,z+Math.sin(a)*r*.8*s,scene,16);c.scale.set(1.08,.92,1)}
}
function pine(x,z,s=1){
 cyl(.15*s,.24*s,3*s,MAT.wood,x,3.2*s,z,18);
 const dark=solid(0x4c743b);
 for(let i=0;i<6;i++){const c=add(new THREE.Mesh(new THREE.ConeGeometry((1.18-i*.13)*s,1.5*s,24),dark));c.position.set(x,3*s+i*.68*s,z)}
}
floweringTree(-6.2,-2.2,1.05);shadeTree(5.8,-2.7,.98);pine(2.1,-5.9,.93);

// ------------------ flowers ------------------
function flower(x,z,color,scale=.9){
 const g=new THREE.Group();scene.add(g);g.position.set(x,1.9,z);
 cyl(.017,.025,.5*scale,solid(0x4c7a40),0,.25*scale,0,8,g);
 for(let i=0;i<7;i++){const a=i/7*Math.PI*2,p=sph(.062*scale,solid(color),Math.cos(a)*.085*scale,.52*scale,Math.sin(a)*.085*scale,g,10);p.scale.set(1.45,.72,1)}
 sph(.045*scale,solid(0xe2b64f),0,.52*scale,0,g,10);
}
const colors=[0xffffff,0xf1a4b7,0xf7cd5f,0xc8afe5,0xf39d69,0x85a8d8,0x866eb8,0xe792a5,0xf2be43];
for(let i=0;i<145;i++){
 const a=i*2.399,r=4.0+(i%15)*.31,x=Math.cos(a)*r,z=Math.sin(a)*r;
 if(Math.abs(x)<1.15&&z>-1.5&&z<7)continue;
 flower(x,z,colors[i%colors.length],.72+(i%4)*.12);
}

// ------------------ clouds + balloons ------------------
function cloud(x,y,z,s=1){
 const g=new THREE.Group();scene.add(g);const m=solid(0xffffff,1);
 [[-.8,0,.7],[0,0,.98],[.8,0,.72],[-.2,.46,.8],[.5,.4,.64]].forEach(([px,py,r])=>{const c=sph(r*s,m,px*s,py*s,0,g,18);c.castShadow=false});
 g.position.set(x,y,z);return g;
}
function balloon(x,y,z,c){
 const g=new THREE.Group();scene.add(g);const b=sph(.5,solid(c),0,0,0,g,22);b.scale.y=1.25;
 const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-.6,0),new THREE.Vector3(.04,-2.15,0)]);
 g.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x756857})));g.position.set(x,y,z);return g;
}
const clouds=[cloud(-10,8,-14,1.6),cloud(6,9,-18,1.9),cloud(14,7,-10,1.25)];
const balloons=[balloon(-6.8,7,-4.4,0xe58b7f),balloon(5.1,8,-7,0xf1c769),balloon(8.5,6.5,-1,0xe4a5a1),balloon(-1.2,8.7,-9,0x86b5d5)];

// ------------------ interaction ------------------
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),tip=document.getElementById("tip");
function labeled(o){let p=o;while(p){if(p.userData?.label)return p;p=p.parent}return null}
renderer.domElement.addEventListener("pointermove",e=>{
 pointer.x=e.clientX/innerWidth*2-1;pointer.y=-(e.clientY/innerHeight)*2+1;ray.setFromCamera(pointer,camera);
 const h=ray.intersectObjects(scene.children,true).map(v=>labeled(v.object)).find(Boolean);
 if(h){tip.hidden=false;tip.textContent=h.userData.label;tip.style.left=e.clientX+"px";tip.style.top=e.clientY+"px";renderer.domElement.style.cursor="pointer"}else{tip.hidden=true;renderer.domElement.style.cursor="grab"}
});

const clock=new THREE.Clock();
function animate(){
 requestAnimationFrame(animate);
 const t=clock.getElapsedTime();
 horse.rotation.z=Math.sin(t*1.05)*.015;
 balloons.forEach((b,i)=>{b.position.y+=Math.sin(t*.7+i)*.0014});
 clouds.forEach((c,i)=>{c.position.x+=.0009*(i+1);if(c.position.x>19)c.position.x=-19});
 controls.update();renderer.render(scene,camera);
}
animate();

addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
setTimeout(()=>document.getElementById("loader").classList.add("hide"),1500);
