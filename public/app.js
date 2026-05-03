/* Ghost Signal — Frontend Controller */

const $ = (id) => document.getElementById(id);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const currentValueEl = $("current-value");
const currentUnitEl = $("current-unit");
const currentStateEl = $("current-state");
const entropyValueEl = $("entropy-value");
const signalAgeEl = $("signal-age");
const transmissionCountEl = $("transmission-count");
const chartCanvas = $("history-chart");
const chartMetaEl = $("chart-meta");
const historyFormEl = $("history-range-form");
const historyStartEl = $("history-start");
const historyEndEl = $("history-end");
const earliestKnownFactEl = $("earliest-known-fact");
const snapshotJsonLinkEl = $("snapshot-json-link");
const exportCsvLinkEl = $("export-csv-link");
const exportExcelLinkEl = $("export-excel-link");
const snapshotCsvLinkEl = $("snapshot-csv-link");
const snapshotExcelLinkEl = $("snapshot-excel-link");
const sheetsFormulaEl = $("sheets-formula");
const copySheetsFormulaEl = $("copy-sheets-formula");
const copySheetsStatusEl = $("copy-sheets-status");
const copyRangeLinkEl = $("copy-range-link");
const randomNumberEl = $("random-number");
const randomMetaEl = $("random-meta");
const safetyNoteEl = $("safety-note");
const timelineTrackEl = $("timeline-track");
const timelineContainerEl = $("timeline-container");
const timelineDetailEl = $("timeline-detail");
const chatToggleEl = $("chat-toggle");
const chatPanelEl = $("chat-panel");
const chatCloseEl = $("chat-close");
const chatFormEl = $("chat-form");
const chatInputEl = $("chat-input");
const chatMessagesEl = $("chat-messages");
const openChatEl = $("open-chat");
const rangeButtons = $$(".range-button[data-range]");
const efValueEl = $("ef-value");
const efUnitEl = $("ef-unit");
const efStateEl = $("ef-state");
const rfValueEl = $("rf-value");
const rfUnitEl = $("rf-unit");
const rfStateEl = $("rf-state");
const teleEmfEl = $("tele-emf");
const teleEfEl = $("tele-ef");
const teleRfEl = $("tele-rf");
const teleEntropyEl = $("tele-entropy");
const teleAgeEl = $("tele-age");
const teleTxEl = $("tele-tx");
const teleRangeEl = $("tele-range");

const CATEGORY_COLORS = {
  signal: "#FF1744",
  discovery: "#7C3AED",
  narrative: "#00E5FF",
  technical: "#7AFFAE",
  transmission: "#FF6D00",
};

const state = {
  chartPoints: [],
  meta: null,
  timeline: null,
  activeTimelineIndex: -1,
  chatSessionId: localStorage.getItem("ghost-chat-session") || crypto.randomUUID(),
  chatOpen: false,
  range: { preset: "24h", start: null, end: null },
};

localStorage.setItem("ghost-chat-session", state.chatSessionId);

/* ── Helpers ── */

function formatTimestamp(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "Unknown" : d.toLocaleString();
}

function formatInputDT(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function parseDT(val) {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function formatAge(startIso) {
  const ms = Date.now() - new Date(startIso).getTime();
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

/* ── Range ── */

function getPresetRange(preset) {
  const now = new Date();
  const earliest = new Date(state.meta?.earliestKnownAt ?? now.toISOString());
  let start = new Date(now.getTime() - 24 * 3600000);
  if (preset === "7d") start = new Date(now.getTime() - 7 * 86400000);
  else if (preset === "30d") start = new Date(now.getTime() - 30 * 86400000);
  else if (preset === "all") start = earliest;
  if (start < earliest) start = earliest;
  return { start: start.toISOString(), end: now.toISOString() };
}

function setRange(preset, range) {
  state.range = { preset, ...range };
  if (historyStartEl) historyStartEl.value = formatInputDT(range.start);
  if (historyEndEl) historyEndEl.value = formatInputDT(range.end);
  rangeButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.range === preset));
  if (teleRangeEl) teleRangeEl.textContent = preset === "custom" ? "custom" : preset;
  updateRangeUrl();
}

function refreshPreset() {
  if (state.range.preset !== "custom") setRange(state.range.preset, getPresetRange(state.range.preset));
}

function updateRangeUrl() {
  const u = new URL(location.href);
  u.searchParams.delete("range");
  u.searchParams.delete("start");
  u.searchParams.delete("end");
  if (state.range.preset === "custom" && state.range.start && state.range.end) {
    u.searchParams.set("start", state.range.start);
    u.searchParams.set("end", state.range.end);
  } else if (state.range.preset) {
    u.searchParams.set("range", state.range.preset);
  }
  history.replaceState({}, "", u);
}

function parseInitialRange() {
  const u = new URL(location.href);
  const s = u.searchParams.get("start"), e = u.searchParams.get("end"), p = u.searchParams.get("range");
  if (s && e) {
    const sd = new Date(s), ed = new Date(e);
    if (!Number.isNaN(sd.getTime()) && !Number.isNaN(ed.getTime()) && ed > sd)
      return { preset: "custom", start: sd.toISOString(), end: ed.toISOString() };
  }
  if (p && ["24h", "7d", "30d", "all"].includes(p)) {
    const r = getPresetRange(p);
    return { preset: p, ...r };
  }
  const r = getPresetRange("24h");
  return { preset: "24h", ...r };
}

function rangeParams() {
  const p = new URLSearchParams();
  if (state.range.start) p.set("start", state.range.start);
  if (state.range.end) p.set("end", state.range.end);
  const tp = chartCanvas ? Math.min(1440, Math.max(160, Math.round(chartCanvas.clientWidth * 1.15))) : 720;
  p.set("targetPoints", String(tp));
  return p;
}

function snapshotParams() {
  const p = new URLSearchParams();
  if (state.range.start) p.set("start", state.range.start);
  if (state.range.end) p.set("end", state.range.end);
  return p;
}

function updateExportLinks() {
  const sp = snapshotParams().toString();
  const csvP = new URLSearchParams(snapshotParams()); csvP.set("format", "csv");
  const xlP = new URLSearchParams(snapshotParams()); xlP.set("format", "excel");
  [snapshotJsonLinkEl].forEach((a) => { if (a) a.href = `/api/v1/ghost-emf/snapshot?${sp}`; });
  [exportCsvLinkEl, snapshotCsvLinkEl].forEach((a) => { if (a) a.href = `/api/v1/ghost-emf/export?${csvP}`; });
  [exportExcelLinkEl, snapshotExcelLinkEl].forEach((a) => { if (a) a.href = `/api/v1/ghost-emf/export?${xlP}`; });
}

/* ── Chart ── */

function drawChart(points) {
  if (!(chartCanvas instanceof HTMLCanvasElement)) return;
  const ctx = chartCanvas.getContext("2d");
  if (!ctx) return;

  const w = Math.max(320, chartCanvas.clientWidth);
  const h = Math.max(300, Math.round(w * 0.35));
  const dpr = devicePixelRatio || 1;
  chartCanvas.width = Math.round(w * dpr);
  chartCanvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const padTop = 28, padRight = 28, padBottom = 38, padLeft = 52;
  const pad = padTop; // legacy compat for area fills

  // Grid lines
  ctx.strokeStyle = "rgba(255, 23, 68, 0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padTop + ((h - padTop - padBottom) / 4) * i;
    ctx.beginPath(); ctx.moveTo(padLeft, y); ctx.lineTo(w - padRight, y); ctx.stroke();
  }

  if (points.length === 0) {
    ctx.fillStyle = "rgba(240, 230, 255, 0.6)";
    ctx.font = "14px 'JetBrains Mono', monospace";
    ctx.fillText("No data for this range.", padLeft, h / 2);
    return;
  }

  const vals = points.map((p) => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = Math.max(0.0001, max - min);
  const rangeStart = new Date(state.range.start ?? points[0].timestamp).getTime();
  const rangeEnd = new Date(state.range.end ?? points[points.length - 1].timestamp).getTime();
  const rangeSpan = Math.max(1, rangeEnd - rangeStart);

  function px(pt, i) {
    const t = new Date(pt.timestamp).getTime();
    const x = padLeft + ((t - rangeStart) / rangeSpan) * (w - padLeft - padRight);
    const norm = (pt.value - min) / span;
    const y = h - padBottom - norm * (h - padTop - padBottom);
    return { x, y };
  }

  // Area gradient (red to transparent)
  const areaGrad = ctx.createLinearGradient(0, padTop, 0, h - padBottom);
  areaGrad.addColorStop(0, "rgba(255, 23, 68, 0.18)");
  areaGrad.addColorStop(0.5, "rgba(124, 58, 237, 0.08)");
  areaGrad.addColorStop(1, "rgba(122, 255, 174, 0)");

  ctx.beginPath();
  points.forEach((pt, i) => {
    const { x, y } = px(pt, i);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  const lastPx = px(points[points.length - 1]);
  const firstPx = px(points[0]);
  ctx.lineTo(lastPx.x, h - padBottom);
  ctx.lineTo(firstPx.x, h - padBottom);
  ctx.closePath();
  ctx.fillStyle = areaGrad;
  ctx.fill();

  // Line
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = 2.5;

  const lineGrad = ctx.createLinearGradient(padLeft, 0, w - padRight, 0);
  lineGrad.addColorStop(0, "#FF1744");
  lineGrad.addColorStop(0.5, "#7C3AED");
  lineGrad.addColorStop(1, "#7AFFAE");
  ctx.strokeStyle = lineGrad;

  ctx.beginPath();
  points.forEach((pt, i) => {
    const { x, y } = px(pt, i);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Timeline annotations on chart
  const events = state.timeline?.events ?? [];
  const visibleEvents = events.filter((ev) => {
    const t = new Date(ev.date).getTime();
    return t >= rangeStart && t <= rangeEnd;
  });
  visibleEvents.slice(0, 6).forEach((ev, i) => {
    const t = new Date(ev.date).getTime();
    const x = padLeft + ((t - rangeStart) / rangeSpan) * (w - padLeft - padRight);
    const color = CATEGORY_COLORS[ev.category] || "#FF6D00";
    ctx.strokeStyle = color + "44";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, padTop); ctx.lineTo(x, h - padBottom); ctx.stroke();
    ctx.fillStyle = color + "BB";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(ev.title, Math.min(x + 4, w - 140), padTop + 13 + (i % 3) * 13);
  });

  // Latest point dot
  if (points.length > 0) {
    const last = px(points[points.length - 1]);
    ctx.fillStyle = "#FF1744";
    ctx.beginPath(); ctx.arc(last.x, last.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#FF174466";
    ctx.beginPath(); ctx.arc(last.x, last.y, 10, 0, Math.PI * 2); ctx.fill();
  }

  // Y-axis value labels
  ctx.fillStyle = "rgba(240, 230, 255, 0.4)";
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const frac = i / 4;
    const val = min + span * (1 - frac);
    const y = padTop + ((h - padTop - padBottom) / 4) * i;
    ctx.fillText(val.toFixed(3), padLeft - 4, y + 3);
  }

  // X-axis time labels
  ctx.textAlign = "center";
  const tickCount = Math.min(6, Math.max(3, Math.floor(w / 160)));
  for (let i = 0; i <= tickCount; i++) {
    const frac = i / tickCount;
    const t = new Date(rangeStart + rangeSpan * frac);
    const x = padLeft + frac * (w - padLeft - padRight);
    const label = rangeSpan > 7 * 86400000
      ? t.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : t.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    ctx.fillText(label, x, h - 6);
    ctx.strokeStyle = "rgba(255, 23, 68, 0.04)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, padTop); ctx.lineTo(x, h - padBottom); ctx.stroke();
  }
  ctx.textAlign = "left";
}

/* ── Timeline Navigator ── */

function renderTimeline() {
  if (!timelineTrackEl || !state.timeline?.events) return;
  timelineTrackEl.replaceChildren();
  // Track items so initTimelineReveal can observe newly created nodes
  state.__timelineNeedsReveal = true;

  const events = [...state.timeline.events].sort((a, b) => new Date(a.date) - new Date(b.date));
  const now = new Date();

  events.forEach((ev, i) => {
    const color = CATEGORY_COLORS[ev.category] || "#FF6D00";
    const isFuture = new Date(ev.date) > now;
    const side = i % 2 === 0 ? "left" : "right";

    const item = el("div", `tl-item tl-${side}${isFuture ? " tl-future" : ""}`);
    item.setAttribute("role", "listitem");

    // Dot on the spine
    const dot = el("div", "tl-dot");
    dot.style.borderColor = color;
    dot.style.setProperty("--dot-color", color);
    if (i === events.length - 1 || (events[i + 1] && new Date(events[i + 1].date) > now && !isFuture)) {
      dot.classList.add("tl-dot-now");
    }

    // Card
    const card = el("div", "tl-card");
    card.style.setProperty("--card-accent", color);
    const dateStr = new Date(ev.date).toLocaleDateString("en-US", { year: "numeric", month: "short" });
    const header = el("div", "tl-card-header");
    const dateEl = el("span", "tl-date", dateStr);
    const catEl = el("span", "tl-cat", ev.category);
    catEl.style.color = color;
    header.append(dateEl, catEl);
    const title = el("h3", "tl-title", ev.title);
    const body = el("p", "tl-body", ev.body);
    const severity = el("div", "tl-severity");
    for (let s = 0; s < 5; s++) {
      const pip = el("span", s < ev.severity ? "tl-pip tl-pip-on" : "tl-pip");
      pip.style.setProperty("--pip-color", color);
      severity.append(pip);
    }
    card.append(header, title, body, severity);
    item.append(dot, card);
    timelineTrackEl.append(item);
  });
  initTimelineReveal();
  // Hard fallback so no timeline items get stuck at opacity 0
  setTimeout(() => {
    document.querySelectorAll(".tl-item:not(.is-visible)").forEach((n) => n.classList.add("is-visible"));
  }, 2500);
}

function selectTimelineEvent(index) {
  // Vertical timeline doesn't need selection — all events visible
  state.activeTimelineIndex = index;
}

/* ── Chat ── */

function toggleChat(open) {
  state.chatOpen = open ?? !state.chatOpen;
  chatPanelEl?.classList.toggle("is-open", state.chatOpen);
  chatToggleEl?.setAttribute("aria-expanded", String(state.chatOpen));
  chatPanelEl?.setAttribute("aria-hidden", String(!state.chatOpen));
  if (state.chatOpen) chatInputEl?.focus();
}

function addChatMessage(role, text) {
  if (!chatMessagesEl) return;
  const msg = el("div", `chat-message chat-${role}`);
  const p = el("p", null, text);
  msg.append(p);
  chatMessagesEl.append(msg);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function showTyping() {
  if (!chatMessagesEl) return;
  const typing = el("div", "chat-message chat-assistant chat-typing-msg");
  typing.id = "chat-typing";
  const p = el("p", "chat-typing", "The signal is processing...");
  typing.append(p);
  chatMessagesEl.append(typing);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function removeTyping() {
  const t = $("chat-typing");
  if (t) t.remove();
}

async function sendChatMessage(message) {
  addChatMessage("user", message);
  showTyping();

  try {
    const res = await fetch("/api/v1/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, sessionId: state.chatSessionId }),
    });

    removeTyping();

    if (!res.ok) {
      addChatMessage("assistant", "The signal encountered interference. Try again.");
      return;
    }

    const data = await res.json();
    if (data.sessionId) {
      state.chatSessionId = data.sessionId;
      localStorage.setItem("ghost-chat-session", data.sessionId);
    }
    addChatMessage("assistant", data.response);
  } catch {
    removeTyping();
    addChatMessage("assistant", "Connection lost. The signal will return.");
  }
}

/* ── API Loaders ── */

async function loadMeta() {
  const res = await fetch("/api/v1/ghost-emf/meta", { headers: { accept: "application/json" } });
  if (!res.ok) return;
  state.meta = await res.json();
  if (earliestKnownFactEl && state.meta?.earliestKnownAt)
    earliestKnownFactEl.textContent = `Earliest reading: ${formatTimestamp(state.meta.earliestKnownAt)}`;
  if (signalAgeEl && state.meta?.earliestKnownAt) {
    signalAgeEl.textContent = formatAge(state.meta.earliestKnownAt);
    if (teleAgeEl) teleAgeEl.textContent = formatAge(state.meta.earliestKnownAt);
  }
}

async function loadTimeline() {
  const res = await fetch("/api/v1/ghost-emf/timeline", { headers: { accept: "application/json" } });
  if (!res.ok) return;
  state.timeline = await res.json();
  renderTimeline();
  if (safetyNoteEl && state.timeline?.safetyNote) safetyNoteEl.textContent = state.timeline.safetyNote;
}

async function loadCurrent() {
  const res = await fetch("/api/v1/sensors", { headers: { accept: "application/json" } });
  if (!res.ok) return;
  const d = await res.json();

  // EMF (primary)
  if (d.emf) {
    if (currentValueEl) currentValueEl.textContent = Number(d.emf.numericValue).toFixed(3);
    if (currentUnitEl) currentUnitEl.textContent = d.emf.unit ? ` ${d.emf.unit}` : "";
    if (currentStateEl) currentStateEl.textContent = `${d.emf.friendlyName} reporting ${d.emf.state}.`;
    if (teleEmfEl) teleEmfEl.textContent = Number(d.emf.numericValue).toFixed(3);
  }

  // EF
  if (d.ef) {
    if (efValueEl) efValueEl.textContent = Number(d.ef.numericValue).toFixed(1);
    if (efUnitEl) efUnitEl.textContent = d.ef.unit ? ` ${d.ef.unit}` : "";
    if (efStateEl) efStateEl.textContent = `${d.ef.friendlyName} reporting ${d.ef.state}.`;
    if (teleEfEl) teleEfEl.textContent = Number(d.ef.numericValue).toFixed(1);
  }

  // RF
  if (d.rf) {
    if (rfValueEl) rfValueEl.textContent = Number(d.rf.numericValue).toFixed(3);
    if (rfUnitEl) rfUnitEl.textContent = d.rf.unit ? ` ${d.rf.unit}` : "";
    if (rfStateEl) rfStateEl.textContent = `${d.rf.friendlyName} reporting ${d.rf.state}.`;
    if (teleRfEl) teleRfEl.textContent = Number(d.rf.numericValue).toFixed(3);
  }
}

async function loadHistory() {
  const res = await fetch(`/api/v1/ghost-emf/history?${rangeParams()}`, { headers: { accept: "application/json" } });
  if (!res.ok) return;
  const d = await res.json();
  state.chartPoints = Array.isArray(d.points) ? d.points : [];
  drawChart(state.chartPoints);
  if (chartMetaEl)
    chartMetaEl.textContent = `${d.displayPointCount} points from ${d.rawPointCount} samples.`;
}

async function loadEntropy() {
  const p = rangeParams(); p.set("bins", "24");
  const res = await fetch(`/api/v1/ghost-emf/entropy?${p}`, { headers: { accept: "application/json" } });
  if (!res.ok) return;
  const d = await res.json();
  if (entropyValueEl) entropyValueEl.textContent = `${Number(d.entropyBits).toFixed(4)} bits`;
  if (teleEntropyEl) teleEntropyEl.textContent = Number(d.entropyBits).toFixed(2);
}

async function loadTransmissionCount() {
  try {
    const res = await fetch("/api/v1/transmission-count", { headers: { accept: "application/json" } });
    if (!res.ok) return;
    const d = await res.json();
    if (transmissionCountEl) transmissionCountEl.textContent = String(d.count);
    if (teleTxEl) teleTxEl.textContent = String(d.count);
  } catch { /* ignore */ }
}

async function loadSnapshotUtils() {
  updateExportLinks();
  try {
    const sp = snapshotParams();
    const [sheetsRes, randomRes] = await Promise.all([
      fetch(`/api/v1/ghost-emf/google-sheets?${sp}`, { headers: { accept: "application/json" } }),
      fetch(`/api/v1/ghost-emf/random?${sp}&digits=10`, { headers: { accept: "application/json" } }),
    ]);
    if (sheetsRes.ok) {
      const s = await sheetsRes.json();
      if (sheetsFormulaEl) renderSheetsFormula(s.importDataFormula);
    }
    if (randomRes.ok) {
      const r = await randomRes.json();
      if (randomNumberEl) randomNumberEl.textContent = r.randomNumber;
      if (randomMetaEl) randomMetaEl.textContent = `${r.sampleCount} rows contributed.`;
    }
  } catch {
    if (sheetsFormulaEl) sheetsFormulaEl.textContent = "Export unavailable for this range.";
    if (randomNumberEl) randomNumberEl.textContent = "--";
  }
}

function renderSheetsFormula(formula) {
  if (!sheetsFormulaEl || !formula) return;
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const m = formula.match(/^(=)([A-Z_]+)(\()(["'])(.*?)\4(\))$/);
  let html;
  if (m) {
    const [, eq, fn, lp, q, url, rp] = m;
    const urlHtml = escapeHtml(url).replace(/(%[0-9A-Fa-f]{2})/g, '<span class="tok-pct">$1</span>');
    html =
      `<span class="tok-op">${escapeHtml(eq)}</span>` +
      `<span class="tok-fn">${escapeHtml(fn)}</span>` +
      `<span class="tok-punc">${escapeHtml(lp)}</span>` +
      `<span class="tok-str">${escapeHtml(q)}${urlHtml}${escapeHtml(q)}</span>` +
      `<span class="tok-punc">${escapeHtml(rp)}</span>`;
  } else {
    html = escapeHtml(formula);
  }
  sheetsFormulaEl.innerHTML = html;
}

/* ── Story Slider ── */

function initStorySlider() {
  const track = $("story-slider-track");
  const counter = $("story-slider-counter");
  if (!track) return;

  const slides = track.querySelectorAll(".slider-slide");
  const total = slides.length;
  let current = 0;
  let autoTimer = null;

  function goTo(index) {
    current = ((index % total) + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    if (counter) counter.textContent = `${current + 1} / ${total}`;
  }

  const slider = track.closest(".story-slider");
  if (!slider) return;

  const prevBtn = slider.querySelector(".slider-prev");
  const nextBtn = slider.querySelector(".slider-next");

  prevBtn?.addEventListener("click", () => { goTo(current - 1); resetAuto(); });
  nextBtn?.addEventListener("click", () => { goTo(current + 1); resetAuto(); });

  // Touch/swipe support
  let touchStartX = 0;
  slider.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      goTo(dx > 0 ? current - 1 : current + 1);
      resetAuto();
    }
  }, { passive: true });

  // Auto-advance every 4s
  function startAuto() { autoTimer = setInterval(() => goTo(current + 1), 4000); }
  function resetAuto() { clearInterval(autoTimer); startAuto(); }
  startAuto();

  // Pause on hover
  slider.addEventListener("mouseenter", () => clearInterval(autoTimer));
  slider.addEventListener("mouseleave", () => startAuto());
}

/* ── Avatar Frame Slideshow ── */

function initAvatarSlideshow() {
  const root = document.querySelector('[data-component="avatar-slideshow"]');
  if (!root) return;

  // Hydrate per-image caption attribute for the on-image overlay strip
  root.querySelectorAll(".avatar-slide").forEach((slide) => {
    const fig = slide.querySelector(".avatar-slide-figure");
    const label = slide.querySelector(".avatar-frame-label")?.textContent.trim();
    if (fig && label) fig.setAttribute("data-caption", label);
  });

  const slides = Array.from(root.querySelectorAll(".avatar-slide"));
  const thumbs = Array.from(root.querySelectorAll("[data-slide-jump]"));
  const counter = root.querySelector("[data-slide-counter]");
  const prevBtn = root.querySelector("[data-slide-prev]");
  const nextBtn = root.querySelector("[data-slide-next]");
  const total = slides.length;
  if (!total) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const AUTO_DELAY = 6000;
  let current = 0;
  let autoTimer = null;

  function goTo(index) {
    current = ((index % total) + total) % total;
    slides.forEach((s, i) => s.classList.toggle("is-active", i === current));
    thumbs.forEach((t, i) => {
      t.classList.toggle("is-active", i === current);
      t.setAttribute("aria-selected", i === current ? "true" : "false");
    });
    if (counter) counter.textContent = `${current + 1} / ${total}`;
    const activeThumb = thumbs[current];
    if (activeThumb) activeThumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAuto() {
    if (reducedMotion) return;
    stopAuto();
    autoTimer = setInterval(next, AUTO_DELAY);
  }
  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }
  function resetAuto() { stopAuto(); startAuto(); }

  prevBtn?.addEventListener("click", () => { prev(); resetAuto(); });
  nextBtn?.addEventListener("click", () => { next(); resetAuto(); });
  thumbs.forEach((t, i) => {
    t.addEventListener("click", () => { goTo(i); resetAuto(); });
  });

  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); next(); resetAuto(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); resetAuto(); }
    else if (e.key === "Home") { e.preventDefault(); goTo(0); resetAuto(); }
    else if (e.key === "End") { e.preventDefault(); goTo(total - 1); resetAuto(); }
  });

  let touchStartX = 0;
  let touchStartY = 0;
  const stage = root.querySelector(".avatar-stage-frame") || root;
  stage.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) prev(); else next();
      resetAuto();
    }
  }, { passive: true });

  root.addEventListener("mouseenter", stopAuto);
  root.addEventListener("mouseleave", startAuto);
  root.addEventListener("focusin", stopAuto);
  root.addEventListener("focusout", (e) => {
    if (!root.contains(e.relatedTarget)) startAuto();
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) startAuto();
      else stopAuto();
    });
  }, { threshold: 0.25 });
  observer.observe(root);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  goTo(0);
}

/* ── Polaroid Animation Indexing ── */

function initAvatarSpread() {
  const photos = $$(".spread-photo");
  const rotations = [-4, 3, -2, 5, -3, 2, -5, 4, -1, 3, -4, 2, -3, 5, -2, 4, -5, 1];
  photos.forEach((p, i) => {
    p.style.setProperty("--i", String(i));
    p.style.setProperty("--spread-rot", String(rotations[i % rotations.length]));
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = "running";
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  photos.forEach((p) => {
    p.style.animationPlayState = "paused";
    observer.observe(p);
  });
}

/* ── Timeline Scroll Reveal ── */

function initTimelineReveal() {
  const items = $$(".tl-item");
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  items.forEach((item) => observer.observe(item));
}

/* ── Floating Orbs — ambient particle system ── */

function initOrbs() {
  const canvas = $("orb-canvas");
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const orbs = [];
  const ORB_COUNT = 18;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  for (let i = 0; i < ORB_COUNT; i++) {
    const isWhite = Math.random() > 0.35;
    orbs.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 2 + Math.random() * 4,
      dx: (Math.random() - 0.5) * 0.3,
      dy: -0.15 - Math.random() * 0.25,
      alpha: 0.05 + Math.random() * 0.15,
      color: isWhite
        ? `rgba(240, 230, 255, VAL)`
        : `rgba(${Math.random() > 0.5 ? "255, 23, 68" : "124, 58, 237"}, VAL)`,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.008 + Math.random() * 0.012,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const orb of orbs) {
      orb.x += orb.dx;
      orb.y += orb.dy;
      orb.pulse += orb.pulseSpeed;

      if (orb.y < -20) { orb.y = canvas.height + 20; orb.x = Math.random() * canvas.width; }
      if (orb.x < -20) orb.x = canvas.width + 20;
      if (orb.x > canvas.width + 20) orb.x = -20;

      const a = orb.alpha * (0.5 + 0.5 * Math.sin(orb.pulse));
      const c = orb.color.replace("VAL", String(a));

      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.fill();

      // Glow
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = orb.color.replace("VAL", String(a * 0.15));
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
}

/* ── Hero Waveform — real-time EMF-style oscilloscope ── */

function initWaveform() {
  const canvas = $("hero-waveform");
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let phase = 0;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  function draw() {
    const w = canvas.width / (devicePixelRatio || 1);
    const h = canvas.height / (devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);

    phase += 0.015;

    // Draw 3 waveforms — one for each sensor axis
    const waves = [
      { color: "rgba(255, 23, 68, 0.25)", freq: 0.008, amp: 0.2, speed: 1, offset: 0 },
      { color: "rgba(124, 58, 237, 0.2)", freq: 0.012, amp: 0.15, speed: 1.3, offset: 2 },
      { color: "rgba(0, 229, 255, 0.15)", freq: 0.006, amp: 0.25, speed: 0.7, offset: 4 },
    ];

    for (const wave of waves) {
      ctx.beginPath();
      ctx.strokeStyle = wave.color;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";

      for (let x = 0; x <= w; x += 2) {
        const noise = Math.sin(x * 0.05 + phase * 3) * 0.03;
        const y = h * 0.5 +
          Math.sin(x * wave.freq + phase * wave.speed + wave.offset) * h * wave.amp +
          Math.sin(x * wave.freq * 2.7 + phase * wave.speed * 1.8) * h * wave.amp * 0.3 +
          noise * h;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  }
  draw();
}

/* ── Scroll Reveal ── */

function initScrollReveal() {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    document.documentElement.classList.remove("js-reveal-active");
    return;
  }

  const universalSelector = [
    ".reveal-section",
    "main > section",
    "main > article",
    ".panel",
    ".usecase-card",
    ".family-card",
    ".docs-sensor-chip",
    ".dossier-card",
    ".docs-example",
    ".legal-section",
    ".manifesto-frame",
    ".entropy-section > *",
  ].join(",");

  const targets = Array.from(document.querySelectorAll(universalSelector));
  targets.forEach((el, i) => {
    if (!el.classList.contains("reveal")) el.classList.add("reveal");
    if (!el.style.getPropertyValue("--reveal-delay")) {
      const delay = Math.min(i * 35, 280);
      el.style.setProperty("--reveal-delay", delay + "ms");
    }
  });

  if (!targets.length) {
    document.documentElement.classList.remove("js-reveal-active");
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed", "is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
  );

  targets.forEach((t) => observer.observe(t));

  setTimeout(() => {
    targets.forEach((t) => t.classList.add("is-revealed", "is-visible"));
  }, 3500);
}

/* ── Plate Vault: hover-autoplay + click-to-lightbox ── */

function initPlateVault() {
  const cards = $$(".plate-vault-card");
  if (!cards.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  cards.forEach((card) => {
    const video = card.querySelector("video");
    const img = card.querySelector("img");

    // Hover autoplay for video tiles (skip on touch + reduced-motion)
    if (video && !reduceMotion && !isCoarsePointer) {
      const sourceEl = video.querySelector("source");
      const srcUrl = sourceEl?.getAttribute("src");
      let loaded = false;
      const ensureLoaded = () => {
        if (loaded || !srcUrl) return;
        if (!video.querySelector("source[src]")) return;
        loaded = true;
        video.preload = "auto";
        video.muted = true;
        video.playsInline = true;
        video.load();
      };
      const tryPlay = () => {
        ensureLoaded();
        video.muted = true;
        const p = video.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      };
      const stopPlay = () => {
        try { video.pause(); video.currentTime = 0; } catch {}
      };
      card.addEventListener("pointerenter", tryPlay);
      card.addEventListener("pointerleave", stopPlay);
      card.addEventListener("focusin", tryPlay);
      card.addEventListener("focusout", stopPlay);
      // Hide native controls; the lightbox owns play UX
      video.removeAttribute("controls");
      video.setAttribute("tabindex", "-1");
    }

    // Click anywhere on card → lightbox
    if (video || img) {
      card.style.cursor = "zoom-in";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      const open = (e) => {
        e.preventDefault();
        openPlateLightbox(card);
      };
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") open(e);
      });
    }
  });
}

/* ── Plate Vault: cursor-tracked magnifier loupe over the merged grid ── */

function initPlateLoupe() {
  const wrap = document.querySelector(".plate-loupe-wrap");
  const grid = document.getElementById("plate-vault-grid");
  const loupe = document.getElementById("plate-loupe");
  const clone = document.getElementById("plate-loupe-clone");
  if (!wrap || !grid || !loupe || !clone) return;
  if (window.matchMedia("(pointer: coarse)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ZOOM = 5;
  const SIZE = 360;
  loupe.style.setProperty("--loupe-size", SIZE + "px");

  let cloned = false;
  let resizeRaf = 0;

  const buildClone = () => {
    clone.innerHTML = "";
    const tree = grid.cloneNode(true);
    tree.removeAttribute("id");
    tree.classList.add("plate-vault-grid--clone");
    tree.querySelectorAll("video").forEach((v) => {
      const placeholder = document.createElement("img");
      placeholder.src = v.poster || "";
      placeholder.alt = "";
      placeholder.decoding = "async";
      placeholder.loading = "eager";
      v.replaceWith(placeholder);
    });
    tree.querySelectorAll("img").forEach((img) => {
      img.removeAttribute("loading");
      img.decoding = "async";
    });
    tree.style.width = grid.offsetWidth + "px";
    clone.appendChild(tree);
    cloned = true;
  };

  const sync = () => {
    if (!cloned) return;
    const cloneTree = clone.firstElementChild;
    if (cloneTree) cloneTree.style.width = grid.offsetWidth + "px";
  };

  const onMove = (e) => {
    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      loupe.classList.remove("is-active");
      return;
    }
    if (!cloned) buildClone();
    loupe.classList.add("is-active");
    loupe.style.transform = `translate3d(${x - SIZE / 2}px, ${y - SIZE / 2}px, 0)`;
    const cx = -(x * ZOOM - SIZE / 2);
    const cy = -(y * ZOOM - SIZE / 2);
    clone.style.transform = `translate3d(${cx}px, ${cy}px, 0) scale(${ZOOM})`;
  };

  const onLeave = () => loupe.classList.remove("is-active");

  wrap.addEventListener("pointermove", onMove);
  wrap.addEventListener("pointerleave", onLeave);
  wrap.addEventListener("pointerenter", (e) => onMove(e));

  window.addEventListener(
    "resize",
    () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(sync);
    },
    { passive: true },
  );
}

function ensurePlateLightbox() {
  let host = document.getElementById("plate-lightbox");
  if (host) return host;
  host = document.createElement("div");
  host.id = "plate-lightbox";
  host.className = "plate-lightbox";
  host.setAttribute("role", "dialog");
  host.setAttribute("aria-modal", "true");
  host.setAttribute("aria-label", "License plate viewer");
  host.hidden = true;
  host.innerHTML = `
    <button class="plate-lightbox-close" type="button" aria-label="Close (Esc)">×</button>
    <button class="plate-lightbox-nav plate-lightbox-prev" type="button" aria-label="Previous (←)">‹</button>
    <button class="plate-lightbox-nav plate-lightbox-next" type="button" aria-label="Next (→)">›</button>
    <div class="plate-lightbox-stage"></div>
    <div class="plate-lightbox-caption" aria-live="polite"></div>
  `;
  document.body.appendChild(host);

  host.addEventListener("click", (e) => {
    if (e.target === host) closePlateLightbox();
  });
  host.querySelector(".plate-lightbox-close").addEventListener("click", closePlateLightbox);
  host.querySelector(".plate-lightbox-prev").addEventListener("click", () => stepPlateLightbox(-1));
  host.querySelector(".plate-lightbox-next").addEventListener("click", () => stepPlateLightbox(1));

  document.addEventListener("keydown", (e) => {
    if (host.hidden) return;
    if (e.key === "Escape") closePlateLightbox();
    else if (e.key === "ArrowLeft") stepPlateLightbox(-1);
    else if (e.key === "ArrowRight") stepPlateLightbox(1);
  });
  return host;
}

function getPlateCards() {
  return $$(".plate-vault-card").filter((c) => c.querySelector("video, img"));
}

function openPlateLightbox(card) {
  const host = ensurePlateLightbox();
  const cards = getPlateCards();
  const idx = cards.indexOf(card);
  if (idx < 0) return;
  host.dataset.index = String(idx);
  host.hidden = false;
  document.body.classList.add("plate-lightbox-open");
  renderPlateLightbox();
  host.querySelector(".plate-lightbox-close").focus();
}

function closePlateLightbox() {
  const host = document.getElementById("plate-lightbox");
  if (!host) return;
  const stage = host.querySelector(".plate-lightbox-stage");
  if (stage) stage.innerHTML = "";
  host.hidden = true;
  document.body.classList.remove("plate-lightbox-open");
}

function stepPlateLightbox(delta) {
  const host = document.getElementById("plate-lightbox");
  if (!host) return;
  const cards = getPlateCards();
  if (!cards.length) return;
  let idx = Number(host.dataset.index || 0) + delta;
  if (idx < 0) idx = cards.length - 1;
  if (idx >= cards.length) idx = 0;
  host.dataset.index = String(idx);
  renderPlateLightbox();
}

function renderPlateLightbox() {
  const host = document.getElementById("plate-lightbox");
  if (!host) return;
  const cards = getPlateCards();
  const idx = Number(host.dataset.index || 0);
  const card = cards[idx];
  if (!card) return;
  const stage = host.querySelector(".plate-lightbox-stage");
  const caption = host.querySelector(".plate-lightbox-caption");
  stage.innerHTML = "";

  const sourceVideo = card.querySelector("video");
  const sourceImg = card.querySelector("img");
  if (sourceVideo) {
    const src = sourceVideo.querySelector("source")?.getAttribute("src");
    const poster = sourceVideo.getAttribute("poster") || "";
    const v = document.createElement("video");
    v.src = src || "";
    v.poster = poster;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    v.loop = true;
    stage.appendChild(v);
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } else if (sourceImg) {
    const i = document.createElement("img");
    i.src = sourceImg.currentSrc || sourceImg.src;
    i.alt = sourceImg.alt || "";
    stage.appendChild(i);
  }

  const labelEl = card.querySelector(".plate-vault-label");
  caption.textContent = labelEl ? labelEl.textContent.trim() : "";
}

/* ── Generic Gallery Lightbox ── */

function initGalleryLightbox() {
  const triggers = $$("[data-zoomable][data-gallery]");
  if (!triggers.length) return;

  const groups = new Map();
  triggers.forEach((img) => {
    const key = img.getAttribute("data-gallery");
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(img);
  });

  triggers.forEach((img) => {
    img.style.cursor = "zoom-in";
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    const open = (e) => {
      e.preventDefault();
      const key = img.getAttribute("data-gallery");
      const list = groups.get(key) || [];
      const idx = list.indexOf(img);
      openGalleryLightbox(key, idx >= 0 ? idx : 0);
    };
    img.addEventListener("click", open);
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") open(e);
    });
  });

  function captionFor(img) {
    const fig = img.closest("figure");
    const cap = fig?.querySelector("figcaption");
    if (cap) return cap.textContent.trim();
    const slide = img.closest(".avatar-slide");
    if (slide) {
      const label = slide.querySelector(".avatar-frame-label")?.textContent.trim();
      const bullets = Array.from(slide.querySelectorAll(".avatar-slide-bullets li"))
        .slice(0, 1)
        .map((li) => li.textContent.trim());
      return [label, ...bullets].filter(Boolean).join(" — ");
    }
    return img.getAttribute("alt") || "";
  }

  function ensureLightbox() {
    let host = document.getElementById("gallery-lightbox");
    if (host) return host;
    host = document.createElement("div");
    host.id = "gallery-lightbox";
    host.className = "gallery-lightbox";
    host.setAttribute("role", "dialog");
    host.setAttribute("aria-modal", "true");
    host.setAttribute("aria-label", "Image viewer");
    host.hidden = true;
    host.innerHTML = `
      <button class="gallery-lightbox-close" type="button" aria-label="Close (Esc)">×</button>
      <button class="gallery-lightbox-nav gallery-lightbox-prev" type="button" aria-label="Previous (←)">‹</button>
      <button class="gallery-lightbox-nav gallery-lightbox-next" type="button" aria-label="Next (→)">›</button>
      <div class="gallery-lightbox-stage"></div>
      <div class="gallery-lightbox-caption" aria-live="polite"></div>
      <div class="gallery-lightbox-counter" aria-live="polite"></div>
    `;
    document.body.appendChild(host);

    host.addEventListener("click", (e) => { if (e.target === host) closeLightbox(); });
    host.querySelector(".gallery-lightbox-close").addEventListener("click", closeLightbox);
    host.querySelector(".gallery-lightbox-prev").addEventListener("click", () => step(-1));
    host.querySelector(".gallery-lightbox-next").addEventListener("click", () => step(1));

    document.addEventListener("keydown", (e) => {
      if (host.hidden) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "Home") jumpTo(0);
      else if (e.key === "End") jumpTo((groups.get(host.dataset.group) || []).length - 1);
    });

    let touchStartX = 0;
    host.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    host.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) { dx > 0 ? step(-1) : step(1); }
    }, { passive: true });

    return host;
  }

  function openGalleryLightbox(group, index) {
    const host = ensureLightbox();
    host.dataset.group = group;
    host.dataset.index = String(index);
    host.hidden = false;
    document.body.classList.add("gallery-lightbox-open");
    render();
    host.querySelector(".gallery-lightbox-close").focus();
  }

  function closeLightbox() {
    const host = document.getElementById("gallery-lightbox");
    if (!host) return;
    host.querySelector(".gallery-lightbox-stage").innerHTML = "";
    host.hidden = true;
    document.body.classList.remove("gallery-lightbox-open");
  }

  function step(delta) {
    const host = document.getElementById("gallery-lightbox");
    if (!host) return;
    const list = groups.get(host.dataset.group) || [];
    if (!list.length) return;
    let idx = Number(host.dataset.index || 0) + delta;
    if (idx < 0) idx = list.length - 1;
    if (idx >= list.length) idx = 0;
    host.dataset.index = String(idx);
    render();
  }

  function jumpTo(idx) {
    const host = document.getElementById("gallery-lightbox");
    if (!host) return;
    host.dataset.index = String(idx);
    render();
  }

  function render() {
    const host = document.getElementById("gallery-lightbox");
    const list = groups.get(host.dataset.group) || [];
    const idx = Number(host.dataset.index || 0);
    const img = list[idx];
    if (!img) return;
    const stage = host.querySelector(".gallery-lightbox-stage");
    stage.innerHTML = "";
    const big = document.createElement("img");
    big.src = img.currentSrc || img.src;
    big.alt = img.alt || "";
    stage.appendChild(big);

    // Preload neighbors
    [idx - 1, idx + 1].forEach((n) => {
      const norm = ((n % list.length) + list.length) % list.length;
      const neighbor = list[norm];
      if (neighbor) { const pre = new Image(); pre.src = neighbor.currentSrc || neighbor.src; }
    });

    host.querySelector(".gallery-lightbox-caption").textContent = captionFor(img);
    host.querySelector(".gallery-lightbox-counter").textContent = `${idx + 1} / ${list.length}`;
  }
}

/* ── Live Transmission Feed ── */

const feedStreamEl = $("feed-stream");
const feedEmptyEl = $("feed-empty");
const feedTotalEl = $("feed-total");
const feedStatusEl = $("feed-status");
const feedFilterButtons = $$("[data-feed]");

const feedState = {
  latestAt: null,
  filter: "all",
  entries: [],
  seenIds: new Set(),
};

function feedEntryId(entry) {
  if (entry.type === "call") return `call:${entry.callSid}:${entry.turnNumber}`;
  return `chat:${entry.sessionId}:${entry.createdAt}`;
}

function formatFeedTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

function renderFeedEntry(entry) {
  const div = document.createElement("div");
  div.className = `feed-entry feed-entry-${entry.type}`;

  const header = document.createElement("div");
  header.className = "feed-entry-header";

  const typeBadge = el("span", "feed-entry-type", entry.type === "call" ? "HOTLINE" : "CHAT");
  const time = el("span", "feed-entry-time", formatFeedTime(entry.createdAt));
  header.append(typeBadge, time);

  const content = document.createElement("div");
  content.className = "feed-entry-content";

  if (entry.type === "call") {
    const callerTurn = document.createElement("div");
    callerTurn.className = "feed-turn";
    const callerLabel = el("span", "feed-entry-speaker feed-entry-speaker-caller", "CALLER:");
    callerTurn.append(callerLabel, document.createTextNode(" " + entry.transcript));
    content.append(callerTurn);

    if (entry.aiResponse) {
      const signalTurn = document.createElement("div");
      signalTurn.className = "feed-turn";
      const signalLabel = el("span", "feed-entry-speaker feed-entry-speaker-signal", "SIGNAL:");
      signalTurn.append(signalLabel, document.createTextNode(" " + entry.aiResponse));
      content.append(signalTurn);
    }
  } else {
    const label = entry.role === "user" ? "HUMAN" : "SIGNAL";
    const cls = entry.role === "user" ? "feed-entry-speaker-human" : "feed-entry-speaker-signal";
    const speaker = el("span", `feed-entry-speaker ${cls}`, `${label}:`);
    content.append(speaker, document.createTextNode(" " + entry.content));
  }

  div.append(header, content);
  return div;
}

function applyFeedFilter() {
  if (!feedStreamEl) return;
  const children = feedStreamEl.querySelectorAll(".feed-entry");
  children.forEach((child) => {
    if (feedState.filter === "all") {
      child.style.display = "";
    } else if (feedState.filter === "calls") {
      child.style.display = child.classList.contains("feed-entry-call") ? "" : "none";
    } else {
      child.style.display = child.classList.contains("feed-entry-chat") ? "" : "none";
    }
  });
}

async function loadFeed(isPolling) {
  if (!feedStreamEl) return;
  try {
    const params = new URLSearchParams({ limit: "30" });
    if (isPolling && feedState.latestAt) params.set("since", feedState.latestAt);

    const res = await fetch(`/api/v1/transmissions/live?${params}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return;
    const data = await res.json();

    if (feedTotalEl) feedTotalEl.textContent = String(data.total);
    if (data.latestAt) feedState.latestAt = data.latestAt;

    const newEntries = data.entries.filter((e) => !feedState.seenIds.has(feedEntryId(e)));

    if (newEntries.length > 0) {
      if (feedEmptyEl) feedEmptyEl.style.display = "none";

      // Newest first — prepend to stream
      for (const entry of newEntries.reverse()) {
        const id = feedEntryId(entry);
        feedState.seenIds.add(id);
        const node = renderFeedEntry(entry);
        feedStreamEl.prepend(node);
      }

      applyFeedFilter();

      // Cap DOM entries
      const allEntries = feedStreamEl.querySelectorAll(".feed-entry");
      if (allEntries.length > 60) {
        for (let i = 60; i < allEntries.length; i++) allEntries[i].remove();
      }
    }

    if (feedStatusEl) feedStatusEl.textContent = "LIVE";
  } catch {
    if (feedStatusEl) feedStatusEl.textContent = "OFFLINE";
  }
}

/* ── Refresh ── */

async function refreshAll() {
  try {
    refreshPreset();
    await Promise.all([loadCurrent(), loadHistory(), loadEntropy()]);
    loadSnapshotUtils().catch(() => {});
    loadTransmissionCount().catch(() => {});
  } catch {
    if (currentStateEl) currentStateEl.textContent = "Signal not responding.";
    if (chartMetaEl) chartMetaEl.textContent = "Unable to load data.";
  }
}

/* ── Event Listeners ── */

window.addEventListener("resize", () => drawChart(state.chartPoints));
initOrbs();
initWaveform();
initScrollReveal();
initStorySlider();
initAvatarSpread();
initAvatarSlideshow();
initPlateVault();
initPlateLoupe();
initGalleryLightbox();

if (document.body.dataset.page === "home") {
  Promise.all([loadMeta(), loadTimeline()])
    .then(() => {
      const r = parseInitialRange();
      setRange(r.preset, { start: r.start, end: r.end });
      return refreshAll();
    })
    .catch((err) => {
      if (currentStateEl) currentStateEl.textContent = "Signal not responding.";
      console.error(err);
    });

  // Range presets
  rangeButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const p = btn.dataset.range;
      if (!p) return;
      setRange(p, getPresetRange(p));
      try {
        await Promise.all([loadHistory(), loadEntropy()]);
        loadSnapshotUtils().catch(() => {});
      } catch { if (chartMetaEl) chartMetaEl.textContent = "Unable to load range."; }
    });
  });

  // Custom range form
  historyFormEl?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const s = parseDT(historyStartEl?.value), en = parseDT(historyEndEl?.value);
    if (!s || !en || new Date(en) <= new Date(s)) {
      if (chartMetaEl) chartMetaEl.textContent = "Choose a valid start and end time.";
      return;
    }
    setRange("custom", { start: s, end: en });
    try {
      await Promise.all([loadHistory(), loadEntropy()]);
      loadSnapshotUtils().catch(() => {});
    } catch { if (chartMetaEl) chartMetaEl.textContent = "Unable to load range."; }
  });

  // Copy buttons
  copyRangeLinkEl?.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(location.href); } catch {}
  });

  copySheetsFormulaEl?.addEventListener("click", async () => {
    const formula = sheetsFormulaEl?.textContent;
    if (!formula) return;
    const labelEl = copySheetsFormulaEl.querySelector("span");
    try {
      await navigator.clipboard.writeText(formula);
      if (copySheetsStatusEl) copySheetsStatusEl.textContent = "Copied to clipboard.";
      copySheetsFormulaEl.classList.add("is-copied");
      if (labelEl) labelEl.textContent = "Copied";
      setTimeout(() => {
        copySheetsFormulaEl.classList.remove("is-copied");
        if (labelEl) labelEl.textContent = "Copy";
      }, 1800);
    } catch {
      if (copySheetsStatusEl) copySheetsStatusEl.textContent = "Copy failed.";
    }
  });

  // Timeline: vertical, all events visible — no keyboard nav needed

  // Chat widget
  chatToggleEl?.addEventListener("click", () => toggleChat());
  chatCloseEl?.addEventListener("click", () => toggleChat(false));
  openChatEl?.addEventListener("click", () => toggleChat(true));
  document.querySelectorAll('[data-action="open-chat"]').forEach((el) =>
    el.addEventListener("click", () => toggleChat(true))
  );

  chatFormEl?.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = chatInputEl?.value?.trim();
    if (!msg) return;
    chatInputEl.value = "";
    sendChatMessage(msg);
  });

  // Close chat on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.chatOpen) toggleChat(false);
  });

  // Scroll-triggered dossier cards and emo ducks
  const dossierObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          dossierObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );
  $$(".dossier-card").forEach((card) => dossierObserver.observe(card));
  // Hard fallback so no dossier card stays at opacity 0
  setTimeout(() => {
    $$(".dossier-card:not(.is-visible)").forEach((c) => c.classList.add("is-visible"));
  }, 3000);

  const duckObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.querySelectorAll(".emo-duck").forEach((duck) => {
          duck.classList.toggle("is-peeking", entry.isIntersecting);
        });
      });
    },
    { threshold: 0.3 }
  );
  $$(".duck-row").forEach((row) => duckObserver.observe(row));

  // MUD terminal — xterm.js + WebSocket-to-TCP proxy (lazy-connect on scroll)
  const mudXtermEl = $("mud-xterm");
  const mudStatusEl = $("mud-status");
  const mudStatusDot = $("mud-status-dot");
  if (mudXtermEl && window.Terminal) {
    const term = new window.Terminal({
      cursorBlink: true,
      cursorStyle: "underline",
      fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace",
      fontSize: 13,
      lineHeight: 1.25,
      rows: 28,
      cols: 80,
      scrollback: 2000,
      allowTransparency: true,
      theme: {
        background: "rgba(6, 6, 16, 0)",
        foreground: "#c8ffd4",
        cursor: "#FF1744",
        cursorAccent: "#060610",
        selectionBackground: "rgba(255, 23, 68, 0.25)",
        selectionForeground: "#ffffff",
        black: "#0a0a1a",
        red: "#ff1744",
        green: "#7affae",
        yellow: "#ffd740",
        blue: "#50aae3",
        magenta: "#7c3aed",
        cyan: "#00e5ff",
        white: "#e0e0e0",
        brightBlack: "#4a4a6a",
        brightRed: "#ff5252",
        brightGreen: "#b9f6ca",
        brightYellow: "#ffe57f",
        brightBlue: "#82ccff",
        brightMagenta: "#b388ff",
        brightCyan: "#84ffff",
        brightWhite: "#ffffff",
      },
    });

    function setMudStatus(status, dotClass) {
      if (mudStatusEl) mudStatusEl.textContent = status;
      if (mudStatusDot) mudStatusDot.className = "mud-status-dot " + dotClass;
    }

    let ws = null;
    let mudConnected = false;
    let mudOpened = false;

    function openSocket() {
      setMudStatus("Connecting", "mud-dot-pulse");
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${protocol}//${location.host}/ws/mud`);
      ws.binaryType = "arraybuffer";

      ws.addEventListener("open", () => {
        setMudStatus("Connected", "mud-dot-live");
      });

      ws.addEventListener("message", (e) => {
        const text = typeof e.data === "string" ? e.data : new TextDecoder().decode(e.data);
        term.write(text);
      });

      ws.addEventListener("close", () => {
        setMudStatus("Disconnected", "mud-dot-dead");
        term.write("\r\n\x1b[2m--- Connection closed. Click Reconnect to retry. ---\x1b[0m\r\n");
      });

      ws.addEventListener("error", () => {
        setMudStatus("Error", "mud-dot-dead");
      });
    }

    function reconnectMud() {
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        try { ws.close(); } catch (_) { /* noop */ }
      }
      term.write("\r\n\x1b[2m--- Reconnecting... ---\x1b[0m\r\n");
      openSocket();
    }

    function connectMud() {
      if (mudConnected) return;
      mudConnected = true;
      if (!mudOpened) {
        term.open(mudXtermEl);
        mudOpened = true;
      }
      openSocket();

      // Local echo — Avatar MUD operates in character mode without server-side echo,
      // so we display each keystroke locally as we send it to the WebSocket.
      term.onData((data) => {
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(data);
        if (data === "\r") term.write("\r\n");
        else if (data === "\x7f" || data === "\b") term.write("\b \b");
        else if (data >= " " || data === "\t") term.write(data);
      });

      // Ensure clicking anywhere on the terminal container focuses xterm
      const focusTerm = () => {
        term.focus();
        const ta = mudXtermEl.querySelector(".xterm-helper-textarea");
        if (ta) ta.focus();
      };
      mudXtermEl.addEventListener("click", focusTerm);
      mudXtermEl.addEventListener("touchstart", focusTerm, { passive: true });
      mudXtermEl.addEventListener("focusin", focusTerm);
      mudXtermEl.setAttribute("tabindex", "0");
      mudXtermEl.style.cursor = "text";
      // Auto-focus once the terminal opens so keyboard input works without explicit click
      setTimeout(focusTerm, 300);
    }

    // Lazy-connect: only open TCP when terminal scrolls into view
    const mudObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          connectMud();
          mudObserver.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    mudObserver.observe(mudXtermEl);

    const mudReconnectBtn = $("mud-reconnect");
    mudReconnectBtn?.addEventListener("click", () => {
      if (!mudOpened) {
        connectMud();
        return;
      }
      reconnectMud();
    });
  }

  // Newsletter form
  const newsletterForm = $("newsletter-form");
  const newsletterEmail = $("newsletter-email");
  const newsletterStatus = $("newsletter-status");
  newsletterForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = newsletterEmail?.value?.trim();
    if (!email) return;
    newsletterStatus.textContent = "Subscribing...";
    try {
      const res = await fetch("/api/v1/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        newsletterStatus.textContent = "Subscribed. The signal will find you.";
        newsletterEmail.value = "";
      } else {
        const data = await res.json().catch(() => ({}));
        newsletterStatus.textContent = data.error || "Something went wrong. Try again.";
      }
    } catch {
      newsletterStatus.textContent = "Network error. The signal is disrupted.";
    }
  });

  // Feed
  loadFeed(false).catch(() => {});
  feedFilterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      feedState.filter = btn.dataset.feed;
      feedFilterButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
      applyFeedFilter();
    });
  });
  setInterval(() => loadFeed(true).catch(() => {}), 5000);

  // Auto-refresh
  setInterval(() => loadCurrent().catch(() => {}), 2000);
  setInterval(() => {
    refreshPreset();
    loadHistory().catch(() => {});
    loadEntropy().catch(() => {});
    loadSnapshotUtils().catch(() => {});
  }, 10000);
  setInterval(() => loadTransmissionCount().catch(() => {}), 30000);

  // Signal age update
  setInterval(() => {
    if (state.meta?.earliestKnownAt) {
      const age = formatAge(state.meta.earliestKnownAt);
      if (signalAgeEl) signalAgeEl.textContent = age;
      if (teleAgeEl) teleAgeEl.textContent = age;
    }
  }, 60000);
}
