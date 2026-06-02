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
  { id: "markets", label: "Mercados" },
  { id: "apps", label: "Apps" },
  { id: "notes", label: "Tareas" },
  { id: "focus", label: "Foco" }
];

const marketCards = [
  { id: "sp500", label: "S&P 500", symbol: "^SPX", unit: "pts", decimals: 2, changeDecimals: 2 },
  { id: "gold", label: "Oro", symbol: "XAUUSD", unit: "USD/oz", decimals: 2, changeDecimals: 2 },
  { id: "btc", label: "Bitcoin", symbol: "BTC/USD", unit: "USD", decimals: 0, changeDecimals: 2 },
  { id: "eurusd", label: "Euro/Dolar", symbol: "EURUSD", unit: "USD/EUR", decimals: 5, changeDecimals: 5 }
];

const totalSlots = 18;
const shell = document.querySelector(".shell");
const sectionTabs = document.querySelector("#section-tabs");
const pageTitle = document.querySelector("#page-title");
const tabButtons = [...document.querySelectorAll("[data-tab-id]")];
const tabPanels = [...document.querySelectorAll("[data-tab-panel]")];
const tabShiftButtons = [...document.querySelectorAll("[data-tab-shift]")];
const appsInventory = document.querySelector("[data-tab-panel='apps']");
const appsInventoryGridArea = document.querySelector(".inventory-grid-area");
const grid = document.querySelector("#app-grid");
const appCount = document.querySelector("#app-count");
const detailIcon = document.querySelector("#detail-icon");
const detailTitle = document.querySelector("#detail-title");
const detailDescription = document.querySelector("#detail-description");
const marketsGrid = document.querySelector("#markets-grid");
const marketRefresh = document.querySelector("#market-refresh");
const marketStatus = document.querySelector("#market-status");
const marketUpdated = document.querySelector("#market-updated");
const bottleAppLinks = [...document.querySelectorAll(".bottle-app")];
const bottleSlots = [...document.querySelectorAll(".bottle-row .bottle")];
const taskList = document.querySelector(".notes-inventory .task-list");
const taskRows = [...document.querySelectorAll("[data-task-row]")];
const completedTasks = document.querySelector("#completed-tasks");
const focusList = document.querySelector(".focus-list");
const focusRows = [...document.querySelectorAll("[data-focus-row]")];
const selector = document.createElement("div");
const taskSelector = document.createElement("div");
const focusSelector = document.createElement("div");
const notesStorageKey = "angelet-central-notes";
const focusStorageKey = "angelet-central-focus";
const marketDataUrl = "data/market-prices.json";
const marketDataScriptUrl = "data/market-prices.js";
let activeSectionIndex = sections.findIndex((section) => section.id === "apps");
let activeSlot = null;
let activeTaskRow = null;
let activeFocusRow = null;
let swipeStart = null;
let completedTaskItems = [];
let marketData = null;
let marketLoadStarted = false;

selector.className = "slot-selector";
taskSelector.className = "slot-selector task-selector";
focusSelector.className = "slot-selector task-selector";

const getWrappedSectionIndex = (index) => (index + sections.length) % sections.length;

const getActiveSection = () => sections[activeSectionIndex];

const isTextEntryTarget = (target) =>
  target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']");

const isPlainShortcut = (event) => !event.altKey && !event.ctrlKey && !event.metaKey;

const getSectionFromHash = () => {
  const hashId = window.location.hash.replace("#", "");
  return sections.some((section) => section.id === hashId) ? hashId : "apps";
};

const positionSelector = () => {
  if (!activeSlot) return;

  const selectorArea = selector.parentElement;
  const slotRect = activeSlot.getBoundingClientRect();
  const areaRect = selectorArea.getBoundingClientRect();

  selector.style.width = `${slotRect.width}px`;
  selector.style.height = `${slotRect.height}px`;
  selector.style.transform = `translate3d(${slotRect.left - areaRect.left}px, ${slotRect.top - areaRect.top}px, 0)`;
};

const moveSelectorToSlot = (slot) => {
  if (!slot) return;

  document.querySelectorAll(".item-slot.is-active, .bottle.is-active").forEach((item) => {
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

const positionFocusSelector = () => {
  if (!activeFocusRow) return;

  focusSelector.style.width = `${activeFocusRow.offsetWidth}px`;
  focusSelector.style.height = `${activeFocusRow.offsetHeight}px`;
  focusSelector.style.transform = `translate3d(${activeFocusRow.offsetLeft}px, ${activeFocusRow.offsetTop}px, 0)`;
};

const moveFocusSelectorToRow = (row) => {
  if (!row) return;

  activeFocusRow = row;
  positionFocusSelector();
  focusSelector.classList.add("is-visible");
};

const refreshFocusSelector = () => {
  if (!activeFocusRow) return;

  positionFocusSelector();
  focusSelector.classList.add("is-visible");
};

const formatMarketPrice = (value, decimals) => {
  if (!Number.isFinite(value)) return "Sin dato";

  const [integerPart, decimalPart] = value.toFixed(decimals).split(".");
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (!decimalPart) return groupedInteger;

  return `${groupedInteger},${decimalPart}`;
};

const formatMarketChange = (value, percent, decimals = 2) => {
  if (!Number.isFinite(value) || !Number.isFinite(percent)) return "Sin variacion";

  const signedValue = value > 0 ? `+${formatMarketPrice(value, decimals)}` : formatMarketPrice(value, decimals);
  const signedPercent = percent > 0 ? `+${formatMarketPrice(percent, 2)}` : formatMarketPrice(percent, 2);
  return `${signedValue} (${signedPercent}%)`;
};

const getMarketTimeLabel = (asset) => {
  if (!asset?.asOf) return "Sin hora";

  return asset.asOf.replace("T", " ").replace("Z", " UTC");
};

const renderMarkets = () => {
  const assets = marketData?.assets || {};
  const fragment = document.createDocumentFragment();
  let okCount = 0;
  let staleCount = 0;

  marketCards.forEach((card) => {
    const asset = assets[card.id] || {};
    const status = asset.status || "error";
    const hasPrice = Number.isFinite(asset.price);
    const item = document.createElement("article");
    const change = Number(asset.change);
    const changePercent = Number(asset.changePercent);
    const trend = change > 0 ? "up" : change < 0 ? "down" : "flat";

    if (status === "ok") okCount += 1;
    if (status === "stale") staleCount += 1;

    item.className = "market-card";
    item.dataset.status = status;
    item.dataset.trend = trend;
    item.innerHTML = `
      <div class="market-card-top">
        <span>${asset.label || card.label}</span>
        <strong>${asset.symbol || card.symbol}</strong>
      </div>
      <p class="market-price">
        <span>${hasPrice ? formatMarketPrice(asset.price, card.decimals) : "Sin dato"}</span>
        ${hasPrice ? `<small>${card.unit}</small>` : ""}
      </p>
      <p class="market-change">${hasPrice ? formatMarketChange(change, changePercent, card.changeDecimals) : "Pendiente"}</p>
      <div class="market-meta">
        <span>${card.unit}</span>
        <span>${getMarketTimeLabel(asset)}</span>
      </div>
    `;

    fragment.appendChild(item);
  });

  marketsGrid.replaceChildren(fragment);

  if (!marketData) {
    marketStatus.textContent = "Cargando";
    marketUpdated.textContent = "Leyendo cotizaciones...";
    return;
  }

  if (okCount === marketCards.length) {
    marketStatus.textContent = "Listo";
  } else if (okCount + staleCount > 0) {
    marketStatus.textContent = "Parcial";
  } else {
    marketStatus.textContent = "Sin datos";
  }

  marketUpdated.textContent = marketData.generatedAt
    ? `Actualizado ${new Date(marketData.generatedAt).toLocaleString("es-ES")}`
    : "Actualizacion no disponible";
};

const loadMarketDataScript = () =>
  new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${marketDataScriptUrl}?v=${Date.now()}`;
    script.async = true;
    script.onload = () => resolve(window.ANGELET_MARKET_PRICES);
    script.onerror = reject;
    document.head.appendChild(script);
  });

const loadMarketData = async ({ force = false } = {}) => {
  if (marketLoadStarted && !force) return;

  marketLoadStarted = true;
  marketStatus.textContent = "Cargando";
  marketUpdated.textContent = "Leyendo cotizaciones...";

  try {
    if (window.location.protocol === "file:") {
      marketData = await loadMarketDataScript();
    } else {
      const response = await fetch(`${marketDataUrl}?v=${Date.now()}`, { cache: "no-store" });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      marketData = await response.json();
    }
  } catch {
    marketData = window.ANGELET_MARKET_PRICES || { generatedAt: null, assets: {} };
  }

  renderMarkets();
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
    focusSelector.classList.remove("is-visible");
    requestAnimationFrame(refreshActiveSelector);
  } else if (activeSection.id === "notes") {
    selector.classList.remove("is-visible");
    focusSelector.classList.remove("is-visible");
    requestAnimationFrame(refreshTaskSelector);
  } else if (activeSection.id === "focus") {
    selector.classList.remove("is-visible");
    taskSelector.classList.remove("is-visible");
    requestAnimationFrame(refreshFocusSelector);
  } else {
    selector.classList.remove("is-visible");
    taskSelector.classList.remove("is-visible");
    focusSelector.classList.remove("is-visible");
    loadMarketData();
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

const getFocusInput = (row) => row.querySelector(".task-input");

const getFocusCheckbox = (row) => row.querySelector(".task-done");

const getFocusItems = () =>
  focusRows.map((row) => ({
    value: getFocusInput(row).value,
    done: getFocusCheckbox(row).checked
  }));

const saveFocusState = () => {
  try {
    localStorage.setItem(focusStorageKey, JSON.stringify({ items: getFocusItems() }));
  } catch {
    // The weekly focus still works if browser storage is unavailable.
  }
};

const loadFocusState = () => {
  let savedState = null;

  try {
    savedState = JSON.parse(localStorage.getItem(focusStorageKey));
  } catch {
    savedState = null;
  }

  if (!Array.isArray(savedState?.items)) return;

  focusRows.forEach((row, index) => {
    const item = savedState.items[index] || {};
    const value = item.value || "";

    getFocusInput(row).value = value;
    getFocusCheckbox(row).checked = Boolean(item.done && value.trim());
  });
};

const focusWeeklyInput = (row) => {
  const input = getFocusInput(row);

  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
};

const moveToFocusInput = (row, offset) => {
  const currentIndex = focusRows.indexOf(row);
  const nextIndex = (currentIndex + offset + focusRows.length) % focusRows.length;

  focusWeeklyInput(focusRows[nextIndex]);
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
  appsInventoryGridArea.appendChild(selector);
  appCount.textContent = String(apps.length + bottleAppLinks.length).padStart(2, "0");
  setActiveApp(apps[0], grid.querySelector(".item-slot[data-filled='true']"));
};

const getSelectableAppSlots = () => [...grid.querySelectorAll(".item-slot"), ...bottleSlots];

const getSlotDirectionScore = (fromSlot, toSlot, direction) => {
  const fromRect = fromSlot.getBoundingClientRect();
  const toRect = toSlot.getBoundingClientRect();
  const fromCenter = {
    x: fromRect.left + fromRect.width / 2,
    y: fromRect.top + fromRect.height / 2
  };
  const toCenter = {
    x: toRect.left + toRect.width / 2,
    y: toRect.top + toRect.height / 2
  };
  const deltaX = toCenter.x - fromCenter.x;
  const deltaY = toCenter.y - fromCenter.y;

  if (direction === "right" && deltaX <= 1) return Number.POSITIVE_INFINITY;
  if (direction === "left" && deltaX >= -1) return Number.POSITIVE_INFINITY;
  if (direction === "down" && deltaY <= 1) return Number.POSITIVE_INFINITY;
  if (direction === "up" && deltaY >= -1) return Number.POSITIVE_INFINITY;

  const primaryDistance = direction === "left" || direction === "right" ? Math.abs(deltaX) : Math.abs(deltaY);
  const crossAxisDistance = direction === "left" || direction === "right" ? Math.abs(deltaY) : Math.abs(deltaX);

  return primaryDistance + crossAxisDistance * 2;
};

const moveAppFocus = (direction) => {
  if (getActiveSection().id !== "apps") return false;

  const slots = getSelectableAppSlots();
  if (!slots.length) return false;

  const focusedIndex = slots.indexOf(document.activeElement);
  const activeIndex = slots.indexOf(activeSlot);
  const currentIndex = focusedIndex >= 0 ? focusedIndex : Math.max(0, activeIndex);
  const currentSlot = slots[currentIndex];
  const nextSlot = slots
    .filter((slot) => slot !== currentSlot)
    .map((slot) => ({
      slot,
      score: getSlotDirectionScore(currentSlot, slot, direction)
    }))
    .filter((candidate) => Number.isFinite(candidate.score))
    .sort((first, second) => first.score - second.score)[0]?.slot;

  if (!nextSlot) return false;

  nextSlot.focus();
  return true;
};

appsInventory.addEventListener("keydown", (event) => {
  if (getActiveSection().id !== "apps") return;

  const moves = {
    ArrowRight: "right",
    ArrowLeft: "left",
    ArrowDown: "down",
    ArrowUp: "up"
  };

  if (!Object.hasOwn(moves, event.key)) return;

  event.preventDefault();
  moveAppFocus(moves[event.key]);
});

bottleSlots.forEach((slot) => {
  slot.addEventListener("mouseenter", () => moveSelectorToSlot(slot));
  slot.addEventListener("focus", () => moveSelectorToSlot(slot));
});

window.addEventListener("resize", () => {
  if (getActiveSection().id === "apps") {
    positionSelector();
    return;
  }

  if (getActiveSection().id === "notes") {
    positionTaskSelector();
    return;
  }

  if (getActiveSection().id === "focus") {
    positionFocusSelector();
  }
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

window.addEventListener("keydown", (event) => {
  if (!isPlainShortcut(event) || isTextEntryTarget(event.target)) return;

  const key = event.key.toLowerCase();

  if (key === "q" || key === "e") {
    event.preventDefault();
    moveSection(key === "q" ? -1 : 1);
    return;
  }

  if (key === "r") {
    event.preventDefault();
    loadMarketData({ force: true });
    return;
  }

  const appMoves = {
    d: "right",
    a: "left",
    s: "down",
    w: "up"
  };

  if (!Object.hasOwn(appMoves, key)) return;

  if (moveAppFocus(appMoves[key])) {
    event.preventDefault();
  }
});

window.addEventListener("hashchange", () => setActiveSection(getSectionFromHash()));

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

focusRows.forEach((row) => {
  const input = getFocusInput(row);
  const checkbox = getFocusCheckbox(row);

  row.addEventListener("mouseenter", () => moveFocusSelectorToRow(row));
  row.addEventListener("focusin", () => moveFocusSelectorToRow(row));
  input.addEventListener("input", () => {
    if (!input.value.trim()) checkbox.checked = false;
    saveFocusState();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== "Tab") return;

    event.preventDefault();
    moveToFocusInput(row, event.shiftKey ? -1 : 1);
  });

  checkbox.addEventListener("change", () => {
    if (checkbox.checked && !input.value.trim()) {
      checkbox.checked = false;
      input.focus();
    }

    saveFocusState();
  });
});

marketRefresh.addEventListener("click", () => loadMarketData({ force: true }));

taskList.appendChild(taskSelector);
focusList.appendChild(focusSelector);
loadNotesState();
loadFocusState();
renderMarkets();
setActiveSection(getSectionFromHash());
renderGrid();
