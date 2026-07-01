(() => {
const { categories, sports } = window.SPORTS_RULES_DATA;

const STORAGE_KEY = "sports-rules-app-records";
const app = document.querySelector("#app");
const categoryById = new Map(categories.map((category) => [category.id, category]));
const categoriesWithoutAll = categories.filter((category) => category.id !== "all");
const state = {
  query: "",
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
  return crypto.randomUUID ? crypto.randomUUID() : `record-${Date.now()}`;
}

function currentRoute() {
  return location.hash.slice(1) || "/";
}

function normalizeRoute() {
  if (!location.hash) {
    location.hash = "/";
  }
}

function setActiveNav() {
  const route = currentRoute();
  document.querySelectorAll(".nav-button").forEach((link) => {
    const href = link.getAttribute("href");
    const active =
      href === "#/" ? route === "/" : route.startsWith(href.replace("#", ""));
    link.classList.toggle("is-active", active);
  });
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function addRecord(sport) {
  const records = getRecords();
  const now = new Date().toISOString();
  const existing = records.find((record) => record.sportId === sport.id);

  if (existing) {
    const nextRecord = {
      ...existing,
      savedCount: existing.savedCount + 1,
      status: "studying",
      updatedAt: now,
    };
    saveRecords([nextRecord, ...records.filter((record) => record.id !== existing.id)]);
    return nextRecord;
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
  const records = getRecords().map((record) =>
    record.id === recordId
      ? { ...record, status, updatedAt: new Date().toISOString() }
      : record,
  );
  saveRecords(records);
  render();
}

function filteredSports(categoryId = "all") {
  const query = state.query.trim().toLowerCase();

  return sports.filter((sport) => {
    const category = categoryById.get(sport.category);
    const matchesCategory = categoryId === "all" || sport.category === categoryId;
    const searchable = [
      sport.title,
      sport.englishName,
      category?.label,
      sport.summary,
      sport.format,
      sport.venue,
      sport.scoring,
      sport.fouls,
      sport.watchFocus,
    ]
      .join(" ")
      .toLowerCase();

    return matchesCategory && (!query || searchable.includes(query));
  });
}

function sportsForCategory(categoryId) {
  return sports.filter((sport) => sport.category === categoryId);
}

function sampleSports(categoryId) {
  return sportsForCategory(categoryId)
    .slice(0, 4)
    .map((sport) => sport.title)
    .join(" / ");
}

function buildCanvaPrompt(sport) {
  const category = categoryById.get(sport.category);
  return `为体育赛事规则APP设计一张${sport.title}赛事图卡，16:9横版，中文标题“${sport.title}”，小标签“${category?.label ?? sport.category}”，画面突出${sport.venue}，加入规则关键词：赛制、得分、常见判罚。风格：清晰教育型、扁平矢量、色彩明快、适合小程序和网页卡片，避免复杂背景和密集文字。`;
}

function renderSportPoster(sport) {
  const category = categoryById.get(sport.category);
  const categoryLabel = escapeHtml(category?.label ?? sport.category);
  const categoryColor = escapeHtml(category?.color ?? sport.accent);
  const accent = escapeHtml(sport.accent);
  const title = escapeHtml(sport.title);
  const englishName = escapeHtml(sport.englishName);
  const shortRule = escapeHtml(sport.scoring.split("，")[0]);
  const gradientId = `poster-${escapeHtml(sport.id)}`;

  return `
    <svg class="poster-svg" viewBox="0 0 640 360" role="img" aria-label="${title}赛事图卡">
      <title>${title}赛事图卡</title>
      <defs>
        <linearGradient id="${gradientId}" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#ffffff" />
          <stop offset="1" stop-color="#eef7ff" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" rx="22" fill="url(#${gradientId})" />
      <rect x="0" y="0" width="14" height="360" fill="${categoryColor}" />
      <circle cx="524" cy="70" r="112" fill="${accent}" opacity="0.12" />
      <circle cx="575" cy="300" r="92" fill="${categoryColor}" opacity="0.12" />
      <rect x="38" y="34" width="132" height="36" rx="18" fill="${categoryColor}" opacity="0.14" />
      <text x="104" y="57" fill="${categoryColor}" text-anchor="middle" font-size="18" font-weight="800">${categoryLabel}</text>
      <text x="38" y="132" fill="#111827" font-size="58" font-weight="900">${title}</text>
      <text x="41" y="170" fill="#64748b" font-size="22" font-weight="800">${englishName}</text>
      <text x="40" y="302" fill="#334155" font-size="21" font-weight="800">规则图卡 · ${shortRule}</text>
      <g transform="translate(344 92)">
        ${renderPosterSymbol(sport.visualType, accent, categoryColor)}
      </g>
    </svg>
  `;
}

function renderPosterSymbol(type, accent, categoryColor) {
  if (["field", "court", "netCourt"].includes(type)) {
    const net = type === "netCourt" ? '<path d="M122 26v166" stroke="#111827" stroke-width="5" opacity=".72"/>' : "";
    return `<rect x="0" y="0" width="244" height="190" rx="18" fill="${accent}" opacity=".82"/><rect x="18" y="20" width="208" height="150" rx="10" fill="none" stroke="#fff" stroke-width="7"/><path d="M122 20v150M18 95h208" stroke="#fff" stroke-width="5" opacity=".9"/><circle cx="122" cy="95" r="35" fill="none" stroke="#fff" stroke-width="5" opacity=".92"/>${net}<circle cx="172" cy="72" r="19" fill="#fff"/><circle cx="172" cy="72" r="9" fill="${categoryColor}"/>`;
  }

  if (type === "table") {
    return `<path d="M28 36h190l25 118H3z" fill="${accent}" opacity=".88"/><path d="M122 36v118M8 95h230" stroke="#fff" stroke-width="7"/><circle cx="183" cy="65" r="15" fill="#fff"/><path d="M178 150h-36M103 150H66" stroke="#111827" stroke-width="8" opacity=".28" stroke-linecap="round"/>`;
  }

  if (type === "diamond") {
    return `<path d="M122 8 230 99 122 184 14 99z" fill="#f3c77a"/><path d="M122 42 188 99 122 154 56 99z" fill="${accent}" opacity=".72"/><path d="M122 154 56 99 122 42 188 99z" fill="none" stroke="#fff" stroke-width="7"/><circle cx="122" cy="154" r="12" fill="#fff"/><circle cx="56" cy="99" r="12" fill="#fff"/><circle cx="122" cy="42" r="12" fill="#fff"/><circle cx="188" cy="99" r="12" fill="#fff"/>`;
  }

  if (["track", "hurdles", "relay", "road", "raceTrack"].includes(type)) {
    const hurdles = type === "hurdles" ? '<path d="M72 60v70M112 50v80M152 46v84" stroke="#fff" stroke-width="8" stroke-linecap="round"/>' : "";
    const baton = type === "relay" ? '<path d="M70 63h58M116 127h58" stroke="#fde047" stroke-width="12" stroke-linecap="round"/>' : "";
    return `<rect x="0" y="14" width="244" height="160" rx="80" fill="${accent}" opacity=".86"/><rect x="48" y="53" width="148" height="82" rx="41" fill="#f8fafc"/><path d="M48 39h148M48 68h148M48 96h148M48 124h148M48 153h148" stroke="#fff" stroke-width="4" opacity=".82"/>${hurdles}${baton}<circle cx="66" cy="95" r="15" fill="${categoryColor}"/>`;
  }

  if (["jump", "throw"].includes(type)) {
    return `<path d="M16 144h210" stroke="#94a3b8" stroke-width="18" stroke-linecap="round"/><path d="M44 108c50-62 117-70 169-15" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round"/><circle cx="56" cy="110" r="18" fill="${categoryColor}"/><path d="M156 46l60 28" stroke="#111827" stroke-width="8" opacity=".18" stroke-linecap="round"/>`;
  }

  if (["pool", "stagePool", "laneWater", "diving"].includes(type)) {
    const platform = type === "diving" ? '<path d="M34 25h112" stroke="#475569" stroke-width="12" stroke-linecap="round"/><path d="M42 31v78" stroke="#475569" stroke-width="10"/>' : "";
    return `<rect x="0" y="18" width="244" height="154" rx="18" fill="#38bdf8"/><path d="M18 54c32 12 50-12 82 0s50 12 82 0 38-10 48-3M18 98c32 12 50-12 82 0s50 12 82 0 38-10 48-3M18 140c32 12 50-12 82 0s50 12 82 0 38-10 48-3" fill="none" stroke="#e0f2fe" stroke-width="7" stroke-linecap="round"/>${platform}<circle cx="142" cy="88" r="16" fill="${categoryColor}"/>`;
  }

  if (["slope", "iceTrack", "rink", "iceOval", "curling"].includes(type)) {
    const house = type === "curling" ? '<circle cx="174" cy="97" r="39" fill="#ef4444"/><circle cx="174" cy="97" r="25" fill="#fff"/><circle cx="174" cy="97" r="12" fill="#2563eb"/>' : '<path d="M122 30v130M54 95h136" stroke="#bfdbfe" stroke-width="6"/>';
    return `<rect x="0" y="16" width="244" height="158" rx="79" fill="#f8fafc" stroke="#93c5fd" stroke-width="8"/><path d="M34 40h120L73 174H8z" fill="${accent}" opacity=".14"/>${house}<circle cx="72" cy="96" r="16" fill="${categoryColor}"/>`;
  }

  if (["ring", "mat", "piste"].includes(type)) {
    return `<rect x="14" y="24" width="216" height="140" rx="${type === "piste" ? "16" : "70"}" fill="#fff" stroke="${accent}" stroke-width="10"/><circle cx="98" cy="94" r="20" fill="${categoryColor}"/><circle cx="148" cy="94" r="20" fill="#2563eb"/><path d="M65 94h115" stroke="#111827" stroke-width="6" opacity=".18" stroke-linecap="round"/>`;
  }

  if (type === "stage") {
    return `<rect x="26" y="24" width="192" height="140" rx="16" fill="#fff" stroke="${accent}" stroke-width="8"/><path d="M70 128c35-70 70-70 105 0" fill="none" stroke="${categoryColor}" stroke-width="12" stroke-linecap="round"/><circle cx="122" cy="70" r="22" fill="${accent}"/>`;
  }

  return `<circle cx="122" cy="95" r="78" fill="${accent}" opacity=".2"/><circle cx="122" cy="95" r="30" fill="${categoryColor}"/>`;
}

function render() {
  normalizeRoute();
  setActiveNav();

  const route = currentRoute();
  const parts = route.split("/").filter(Boolean);

  if (parts[0] === "sport") {
    renderSportPage(parts[1]);
    return;
  }

  if (parts[0] === "category") {
    renderCategoryPage(parts[1] || "all");
    return;
  }

  if (parts[0] === "records") {
    renderRecordsPage();
    return;
  }

  renderHomePage();
}

function renderHomePage() {
  const featured = ["football", "basketball", "swimming", "skiing", "boxing", "short-track"]
    .map((id) => sports.find((sport) => sport.id === id))
    .filter(Boolean);

  app.innerHTML = `
    <section class="category-dashboard">
      <div class="dashboard-copy">
        <p class="eyebrow">SPORT RULES EXPLAINER</p>
        <h2>先选赛事大类，再进入项目规则</h2>
        <p>每个类别都可以点开查看细分项目，每个项目都有赛事图卡、赛制、场地器材、得分胜负、常见判罚和观赛重点。</p>
        <div class="hero-stats">
          <span><b>7</b>大类</span>
          <span><b>44</b>项目</span>
          <span><b>5</b>规则维度</span>
        </div>
      </div>
      <div class="category-grid category-grid-primary">
        ${categoriesWithoutAll.map(renderCategoryCard).join("")}
      </div>
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">推荐项目</p>
          <h2>先看这些赛事图卡</h2>
        </div>
        <a class="text-link" href="#/category/all">全部项目</a>
      </div>
      <div class="sport-grid">
        ${featured.map(renderSportCard).join("")}
      </div>
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">学习记录</p>
          <h2>复习已经保存的项目</h2>
        </div>
        <a class="primary-link" href="#/records">查看学习记录</a>
      </div>
    </section>
  `;
}

function renderCategoryCard(category) {
  const count = sportsForCategory(category.id).length;

  return `
    <a class="category-card" href="#/category/${escapeHtml(category.id)}">
      <span class="category-bar" style="background:${escapeHtml(category.color)}"></span>
      <span class="category-card-main">
        <b>${escapeHtml(category.label)}</b>
        <small>${escapeHtml(category.description)}</small>
        <em>${escapeHtml(sampleSports(category.id))}</em>
      </span>
      <span class="category-card-count">${count}项</span>
    </a>
  `;
}

function renderCategoryPage(categoryId) {
  const category = categoryById.get(categoryId) || categoryById.get("all");
  const list = filteredSports(category.id);

  app.innerHTML = `
    <div class="page-grid">
      <aside class="sidebar">
        <label class="search-box">
          <span>搜索项目</span>
          <input id="search-input" type="search" value="${escapeHtml(state.query)}" placeholder="足球、跳水、短道速滑..." />
        </label>
        <section class="filter-block">
          <div class="section-title">
            <h2>赛事分类</h2>
            <span>${sports.length}项</span>
          </div>
          <div class="category-list">
            ${categories.map((item) => renderCategoryButton(item, category.id)).join("")}
          </div>
        </section>
        <section class="brief-panel">
          <h2>学习框架</h2>
          <ol>
            <li>进入分类页选择项目</li>
            <li>打开详情页看完整规则</li>
            <li>加入学习记录继续复习</li>
          </ol>
        </section>
      </aside>

      <section class="content-view">
        <div class="content-head">
          <div>
            <p class="eyebrow">赛事规则库</p>
            <h2>${escapeHtml(category.label)}</h2>
            <p class="content-desc">${escapeHtml(category.description)}</p>
          </div>
          <div class="result-meta">
            <span data-result-count>${list.length}</span>
            <span>个项目</span>
          </div>
        </div>
        <div id="sport-grid" class="sport-grid">
          ${list.length ? list.map(renderSportCard).join("") : renderEmptyState()}
        </div>
      </section>
    </div>
  `;

}

function renderCategoryButton(category, activeId) {
  const activeClass = category.id === activeId ? " is-active" : "";
  return `
    <a class="category-button${activeClass}" href="#/category/${escapeHtml(category.id)}">
      <span class="category-color" style="background:${escapeHtml(category.color)}"></span>
      <span>
        <span class="category-name">${escapeHtml(category.label)}</span>
        <span class="category-desc">${escapeHtml(category.description)}</span>
      </span>
      <span class="category-count">${escapeHtml(category.countLabel)}</span>
    </a>
  `;
}

function renderSportCard(sport) {
  const category = categoryById.get(sport.category);

  return `
    <article class="sport-card">
      <a class="visual" href="#/sport/${escapeHtml(sport.id)}">${renderSportPoster(sport)}</a>
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
        <a class="primary-link card-link" href="#/sport/${escapeHtml(sport.id)}">进入详情</a>
      </div>
    </article>
  `;
}

function renderSportPage(sportId) {
  const sport = sports.find((item) => item.id === sportId);
  if (!sport) {
    app.innerHTML = renderNotFound();
    return;
  }

  const category = categoryById.get(sport.category);
  const related = sports
    .filter((item) => item.category === sport.category && item.id !== sport.id)
    .slice(0, 3);

  app.innerHTML = `
    <section class="detail-layout">
      <aside class="detail-side">
        <a class="text-link" href="#/category/${escapeHtml(sport.category)}">返回${escapeHtml(category?.label ?? "分类")}</a>
        <div class="detail-visual">${renderSportPoster(sport)}</div>
        <button class="primary-button" type="button" data-save="${escapeHtml(sport.id)}">加入学习记录</button>
        <label class="toggle-row">
          <span>大字模式</span>
          <input type="checkbox" data-large-text />
        </label>
        <div class="source-box" id="save-status">官方规则线索：${escapeHtml(sport.source)}</div>
      </aside>

      <article class="detail-main">
        <div class="detail-title">
          <p class="eyebrow">${escapeHtml(category?.label ?? sport.category)}</p>
          <h2>${escapeHtml(sport.title)}</h2>
          <p>${escapeHtml(sport.summary)}</p>
        </div>
        <div class="rule-list">
          ${renderRuleSection("比赛赛制", sport.format)}
          ${renderRuleSection("场地器材", sport.venue)}
          ${renderRuleSection("得分胜负", sport.scoring)}
          ${renderRuleSection("常见判罚", sport.fouls)}
          ${renderRuleSection("观赛重点", sport.watchFocus)}
          ${renderRuleSection("Canva图卡提示", buildCanvaPrompt(sport))}
        </div>

        <section class="related-section">
          <div class="section-head">
            <div>
              <p class="eyebrow">同类项目</p>
              <h2>继续学习${escapeHtml(category?.label ?? "")}</h2>
            </div>
          </div>
          <div class="compact-grid">
            ${related.map(renderCompactSport).join("")}
          </div>
        </section>
      </article>
    </section>
  `;
}

function renderRuleSection(title, body) {
  return `
    <section class="rule-section">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
    </section>
  `;
}

function renderCompactSport(sport) {
  return `
    <a class="compact-card" href="#/sport/${escapeHtml(sport.id)}">
      <span>${renderSportPoster(sport)}</span>
      <b>${escapeHtml(sport.title)}</b>
      <small>${escapeHtml(sport.summary)}</small>
    </a>
  `;
}

function renderRecordsPage() {
  const records = getRecords();

  app.innerHTML = `
    <section class="content-view single-view">
      <div class="content-head">
        <div>
          <p class="eyebrow">本地记录</p>
          <h2>学习记录</h2>
        </div>
        ${records.length ? '<button class="ghost-button" type="button" data-clear-records>清空记录</button>' : ""}
      </div>
      <div class="records-list">
        ${records.length ? records.map(renderRecordCard).join("") : renderEmptyRecords()}
      </div>
    </section>
  `;
}

function renderRecordCard(record) {
  const category = categoryById.get(record.category);
  const status = record.status === "mastered" ? "已掌握" : "学习中";

  return `
    <article class="record-card">
      <div class="sport-meta">
        <span class="pill">${escapeHtml(category?.label ?? record.category)}</span>
        <span class="pill">${status}</span>
      </div>
      <h3>${escapeHtml(record.sportTitle)}</h3>
      <p>${escapeHtml(record.englishName)} · 保存 ${record.savedCount} 次 · ${formatDateTime(record.updatedAt)}</p>
      <p>官方规则线索：${escapeHtml(record.source)}</p>
      <div class="record-actions">
        <a class="primary-link" href="#/sport/${escapeHtml(record.sportId)}">打开详情</a>
        <button class="record-button" type="button" data-status="studying" data-record="${escapeHtml(record.id)}">继续学习</button>
        <button class="record-button" type="button" data-status="mastered" data-record="${escapeHtml(record.id)}">标记已掌握</button>
      </div>
    </article>
  `;
}

function renderEmptyState() {
  return `
    <div class="empty-state">
      <h3>没有找到匹配项目</h3>
      <p>换一个关键词，或切换到全部项目。</p>
    </div>
  `;
}

function renderEmptyRecords() {
  return `
    <div class="empty-state">
      <h3>暂无学习记录</h3>
      <p>进入任意项目详情页，点击“加入学习记录”后会显示在这里。</p>
      <a class="primary-link" href="#/category/all">去规则库</a>
    </div>
  `;
}

function renderNotFound() {
  return `
    <section class="content-view single-view">
      <div class="empty-state">
        <h3>没有找到这个项目</h3>
        <p>返回规则库重新选择。</p>
        <a class="primary-link" href="#/category/all">返回规则库</a>
      </div>
    </section>
  `;
}

function renderVisual(sport) {
  const accent = escapeHtml(sport.accent);
  const title = escapeHtml(sport.title);
  const type = sport.visualType;
  const svgOpen = `<svg viewBox="0 0 160 100" role="img" aria-label="${title}示意图"><title>${title}示意图</title>`;
  const svgClose = "</svg>";

  if (type === "field") {
    return `${svgOpen}<rect width="160" height="100" rx="8" fill="#dff4df"/><rect x="8" y="8" width="144" height="84" rx="4" fill="#58a55c"/><path d="M80 8v84M8 50h144" stroke="#fff" stroke-width="2"/><circle cx="80" cy="50" r="14" fill="none" stroke="#fff" stroke-width="2"/><rect x="8" y="27" width="24" height="46" fill="none" stroke="#fff" stroke-width="2"/><rect x="128" y="27" width="24" height="46" fill="none" stroke="#fff" stroke-width="2"/><circle cx="80" cy="50" r="2" fill="#fff"/>${svgClose}`;
  }

  if (type === "court") {
    return `${svgOpen}<rect width="160" height="100" rx="8" fill="#fff7ed"/><rect x="10" y="10" width="140" height="80" rx="3" fill="#f6c17b"/><path d="M80 10v80M10 50h140" stroke="#fff" stroke-width="2"/><circle cx="80" cy="50" r="13" fill="none" stroke="#fff" stroke-width="2"/><path d="M10 27h22v46H10M150 27h-22v46h22" fill="none" stroke="#fff" stroke-width="2"/><circle cx="22" cy="50" r="3" fill="${accent}"/><circle cx="138" cy="50" r="3" fill="${accent}"/>${svgClose}`;
  }

  if (type === "netCourt") {
    return `${svgOpen}<rect width="160" height="100" rx="8" fill="#ecfccb"/><rect x="12" y="14" width="136" height="72" rx="3" fill="#a3e635"/><path d="M80 14v72" stroke="#111827" stroke-width="2"/><path d="M12 38h136M12 62h136M36 14v72M124 14v72" stroke="#fff" stroke-width="1.6"/><circle cx="55" cy="50" r="4" fill="${accent}"/><circle cx="105" cy="50" r="4" fill="#fff"/>${svgClose}`;
  }

  if (type === "table") {
    return `${svgOpen}<rect width="160" height="100" rx="8" fill="#dbeafe"/><path d="M35 25h90l12 52H23z" fill="#2563eb"/><path d="M80 25v52M26 51h108" stroke="#fff" stroke-width="2"/><path d="M30 51h100" stroke="#111827" stroke-width="3" opacity=".22"/><circle cx="106" cy="39" r="4" fill="#fff"/>${svgClose}`;
  }

  if (type === "diamond") {
    return `${svgOpen}<rect width="160" height="100" rx="8" fill="#dcfce7"/><path d="M80 15 132 58 80 94 28 58z" fill="#f7d08a"/><path d="M80 28 114 58 80 82 46 58z" fill="#86efac"/><path d="M80 82 46 58 80 28 114 58z" fill="none" stroke="#fff" stroke-width="2"/><circle cx="80" cy="82" r="4" fill="#fff"/><circle cx="46" cy="58" r="4" fill="#fff"/><circle cx="80" cy="28" r="4" fill="#fff"/><circle cx="114" cy="58" r="4" fill="#fff"/>${svgClose}`;
  }

  if (["track", "hurdles", "relay"].includes(type)) {
    const hurdles = type === "hurdles" ? '<path d="M58 27v46M74 27v46M90 27v46M106 27v46" stroke="#fff" stroke-width="2"/>' : "";
    const relay = type === "relay" ? '<path d="M50 39h28M82 61h28" stroke="#fde047" stroke-width="4" stroke-linecap="round"/>' : "";
    return `${svgOpen}<rect width="160" height="100" rx="8" fill="#fee2e2"/><rect x="16" y="15" width="128" height="70" rx="35" fill="#ef4444"/><rect x="36" y="30" width="88" height="40" rx="20" fill="#f8fafc"/><path d="M36 26h88M36 38h88M36 50h88M36 62h88M36 74h88" stroke="#fff" stroke-width="1.2"/>${hurdles}${relay}<circle cx="48" cy="50" r="4" fill="${accent}"/>${svgClose}`;
  }

  if (type === "road") {
    return `${svgOpen}<rect width="160" height="100" rx="8" fill="#e0f2fe"/><path d="M12 82c28-42 41-48 61-31 15 13 28 8 39-13 8-15 20-22 37-17" fill="none" stroke="#64748b" stroke-width="14" stroke-linecap="round"/><path d="M12 82c28-42 41-48 61-31 15 13 28 8 39-13 8-15 20-22 37-17" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 7" stroke-linecap="round"/>${svgClose}`;
  }

  if (type === "jump") {
    return `${svgOpen}<rect width="160" height="100" rx="8" fill="#fffbeb"/><rect x="14" y="42" width="86" height="12" rx="2" fill="#94a3b8"/><rect x="101" y="33" width="44" height="30" rx="10" fill="#fde68a"/><path d="M55 37c20-22 46-20 68-5" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round"/><path d="M96 29v40" stroke="#fff" stroke-width="3"/>${svgClose}`;
  }

  if (type === "throw") {
    return `${svgOpen}<rect width="160" height="100" rx="8" fill="#f1f5f9"/><path d="M32 78 142 28 137 92z" fill="#dbeafe"/><path d="M36 76 142 28M36 76l101 16" stroke="#94a3b8" stroke-width="1.5"/><circle cx="33" cy="76" r="14" fill="#cbd5e1"/><path d="M47 70c27-30 53-41 82-44" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>${svgClose}`;
  }

  if (["pool", "stagePool", "laneWater", "diving"].includes(type)) {
    const platform = type === "diving" ? '<path d="M33 26h62" stroke="#64748b" stroke-width="6" stroke-linecap="round"/><path d="M36 29v35" stroke="#64748b" stroke-width="5"/>' : "";
    return `${svgOpen}<rect width="160" height="100" rx="8" fill="#dff7ff"/><rect x="12" y="15" width="136" height="70" rx="6" fill="#38bdf8"/><path d="M18 28c16 5 27-5 43 0s27 5 43 0 27-5 38 0M18 50c16 5 27-5 43 0s27 5 43 0 27-5 38 0M18 72c16 5 27-5 43 0s27 5 43 0 27-5 38 0" fill="none" stroke="#e0f2fe" stroke-width="2"/><path d="M37 15v70M55 15v70M73 15v70M91 15v70M109 15v70M127 15v70" stroke="#e0f2fe" stroke-width="1.4"/>${platform}<circle cx="58" cy="50" r="4" fill="${accent}"/>${svgClose}`;
  }

  if (["slope", "iceTrack"].includes(type)) {
    return `${svgOpen}<rect width="160" height="100" rx="8" fill="#eef2ff"/><path d="M22 22h110L64 88H14z" fill="#f8fafc"/><path d="M132 22 64 88" stroke="#c7d2fe" stroke-width="8" stroke-linecap="round"/><path d="M44 42h12M74 54h12M101 66h12" stroke="${accent}" stroke-width="3" stroke-linecap="round"/><circle cx="91" cy="54" r="4" fill="${accent}"/>${svgClose}`;
  }

  if (["rink", "iceOval", "curling"].includes(type)) {
    const house = type === "curling" ? '<circle cx="108" cy="50" r="22" fill="#ef4444" opacity=".85"/><circle cx="108" cy="50" r="14" fill="#fff"/><circle cx="108" cy="50" r="7" fill="#2563eb"/>' : '<path d="M80 16v68M37 50h86" stroke="#bfdbfe" stroke-width="2"/><circle cx="80" cy="50" r="12" fill="none" stroke="#bfdbfe" stroke-width="2"/>';
    return `${svgOpen}<rect width="160" height="100" rx="8" fill="#e0f2fe"/><rect x="15" y="16" width="130" height="68" rx="34" fill="#f8fafc" stroke="#93c5fd" stroke-width="3"/>${house}<circle cx="46" cy="50" r="5" fill="${accent}"/>${svgClose}`;
  }

  if (["ring", "mat"].includes(type)) {
    return `${svgOpen}<rect width="160" height="100" rx="8" fill="#fee2e2"/><rect x="25" y="18" width="110" height="64" rx="${type === "mat" ? "30" : "2"}" fill="#f8fafc" stroke="${accent}" stroke-width="4"/><circle cx="80" cy="50" r="24" fill="none" stroke="#fecaca" stroke-width="3"/><circle cx="63" cy="50" r="7" fill="${accent}"/><circle cx="97" cy="50" r="7" fill="#1d4ed8"/>${svgClose}`;
  }

  if (type === "piste") {
    return `${svgOpen}<rect width="160" height="100" rx="8" fill="#f1f5f9"/><rect x="14" y="40" width="132" height="20" rx="3" fill="#cbd5e1"/><path d="M30 50h100" stroke="#fff" stroke-width="2" stroke-dasharray="5 5"/><circle cx="55" cy="50" r="5" fill="${accent}"/><circle cx="105" cy="50" r="5" fill="#1d4ed8"/>${svgClose}`;
  }

  if (type === "stage") {
    return `${svgOpen}<rect width="160" height="100" rx="8" fill="#fae8ff"/><rect x="24" y="18" width="112" height="64" rx="5" fill="#fff" stroke="#e879f9" stroke-width="2"/><path d="M50 66c18-35 42-35 60 0" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round"/><circle cx="80" cy="38" r="9" fill="${accent}"/>${svgClose}`;
  }

  if (type === "raceTrack") {
    return `${svgOpen}<rect width="160" height="100" rx="8" fill="#dcfce7"/><path d="M25 70c5-36 39-58 73-43 24 11 45 2 52-9" fill="none" stroke="#374151" stroke-width="17" stroke-linecap="round"/><path d="M25 70c5-36 39-58 73-43 24 11 45 2 52-9" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="7 7" stroke-linecap="round"/><circle cx="75" cy="35" r="5" fill="${accent}"/>${svgClose}`;
  }

  return `${svgOpen}<rect width="160" height="100" rx="8" fill="#f8fafc"/><circle cx="80" cy="50" r="28" fill="${accent}" opacity=".18"/><circle cx="80" cy="50" r="8" fill="${accent}"/>${svgClose}`;
}

document.addEventListener("input", (event) => {
  if (event.target.id !== "search-input") {
    return;
  }
  state.query = event.target.value;
  const route = currentRoute();
  const parts = route.split("/").filter(Boolean);
  if (parts[0] === "category") {
    const list = filteredSports(parts[1] || "all");
    const grid = document.querySelector("#sport-grid");
    const count = document.querySelector("[data-result-count]");
    if (grid) {
      grid.innerHTML = list.length ? list.map(renderSportCard).join("") : renderEmptyState();
    }
    if (count) {
      count.textContent = String(list.length);
    }
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-large-text]")) {
    document.querySelector(".detail-main")?.classList.toggle("large-text", event.target.checked);
  }
});

document.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save]");
  const clearButton = event.target.closest("[data-clear-records]");
  const statusButton = event.target.closest("[data-status]");

  if (saveButton) {
    const sport = sports.find((item) => item.id === saveButton.dataset.save);
    if (!sport) return;
    const record = addRecord(sport);
    const status = document.querySelector("#save-status");
    if (status) {
      status.textContent = `已保存“${record.sportTitle}”到学习记录`;
    }
  }

  if (clearButton) {
    localStorage.removeItem(STORAGE_KEY);
    renderRecordsPage();
  }

  if (statusButton) {
    updateRecordStatus(statusButton.dataset.record, statusButton.dataset.status);
  }
});

window.addEventListener("hashchange", render);
render();
})();
