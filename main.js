import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.getElementById("world");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fd7fb);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0.1, 11.8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.minDistance = 8.5;
controls.maxDistance = 15.5;

// Important: limited orbit preserves the hand-painted composition while still feeling 3D.
controls.minAzimuthAngle = THREE.MathUtils.degToRad(-15);
controls.maxAzimuthAngle = THREE.MathUtils.degToRad(15);
controls.minPolarAngle = THREE.MathUtils.degToRad(75);
controls.maxPolarAngle = THREE.MathUtils.degToRad(105);

const loader = new THREE.TextureLoader();

loader.load("assets/main-island-art.png", (texture) => {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const imageAspect = texture.image.width / texture.image.height;
  const height = 7.6;
  const width = height * imageAspect;

  const segX = 160;
  const segY = 106;
  const geometry = new THREE.PlaneGeometry(width, height, segX, segY);

  // Depth sculpting:
  // preserve the exact artwork, but push foreground objects toward the camera
  // and recess sky / distant islands to create parallax.
  const pos = geometry.attributes.position;

  function gaussian(u, v, cx, cy, sx, sy, amp) {
    const dx = (u - cx) / sx;
    const dy = (v - cy) / sy;
    return amp * Math.exp(-(dx*dx + dy*dy) * 2.0);
  }

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);

    const u = x / width + 0.5;
    const v = y / height + 0.5;

    // Base perspective: foreground lower image comes closer.
    let z = (0.52 - v) * 0.55;

    // Main island foreground volume.
    z += gaussian(u, v, 0.50, 0.25, 0.42, 0.26, 1.05);

    // Message wall.
    z += gaussian(u, v, 0.34, 0.56, 0.10, 0.12, 0.62);

    // Rocking horse.
    z += gaussian(u, v, 0.34, 0.39, 0.085, 0.10, 0.48);

    // Gacha machine.
    z += gaussian(u, v, 0.61, 0.47, 0.075, 0.12, 0.56);

    // Bench / tea area.
    z += gaussian(u, v, 0.70, 0.27, 0.10, 0.10, 0.42);

    // Foreground tree on the left.
    z += gaussian(u, v, 0.08, 0.74, 0.12, 0.28, 0.35);

    // Main academic island in the distance.
    z -= gaussian(u, v, 0.54, 0.75, 0.12, 0.13, 0.32);

    // Perfume island.
    z -= gaussian(u, v, 0.72, 0.70, 0.11, 0.15, 0.28);

    // Art / Game island cluster.
    z -= gaussian(u, v, 0.86, 0.55, 0.12, 0.19, 0.20);

    // Sky is intentionally flat and farther back.
    if (v > 0.72) {
      z -= (v - 0.72) * 0.8;
    }

    pos.setZ(i, z);
  }

  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide
  });

  const diorama = new THREE.Mesh(geometry, material);
  diorama.position.z = 0;
  scene.add(diorama);

  // Slightly curved framing creates additional depth at the edges.
  const frameGeo = new THREE.PlaneGeometry(width * 1.015, height * 1.015, 1, 1);
  const frameMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.06,
    side: THREE.BackSide
  });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.z = -0.35;
  scene.add(frame);

  // A few real 3D particles in front of the illustration help sell the space.
  const sparkleGeometry = new THREE.BufferGeometry();
  const sparkleCount = 70;
  const points = new Float32Array(sparkleCount * 3);

  for (let i = 0; i < sparkleCount; i++) {
    points[i*3] = (Math.random() - 0.5) * width * 0.86;
    points[i*3+1] = (Math.random() - 0.5) * height * 0.72;
    points[i*3+2] = 0.4 + Math.random() * 1.1;
  }

  sparkleGeometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
  const sparkleMaterial = new THREE.PointsMaterial({
    color: 0xfff0a8,
    size: 0.035,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true
  });
  const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);
  scene.add(sparkles);

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    sparkles.rotation.z = Math.sin(t * 0.08) * 0.01;
    sparkles.position.y = Math.sin(t * 0.3) * 0.025;

    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  setTimeout(() => {
    document.getElementById("loader").classList.add("hide");
  }, 900);
}, undefined, (err) => {
  console.error(err);
  document.querySelector(".loader-sub").textContent = "Could not load the island artwork.";
});

document.getElementById("reset").addEventListener("click", () => {
  camera.position.set(0, 0.1, 11.8);
  controls.target.set(0, 0, 0);
  controls.update();
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
