const { categories, sports } = window.SPORTS_RULES_DATA;

const STORAGE_KEY = "sports-rules-app-records";
const categoryById = new Map(categories.map((category) => [category.id, category]));

const state = {
  activeCategory: "all",
  activeView: "library",
  query: "",
};

const elements = {
  categoryList: document.querySelector("#category-list"),
  sportGrid: document.querySelector("#sport-grid"),
  searchInput: document.querySelector("#search-input"),
  resultTitle: document.querySelector("#result-title"),
  resultCount: document.querySelector("#result-count"),
  totalCount: document.querySelector("#total-count"),
  libraryView: document.querySelector("#library-view"),
  recordsView: document.querySelector("#records-view"),
  recordsList: document.querySelector("#records-list"),
  clearRecords: document.querySelector("#clear-records"),
  dialog: document.querySelector("#rule-dialog"),
  dialogContent: document.querySelector("#dialog-content"),
  navButtons: document.querySelectorAll("[data-view]"),
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `record-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getRecords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function addRecord(sport) {
  const records = getRecords();
  const current = records.find((record) => record.sportId === sport.id);
  const now = new Date().toISOString();

  if (current) {
    const updated = {
      ...current,
      savedCount: current.savedCount + 1,
      status: "studying",
      updatedAt: now,
    };
    saveRecords([updated, ...records.filter((record) => record.id !== current.id)]);
    return updated;
  }

  const record = {
    id: createId(),
    sportId: sport.id,
    sportTitle: sport.title,
    englishName: sport.englishName,
    category: sport.category,
    source: sport.source,
    savedCount: 1,
    status: "studying",
    createdAt: now,
    updatedAt: now,
  };
  saveRecords([record, ...records]);
  return record;
}

function updateRecordStatus(recordId, status) {
  const now = new Date().toISOString();
  const records = getRecords().map((record) =>
    record.id === recordId ? { ...record, status, updatedAt: now } : record,
  );
  saveRecords(records);
  renderRecords();
}

function getFilteredSports() {
  const query = state.query.trim().toLowerCase();

  return sports.filter((sport) => {
    const categoryLabel = categoryById.get(sport.category)?.label ?? "";
    const inCategory = state.activeCategory === "all" || sport.category === state.activeCategory;
    const searchable = [
      sport.title,
      sport.englishName,
      categoryLabel,
      sport.summary,
      sport.format,
      sport.venue,
      sport.scoring,
      sport.fouls,
      sport.watchFocus,
    ]
      .join(" ")
      .toLowerCase();

    return inCategory && (!query || searchable.includes(query));
  });
}

function renderCategories() {
  elements.totalCount.textContent = `${sports.length}项`;
  elements.categoryList.innerHTML = categories
    .map((category) => {
      const activeClass = category.id === state.activeCategory ? " is-active" : "";
      return `
        <button class="category-button${activeClass}" type="button" data-category="${escapeHtml(category.id)}">
          <span class="category-color" style="background:${escapeHtml(category.color)}"></span>
          <span>
            <span class="category-name">${escapeHtml(category.label)}</span>
            <span class="category-desc">${escapeHtml(category.description)}</span>
          </span>
          <span class="category-count">${escapeHtml(category.countLabel)}</span>
        </button>
      `;
    })
    .join("");
}

function renderSports() {
  const filtered = getFilteredSports();
  const activeCategory = categoryById.get(state.activeCategory);
  elements.resultTitle.textContent = activeCategory?.label ?? "全部项目";
  elements.resultCount.textContent = filtered.length;

  if (filtered.length === 0) {
    elements.sportGrid.innerHTML = `
      <div class="empty-state">
        <h3>没有找到匹配项目</h3>
        <p>换一个关键词，或切换到全部项目。</p>
      </div>
    `;
    return;
  }

  elements.sportGrid.innerHTML = filtered.map(renderSportCard).join("");
}

function renderSportCard(sport) {
  const category = categoryById.get(sport.category);
  return `
    <article class="sport-card">
      <div class="visual">${renderVisual(sport)}</div>
      <div class="sport-body">
        <div class="sport-meta">
          <span class="pill">${escapeHtml(category?.label ?? sport.category)}</span>
          <span class="pill">${escapeHtml(sport.englishName)}</span>
        </div>
        <h3>${escapeHtml(sport.title)}</h3>
        <p class="summary">${escapeHtml(sport.summary)}</p>
        <div class="facts">
          <div class="fact">
            <b>赛制</b>
            <span>${escapeHtml(sport.format)}</span>
          </div>
          <div class="fact">
            <b>胜负</b>
            <span>${escapeHtml(sport.scoring)}</span>
          </div>
        </div>
        <button class="primary-button" type="button" data-open="${escapeHtml(sport.id)}">查看规则</button>
      </div>
    </article>
  `;
}

function renderRecords() {
  const records = getRecords();

  if (records.length === 0) {
    elements.recordsList.innerHTML = `
      <div class="empty-state">
        <h3>暂无学习记录</h3>
        <p>在规则卡中点击“加入学习记录”后，这里会显示复习进度。</p>
      </div>
    `;
    elements.clearRecords.hidden = true;
    return;
  }

  elements.clearRecords.hidden = false;
  elements.recordsList.innerHTML = records
    .map((record) => {
      const category = categoryById.get(record.category);
      const statusLabel = record.status === "mastered" ? "已掌握" : "学习中";
      return `
        <article class="record-card">
          <div class="sport-meta">
            <span class="pill">${escapeHtml(category?.label ?? record.category)}</span>
            <span class="pill">${statusLabel}</span>
          </div>
          <h3>${escapeHtml(record.sportTitle)}</h3>
          <p>${escapeHtml(record.englishName)} · 保存 ${record.savedCount} 次 · ${formatDateTime(record.updatedAt)}</p>
          <p>官方规则线索：${escapeHtml(record.source)}</p>
          <div class="record-actions">
            <button class="record-button" type="button" data-open="${escapeHtml(record.sportId)}">打开规则</button>
            <button class="record-button" type="button" data-status="studying" data-record="${escapeHtml(record.id)}">继续学习</button>
            <button class="record-button" type="button" data-status="mastered" data-record="${escapeHtml(record.id)}">标记已掌握</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function openRuleDialog(sportId) {
  const sport = sports.find((item) => item.id === sportId);
  if (!sport) {
    return;
  }

  elements.dialogContent.innerHTML = renderDialog(sport);
  elements.dialog.showModal();

  elements.dialogContent.querySelector("[data-close]").addEventListener("click", () => {
    elements.dialog.close();
  });

  elements.dialogContent.querySelector("[data-save]").addEventListener("click", () => {
    const record = addRecord(sport);
    renderRecords();
    const status = elements.dialogContent.querySelector("[data-save-status]");
    status.textContent = `已保存“${record.sportTitle}”到学习记录`;
  });

  elements.dialogContent.querySelector("[data-large-text]").addEventListener("change", (event) => {
    elements.dialogContent
      .querySelector(".dialog-shell")
      .classList.toggle("large-text", event.target.checked);
  });
}

function renderDialog(sport) {
  const category = categoryById.get(sport.category);
  const sections = [
    ["比赛赛制", sport.format],
    ["场地器材", sport.venue],
    ["得分胜负", sport.scoring],
    ["常见判罚", sport.fouls],
    ["观赛重点", sport.watchFocus],
  ];

  return `
    <div class="dialog-shell">
      <aside class="dialog-side">
        <div class="visual">${renderVisual(sport)}</div>
        <div class="rule-actions">
          <label class="toggle-row">
            <span>大字模式</span>
            <input type="checkbox" data-large-text />
          </label>
          <button class="primary-button" type="button" data-save>加入学习记录</button>
          <div class="source-box" data-save-status>官方规则线索：${escapeHtml(sport.source)}</div>
        </div>
      </aside>
      <section class="dialog-main">
        <div class="dialog-top">
          <div>
            <p class="eyebrow">${escapeHtml(category?.label ?? sport.category)}</p>
            <h2>${escapeHtml(sport.title)}</h2>
          </div>
          <button class="close-button" type="button" data-close aria-label="关闭">×</button>
        </div>
        <p class="summary-text">${escapeHtml(sport.summary)}</p>
        <div class="rule-list">
          ${sections
            .map(
              ([title, body]) => `
                <section class="rule-section">
                  <h3>${escapeHtml(title)}</h3>
                  <p>${escapeHtml(body)}</p>
                </section>
              `,
            )
            .join("")}
        </div>
      </section>
    </div>
  `;
}

function setView(view) {
  state.activeView = view;
  elements.libraryView.classList.toggle("is-hidden", view !== "library");
  elements.recordsView.classList.toggle("is-hidden", view !== "records");
  elements.navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });
  if (view === "records") {
    renderRecords();
  }
}

function renderVisual(sport) {
  const accent = escapeHtml(sport.accent);
  const title = escapeHtml(sport.title);
  const type = sport.visualType;
  const svgOpen = `<svg viewBox="0 0 160 100" role="img" aria-label="${title}示意图"><title>${title}示意图</title>`;
  const svgClose = "</svg>";

  if (type === "field") {
    return `${svgOpen}
      <rect width="160" height="100" rx="8" fill="#dff4df"/>
      <rect x="8" y="8" width="144" height="84" rx="4" fill="#58a55c"/>
      <path d="M80 8v84M8 50h144" stroke="#fff" stroke-width="2"/>
      <circle cx="80" cy="50" r="14" fill="none" stroke="#fff" stroke-width="2"/>
      <rect x="8" y="27" width="24" height="46" fill="none" stroke="#fff" stroke-width="2"/>
      <rect x="128" y="27" width="24" height="46" fill="none" stroke="#fff" stroke-width="2"/>
      <circle cx="80" cy="50" r="2" fill="#fff"/>
    ${svgClose}`;
  }

  if (type === "court") {
    return `${svgOpen}
      <rect width="160" height="100" rx="8" fill="#fff7ed"/>
      <rect x="10" y="10" width="140" height="80" rx="3" fill="#f6c17b"/>
      <path d="M80 10v80M10 50h140" stroke="#fff" stroke-width="2"/>
      <circle cx="80" cy="50" r="13" fill="none" stroke="#fff" stroke-width="2"/>
      <path d="M10 27h22v46H10M150 27h-22v46h22" fill="none" stroke="#fff" stroke-width="2"/>
      <circle cx="22" cy="50" r="3" fill="${accent}"/>
      <circle cx="138" cy="50" r="3" fill="${accent}"/>
    ${svgClose}`;
  }

  if (type === "netCourt") {
    return `${svgOpen}
      <rect width="160" height="100" rx="8" fill="#ecfccb"/>
      <rect x="12" y="14" width="136" height="72" rx="3" fill="#a3e635"/>
      <path d="M80 14v72" stroke="#111827" stroke-width="2"/>
      <path d="M12 38h136M12 62h136M36 14v72M124 14v72" stroke="#fff" stroke-width="1.6"/>
      <circle cx="55" cy="50" r="4" fill="${accent}"/>
      <circle cx="105" cy="50" r="4" fill="#fff"/>
    ${svgClose}`;
  }

  if (type === "table") {
    return `${svgOpen}
      <rect width="160" height="100" rx="8" fill="#dbeafe"/>
      <path d="M35 25h90l12 52H23z" fill="#2563eb"/>
      <path d="M80 25v52M26 51h108" stroke="#fff" stroke-width="2"/>
      <path d="M30 51h100" stroke="#111827" stroke-width="3" opacity=".22"/>
      <circle cx="106" cy="39" r="4" fill="#fff"/>
    ${svgClose}`;
  }

  if (type === "diamond") {
    return `${svgOpen}
      <rect width="160" height="100" rx="8" fill="#dcfce7"/>
      <path d="M80 15 132 58 80 94 28 58z" fill="#f7d08a"/>
      <path d="M80 28 114 58 80 82 46 58z" fill="#86efac"/>
      <path d="M80 82 46 58 80 28 114 58z" fill="none" stroke="#fff" stroke-width="2"/>
      <circle cx="80" cy="82" r="4" fill="#fff"/><circle cx="46" cy="58" r="4" fill="#fff"/>
      <circle cx="80" cy="28" r="4" fill="#fff"/><circle cx="114" cy="58" r="4" fill="#fff"/>
    ${svgClose}`;
  }

  if (["track", "hurdles", "relay"].includes(type)) {
    const hurdles = type === "hurdles" ? '<path d="M58 27v46M74 27v46M90 27v46M106 27v46" stroke="#fff" stroke-width="2"/>' : "";
    const relay = type === "relay" ? '<path d="M50 39h28M82 61h28" stroke="#fde047" stroke-width="4" stroke-linecap="round"/>' : "";
    return `${svgOpen}
      <rect width="160" height="100" rx="8" fill="#fee2e2"/>
      <rect x="16" y="15" width="128" height="70" rx="35" fill="#ef4444"/>
      <rect x="36" y="30" width="88" height="40" rx="20" fill="#f8fafc"/>
      <path d="M36 26h88M36 38h88M36 50h88M36 62h88M36 74h88" stroke="#fff" stroke-width="1.2"/>
      ${hurdles}${relay}
      <circle cx="48" cy="50" r="4" fill="${accent}"/>
    ${svgClose}`;
  }

  if (type === "road") {
    return `${svgOpen}
      <rect width="160" height="100" rx="8" fill="#e0f2fe"/>
      <path d="M12 82c28-42 41-48 61-31 15 13 28 8 39-13 8-15 20-22 37-17" fill="none" stroke="#64748b" stroke-width="14" stroke-linecap="round"/>
      <path d="M12 82c28-42 41-48 61-31 15 13 28 8 39-13 8-15 20-22 37-17" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 7" stroke-linecap="round"/>
    ${svgClose}`;
  }

  if (type === "jump") {
    return `${svgOpen}
      <rect width="160" height="100" rx="8" fill="#fffbeb"/>
      <rect x="14" y="42" width="86" height="12" rx="2" fill="#94a3b8"/>
      <rect x="101" y="33" width="44" height="30" rx="10" fill="#fde68a"/>
      <path d="M55 37c20-22 46-20 68-5" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
      <path d="M96 29v40" stroke="#fff" stroke-width="3"/>
    ${svgClose}`;
  }

  if (type === "throw") {
    return `${svgOpen}
      <rect width="160" height="100" rx="8" fill="#f1f5f9"/>
      <path d="M32 78 142 28 137 92z" fill="#dbeafe"/>
      <path d="M36 76 142 28M36 76l101 16" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="33" cy="76" r="14" fill="#cbd5e1"/>
      <path d="M47 70c27-30 53-41 82-44" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
    ${svgClose}`;
  }

  if (["pool", "stagePool", "laneWater", "diving"].includes(type)) {
    const platform = type === "diving" ? '<path d="M33 26h62" stroke="#64748b" stroke-width="6" stroke-linecap="round"/><path d="M36 29v35" stroke="#64748b" stroke-width="5"/>' : "";
    return `${svgOpen}
      <rect width="160" height="100" rx="8" fill="#dff7ff"/>
      <rect x="12" y="15" width="136" height="70" rx="6" fill="#38bdf8"/>
      <path d="M18 28c16 5 27-5 43 0s27 5 43 0 27-5 38 0M18 50c16 5 27-5 43 0s27 5 43 0 27-5 38 0M18 72c16 5 27-5 43 0s27 5 43 0 27-5 38 0" fill="none" stroke="#e0f2fe" stroke-width="2"/>
      <path d="M37 15v70M55 15v70M73 15v70M91 15v70M109 15v70M127 15v70" stroke="#e0f2fe" stroke-width="1.4"/>
      ${platform}
      <circle cx="58" cy="50" r="4" fill="${accent}"/>
    ${svgClose}`;
  }

  if (["slope", "iceTrack"].includes(type)) {
    return `${svgOpen}
      <rect width="160" height="100" rx="8" fill="#eef2ff"/>
      <path d="M22 22h110L64 88H14z" fill="#f8fafc"/>
      <path d="M132 22 64 88" stroke="#c7d2fe" stroke-width="8" stroke-linecap="round"/>
      <path d="M44 42h12M74 54h12M101 66h12" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="91" cy="54" r="4" fill="${accent}"/>
    ${svgClose}`;
  }

  if (["rink", "iceOval", "curling"].includes(type)) {
    const house = type === "curling" ? '<circle cx="108" cy="50" r="22" fill="#ef4444" opacity=".85"/><circle cx="108" cy="50" r="14" fill="#fff"/><circle cx="108" cy="50" r="7" fill="#2563eb"/>' : '<path d="M80 16v68M37 50h86" stroke="#bfdbfe" stroke-width="2"/><circle cx="80" cy="50" r="12" fill="none" stroke="#bfdbfe" stroke-width="2"/>';
    return `${svgOpen}
      <rect width="160" height="100" rx="8" fill="#e0f2fe"/>
      <rect x="15" y="16" width="130" height="68" rx="34" fill="#f8fafc" stroke="#93c5fd" stroke-width="3"/>
      ${house}
      <circle cx="46" cy="50" r="5" fill="${accent}"/>
    ${svgClose}`;
  }

  if (["ring", "mat"].includes(type)) {
    return `${svgOpen}
      <rect width="160" height="100" rx="8" fill="#fee2e2"/>
      <rect x="25" y="18" width="110" height="64" rx="${type === "mat" ? "30" : "2"}" fill="#f8fafc" stroke="${accent}" stroke-width="4"/>
      <circle cx="80" cy="50" r="24" fill="none" stroke="#fecaca" stroke-width="3"/>
      <circle cx="63" cy="50" r="7" fill="${accent}"/><circle cx="97" cy="50" r="7" fill="#1d4ed8"/>
    ${svgClose}`;
  }

  if (type === "piste") {
    return `${svgOpen}
      <rect width="160" height="100" rx="8" fill="#f1f5f9"/>
      <rect x="14" y="40" width="132" height="20" rx="3" fill="#cbd5e1"/>
      <path d="M30 50h100" stroke="#fff" stroke-width="2" stroke-dasharray="5 5"/>
      <circle cx="55" cy="50" r="5" fill="${accent}"/><circle cx="105" cy="50" r="5" fill="#1d4ed8"/>
    ${svgClose}`;
  }

  if (type === "stage") {
    return `${svgOpen}
      <rect width="160" height="100" rx="8" fill="#fae8ff"/>
      <rect x="24" y="18" width="112" height="64" rx="5" fill="#fff" stroke="#e879f9" stroke-width="2"/>
      <path d="M50 66c18-35 42-35 60 0" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="80" cy="38" r="9" fill="${accent}"/>
    ${svgClose}`;
  }

  if (type === "raceTrack") {
    return `${svgOpen}
      <rect width="160" height="100" rx="8" fill="#dcfce7"/>
      <path d="M25 70c5-36 39-58 73-43 24 11 45 2 52-9" fill="none" stroke="#374151" stroke-width="17" stroke-linecap="round"/>
      <path d="M25 70c5-36 39-58 73-43 24 11 45 2 52-9" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="7 7" stroke-linecap="round"/>
      <circle cx="75" cy="35" r="5" fill="${accent}"/>
    ${svgClose}`;
  }

  return `${svgOpen}<rect width="160" height="100" rx="8" fill="#f8fafc"/><circle cx="80" cy="50" r="28" fill="${accent}" opacity=".18"/><circle cx="80" cy="50" r="8" fill="${accent}"/>${svgClose}`;
}

elements.categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) {
    return;
  }
  state.activeCategory = button.dataset.category;
  renderCategories();
  renderSports();
});

elements.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderSports();
});

elements.sportGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-open]");
  if (button) {
    openRuleDialog(button.dataset.open);
  }
});

elements.recordsList.addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-open]");
  const statusButton = event.target.closest("[data-status]");
  if (openButton) {
    openRuleDialog(openButton.dataset.open);
  }
  if (statusButton) {
    updateRecordStatus(statusButton.dataset.record, statusButton.dataset.status);
  }
});

elements.clearRecords.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderRecords();
});

elements.navButtons.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) {
    elements.dialog.close();
  }
});

renderCategories();
renderSports();
renderRecords();
