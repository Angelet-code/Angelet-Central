const apps = [
  {
    name: "SchemaLab",
    url: "https://angelet-code.github.io/SchemaLab/",
    logo: "assets/logos/schema-lab.png",
    icon: "icon-schema",
    short: "SL",
    description:
      "Laboratorio visual para pensar, ordenar y convertir esquemas en algo que se pueda tocar."
  },
  {
    name: "Mix Revision",
    url: "https://github.com/Angelet-code/Mix-Revision",
    logo: "assets/logos/mix-revision.png",
    icon: "icon-mix",
    short: "MR",
    description:
      "Herramienta de revision para mezclas: una mesa rapida donde comparar, apuntar y decidir cambios."
  },
  {
    name: "EEpedia",
    url: "https://angelet-code.github.io/EEpedia/index.html",
    logo: "assets/logos/eepedia.webp",
    pixelated: true,
    icon: "icon-eepedia",
    short: "EE",
    description:
      "Enciclopedia y base de consulta para reunir conocimiento sin perderte entre carpetas y notas."
  },
  {
    name: "Cuanto es lo mio",
    url: "https://angelet-code.github.io/Cuanto-es-lo-mio/",
    logo: "assets/logos/cuanto-es-lo-mio.jpg",
    icon: "icon-money",
    short: "$",
    description:
      "Calculadora practica para aclarar numeros, repartos y cantidades sin abrir media docena de pesta&ntilde;as."
  }
];

const totalSlots = 18;
const grid = document.querySelector("#app-grid");
const appCount = document.querySelector("#app-count");
const detailIcon = document.querySelector("#detail-icon");
const detailTitle = document.querySelector("#detail-title");
const detailDescription = document.querySelector("#detail-description");
const detailLink = document.querySelector("#detail-link");

const getTemplateMarkup = (id) => {
  const template = document.querySelector(`#${id}`);
  return template ? template.innerHTML.trim() : "";
};

const renderAppIcon = (app, size = "slot") => {
  if (!app.logo) {
    return getTemplateMarkup(app.icon);
  }

  const pixelClass = app.pixelated ? " logo-pixelated" : "";
  return `<img class="app-logo ${size}-logo${pixelClass}" src="${app.logo}" alt="" loading="eager" />`;
};

const setActiveApp = (app, slot) => {
  document.querySelectorAll(".item-slot.is-active").forEach((item) => {
    item.classList.remove("is-active");
  });

  if (slot) {
    slot.classList.add("is-active");
  }

  detailIcon.innerHTML = renderAppIcon(app, "detail");
  detailTitle.textContent = app.name;
  detailDescription.innerHTML = app.description;
  detailLink.href = app.url;
  detailLink.setAttribute("aria-label", `Abrir ${app.name}`);
};

const createSlot = (app, index) => {
  const slot = document.createElement(app ? "a" : "div");
  slot.className = app ? "item-slot" : "item-slot empty";
  slot.dataset.filled = app ? "true" : "false";
  slot.dataset.index = index;

  if (app) {
    slot.href = app.url;
    slot.target = "_blank";
    slot.rel = "noreferrer";
    slot.setAttribute("aria-label", `Abrir ${app.name}`);
    slot.innerHTML = `${renderAppIcon(app)}<span class="app-name">${app.short}</span>`;
    slot.addEventListener("mouseenter", () => setActiveApp(app, slot));
    slot.addEventListener("focus", () => setActiveApp(app, slot));
  } else {
    slot.setAttribute("aria-hidden", "true");
    slot.innerHTML = getTemplateMarkup("icon-empty");
  }

  return slot;
};

const renderGrid = () => {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < totalSlots; index += 1) {
    fragment.appendChild(createSlot(apps[index], index));
  }

  grid.appendChild(fragment);
  appCount.textContent = String(apps.length).padStart(2, "0");
  setActiveApp(apps[0], grid.querySelector(".item-slot[data-filled='true']"));
};

grid.addEventListener("keydown", (event) => {
  const filledSlots = [...grid.querySelectorAll(".item-slot[data-filled='true']")];
  const currentIndex = filledSlots.indexOf(document.activeElement);

  if (currentIndex < 0) return;

  const moves = {
    ArrowRight: 1,
    ArrowLeft: -1,
    ArrowDown: 6,
    ArrowUp: -6
  };

  if (!Object.hasOwn(moves, event.key)) return;

  event.preventDefault();
  const nextIndex = Math.max(0, Math.min(filledSlots.length - 1, currentIndex + moves[event.key]));
  filledSlots[nextIndex].focus();
});

renderGrid();
