/* ==========================================================================
   Declassified Encounters — library logic
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- data ---------- */
  const AGENCY_BY_ORG = {
    "US Department of War": "DoW",
    "All-domain Anomaly Resolution Office (DoD)": "DoD",
    "Federal Bureau of Investigation": "FBI",
    "FBI / US Department of War": "FBI",
    "Central Intelligence Agency": "CIA",
    "CIA Office of Scientific Intelligence": "CIA",
    "CIA (translation of Smena, 1967)": "CIA",
    "National Security Agency": "NSA",
    "US Air Force / National Archives": "USAF",
    "US Air Force / DTIC": "USAF",
    "US Air Force": "USAF",
    "US National Archives and Records Administration": "NARA",
    "US National Archives": "NARA",
    "The National Archives (UK) / MoD": "MoD",
    "The National Archives (UK)": "MoD",
    "CNES (French Space Agency)": "CNES",
    "Library and Archives Canada": "LAC",
    "Arquivo Nacional / Força Aérea Brasileira": "FAB",
    "Força Aérea Brasileira": "FAB",
    "New Zealand Defence Force": "NZDF",
    "National Archives of Australia": "NAA",
    "University of Colorado / US Air Force": "USAF",
    "Brookings Institution for NASA": "NASA",
    "KGB (USSR)": "KGB",
  };

  const normalize = (r, fallbackKind) => ({
    ...r,
    kind: r.kind || (r.badge === "myth" ? "myth" : fallbackKind),
    collection: r.collection || r.id,
    agency: r.agency || AGENCY_BY_ORG[r.org] || "—",
    location: r.location || r.country || "—",
    format: r.format || r.type || "—",
  });

  const collections = (window.DE_COLLECTIONS?.records || []).map((r) => normalize(r, "collection"));
  const documents = (window.DE_DOCUMENTS || []).map((d) => normalize(d, "document"));

  const allItems = [...collections, ...documents];

  const BADGE_TEXT = {
    gov: "Official",
    institution: "Institutional",
    mirror: "Mirror",
    myth: "No document",
  };

  const AGENCY_INFO = Object.fromEntries(
    (window.DE_AGENCIES || []).map((a) => [a.code, a])
  );
  const STORAGE = window.DE_STORAGE || { byRecord: {}, totals: {} };

  const SORTS = {
    relevance: (a, b) => a._i - b._i,
    "year-desc": (a, b) => b.yearStart - a.yearStart,
    "year-asc": (a, b) => a.yearStart - b.yearStart,
    title: (a, b) => a.title.localeCompare(b.title),
  };

  const savedView = localStorage.getItem("de-view");
  const state = {
    q: "",
    category: "all",
    agency: "all",
    decade: "all",
    type: "all",
    badge: "all",
    kind: "all",
    sort: "relevance",
    view: savedView === "grid" ? "grid" : "table",
    limit: 24,
  };

  /* ---------- elements ---------- */
  const $ = (s) => document.querySelector(s);
  const resultsEl = $("#results");
  const searchEl = $("#search");
  const countEl = $("#resultCount");
  const colHead = $("#colHead");
  const loadNote = $("#loadNote");
  const loadText = $("#loadText");
  const loadMore = $("#loadMore");
  const overlay = $("#overlay");
  const drawer = $("#drawer");
  const drawerBody = $("#drawerBody");

  /* ---------- helpers ---------- */
  const esc = (s = "") =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const decadeOf = (y) => {
    if (!y) return "unknown";
    if (y < 1950) return "pre-1950";
    return Math.floor(y / 10) * 10 + "s";
  };

  const haystack = (item) =>
    [
      item.title,
      item.short,
      item.summary,
      item.org,
      item.agency,
      item.country,
      item.location,
      item.type,
      item.format,
      item.release,
      item.dateLabel,
      item.year,
      item.yearStart,
      (item.tags || []).join(" "),
      item.inside ? item.inside.join(" ") : "",
    ]
      .join(" ")
      .toLowerCase();

  const tokens = () =>
    state.q
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

  function score(item, toks) {
    if (!toks.length) return 0;
    const title = (item.title + " " + (item.short || "")).toLowerCase();
    const tags = (item.tags || []).join(" ").toLowerCase();
    const body = haystack(item);
    let s = 0;
    for (const t of toks) {
      if (!body.includes(t)) return -1;
      if (title.includes(t)) s += 6;
      if (tags.includes(t)) s += 3;
      if ((item.agency || "").toLowerCase().includes(t)) s += 2;
      s += 1;
    }
    return s;
  }

  /* ---------- facets ---------- */
  function buildFacets() {
    const agencies = [...new Set(allItems.map((i) => i.agency).filter(Boolean))].sort();
    const types = [...new Set(allItems.map((i) => i.type).filter(Boolean))].sort();
    const decades = [...new Set(allItems.map((i) => decadeOf(i.yearStart)))].sort((a, b) => {
      if (a === "unknown") return 1;
      if (b === "unknown") return -1;
      if (a === "pre-1950") return -1;
      if (b === "pre-1950") return 1;
      return parseInt(a) - parseInt(b);
    });

    const agencySel = $("#agency");
    agencies.forEach((a) => {
      const info = AGENCY_INFO[a];
      const label = info ? `${a} — ${info.name}` : a;
      agencySel.insertAdjacentHTML("beforeend", `<option value="${esc(a)}">${esc(label)}</option>`);
    });

    const typeSel = $("#type");
    types.forEach((t) => typeSel.insertAdjacentHTML("beforeend", `<option value="${esc(t)}">${esc(t)}</option>`));

    const decadeSel = $("#decade");
    decades.filter((d) => d !== "unknown").forEach((d) =>
      decadeSel.insertAdjacentHTML("beforeend", `<option value="${esc(d)}">${esc(d)}</option>`)
    );
  }

  /* ---------- filtering ---------- */
  function baseFiltered() {
    const toks = tokens();
    return allItems.filter((item) => {
      if (state.category !== "all" && item.category !== state.category) return false;
      if (state.agency !== "all" && item.agency !== state.agency) return false;
      if (state.decade !== "all" && decadeOf(item.yearStart) !== state.decade) return false;
      if (state.type !== "all" && item.type !== state.type) return false;
      if (state.badge !== "all" && item.badge !== state.badge) return false;
      if (toks.length && score(item, toks) < 0) return false;
      return true;
    });
  }

  function currentResults() {
    let list = baseFiltered();
    if (state.kind !== "all") list = list.filter((i) => i.kind === state.kind);

    const toks = tokens();
    list = list.map((item) => ({ item, s: score(item, toks) }));
    list.sort((a, b) => {
      if (state.sort === "relevance" && toks.length) return b.s - a.s || a.item._i - b.item._i;
      return SORTS[state.sort](a.item, b.item);
    });
    return list.map((x) => x.item);
  }

  /* ---------- render ---------- */
  function badgeHTML(badge) {
    return `<span class="badge ${badge}"><i></i>${BADGE_TEXT[badge] || badge}</span>`;
  }

  function resultHTML(item, i) {
    return `
      <button class="result" type="button" data-id="${esc(item.id)}" style="--i:${i}" aria-label="Open record: ${esc(item.title)}">
        <span class="r-badge">${badgeHTML(item.badge)}</span>
        <span class="r-main">
          <span class="r-title">${esc(item.title)}</span>
          <span class="r-sum">${esc(item.summary)}</span>
        </span>
        <span class="r-agency" title="${esc(AGENCY_INFO[item.agency]?.name || item.agency || "")}">${esc(item.agency || "—")}</span>
        <span class="r-date">${esc(item.dateLabel || item.year || "—")}</span>
        <span class="r-loc">${esc(item.location || "—")}</span>
        <span class="r-format">${esc(item.format || item.type || "—")}</span>
        <span class="r-go" aria-hidden="true">↗</span>
      </button>`;
  }

  function render() {
    const list = currentResults();
    const visible = list.slice(0, state.limit);

    resultsEl.className = "view-" + state.view;
    resultsEl.innerHTML = visible.length
      ? visible.map(resultHTML).join("")
      : `<div class="empty"><b>No records match that.</b>Try a broader term — or reset the filters. <code>Roswell</code> <code>CIA</code> <code>1953</code> <code>treaty</code></div>`;

    countEl.textContent = list.length;
    colHead.hidden = state.view !== "table" || !visible.length;

    // tab counts reflect the current query, not the current tab
    const base = baseFiltered();
    const counts = { all: base.length, collection: 0, document: 0, myth: 0 };
    base.forEach((i) => (counts[i.kind] = (counts[i.kind] || 0) + 1));
    document.querySelectorAll("[data-count]").forEach((el) => {
      el.textContent = counts[el.dataset.count] ?? 0;
    });

    loadNote.hidden = list.length <= state.limit;
    if (!loadNote.hidden) loadText.textContent = `Showing ${visible.length} of ${list.length}`;
  }

  /* ---------- drawer ---------- */
  let lastFocus = null;

  function openDrawer(id, push = true) {
    const item = allItems.find((i) => i.id === id);
    if (!item) return;

    lastFocus = document.activeElement;

    $("#drawerBadge").className = "badge " + item.badge;
    $("#drawerBadge").innerHTML = `<i></i>${BADGE_TEXT[item.badge] || item.badge}`;
    $("#drawerTitle").textContent = item.title;
    $("#drawerSub").textContent = [item.org, item.country, item.dateLabel || item.year]
      .filter(Boolean)
      .join("  ·  ");

    const inside = (item.inside || []).map((x) => `<li>${esc(x)}</li>`).join("");
    const tags = (item.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
    const st =
      STORAGE.byRecord?.[item.id] ||
      (item.collection ? STORAGE.byRecord?.[item.collection] : null) || { size: "—", note: "" };
    const agencyFull = AGENCY_INFO[item.agency]?.name || item.agency || "—";

    drawerBody.innerHTML = `
      <div class="drawer-section">
        <h4>Summary</h4>
        <p>${esc(item.summary)}</p>
      </div>

      ${inside ? `<div class="drawer-section"><h4>What's inside</h4><ul class="bullets">${inside}</ul></div>` : ""}

      ${item.why ? `<div class="drawer-section"><h4>Why it matters</h4><p>${esc(item.why)}</p></div>` : ""}

      ${item.caution ? `<div class="drawer-section"><h4>Read with care</h4><div class="caution-box"><b>Provenance note</b>${esc(item.caution)}</div></div>` : ""}

      <div class="drawer-section">
        <h4>Record details</h4>
        <div class="meta-grid">
          <div><span>Agency</span><b>${esc(agencyFull)}</b></div>
          <div><span>Format</span><b>${esc(item.format || item.type || "—")}</b></div>
          <div><span>Storage</span><b>${esc(st.size)}${st.kind === "est" ? " est." : ""}</b></div>
          <div><span>Release</span><b>${esc(item.release || "—")}</b></div>
        </div>
        ${st.note ? `<div class="storage-note">${esc(st.note)}</div>` : ""}
      </div>

      <div class="drawer-section">
        <h4>Primary source</h4>
        <div class="source-box">
          <div class="src-label">${esc(item.badge === "myth" ? "No document exists — check the record" : "Open the original")}</div>
          <a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.urlLabel || item.url)} ↗</a>
          <div class="src-org">${esc(item.org)}${item.release ? " · " + esc(item.release) : ""}</div>
        </div>
        <div class="drawer-actions">
          <button class="btn primary" type="button" id="copyLink">Copy record link</button>
          <a class="btn" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a>
        </div>
      </div>

      ${tags ? `<div class="drawer-section"><h4>Tags</h4><div class="tag-row">${tags}</div></div>` : ""}
    `;

    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";

    if (push) history.pushState({ id }, "", "#r/" + id);

    const copyBtn = document.getElementById("copyLink");
    copyBtn?.addEventListener("click", async () => {
      const link = location.origin + location.pathname + "#r/" + id;
      try {
        await navigator.clipboard.writeText(link);
        copyBtn.textContent = "Copied ✓";
        setTimeout(() => (copyBtn.textContent = "Copy record link"), 1600);
      } catch {
        copyBtn.textContent = "Copy failed";
      }
    });

    $("#closeDrawer").focus();
  }

  function closeDrawer(pop = true) {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    if (pop && location.hash.startsWith("#r/")) history.replaceState({}, "", location.pathname + location.search);
    lastFocus?.focus?.();
  }

  /* ---------- events ---------- */
  resultsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".result");
    if (btn) openDrawer(btn.dataset.id);
  });

  overlay.addEventListener("click", () => closeDrawer());
  $("#closeDrawer").addEventListener("click", () => closeDrawer());

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) closeDrawer();
    if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && document.activeElement !== searchEl)) {
      e.preventDefault();
      searchEl.focus();
      searchEl.select();
    }
  });

  window.addEventListener("popstate", () => {
    if (location.hash.startsWith("#r/")) {
      openDrawer(location.hash.slice(3), false);
    } else if (drawer.classList.contains("open")) {
      closeDrawer(false);
    }
  });

  let t;
  searchEl.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.q = searchEl.value;
      state.limit = 24;
      render();
    }, 110);
  });

  document.querySelectorAll(".chip[data-filter]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const f = chip.dataset.filter;
      state[f] = chip.dataset.value;
      document
        .querySelectorAll(`.chip[data-filter="${f}"]`)
        .forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      state.limit = 24;
      render();
    });
  });

  ["agency", "decade", "type", "badge"].forEach((id) => {
    $("#" + id).addEventListener("change", (e) => {
      state[id] = e.target.value;
      state.limit = 24;
      render();
    });
  });

  $("#sort").addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.kind = tab.dataset.kind;
      document.querySelectorAll(".tab").forEach((x) => x.setAttribute("aria-selected", String(x === tab)));
      state.limit = 24;
      render();
    });
  });

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.view = btn.dataset.view;
      localStorage.setItem("de-view", state.view);
      document.querySelectorAll(".view-btn").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      render();
    });
  });

  loadMore.addEventListener("click", () => {
    state.limit += 24;
    render();
  });

  $("#reset").addEventListener("click", () => {
    state.q = "";
    state.category = "all";
    state.agency = "all";
    state.decade = "all";
    state.type = "all";
    state.badge = "all";
    state.kind = "all";
    state.sort = "relevance";
    state.limit = 24;
    searchEl.value = "";
    $("#agency").value = "all";
    $("#decade").value = "all";
    $("#type").value = "all";
    $("#badge").value = "all";
    $("#sort").value = "relevance";
    document.querySelectorAll(".chip[data-filter='category']").forEach((c) =>
      c.setAttribute("aria-pressed", String(c.dataset.value === "all"))
    );
    document.querySelectorAll(".tab").forEach((x) => x.setAttribute("aria-selected", String(x.dataset.kind === "all")));
    render();
    searchEl.focus();
  });

  /* ---------- stats ---------- */
  function renderStats() {
    const kindCount = (k) => allItems.filter((i) => i.kind === k).length;
    const stats = [
      { value: "478", label: "PURSUE files", sub: "May – Oct 2026" },
      { value: "12,618", label: "Blue Book sightings", sub: "1947 – 1969" },
      { value: "701", label: "Left unidentified", sub: "officially unresolved" },
      {
        value: String(allItems.length),
        label: "Indexed records",
        sub: `${kindCount("collection")} collections · ${kindCount("document")} documents`,
      },
    ];
    $("#stats").innerHTML = stats
      .map(
        (s) => `<div class="stat"><b>${esc(s.value)}</b><small>${esc(s.label)}</small><i>${esc(s.sub)}</i></div>`
      )
      .join("");
  }

  /* ---------- reveal ---------- */
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ---------- sources, storage, agencies ---------- */
  const parseMb = (s) => {
    if (!s || s === "—") return 0;
    const m = String(s).match(/([\d.]+)\s*(GB|MB)/i);
    if (!m) return 0;
    return m[2].toUpperCase() === "GB" ? parseFloat(m[1]) * 1000 : parseFloat(m[1]);
  };
  const fmtGb = (mb) => (mb / 1000).toFixed(1) + " GB";

  function renderDownloads() {
    const dl = window.DE_DOWNLOADS || [];
    if (!dl.length) return;

    const docsMb = dl.reduce((n, d) => n + parseMb(d.docs), 0);
    const videoMb = dl.reduce((n, d) => n + parseMb(d.videos), 0);
    const totalMb = docsMb + videoMb;
    const allLabel = STORAGE.totals?.allLabel || "~45–55 GB";

    const cards = [
      { value: fmtGb(docsMb), label: "Documents", sub: `${dl.length} bundles` },
      { value: fmtGb(videoMb), label: "Video", sub: "6 releases" },
      { value: fmtGb(totalMb), label: "PURSUE total", sub: "≈25 GB extracted" },
      { value: allLabel, label: "Everything indexed", sub: "estimate, incl. video" },
    ];
    $("#storageCards").innerHTML = cards
      .map(
        (c) => `<div class="storage-card"><b>${esc(c.value)}</b><small>${esc(c.label)}</small><i>${esc(c.sub)}</i></div>`
      )
      .join("");

    const rows = dl
      .map(
        (d) => `
        <div class="dl-row">
          <span class="dl-rel">${esc(d.release)}</span>
          <span class="dl-what"><b>${esc(d.date)}</b><i>${esc(d.note)}</i></span>
          <span class="dl-size"><a href="${esc(d.docsUrl)}" target="_blank" rel="noopener">${esc(d.docs)} <span aria-hidden="true">↓</span></a></span>
          <span class="dl-size">${
            d.videos && d.videos !== "—"
              ? `<a href="${esc(d.videosUrl)}" target="_blank" rel="noopener">${esc(d.videos)} <span aria-hidden="true">↓</span></a>`
              : `<span class="dl-none">no video</span>`
          }</span>
        </div>`
      )
      .join("");

    $("#dlTable").innerHTML = `
      <div class="dl-row dl-head">
        <span>Release</span><span>Date / content</span><span>Documents</span><span>Video</span>
      </div>
      ${rows}
      <div class="dl-row dl-total">
        <span>Total</span>
        <span class="dl-what"><b>478 files</b><i>7 document bundles · 6 video bundles</i></span>
        <span class="dl-size">${fmtGb(docsMb)}</span>
        <span class="dl-size">${fmtGb(videoMb)}</span>
      </div>`;
  }

  function renderAgencies() {
    const list = window.DE_AGENCIES || [];
    if (!list.length) return;
    $("#agencyGrid").innerHTML = list
      .map((a) => {
        let host = "";
        try {
          host = new URL(a.url).hostname.replace(/^www\./, "");
        } catch {
          host = "link";
        }
        return `
        <article class="agency-card">
          <div class="agency-top">
            <span class="agency-code">${esc(a.code)}</span>
            <span class="agency-country">${esc(a.country)}</span>
          </div>
          <h3>${esc(a.name)}</h3>
          <p>${esc(a.blurb)}</p>
          <div class="agency-foot">
            <span class="agency-kind">${esc(a.kind)}</span>
            <a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(host)} ↗</a>
          </div>
        </article>`;
      })
      .join("");
  }

  /* ---------- jump to search ---------- */
  const jumpBtn = $("#jumpSearch");
  let jumpTicking = false;

  function syncJump() {
    jumpTicking = false;
    jumpBtn.classList.toggle("show", window.scrollY > 780);
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!jumpTicking) {
        jumpTicking = true;
        requestAnimationFrame(syncJump);
      }
    },
    { passive: true }
  );

  jumpBtn.addEventListener("click", () => {
    document.querySelector(".search-section").scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => searchEl.focus({ preventScroll: true }), 420);
  });

  syncJump();

  /* ---------- boot ---------- */
  allItems.forEach((item, i) => (item._i = i));

  buildFacets();
  renderStats();
  renderDownloads();
  renderAgencies();
  render();
  initReveal();

  document.querySelectorAll(".view-btn").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.view === state.view))
  );

  searchEl.placeholder = `Search ${allItems.length} records — try “Roswell”, “CIA”, “1953”, “treaty”, “radar”…`;

  if (location.hash.startsWith("#r/")) {
    setTimeout(() => openDrawer(location.hash.slice(3), false), 60);
  }
})();
