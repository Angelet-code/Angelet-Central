const apps = [
  {
    name: "Schema Lab",
    url: "https://angelet-code.github.io/SchemaLab/",
    logo: "assets/logos/schema-lab.png",
    icon: "icon-schema",
    short: "SL",
    description:
      "Analiza circuitos eléctricos y ayuda a entender sus componentes, conexiones y función dentro del esquema."
  },
  {
    name: "Mix Revision",
    url: "https://angelet-code.github.io/Mix-Revision/",
    logo: "assets/logos/mix-revision.png",
    icon: "icon-mix",
    short: "MR",
    description:
      "Checklist para revisar feedback de mezclas y convertir comentarios en tareas claras de revisión."
  },
  {
    name: "EEpedia",
    url: "https://angelet-code.github.io/EEpedia/index.html",
    logo: "assets/logos/eepedia.webp",
    pixelated: true,
    icon: "icon-eepedia",
    short: "EE",
    description:
      "Información detallada sobre Empire Earth: Art of Conquest, con guías, unidades, poderes y recursos de consulta."
  },
  {
    name: "Cuanto es lo mío?",
    url: "https://angelet-code.github.io/Cuanto-es-lo-mio/",
    logo: "assets/logos/cuanto-es-lo-mio.jpg",
    icon: "icon-money",
    short: "$",
    description:
      "App para dividir la cuenta pagando cada uno lo suyo, marcando productos y calculando el total por persona."
  }
];

const totalSlots = 18;
const grid = document.querySelector("#app-grid");
const appCount = document.querySelector("#app-count");
const detailIcon = document.querySelector("#detail-icon");
const detailTitle = document.querySelector("#detail-title");
const detailDescription = document.querySelector("#detail-description");
const selector = document.createElement("div");
let activeSlot = null;

selector.className = "slot-selector";

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
    activeSlot = slot;
    selector.style.width = `${slot.offsetWidth}px`;
    selector.style.height = `${slot.offsetHeight}px`;
    selector.style.transform = `translate3d(${slot.offsetLeft}px, ${slot.offsetTop}px, 0)`;
    selector.classList.add("is-visible");
  }

  detailIcon.innerHTML = renderAppIcon(app, "detail");
  detailTitle.textContent = app.name;
  detailDescription.innerHTML = app.description;
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
  grid.appendChild(selector);
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

window.addEventListener("resize", () => {
  if (!activeSlot) return;

  selector.style.width = `${activeSlot.offsetWidth}px`;
  selector.style.height = `${activeSlot.offsetHeight}px`;
  selector.style.transform = `translate3d(${activeSlot.offsetLeft}px, ${activeSlot.offsetTop}px, 0)`;
});

renderGrid();
