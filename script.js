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
  },
  {
    name: "Left2Eat",
    url: "https://angelet-code.github.io/left2eat/",
    icon: "icon-left2eat",
    short: "L2E",
    description:
      "Diario nutricional personal para registrar comidas, calcular macros en tiempo real y consultar el historico."
  }
];

const sections = [
  { id: "apps", label: "Apps" },
  { id: "notes", label: "Tareas" }
];

const totalSlots = 18;
const shell = document.querySelector(".shell");
const sectionTabs = document.querySelector("#section-tabs");
const pageTitle = document.querySelector("#page-title");
const tabButtons = [...document.querySelectorAll("[data-tab-id]")];
const tabPanels = [...document.querySelectorAll("[data-tab-panel]")];
const tabShiftButtons = [...document.querySelectorAll("[data-tab-shift]")];
const grid = document.querySelector("#app-grid");
const appCount = document.querySelector("#app-count");
const detailIcon = document.querySelector("#detail-icon");
const detailTitle = document.querySelector("#detail-title");
const detailDescription = document.querySelector("#detail-description");
const taskList = document.querySelector(".task-list");
const taskRows = [...document.querySelectorAll("[data-task-row]")];
const completedTasks = document.querySelector("#completed-tasks");
const selector = document.createElement("div");
const taskSelector = document.createElement("div");
const notesStorageKey = "angelet-central-notes";
let activeSectionIndex = sections.findIndex((section) => section.id === "apps");
let activeSlot = null;
let activeTaskRow = null;
let swipeStart = null;
let completedTaskItems = [];

selector.className = "slot-selector";
taskSelector.className = "slot-selector task-selector";

const getWrappedSectionIndex = (index) => (index + sections.length) % sections.length;

const getActiveSection = () => sections[activeSectionIndex];

const positionSelector = () => {
  if (!activeSlot) return;

  selector.style.width = `${activeSlot.offsetWidth}px`;
  selector.style.height = `${activeSlot.offsetHeight}px`;
  selector.style.transform = `translate3d(${activeSlot.offsetLeft}px, ${activeSlot.offsetTop}px, 0)`;
};

const moveSelectorToSlot = (slot) => {
  if (!slot) return;

  document.querySelectorAll(".item-slot.is-active").forEach((item) => {
    item.classList.remove("is-active");
  });

  slot.classList.add("is-active");
  activeSlot = slot;
  positionSelector();
  selector.classList.add("is-visible");
};

const refreshActiveSelector = () => {
  if (!activeSlot) return;

  positionSelector();
  selector.classList.add("is-visible");
};

const positionTaskSelector = () => {
  if (!activeTaskRow) return;

  taskSelector.style.width = `${activeTaskRow.offsetWidth}px`;
  taskSelector.style.height = `${activeTaskRow.offsetHeight}px`;
  taskSelector.style.transform = `translate3d(${activeTaskRow.offsetLeft}px, ${activeTaskRow.offsetTop}px, 0)`;
};

const moveTaskSelectorToRow = (row) => {
  if (!row) return;

  activeTaskRow = row;
  positionTaskSelector();
  taskSelector.classList.add("is-visible");
};

const refreshTaskSelector = () => {
  if (!activeTaskRow) return;

  positionTaskSelector();
  taskSelector.classList.add("is-visible");
};

const setActiveSection = (sectionTarget) => {
  const nextIndex =
    typeof sectionTarget === "number"
      ? getWrappedSectionIndex(sectionTarget)
      : sections.findIndex((section) => section.id === sectionTarget);

  if (nextIndex < 0) return;

  activeSectionIndex = nextIndex;
  const activeSection = getActiveSection();

  shell.dataset.activeTab = activeSection.id;
  pageTitle.textContent = activeSection.label;

  tabButtons.forEach((button) => {
    const isActive = button.dataset.tabId === activeSection.id;

    button.classList.toggle("active", isActive);
    button.classList.toggle("ghost", !isActive);

    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  tabPanels.forEach((panel) => {
    const isActive = panel.dataset.tabPanel === activeSection.id;

    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });

  if (activeSection.id === "apps") {
    taskSelector.classList.remove("is-visible");
    requestAnimationFrame(refreshActiveSelector);
  } else {
    selector.classList.remove("is-visible");
    requestAnimationFrame(refreshTaskSelector);
  }
};

const moveSection = (offset) => {
  setActiveSection(activeSectionIndex + offset);
};

const getTaskInput = (row) => row.querySelector(".task-input");

const getTaskCheckbox = (row) => row.querySelector(".task-done");

const getPendingTasks = () => taskRows.map((row) => getTaskInput(row).value);

const renderCompletedTasks = () => {
  const fragment = document.createDocumentFragment();

  completedTaskItems.forEach((task) => {
    const item = document.createElement("li");
    item.textContent = task;
    fragment.appendChild(item);
  });

  completedTasks.replaceChildren(fragment);
};

const saveNotesState = () => {
  try {
    localStorage.setItem(
      notesStorageKey,
      JSON.stringify({
        pending: getPendingTasks(),
        completed: completedTaskItems
      })
    );
  } catch {
    // The checklist still works if browser storage is unavailable.
  }
};

const loadNotesState = () => {
  let savedState = null;

  try {
    savedState = JSON.parse(localStorage.getItem(notesStorageKey));
  } catch {
    savedState = null;
  }

  if (Array.isArray(savedState?.pending)) {
    taskRows.forEach((row, index) => {
      getTaskInput(row).value = savedState.pending[index] || "";
    });
  }

  completedTaskItems = Array.isArray(savedState?.completed) ? savedState.completed : [];
  renderCompletedTasks();
};

const completeTask = (row) => {
  const input = getTaskInput(row);
  const checkbox = getTaskCheckbox(row);
  const task = input.value.trim();

  checkbox.checked = false;

  if (!task) {
    input.focus();
    return;
  }

  completedTaskItems.unshift(task);
  input.value = "";
  renderCompletedTasks();
  saveNotesState();
  input.focus();
};

const focusTaskInput = (row) => {
  const input = getTaskInput(row);

  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
};

const moveToTaskInput = (row, offset) => {
  const currentIndex = taskRows.indexOf(row);
  const nextIndex = (currentIndex + offset + taskRows.length) % taskRows.length;

  focusTaskInput(taskRows[nextIndex]);
};

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
  moveSelectorToSlot(slot);

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
    slot.tabIndex = 0;
    slot.setAttribute("aria-label", "Casilla vacia");
    slot.innerHTML = getTemplateMarkup("icon-empty");
    slot.addEventListener("mouseenter", () => moveSelectorToSlot(slot));
    slot.addEventListener("focus", () => moveSelectorToSlot(slot));
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
  if (getActiveSection().id !== "apps") return;

  const slots = [...grid.querySelectorAll(".item-slot")];
  const currentIndex = slots.indexOf(document.activeElement);

  if (currentIndex < 0) return;

  const columnCount = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length || 6;
  const moves = {
    ArrowRight: 1,
    ArrowLeft: -1,
    ArrowDown: columnCount,
    ArrowUp: -columnCount
  };

  if (!Object.hasOwn(moves, event.key)) return;

  event.preventDefault();
  const nextIndex = Math.max(0, Math.min(slots.length - 1, currentIndex + moves[event.key]));
  slots[nextIndex].focus();
});

window.addEventListener("resize", () => {
  if (getActiveSection().id === "apps") {
    positionSelector();
    return;
  }

  positionTaskSelector();
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveSection(button.dataset.tabId));
});

sectionTabs.addEventListener("click", (event) => {
  const tabButton = event.target.closest("[data-tab-id]");

  if (!tabButton) return;

  setActiveSection(tabButton.dataset.tabId);
});

tabShiftButtons.forEach((button) => {
  button.addEventListener("click", () => moveSection(Number(button.dataset.tabShift)));
});

sectionTabs.addEventListener("keydown", (event) => {
  const moves = {
    ArrowLeft: -1,
    ArrowRight: 1
  };

  if (!Object.hasOwn(moves, event.key)) return;

  event.preventDefault();
  moveSection(moves[event.key]);
  tabButtons[activeSectionIndex].focus();
});

shell.addEventListener(
  "pointerdown",
  (event) => {
    if (event.pointerType === "mouse" || event.target.closest("input, textarea, select, [contenteditable='true']")) return;

    swipeStart = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY
    };
  },
  { passive: true }
);

shell.addEventListener(
  "pointerup",
  (event) => {
    if (!swipeStart || event.pointerId !== swipeStart.id) return;

    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;
    const isHorizontalSwipe = Math.abs(deltaX) > 56 && Math.abs(deltaX) > Math.abs(deltaY) * 1.35;

    if (isHorizontalSwipe) {
      moveSection(deltaX < 0 ? 1 : -1);
    }

    swipeStart = null;
  },
  { passive: true }
);

shell.addEventListener("pointercancel", () => {
  swipeStart = null;
});

taskRows.forEach((row) => {
  const input = getTaskInput(row);
  const checkbox = getTaskCheckbox(row);

  row.addEventListener("mouseenter", () => moveTaskSelectorToRow(row));
  row.addEventListener("focusin", () => moveTaskSelectorToRow(row));
  input.addEventListener("input", saveNotesState);
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== "Tab") return;

    event.preventDefault();
    moveToTaskInput(row, event.shiftKey ? -1 : 1);
  });

  checkbox.addEventListener("change", () => completeTask(row));
});

taskList.appendChild(taskSelector);
loadNotesState();
setActiveSection("apps");
renderGrid();
