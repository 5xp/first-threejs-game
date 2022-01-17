import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js";
import { Controller } from "./controls/Controller.js";

const clock = new THREE.Clock();
const stepsPerFrame = 5;
let scene, camera, renderer, controls, topDownCamera;

init();
update();

function init() {
  scene = new THREE.Scene();

  const aspectRatio = window.innerWidth / window.innerHeight;
  const fov = 75;

  camera = new THREE.PerspectiveCamera(fov, aspectRatio, 0.1, 3000);
  camera.rotation.order = "YXZ";

  // set up renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);

  const gridWidth = 3000;
  const gridHelper = new THREE.GridHelper(gridWidth, gridWidth / 64);
  scene.add(gridHelper);

  controls = new Controller(camera, renderer.domElement);
  camera.position.set(0, 64, 0);

  window.addEventListener("resize", onWindowResize);
}

function update() {
  requestAnimationFrame(update);

  const deltaTime = Math.min(0.05, clock.getDelta()) / stepsPerFrame;

  // split up the update into multiple steps for better collision
  for (let i = 0; i < stepsPerFrame; i++) {
    controls.updatePlayer(deltaTime);
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
