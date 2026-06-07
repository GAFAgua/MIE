import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Group,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

var panel = document.querySelector("[data-model-viewer]");
var mount = document.querySelector("[data-model-canvas]");
var statusText = document.querySelector("[data-model-status]");

if (panel && mount) {
  initModel();
}

function initModel() {
  var renderer;

  try {
    renderer = new WebGLRenderer({
      antialias: true,
      alpha: true
    });
  } catch (error) {
    setStatus("当前浏览器不支持 3D");
    return;
  }

  var scene = new Scene();
  var camera = new PerspectiveCamera(34, 1, 0.01, 100);
  var group = new Group();
  var loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  var dragging = false;
  var lastX = 0;
  var targetRotation = 0.45;
  var currentRotation = 0.45;

  renderer.setClearColor(new Color(0xf8f8f8), 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  mount.appendChild(renderer.domElement);

  scene.add(group);
  scene.add(new AmbientLight(0xffffff, 1.6));

  var keyLight = new DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  var rimLight = new DirectionalLight(0xffffff, 0.75);
  rimLight.position.set(-4, 1, -3);
  scene.add(rimLight);

  camera.position.set(0, 0.2, 4);

  loader.load(
    "./assets/models/yangwen-xingye.glb",
    function (gltf) {
      var model = gltf.scene;
      fitModel(model);
      group.add(model);
      panel.classList.add("is-loaded");
      setStatus("");
    },
    undefined,
    function (error) {
      var message = "模型未载入";
      if (error && error.target && error.target.status) {
        message += " / " + error.target.status;
      } else if (error && error.message) {
        message += " / " + error.message;
      }
      window.__modelLoadError = message;
      setStatus(message);
    }
  );

  mount.addEventListener("pointerdown", function (event) {
    dragging = true;
    lastX = event.clientX;
    if (mount.setPointerCapture) {
      mount.setPointerCapture(event.pointerId);
    }
  });

  mount.addEventListener("pointermove", function (event) {
    if (!dragging) {
      return;
    }
    targetRotation += (event.clientX - lastX) * 0.012;
    lastX = event.clientX;
  });

  mount.addEventListener("pointerup", stopDrag);
  mount.addEventListener("pointercancel", stopDrag);
  window.addEventListener("resize", resize);

  resize();
  render();

  function fitModel(model) {
    var box = new Box3().setFromObject(model);
    var size = new Vector3();
    var center = new Vector3();

    box.getSize(size);
    box.getCenter(center);
    model.position.sub(center);

    var maxSize = Math.max(size.x, size.y, size.z);
    if (maxSize > 0) {
      model.scale.setScalar(1.62 / maxSize);
    }

    model.traverse(function (child) {
      if (child && child.isMesh) {
        child.material = new MeshStandardMaterial({
          color: 0xd8a51e,
          metalness: 0.82,
          roughness: 0.36
        });
      }
    });

    model.rotation.set(-0.18, 0.28, 0);
  }

  function stopDrag() {
    dragging = false;
  }

  function resize() {
    var rect = mount.getBoundingClientRect();
    var width = Math.max(rect.width, 1);
    var height = Math.max(rect.height, 1);

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function render() {
    currentRotation += (targetRotation - currentRotation) * 0.08;
    group.rotation.y = currentRotation;
    group.rotation.x = -0.08;
    renderer.render(scene, camera);
    window.requestAnimationFrame(render);
  }
}

function setStatus(text) {
  if (statusText) {
    statusText.textContent = text;
  }
}
