const app = document.querySelector(".app");
const buttons = [...document.querySelectorAll("[data-key]")];
const sceneKicker = document.querySelector("#sceneKicker");
const sceneTitle = document.querySelector("#sceneTitle");
const sceneText = document.querySelector("#sceneText");

const scenes = {
  1: {
    id: "outline",
    kicker: "KEY 1 / FORM",
    title: "杏形轮廓",
    text: "上圆下收，金叶成形",
  },
  2: {
    id: "foil",
    kicker: "KEY 2 / MATERIAL",
    title: "金箔薄片",
    text: "薄如叶片，光随面转",
  },
  3: {
    id: "relief",
    kicker: "KEY 3 / CRAFT",
    title: "锤鍱纹理",
    text: "捶压成纹，起伏见形",
  },
  4: {
    id: "ram",
    kicker: "KEY 4 / MOTIF",
    title: "二尖角羊头纹",
    text: "以角识羊，以纹成像",
  },
  5: {
    id: "symmetry",
    kicker: "KEY 5 / STRUCTURE",
    title: "双羊相背",
    text: "左右成对，沿轴展开",
  },
  6: {
    id: "stitch",
    kicker: "KEY 6 / USE",
    title: "缝缀小孔",
    text: "金叶附着于玉衣头套之上",
  },
};

let resetTimer = 0;

function setIdle() {
  app.dataset.scene = "idle";
  sceneKicker.textContent = "KEY INTERACTIVE VISUAL DESIGN";
  sceneTitle.textContent = "羊头纹杏形金叶";
  sceneText.textContent = "按下 1-6，进入六个文物特点的特写镜头。";
  buttons.forEach((button) => button.classList.remove("is-active"));
}

function playScene(key) {
  const scene = scenes[key];
  if (!scene) return;

  window.clearTimeout(resetTimer);
  app.dataset.scene = "idle";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      app.dataset.scene = scene.id;
      sceneKicker.textContent = scene.kicker;
      sceneTitle.textContent = scene.title;
      sceneText.textContent = scene.text;
      buttons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.key === key);
      });
    });
  });

  resetTimer = window.setTimeout(setIdle, 7200);
}

buttons.forEach((button) => {
  button.addEventListener("click", () => playScene(button.dataset.key));
});

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  playScene(event.key);
});

setIdle();
