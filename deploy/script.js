const app = document.querySelector(".app");
const modelStage = document.querySelector("#modelStage");
const leafModel = document.querySelector("#leafModel");
const lens = document.querySelector("#lens");
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
    text: "模型回正，外轮廓以金线描边，强调上圆下收的杏形。",
    feature: "外形特征",
    translate: "以测量线和描边把金叶轮廓从文物表面独立出来。",
    annotation: "外轮廓被提取为第一层观察线",
  },
  2: {
    id: "foil",
    kicker: "KEY 2 / MATERIAL",
    title: "金箔薄片",
    text: "金叶转向侧面，厚度被压缩成一条细金线。",
    feature: "材质特征",
    translate: "用侧向旋转和边缘闪光表现薄金箔片的轻薄感。",
    annotation: "侧面观察：金叶不是厚块，而是薄片",
  },
  3: {
    id: "relief",
    kicker: "KEY 3 / CRAFT",
    title: "锤鍱纹理",
    text: "侧光扫过表面，凹凸纹理像浮雕一样显影。",
    feature: "工艺特征",
    translate: "用扫光和浮起线条模拟锤鍱形成的表面起伏。",
    annotation: "扫光经过时，纹理层次被放大",
  },
  4: {
    id: "ram",
    kicker: "KEY 4 / MOTIF",
    title: "二尖角羊头纹",
    text: "羊角线稿从金面上浮起，观众先从角识别羊头纹。",
    feature: "纹样特征",
    translate: "用深金线稿强化羊角、羊头和兽面化纹样。",
    annotation: "羊角是识别羊头纹的关键视觉锚点",
  },
  5: {
    id: "symmetry",
    kicker: "KEY 5 / STRUCTURE",
    title: "双羊相背",
    text: "中轴线出现，左右纹样镜像展开并重新对齐。",
    feature: "结构特征",
    translate: "用中轴线和镜像辅助线表现双羊相背的对称结构。",
    annotation: "沿中轴观察，左右纹样形成稳定秩序",
  },
  6: {
    id: "stitch",
    kicker: "KEY 6 / USE",
    title: "缝缀小孔",
    text: "孔洞依次亮起，细线穿孔形成缝缀路径。",
    feature: "使用特征",
    translate: "把孔洞转译为功能点，提示它与玉衣头套的关系。",
    annotation: "小孔不是装饰，而是缝缀功能的证据",
  },
};

const observed = new Set();
let resetTimer = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
let dragRotateX = -8;
let dragRotateY = 16;

function setModelRotation(x, y) {
  dragRotateX = Math.max(-18, Math.min(18, x));
  dragRotateY = Math.max(-28, Math.min(28, y));
  leafModel.style.setProperty("--rx", `${dragRotateX}deg`);
  leafModel.style.setProperty("--ry", `${dragRotateY}deg`);
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

function setIdle() {
  app.dataset.scene = "idle";
  app.dataset.report = "closed";
  sceneKicker.textContent = "OBSERVATION DESK";
  sceneTitle.textContent = "白底 3D 金叶观察台";
  sceneText.textContent = "选择一个观察点，查看金叶的形状、材质、工艺、纹样、结构和用途。";
  detailFeature.textContent = "完整金叶";
  detailTranslate.textContent = "当前为待观察状态，模型可拖动旋转。";
  annotationLabel.textContent = "拖动金叶可轻微旋转，按 1-6 进入观察镜头";
  buttons.forEach((button) => button.classList.remove("is-active"));
  setModelRotation(-8, 16);
}

function playScene(key) {
  const scene = scenes[key];
  if (!scene) return;

  window.clearTimeout(resetTimer);
  app.dataset.report = "closed";
  app.dataset.scene = "idle";
  observed.add(key);
  updateProgress();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      app.dataset.scene = scene.id;
      sceneKicker.textContent = scene.kicker;
      sceneTitle.textContent = scene.title;
      sceneText.textContent = scene.text;
      detailFeature.textContent = scene.feature;
      detailTranslate.textContent = scene.translate;
      annotationLabel.textContent = scene.annotation;
      buttons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.key === key);
      });

      if (key === "2") setModelRotation(-4, 76);
      else if (key === "3") setModelRotation(-18, 20);
      else if (key === "4") setModelRotation(-10, -14);
      else setModelRotation(-6, 0);
    });
  });
}

function showReport() {
  reportGrid.innerHTML = Object.entries(scenes)
    .map(
      ([key, scene]) => `
        <article>
          <span>${key}</span>
          <strong>${scene.title}</strong>
          <p>${scene.translate}</p>
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

function updateLens(event) {
  const rect = modelStage.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;

  lens.classList.toggle("is-visible", inside && !isDragging);
  if (!inside) return;

  lens.style.left = `${x}px`;
  lens.style.top = `${y}px`;
  lens.style.backgroundPosition = `${(x / rect.width) * 100}% ${(y / rect.height) * 100}%`;
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
  lens.classList.remove("is-visible");
  modelStage.setPointerCapture(event.pointerId);
});

modelStage.addEventListener("pointermove", (event) => {
  if (!isDragging) {
    updateLens(event);
    return;
  }

  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  setModelRotation(dragRotateX + dy * 0.06, dragRotateY + dx * 0.08);
  startX = event.clientX;
  startY = event.clientY;
});

modelStage.addEventListener("pointerup", (event) => {
  isDragging = false;
  modelStage.releasePointerCapture(event.pointerId);
});

modelStage.addEventListener("pointerleave", () => {
  lens.classList.remove("is-visible");
});

resetButton.addEventListener("click", resetObservation);

setIdle();
updateProgress();
