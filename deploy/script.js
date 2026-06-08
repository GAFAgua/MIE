import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/libs/meshopt_decoder.module.js";

const app = document.querySelector(".app");
const modelStage = document.querySelector("#modelStage");
const canvas = document.querySelector("#relicCanvas");
const modelPreview = document.querySelector("#modelPreview");
const modelLoading = document.querySelector("#modelLoading");
const modelLoadingDetail = document.querySelector("#modelLoadingDetail");
const hudTop = document.querySelector("#hudTop");
const hudLeft = document.querySelector("#hudLeft");
const hudCode = document.querySelector("#hudCode");
const hudTitle = document.querySelector("#hudTitle");
const hudText = document.querySelector("#hudText");
const buttons = [...document.querySelectorAll("[data-key]")];
const progressText = document.querySelector("#progressText");
const progressFill = document.querySelector("#progressFill");
const sceneKicker = document.querySelector("#sceneKicker");
const sceneTitle = document.querySelector("#sceneTitle");
const sceneText = document.querySelector("#sceneText");
const detailFeature = document.querySelector("#detailFeature");
const detailTranslate = document.querySelector("#detailTranslate");
const annotationLabel = document.querySelector("#annotationLabel");
const reportGrid = document.querySelector("#reportGrid");
const resetButton = document.querySelector("#resetButton");

const scenes = {
  1: {
    id: "outline",
    kicker: "KEY 1 / FORM",
    title: "杏形轮廓",
    text: "模型正对观察台，直接查看 Tripo 生成的整体轮廓。",
    feature: "外形特征",
    translate: "由八块杏形金薄片组成，轮廓信息对应金片单元的边界。",
    annotation: "正面观察：查看整体杏形和浮雕分布",
    code: "FORM-01",
    hud: "外缘闭合曲线标记杏形金薄片边界。该类金片原缀于南越王玉衣面罩丝巾之上，边界用于理解其组合方式。",
    rotation: [-0.06, 0, 0],
    zoom: 0.94,
  },
  2: {
    id: "foil",
    kicker: "KEY 2 / MATERIAL",
    title: "金箔薄片",
    text: "模型轻微转向，观察金叶薄片边缘和整体外轮廓。",
    feature: "材质特征",
    translate: "金片为薄金属片，侧缘显示金箔薄片与浮雕起伏的差异。",
    annotation: "斜侧观察：外轮廓线稿贴近模型表面",
    code: "MAT-02",
    hud: "侧缘线追踪金箔厚度。丝巾已朽烂而金饰保存，使薄片材质成为判断佩缀方式的重要依据。",
    rotation: [-0.05, 0.38, 0],
    zoom: 0.96,
  },
  3: {
    id: "relief",
    kicker: "KEY 3 / CRAFT",
    title: "锤鍱纹理",
    text: "斜向光照扫过模型，凸起纹理随光线显影。",
    feature: "工艺特征",
    translate: "凸起线条对应锤鍱工艺形成的浮雕高差。",
    annotation: "斜光下查看浮雕高差",
    code: "CRAFT-03",
    hud: "细框锁定锤鍱形成的弧形肋纹。线条不是装饰轮廓，而是在读取金片表面的敲压痕迹。",
    rotation: [-0.32, 0.34, -0.04],
    zoom: 1.08,
  },
  4: {
    id: "ram",
    kicker: "KEY 4 / MOTIF",
    title: "羊头纹",
    text: "镜头靠近上方羊头纹，观察尖角、眼窝、鼻梁和兽面结构。",
    feature: "纹样特征",
    translate: "装饰图案为两个尖角羊头纹，羊头纹饰两两相背。",
    annotation: "特写观察：羊头纹是模型主体",
    code: "MOTIF-04",
    hud: "顶部细线标注尖角羊头纹。尖角、眼窝与鼻梁构成识别点，并与草原文化纹饰发生联系。",
    rotation: [-0.18, -0.12, 0],
    zoom: 1.18,
  },
  5: {
    id: "symmetry",
    kicker: "KEY 5 / STRUCTURE",
    title: "双羊相背",
    text: "模型回到正面，查看中轴两侧的对称关系。",
    feature: "结构特征",
    translate: "中轴组织左右两组羊头，使双羊相背的结构变得清晰。",
    annotation: "沿中轴观察，左右纹样形成稳定秩序",
    code: "STRUCT-05",
    hud: "中轴线将左右浮雕分为相背的两组羊头。对称关系提示金片图案并非单个兽面，而是双羊结构。",
    rotation: [-0.04, 0, 0],
    zoom: 1,
  },
  6: {
    id: "stitch",
    kicker: "KEY 6 / USE",
    title: "缝缀小孔",
    text: "模型略微倾斜，查看孔洞和边缘位置。",
    feature: "使用特征",
    translate: "孔洞和边缘位置提示其原本可能用于缝缀固定。",
    annotation: "小孔不是装饰，而是缝缀功能的证据",
    code: "USE-06",
    hud: "孔位被作为功能节点标出。它们联系到金饰原缀于丝巾之上的保存信息，而不是纯装饰点。",
    rotation: [-0.1, -0.42, 0.02],
    zoom: 1.04,
  },
};

const observed = new Set();
const MODEL_FRONT_OFFSET_Y = -Math.PI / 2;
const targetRotation = new THREE.Euler(-0.08, 0.16, 0);
const currentRotation = new THREE.Euler(-0.08, 0.16, 0);

let renderer;
let scene;
let camera;
let relicRoot;
let modelPivot;
let annotationRoot;
let lineOverlayRoot;
let scanRoot;
let flowRoot;
let resetTimer = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
let targetZoom = 1;
let currentZoom = 1;

function syncLineOverlayFacing() {
  if (!lineOverlayRoot || !modelPivot) return;
  const sideways = Math.abs(modelPivot.rotation.y);
  const compensation = THREE.MathUtils.clamp(modelPivot.rotation.y * -0.35, -0.26, 0.26);
  lineOverlayRoot.rotation.y = sideways > 0.22 ? compensation : 0;
}

function updateProgress() {
  const count = observed.size;
  progressText.textContent = `已观察 ${count}/6`;
  progressFill.style.width = `${(count / 6) * 100}%`;

  buttons.forEach((button) => {
    const done = observed.has(button.dataset.key);
    button.classList.toggle("is-done", done);
    button.querySelector("em").textContent = done ? "已观察" : "未观察";
  });

  if (count === 6) {
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(showReport, 900);
  }
}

function setTarget(rotation, zoom = 1) {
  targetRotation.set(rotation[0], rotation[1], rotation[2]);
  targetZoom = zoom;
}

function setIdle() {
  app.dataset.scene = "idle";
  app.dataset.report = "closed";
  setAnnotation("none");
  updateHud({
    id: "idle",
    code: "MIE-00",
    title: "待观察",
    hud: "选择右侧词条，系统将在模型表面显示对应识别线、采样点和结构说明。",
  });
  sceneKicker.textContent = "OBSERVATION DESK";
  sceneTitle.textContent = "Tripo 真实 3D 金叶观察台";
  sceneText.textContent = "选择一个观察点，查看金叶的形状、材质、工艺、纹样、结构和用途。";
  detailFeature.textContent = "完整金叶";
  detailTranslate.textContent = "当前加载的是 Tripo 生成的 GLB 模型，可拖动旋转。";
  annotationLabel.textContent = "拖动模型可自由旋转，按 1-6 进入观察镜头";
  buttons.forEach((button) => button.classList.remove("is-active"));
  setTarget([-0.08, 0.16, 0], 1);
}

function playScene(key) {
  const item = scenes[key];
  if (!item) return;

  window.clearTimeout(resetTimer);
  app.dataset.report = "closed";
  app.dataset.scene = item.id;
  setAnnotation(item.id);
  updateHud(item);
  observed.add(key);
  updateProgress();

  sceneKicker.textContent = item.kicker;
  sceneTitle.textContent = item.title;
  sceneText.textContent = item.text;
  detailFeature.textContent = item.feature;
  detailTranslate.textContent = item.translate;
  annotationLabel.textContent = item.annotation;
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.key === key);
  });
  setTarget(item.rotation, item.zoom);
}

function showReport() {
  reportGrid.innerHTML = Object.entries(scenes)
    .map(
      ([key, item]) => `
        <article>
          <span>${key}</span>
          <strong>${item.title}</strong>
          <p>${item.translate}</p>
        </article>
      `,
    )
    .join("");
  app.dataset.report = "open";
}

function resetObservation() {
  observed.clear();
  updateProgress();
  setIdle();
}

function initRenderer() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.05, 6.2);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const mobileViewport = window.matchMedia("(max-width: 720px)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobileViewport ? 1.35 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;

  scene.add(new THREE.HemisphereLight(0xf5f5f2, 0x565a5d, 1.12));

  const key = new THREE.DirectionalLight(0xffffff, 2.45);
  key.position.set(-3.2, 4.1, 5.2);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xb7c0c4, 0.72);
  fill.position.set(3.6, -1.4, 2.4);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 1.35);
  rim.position.set(0, 2.5, -3.2);
  scene.add(rim);

  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 3.9, 0.04),
    new THREE.MeshPhysicalMaterial({
      color: 0xd8dcdd,
      transparent: true,
      opacity: 0.14,
      roughness: 0.06,
      metalness: 0,
      transmission: 0.35,
    }),
  );
  panel.position.set(0, 0, -0.28);
  scene.add(panel);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 0.26, 0.58),
    new THREE.MeshStandardMaterial({ color: 0x6b6c68, roughness: 0.48, metalness: 0.05 }),
  );
  base.position.set(0, -2.08, -0.16);
  scene.add(base);

  modelPivot = new THREE.Group();
  scene.add(modelPivot);
  annotationRoot = new THREE.Group();
  annotationRoot.visible = false;
  modelPivot.add(annotationRoot);
  lineOverlayRoot = new THREE.Group();
  modelPivot.add(lineOverlayRoot);
  scanRoot = new THREE.Group();
  flowRoot = new THREE.Group();
  modelPivot.add(scanRoot, flowRoot);

  resizeRenderer();
  loadModel();
  animate();
}

function tintModel(root) {
  const paleGold = new THREE.MeshStandardMaterial({
    color: 0xb7a86e,
    metalness: 0.48,
    roughness: 0.5,
    envMapIntensity: 0.42,
    transparent: false,
    opacity: 1,
    depthWrite: true,
  });

  root.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    child.material = paleGold.clone();
    addLedEdges(child);
  });
}

function addLedEdges(mesh) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 34);
  const material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.92,
    depthTest: false,
  });
  const line = new THREE.LineSegments(edges, material);
  line.renderOrder = 40;
  line.scale.setScalar(1.003);
  mesh.add(line);

  const glowMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.32,
    depthTest: false,
  });
  const glow = new THREE.LineSegments(edges.clone(), glowMaterial);
  glow.renderOrder = 39;
  glow.scale.setScalar(1.012);
  mesh.add(glow);
}

function frameModel(root) {
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);

  root.position.sub(center);
  root.scale.setScalar(2.72 / maxSize);
  root.rotation.y = MODEL_FRONT_OFFSET_Y;

  const framedBox = new THREE.Box3().setFromObject(root);
  root.position.y -= framedBox.getCenter(new THREE.Vector3()).y * 0.12;
}

function loadModel() {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const startedAt = performance.now();

  loader.load(
    canvas.dataset.model,
    (gltf) => {
      relicRoot = gltf.scene;
      tintModel(relicRoot);
      frameModel(relicRoot);
      modelPivot.add(relicRoot);
      createLineOverlays();
      createScanField();
      canvas.classList.add("is-ready");
      modelPreview.classList.add("is-hidden");
      modelLoading.classList.add("is-hidden");
    },
    (event) => {
      if (!event.lengthComputable) {
        if (performance.now() - startedAt > 1800) {
          modelLoadingDetail.textContent = "模型文件较大，正在继续加载；当前可先浏览文字信息。";
        }
        return;
      }
      const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
      modelLoadingDetail.textContent = `已加载 ${percent}% · 首次打开会稍慢，之后浏览器会缓存`;
    },
    (error) => {
      modelLoading.querySelector("strong").textContent = "3D 模型加载失败";
      modelLoadingDetail.textContent = "已保留文物预览图，可以刷新或换网络后重试。";
      console.error(error);
    },
  );
}

function updateHud(item) {
  hudTop.textContent = `${item.code || "MIE-00"} / FORM-MATERIAL-RITUAL MAP`;
  hudLeft.textContent = `source: west han nanyue king museum / ${item.id || "idle"}`;
  hudCode.textContent = item.code || "MIE-00";
  hudTitle.textContent = item.title || "待观察";
  hudText.textContent = item.hud || item.text || "";
}

function setAnnotation(name) {
  if (annotationRoot) {
    annotationRoot.visible = false;
    annotationRoot.children.forEach((child) => {
      child.visible = false;
    });
  }
  if (lineOverlayRoot) {
    const activeName = name === "foil" ? "outline" : name;
    lineOverlayRoot.children.forEach((child) => {
      child.visible = child.name === activeName;
    });
  }
  if (flowRoot) {
    flowRoot.children.forEach((child) => {
      child.visible = false;
    });
  }
}

function createLineOverlays() {
  if (!lineOverlayRoot) return;
  lineOverlayRoot.clear();

  const assetPrefix = canvas.dataset.model.startsWith("assets/") ? "assets/" : "";
  const loader = new THREE.TextureLoader();
  const overlayScale = 0.92;
  const overlays = [
    {
      name: "outline",
      file: "outline-only.png",
      width: 3.18 * overlayScale,
      height: 3.18 * overlayScale,
      position: [0, 0.02, 0.18],
      opacity: 0.9,
    },
    {
      name: "relief",
      file: "relief.png",
      width: 3.12 * overlayScale,
      height: 2.55 * overlayScale,
      position: [0, 0.15, 0.185],
      opacity: 0.86,
    },
    {
      name: "ram",
      file: "ram.png",
      width: 1.48 * overlayScale,
      height: 0.82 * overlayScale,
      position: [0, 1.05, 0.19],
      opacity: 0.92,
    },
    {
      name: "symmetry",
      file: "symmetry.png",
      width: 3.05 * overlayScale,
      height: 2.25 * overlayScale,
      position: [0, -0.06, 0.188],
      opacity: 0.88,
    },
  ];

  overlays.forEach((overlay) => {
    loader.load(`${assetPrefix}line-overlays/${overlay.file}`, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: overlay.opacity,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(overlay.width, overlay.height), material);
      mesh.name = overlay.name;
      mesh.position.set(...overlay.position);
      mesh.renderOrder = 55;
      const activeName = app.dataset.scene === "foil" ? "outline" : app.dataset.scene;
      mesh.visible = mesh.name === activeName;
      lineOverlayRoot.add(mesh);
    });
  });
}

function point(x, y, z = 0.57) {
  return new THREE.Vector3(x, y, z);
}

function makeLineGroup(name) {
  const group = new THREE.Group();
  group.name = name;
  group.visible = false;
  annotationRoot.add(group);
  return group;
}

function addTube(group, coords, radius = 0.0038) {
  const curve = new THREE.CatmullRomCurve3(coords.map(([x, y, z]) => point(x, y, z)));
  const geometry = new THREE.TubeGeometry(curve, 72, radius, 6, false);
  const material = new THREE.MeshBasicMaterial({
    color: 0xff2838,
    depthTest: false,
    transparent: true,
    opacity: 1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 30;
  group.add(mesh);
  return mesh;
}

function addRing(group, x, y, radius = 0.045, z = 0.59) {
  const geometry = new THREE.TorusGeometry(radius, 0.0038, 8, 36);
  const material = new THREE.MeshBasicMaterial({
    color: 0xff2838,
    depthTest: false,
    transparent: true,
    opacity: 1,
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.position.set(x, y, z);
  ring.renderOrder = 31;
  group.add(ring);
  return ring;
}

function addBox(group, x, y, width, height, z = 0.6) {
  addTube(
    group,
    [
      [x - width / 2, y - height / 2, z],
      [x + width / 2, y - height / 2, z],
      [x + width / 2, y + height / 2, z],
      [x - width / 2, y + height / 2, z],
      [x - width / 2, y - height / 2, z],
    ],
    0.0032,
  );
}

function mirrorPath(coords) {
  return coords.map(([x, y, z]) => [-x, y, z]);
}

function addMirroredTube(group, coords, radius = 0.0038) {
  addTube(group, coords, radius);
  addTube(group, mirrorPath(coords), radius);
}

function createFeatureAnnotations() {
  annotationRoot.clear();

  const outerContour = [
    [0, 1.48], [0.38, 1.42], [0.76, 1.24], [1.04, 0.88], [1.24, 0.35],
    [1.3, -0.14], [1.2, -0.62], [0.98, -1.06], [0.6, -1.39],
    [0.22, -1.48], [-0.22, -1.48], [-0.6, -1.39], [-0.98, -1.06],
    [-1.2, -0.62], [-1.3, -0.14], [-1.24, 0.35], [-1.04, 0.88],
    [-0.76, 1.24], [-0.38, 1.42], [0, 1.48],
  ];

  const outline = makeLineGroup("outline");
  addTube(outline, outerContour, 0.0052);

  const foil = makeLineGroup("foil");
  addTube(foil, [[1.22, 1.28], [1.31, 0.74], [1.34, 0.12], [1.26, -0.58], [1.04, -1.18]], 0.005);
  addTube(foil, [[1.1, 1.18], [1.18, 0.56], [1.2, -0.2], [1.04, -0.96]], 0.0034);
  addTube(foil, [[1.18, 0.82, 0.48], [1.38, 0.82, 0.74]], 0.0032);
  addTube(foil, [[1.17, -0.24, 0.48], [1.36, -0.24, 0.74]], 0.0032);
  addTube(foil, [[0.48, -1.48], [0.9, -1.48], [1.08, -1.28]], 0.0034);

  const relief = makeLineGroup("relief");
  [
    [[-1.28, 0.82], [-1.05, 0.72], [-0.84, 0.56], [-0.66, 0.34], [-0.56, 0.1]],
    [[-1.28, 0.62], [-1.02, 0.5], [-0.78, 0.3], [-0.62, 0.04], [-0.55, -0.24]],
    [[-1.22, 0.4], [-0.96, 0.24], [-0.76, -0.02], [-0.65, -0.32], [-0.62, -0.62]],
    [[-0.5, 1.32], [-0.74, 1.3], [-0.82, 1.12], [-0.68, 0.98], [-0.48, 1.02]],
    [[-0.43, 1.22], [-0.64, 1.16], [-0.66, 0.98], [-0.48, 0.9], [-0.34, 0.98]],
    [[-0.44, 0.86], [-0.18, 0.74], [0, 0.66], [0.18, 0.74], [0.44, 0.86]],
    [[-0.36, 0.6], [-0.12, 0.46], [0, 0.38], [0.12, 0.46], [0.36, 0.6]],
    [[-0.28, 0.34], [-0.1, 0.18], [0, 0.08], [0.1, 0.18], [0.28, 0.34]],
  ].forEach((line) => addMirroredTube(relief, line, 0.0034));
  addTube(relief, [[-0.18, 1.56], [-0.08, 1.46], [0, 1.5], [0.08, 1.46], [0.18, 1.56]], 0.0032);
  addTube(relief, [[-0.22, 1.38], [-0.08, 1.3], [0, 1.34], [0.08, 1.3], [0.22, 1.38]], 0.0032);

  const ram = makeLineGroup("ram");
  addTube(ram, [
    [0, 0.92], [-0.22, 1.08], [-0.34, 1.32], [-0.54, 1.43], [-0.7, 1.36],
    [-0.66, 1.2], [-0.52, 1.16], [-0.36, 1.24],
  ], 0.005);
  addTube(ram, [
    [0, 0.92], [0.22, 1.08], [0.34, 1.32], [0.54, 1.43], [0.7, 1.36],
    [0.66, 1.2], [0.52, 1.16], [0.36, 1.24],
  ], 0.005);
  addTube(ram, [[-0.24, 1.5], [-0.06, 1.34], [0, 0.92], [0.06, 1.34], [0.24, 1.5]], 0.004);
  addRing(ram, -0.34, 1.28, 0.048);
  addRing(ram, 0.34, 1.28, 0.048);

  const symmetry = makeLineGroup("symmetry");
  addTube(symmetry, [[0, 1.66], [0, 0.86], [0, 0.08], [0, -0.74], [0, -1.62]], 0.0032);
  addMirroredTube(symmetry, [
    [0, 0.44], [-0.22, 0.78], [-0.58, 0.94], [-0.96, 0.84], [-1.18, 0.52],
    [-1.24, 0.18], [-1.06, -0.08], [-0.74, -0.18], [-0.56, -0.42],
    [-0.46, -0.84], [-0.38, -1.34], [-0.68, -1.36], [-0.98, -1.18],
    [-1.18, -0.82], [-1.06, -0.5], [-0.84, -0.34], [-0.76, -0.02],
    [-0.54, 0.3], [-0.28, 0.5], [0, 0.44],
  ], 0.005);
  addMirroredTube(symmetry, [[-0.58, 0.32], [-0.72, 0.04], [-0.64, -0.34], [-0.38, -0.8]], 0.004);
  addMirroredTube(symmetry, [[-0.72, -0.58], [-0.88, -0.82], [-0.78, -1.04], [-0.54, -0.92], [-0.62, -0.58]], 0.004);
  addMirroredTube(symmetry, [[-0.28, -0.72], [-0.32, -1.12], [-0.36, -1.58]], 0.004);

  const stitch = makeLineGroup("stitch");
  [
    [-0.18, 1.68], [0.18, 1.68], [-1.48, -0.12], [1.48, -0.12], [-1.42, -0.45],
    [1.42, -0.45], [-0.18, -1.62], [0.18, -1.62],
  ].forEach(([x, y]) => addRing(stitch, x, y, 0.043));
  addTube(stitch, [[-0.18, 1.68], [-0.78, 0.94], [-1.48, -0.12]], 0.0028);
  addTube(stitch, [[0.18, 1.68], [0.78, 0.94], [1.48, -0.12]], 0.0028);
  addTube(stitch, [[-1.42, -0.45], [-0.86, -1.18], [-0.18, -1.62]], 0.0028);
  addTube(stitch, [[1.42, -0.45], [0.86, -1.18], [0.18, -1.62]], 0.0028);

  setAnnotation("none");
}

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function createScanField() {
  scanRoot.clear();
  const random = seededRandom(314159);
  const vertices = [];
  const colors = [];
  const color = new THREE.Color();

  for (let i = 0; i < 380; i += 1) {
    const x = (random() - 0.5) * 3.25;
    const y = (random() - 0.5) * 3.45;
    const edgeFade = Math.max(Math.abs(x) / 1.7, Math.abs(y) / 1.78);
    if (edgeFade > 1.08) continue;
    const z = 0.68 + random() * 0.18;
    vertices.push(x, y, z);
    const tone = 0.65 + random() * 0.35;
    color.setRGB(tone, tone, tone);
    colors.push(color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.014,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthTest: false,
  });
  const points = new THREE.Points(geometry, material);
  points.renderOrder = 20;
  scanRoot.add(points);
}

function addFlow(name, coords, color = 0xc77a2a) {
  const curve = new THREE.CatmullRomCurve3(coords.map(([x, y, z]) => point(x, y, z)));
  const geometry = new THREE.TubeGeometry(curve, 96, 0.0024, 5, false);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 1,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.renderOrder = 24;
  flowRoot.add(mesh);
  return mesh;
}

function createFlowField() {
  flowRoot.clear();
  addFlow("global", [[-1.4, 1.1, 0.64], [-0.7, 0.78, 0.7], [0, 0.54, 0.72], [0.72, 0.78, 0.7], [1.42, 1.1, 0.64]]);
  addFlow("global", [[-1.28, -0.58, 0.63], [-0.54, -0.1, 0.72], [0, 0.1, 0.75], [0.54, -0.1, 0.72], [1.28, -0.58, 0.63]]);
  addFlow("relief", [[-1.18, 0.68, 0.69], [-0.7, 0.35, 0.76], [-0.22, 0.12, 0.76], [0.22, 0.12, 0.76], [0.7, 0.35, 0.76], [1.18, 0.68, 0.69]], 0xd08a34);
  addFlow("ram", [[-0.72, 1.36, 0.74], [-0.32, 1.15, 0.8], [0, 0.92, 0.82], [0.32, 1.15, 0.8], [0.72, 1.36, 0.74]], 0xd08a34);
  addFlow("symmetry", [[0, 1.72, 0.75], [0, 0.8, 0.8], [0, -0.15, 0.78], [0, -1.66, 0.7]], 0xd08a34);
  addFlow("stitch", [[-0.18, 1.68, 0.72], [-1.48, -0.12, 0.68], [-0.18, -1.62, 0.69], [0.18, -1.62, 0.69], [1.48, -0.12, 0.68], [0.18, 1.68, 0.72]], 0xd08a34);
}

function resizeRenderer() {
  if (!renderer) return;
  const rect = modelStage.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(320, Math.floor(rect.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  currentRotation.x = THREE.MathUtils.lerp(currentRotation.x, targetRotation.x, 0.085);
  currentRotation.y = THREE.MathUtils.lerp(currentRotation.y, targetRotation.y, 0.085);
  currentRotation.z = THREE.MathUtils.lerp(currentRotation.z, targetRotation.z, 0.085);
  currentZoom = THREE.MathUtils.lerp(currentZoom, targetZoom, 0.085);

  if (modelPivot) {
    modelPivot.rotation.copy(currentRotation);
    modelPivot.scale.setScalar(currentZoom);
    syncLineOverlayFacing();
  }

  renderer.render(scene, camera);
}

buttons.forEach((button) => {
  button.addEventListener("click", () => playScene(button.dataset.key));
});

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  playScene(event.key);
});

modelStage.addEventListener("pointerdown", (event) => {
  isDragging = true;
  startX = event.clientX;
  startY = event.clientY;
  modelStage.setPointerCapture(event.pointerId);
});

modelStage.addEventListener("pointermove", (event) => {
  if (!isDragging) return;

  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  targetRotation.y += dx * 0.0065;
  targetRotation.x += dy * 0.0055;
  targetRotation.x = THREE.MathUtils.clamp(targetRotation.x, -0.9, 0.9);
  startX = event.clientX;
  startY = event.clientY;
});

modelStage.addEventListener("pointerup", (event) => {
  isDragging = false;
  modelStage.releasePointerCapture(event.pointerId);
});

modelStage.addEventListener("pointercancel", () => {
  isDragging = false;
});

resetButton.addEventListener("click", resetObservation);
window.addEventListener("resize", resizeRenderer);

initRenderer();
setIdle();
updateProgress();
