const currentValueEl = document.getElementById("current-value");
const currentUnitEl = document.getElementById("current-unit");
const currentStateEl = document.getElementById("current-state");
const lastUpdatedEl = document.getElementById("last-updated");
const entropyValueEl = document.getElementById("entropy-value");
const cacheStatusEl = document.getElementById("cache-status");
const chartMetaEl = document.getElementById("chart-meta");
const chartEventsEl = document.getElementById("chart-events");
const countdownEl = document.getElementById("countdown");
const chartCanvas = document.getElementById("history-chart");
const historyFormEl = document.getElementById("history-range-form");
const historyStartEl = document.getElementById("history-start");
const historyEndEl = document.getElementById("history-end");
const earliestKnownFactEl = document.getElementById("earliest-known-fact");
const timelineAnnotationsEl = document.getElementById("timeline-annotations");
const storyMilestonesEl = document.getElementById("story-milestones");
const safetyNoteEl = document.getElementById("safety-note");
const snapshotJsonLinkEl = document.getElementById("snapshot-json-link");
const exportCsvLinkEl = document.getElementById("export-csv-link");
const exportExcelLinkEl = document.getElementById("export-excel-link");
const sheetsFormulaEl = document.getElementById("sheets-formula");
const copySheetsFormulaButtonEl = document.getElementById("copy-sheets-formula");
const copySheetsStatusEl = document.getElementById("copy-sheets-status");
const copyRangeLinkButtonEl = document.getElementById("copy-range-link");
const copyRangeStatusEl = document.getElementById("copy-range-status");
const snapshotStorageNoteEl = document.getElementById("snapshot-storage-note");
const randomNumberEl = document.getElementById("random-number");
const randomMetaEl = document.getElementById("random-meta");
const randomJsonLinkEl = document.getElementById("random-json-link");
const rangeButtons = Array.from(document.querySelectorAll(".range-button[data-range]"));

const appState = {
  chartPoints: [],
  meta: null,
  timeline: null,
  range: {
    preset: "24h",
    start: null,
    end: null,
  },
};

function formatRelativeTimestamp(isoString) {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleString();
}

function formatInputDateTime(isoString) {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const offsetMs = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
}

function parseInputDateTime(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function formatRangeLabel(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "an unknown range";
  }

  return `${startDate.toLocaleString()} to ${endDate.toLocaleString()}`;
}

function createElement(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) {
    node.className = className;
  }
  if (typeof text === "string") {
    node.textContent = text;
  }
  return node;
}

function getVisibleAnnotations() {
  if (!appState.timeline?.annotations || !appState.range.start || !appState.range.end) {
    return [];
  }

  const start = new Date(appState.range.start).getTime();
  const end = new Date(appState.range.end).getTime();

  return appState.timeline.annotations.filter((annotation) => {
    const timestamp = new Date(annotation.date).getTime();
    return Number.isFinite(timestamp) && timestamp >= start && timestamp <= end;
  });
}

function drawChart(points) {
  if (!(chartCanvas instanceof HTMLCanvasElement)) {
    return;
  }

  const context = chartCanvas.getContext("2d");
  if (!context) {
    return;
  }

  const width = Math.max(320, chartCanvas.clientWidth);
  const height = Math.max(320, Math.round(width * 0.36));
  const ratio = window.devicePixelRatio || 1;

  chartCanvas.width = Math.round(width * ratio);
  chartCanvas.height = Math.round(height * ratio);
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const padding = 26;

  context.strokeStyle = "rgba(122, 255, 174, 0.1)";
  context.lineWidth = 1;
  for (let row = 0; row <= 4; row += 1) {
    const y = padding + ((height - padding * 2) / 4) * row;
    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
  }

  if (points.length === 0) {
    context.fillStyle = "rgba(235, 255, 240, 0.78)";
    context.font = "16px 'JetBrains Mono', monospace";
    context.fillText("No points available for the selected range.", padding, height / 2);
    return;
  }

  const rangeStart = new Date(appState.range.start ?? points[0].timestamp).getTime();
  const rangeEnd = new Date(appState.range.end ?? points[points.length - 1].timestamp).getTime();
  const rangeSpan = Math.max(1, rangeEnd - rangeStart);
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(0.0001, max - min);

  const areaGradient = context.createLinearGradient(0, padding, 0, height - padding);
  areaGradient.addColorStop(0, "rgba(122, 255, 174, 0.28)");
  areaGradient.addColorStop(1, "rgba(122, 255, 174, 0)");

  context.beginPath();
  points.forEach((point, index) => {
    const x = padding + ((width - padding * 2) / Math.max(1, points.length - 1)) * index;
    const normalized = (point.value - min) / span;
    const y = height - padding - normalized * (height - padding * 2);

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.lineTo(width - padding, height - padding);
  context.lineTo(padding, height - padding);
  context.closePath();
  context.fillStyle = areaGradient;
  context.fill();

  context.lineJoin = "round";
  context.lineCap = "round";
  context.lineWidth = 3;
  context.strokeStyle = "#7affae";
  context.beginPath();

  points.forEach((point, index) => {
    const x = padding + ((width - padding * 2) / Math.max(1, points.length - 1)) * index;
    const normalized = (point.value - min) / span;
    const y = height - padding - normalized * (height - padding * 2);

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });

  context.stroke();

  const annotations = getVisibleAnnotations();
  annotations.slice(0, 6).forEach((annotation, index) => {
    const timestamp = new Date(annotation.date).getTime();
    const x = padding + ((timestamp - rangeStart) / rangeSpan) * (width - padding * 2);

    context.strokeStyle = "rgba(214, 255, 166, 0.32)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x, padding);
    context.lineTo(x, height - padding);
    context.stroke();

    context.fillStyle = "rgba(214, 255, 166, 0.88)";
    context.font = "11px 'JetBrains Mono', monospace";
    context.fillText(annotation.title, Math.min(x + 4, width - 168), padding + 14 + (index % 2) * 14);
  });

  const latest = points[points.length - 1];
  if (latest) {
    const x = width - padding;
    const normalized = (latest.value - min) / span;
    const y = height - padding - normalized * (height - padding * 2);

    context.fillStyle = "#24ff76";
    context.beginPath();
    context.arc(x, y, 5.5, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = "rgba(235, 255, 240, 0.78)";
  context.font = "11px 'JetBrains Mono', monospace";
  context.fillText(`min ${min.toFixed(3)}`, padding, height - 8);
  context.fillText(`max ${max.toFixed(3)}`, width - padding - 72, height - 8);
}

function renderTimeline() {
  if (timelineAnnotationsEl) {
    timelineAnnotationsEl.replaceChildren();

    const annotations = [...(appState.timeline?.annotations ?? [])].sort(
      (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
    );

    if (annotations.length === 0) {
      timelineAnnotationsEl.append(createElement("p", "timeline-empty", "No timeline annotations available."));
    } else {
      annotations.forEach((annotation) => {
        const item = createElement("article", "timeline-item");
        const meta = createElement("p", "timeline-date", formatRelativeTimestamp(annotation.date));
        const title = createElement("h3", "timeline-title", annotation.title);
        const subtitle = createElement("p", "timeline-subtitle", annotation.subtitle);
        item.append(meta, title, subtitle);
        timelineAnnotationsEl.append(item);
      });
    }
  }

  if (storyMilestonesEl) {
    storyMilestonesEl.replaceChildren();

    const milestones = appState.timeline?.milestones ?? [];
    if (milestones.length === 0) {
      storyMilestonesEl.append(createElement("p", "timeline-empty", "No story milestones available."));
    } else {
      milestones.forEach((milestone) => {
        const card = createElement("article", "milestone-card");
        const era = createElement("p", "milestone-era", milestone.eraLabel);
        const title = createElement("h3", "milestone-title", milestone.title);
        const subtitle = createElement("p", "milestone-subtitle", milestone.subtitle);
        const body = createElement("p", "milestone-body", milestone.body);
        card.append(era, title, subtitle, body);
        storyMilestonesEl.append(card);
      });
    }
  }

  if (safetyNoteEl && appState.timeline?.safetyNote) {
    safetyNoteEl.textContent = appState.timeline.safetyNote;
  }
}

function applyPresetButtonState() {
  rangeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.range === appState.range.preset);
  });
}

function getPresetRange(preset) {
  const end = new Date();
  const earliest = new Date(appState.meta?.earliestKnownAt ?? end.toISOString());
  let start = new Date(end.getTime() - 24 * 60 * 60_000);

  if (preset === "7d") {
    start = new Date(end.getTime() - 7 * 24 * 60 * 60_000);
  } else if (preset === "30d") {
    start = new Date(end.getTime() - 30 * 24 * 60 * 60_000);
  } else if (preset === "all") {
    start = earliest;
  }

  if (start.getTime() < earliest.getTime()) {
    start = earliest;
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function setRange(preset, range) {
  appState.range = {
    preset,
    start: range.start,
    end: range.end,
  };

  if (historyStartEl instanceof HTMLInputElement) {
    historyStartEl.value = formatInputDateTime(range.start);
  }
  if (historyEndEl instanceof HTMLInputElement) {
    historyEndEl.value = formatInputDateTime(range.end);
  }

  applyPresetButtonState();
  updateRangeUrl();
}

function refreshPresetWindow() {
  if (appState.range.preset !== "custom") {
    setRange(appState.range.preset, getPresetRange(appState.range.preset));
  }
}

function updateRangeUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("range");
  url.searchParams.delete("start");
  url.searchParams.delete("end");

  if (appState.range.preset === "custom" && appState.range.start && appState.range.end) {
    url.searchParams.set("start", appState.range.start);
    url.searchParams.set("end", appState.range.end);
  } else if (appState.range.preset) {
    url.searchParams.set("range", appState.range.preset);
  }

  window.history.replaceState({}, "", url);
}

function parseInitialRange() {
  const url = new URL(window.location.href);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  const preset = url.searchParams.get("range");

  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate.getTime() > startDate.getTime()) {
      return {
        preset: "custom",
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      };
    }
  }

  if (preset && ["24h", "7d", "30d", "all"].includes(preset)) {
    const range = getPresetRange(preset);
    return {
      preset,
      start: range.start,
      end: range.end,
    };
  }

  const range = getPresetRange("24h");
  return {
    preset: "24h",
    start: range.start,
    end: range.end,
  };
}

function getTargetPoints() {
  if (!(chartCanvas instanceof HTMLCanvasElement)) {
    return 720;
  }

  return Math.min(1440, Math.max(160, Math.round(chartCanvas.clientWidth * 1.15)));
}

function buildRangeSearchParams() {
  const params = new URLSearchParams();
  if (appState.range.start) {
    params.set("start", appState.range.start);
  }
  if (appState.range.end) {
    params.set("end", appState.range.end);
  }
  params.set("targetPoints", String(getTargetPoints()));
  return params;
}

function buildSnapshotSearchParams() {
  const params = new URLSearchParams();
  if (appState.range.start) {
    params.set("start", appState.range.start);
  }
  if (appState.range.end) {
    params.set("end", appState.range.end);
  }
  return params;
}

function updateSnapshotLinks() {
  const params = buildSnapshotSearchParams();
  const snapshotSearch = params.toString();
  const csvParams = new URLSearchParams(params);
  csvParams.set("format", "csv");
  const excelParams = new URLSearchParams(params);
  excelParams.set("format", "excel");

  if (snapshotJsonLinkEl instanceof HTMLAnchorElement) {
    snapshotJsonLinkEl.href = `/api/v1/ghost-emf/snapshot?${snapshotSearch}`;
  }
  if (exportCsvLinkEl instanceof HTMLAnchorElement) {
    exportCsvLinkEl.href = `/api/v1/ghost-emf/export?${csvParams.toString()}`;
  }
  if (exportExcelLinkEl instanceof HTMLAnchorElement) {
    exportExcelLinkEl.href = `/api/v1/ghost-emf/export?${excelParams.toString()}`;
  }
  if (randomJsonLinkEl instanceof HTMLAnchorElement) {
    randomJsonLinkEl.href = `/api/v1/ghost-emf/random?${snapshotSearch}`;
  }
}

async function loadMeta() {
  const response = await fetch("/api/v1/ghost-emf/meta", { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Meta request failed with ${response.status}`);
  }

  appState.meta = await response.json();

  if (earliestKnownFactEl && appState.meta?.earliestKnownAt) {
    earliestKnownFactEl.textContent = `Earliest retained reading: ${formatRelativeTimestamp(appState.meta.earliestKnownAt)}`;
  }

  if (snapshotStorageNoteEl) {
    snapshotStorageNoteEl.textContent =
      appState.meta?.historyMode === "d1"
        ? "Serverless D1 snapshots are active and stored once per minute by the Worker cron trigger."
        : "D1 snapshot storage is not active yet. Export and reproducible random numbers require EMF_DB.";
  }
}

async function loadTimeline() {
  const response = await fetch("/api/v1/ghost-emf/timeline", { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Timeline request failed with ${response.status}`);
  }

  appState.timeline = await response.json();
  renderTimeline();
}

async function loadCurrent() {
  const response = await fetch("/api/v1/ghost-emf/current", { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Current request failed with ${response.status}`);
  }

  const payload = await response.json();
  if (currentValueEl) {
    currentValueEl.textContent = Number(payload.numericValue).toFixed(3);
  }
  if (currentUnitEl) {
    currentUnitEl.textContent = payload.unit ? ` ${payload.unit}` : "";
  }
  if (currentStateEl) {
    currentStateEl.textContent = `${payload.friendlyName} is reporting ${payload.state}.`;
  }
  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = formatRelativeTimestamp(payload.lastUpdated);
  }
  if (cacheStatusEl) {
    cacheStatusEl.textContent = response.headers.get("x-cache-status") ?? "MISS";
  }
}

async function loadHistory() {
  const response = await fetch(`/api/v1/ghost-emf/history?${buildRangeSearchParams().toString()}`, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`History request failed with ${response.status}`);
  }

  const payload = await response.json();
  appState.chartPoints = Array.isArray(payload.points) ? payload.points : [];
  drawChart(appState.chartPoints);

  if (chartMetaEl) {
    chartMetaEl.textContent =
      `${payload.displayPointCount} visible points from ${payload.rawPointCount} retained samples across ${formatRangeLabel(payload.start, payload.end)}.`;
  }

  if (chartEventsEl) {
    const visibleAnnotations = getVisibleAnnotations();
    chartEventsEl.textContent =
      visibleAnnotations.length > 0
        ? `${visibleAnnotations.length} dated marker${visibleAnnotations.length === 1 ? "" : "s"} in view: ${visibleAnnotations.map((annotation) => annotation.title).join(", ")}.`
        : "No dated technical markers fall inside the selected range.";
  }
}

async function loadEntropy() {
  const params = buildRangeSearchParams();
  params.set("bins", "24");
  const response = await fetch(`/api/v1/ghost-emf/entropy?${params.toString()}`, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Entropy request failed with ${response.status}`);
  }

  const payload = await response.json();
  if (entropyValueEl) {
    entropyValueEl.textContent = `${Number(payload.entropyBits).toFixed(4)} bits`;
  }
}

async function loadSnapshotUtilities() {
  updateSnapshotLinks();

  const snapshotParams = buildSnapshotSearchParams();
  const sheetsResponse = await fetch(`/api/v1/ghost-emf/google-sheets?${snapshotParams.toString()}`, {
    headers: { accept: "application/json" },
  });
  if (!sheetsResponse.ok) {
    throw new Error(`Google Sheets request failed with ${sheetsResponse.status}`);
  }

  const randomParams = new URLSearchParams(snapshotParams);
  randomParams.set("digits", "10");
  const randomResponse = await fetch(`/api/v1/ghost-emf/random?${randomParams.toString()}`, {
    headers: { accept: "application/json" },
  });
  if (!randomResponse.ok) {
    throw new Error(`Random request failed with ${randomResponse.status}`);
  }

  const sheetsPayload = await sheetsResponse.json();
  const randomPayload = await randomResponse.json();

  if (sheetsFormulaEl) {
    sheetsFormulaEl.textContent = sheetsPayload.importDataFormula;
  }

  if (randomNumberEl) {
    randomNumberEl.textContent = randomPayload.randomNumber;
  }

  if (randomMetaEl) {
    randomMetaEl.textContent =
      `${randomPayload.sampleCount} stored rows contributed to this value across ${formatRangeLabel(randomPayload.start, randomPayload.end)}.`;
  }
}

function handleSnapshotUtilityError(error) {
  if (sheetsFormulaEl) {
    sheetsFormulaEl.textContent = "Snapshot export helpers are unavailable for this range.";
  }
  if (copySheetsStatusEl) {
    copySheetsStatusEl.textContent = "Pick a range with stored D1 rows to generate export helpers.";
  }
  if (randomNumberEl) {
    randomNumberEl.textContent = "--";
  }
  if (randomMetaEl) {
    randomMetaEl.textContent = "No stored snapshot rows are available for the selected range.";
  }
  console.error(error);
}

function updateCountdown() {
  if (!countdownEl) {
    return;
  }

  const target = new Date("2028-11-07T00:00:00-05:00");
  const remaining = target.getTime() - Date.now();

  if (remaining <= 0) {
    countdownEl.textContent = "Election Day has arrived.";
    return;
  }

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  countdownEl.textContent = `${days}d ${hours}h ${minutes}m remaining`;
}

async function refreshAll() {
  try {
    refreshPresetWindow();
    await Promise.all([loadCurrent(), loadHistory(), loadEntropy()]);
    loadSnapshotUtilities().catch(handleSnapshotUtilityError);
  } catch (error) {
    if (currentStateEl) {
      currentStateEl.textContent = "The public feed is not responding right now.";
    }
    if (chartMetaEl) {
      chartMetaEl.textContent = "Unable to load the selected history range.";
    }
    console.error(error);
  }
}

window.addEventListener("resize", () => drawChart(appState.chartPoints));

updateCountdown();
setInterval(updateCountdown, 60_000);

if (document.body.dataset.page === "home") {
  Promise.all([loadMeta(), loadTimeline()])
    .then(() => {
      const initialRange = parseInitialRange();
      setRange(initialRange.preset, { start: initialRange.start, end: initialRange.end });
      return refreshAll();
    })
    .catch((error) => {
      if (currentStateEl) {
        currentStateEl.textContent = "The public feed is not responding right now.";
      }
      console.error(error);
    });

  rangeButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const preset = button.dataset.range;
      if (!preset) {
        return;
      }

      setRange(preset, getPresetRange(preset));
      try {
        await Promise.all([loadHistory(), loadEntropy()]);
        loadSnapshotUtilities().catch(handleSnapshotUtilityError);
      } catch (error) {
        if (chartMetaEl) {
          chartMetaEl.textContent = "Unable to load the selected history range.";
        }
        console.error(error);
      }
    });
  });

  historyFormEl?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const start = parseInputDateTime(historyStartEl instanceof HTMLInputElement ? historyStartEl.value : "");
    const end = parseInputDateTime(historyEndEl instanceof HTMLInputElement ? historyEndEl.value : "");

    if (!start || !end || new Date(end).getTime() <= new Date(start).getTime()) {
      if (chartMetaEl) {
        chartMetaEl.textContent = "Choose a valid start time and a later end time before applying a custom range.";
      }
      return;
    }

    setRange("custom", { start, end });
    try {
      await Promise.all([loadHistory(), loadEntropy()]);
      loadSnapshotUtilities().catch(handleSnapshotUtilityError);
    } catch (error) {
      if (chartMetaEl) {
        chartMetaEl.textContent = "Unable to load the selected history range.";
      }
      console.error(error);
    }
  });

  copySheetsFormulaButtonEl?.addEventListener("click", async () => {
    const formula = sheetsFormulaEl?.textContent;
    if (!formula) {
      return;
    }

    try {
      await navigator.clipboard.writeText(formula);
      if (copySheetsStatusEl) {
        copySheetsStatusEl.textContent = "Google Sheets formula copied.";
      }
    } catch (error) {
      if (copySheetsStatusEl) {
        copySheetsStatusEl.textContent = "Clipboard copy failed. Copy the formula manually.";
      }
      console.error(error);
    }
  });

  copyRangeLinkButtonEl?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      if (copyRangeStatusEl) {
        copyRangeStatusEl.textContent = "Shareable range link copied.";
      }
    } catch (error) {
      if (copyRangeStatusEl) {
        copyRangeStatusEl.textContent = "Clipboard copy failed. Copy the URL manually.";
      }
      console.error(error);
    }
  });

  setInterval(() => {
    loadCurrent().catch(console.error);
  }, 3_000);
  setInterval(() => {
    refreshPresetWindow();
    loadHistory().catch(console.error);
    loadEntropy().catch(console.error);
    loadSnapshotUtilities().catch(console.error);
  }, 15_000);
}
