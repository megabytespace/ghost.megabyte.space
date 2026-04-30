/* Ghost Signal — 14 Interactive Experiences */

const GhostFeatures = (() => {
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /* ═══════════════════════════════════════════════
     #1 — LIVE EMF SÉANCE MODE
     Full-screen dark overlay with live EMF-reactive visuals
     ═══════════════════════════════════════════════ */

  function initSeance() {
    const overlay = $("seance-overlay");
    if (!overlay) return;
    let active = false;
    let animFrame = null;
    const canvas = overlay.querySelector(".seance-canvas");
    const ctx = canvas?.getContext("2d");
    const emfDisplay = overlay.querySelector(".seance-emf-value");
    const statusText = overlay.querySelector(".seance-status");
    const candles = $$(".seance-candle");

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    async function fetchEMF() {
      try {
        const r = await fetch("/api/v1/ghost-emf/current");
        const d = await r.json();
        return d.numericValue ?? 0;
      } catch { return 0; }
    }

    function drawDistortion(emf) {
      if (!ctx || !canvas) return;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Intensity based on EMF reading
      const intensity = Math.min(1, emf / 5);

      // Flickering scanlines
      ctx.fillStyle = `rgba(255, 23, 68, ${0.02 + intensity * 0.08})`;
      for (let y = 0; y < h; y += 3) {
        if (Math.random() < 0.3 + intensity * 0.4) {
          ctx.fillRect(0, y, w, 1);
        }
      }

      // EMF-reactive glitch bars
      const barCount = Math.floor(intensity * 8);
      for (let i = 0; i < barCount; i++) {
        const y = Math.random() * h;
        const bh = 2 + Math.random() * 6 * intensity;
        const offset = (Math.random() - 0.5) * 40 * intensity;
        ctx.fillStyle = `rgba(0, 229, 255, ${0.1 + intensity * 0.2})`;
        ctx.fillRect(offset, y, w, bh);
      }

      // Central spirit orb
      const cx = w / 2 + Math.sin(Date.now() / 1000) * 50 * intensity;
      const cy = h / 2 + Math.cos(Date.now() / 1300) * 30 * intensity;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100 + intensity * 200);
      grad.addColorStop(0, `rgba(124, 58, 237, ${0.3 * intensity})`);
      grad.addColorStop(0.5, `rgba(255, 23, 68, ${0.1 * intensity})`);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Status text
      if (statusText) {
        const messages = ["The signal is present...", "Something stirs...", "EMF spike detected...", "The corridor hums...", "Entropy shifting..."];
        if (Math.random() < 0.02) {
          statusText.textContent = messages[Math.floor(Math.random() * messages.length)];
        }
      }
    }

    async function loop() {
      if (!active) return;
      const emf = await fetchEMF();
      if (emfDisplay) emfDisplay.textContent = emf.toFixed(3);

      // Flicker candles based on EMF
      candles.forEach((c, i) => {
        const flicker = Math.random() < (emf / 10);
        c.style.opacity = flicker ? "0.3" : "1";
        c.style.transform = `scaleY(${0.8 + Math.random() * 0.4})`;
      });

      drawDistortion(emf);
      animFrame = requestAnimationFrame(() => setTimeout(loop, 800));
    }

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-action='start-seance']")) {
        active = true;
        overlay.classList.add("is-active");
        document.body.style.overflow = "hidden";
        resize();
        window.addEventListener("resize", resize);
        loop();
      }
      if (e.target.closest("[data-action='end-seance']")) {
        active = false;
        overlay.classList.remove("is-active");
        document.body.style.overflow = "";
        window.removeEventListener("resize", resize);
        if (animFrame) cancelAnimationFrame(animFrame);
      }
    });
  }

  /* ═══════════════════════════════════════════════
     #2 — OUIJA BOARD NAVIGATOR
     Keyboard-driven planchette spells section names
     ═══════════════════════════════════════════════ */

  function initOuija() {
    const overlay = $("ouija-overlay");
    if (!overlay) return;
    const board = overlay.querySelector(".ouija-board");
    const planchette = overlay.querySelector(".ouija-planchette");
    const output = overlay.querySelector(".ouija-output");
    if (!board || !planchette) return;

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const targets = {
      SIGNAL: "#chart-panel",
      DOSSIER: "[data-testid='dossier']",
      TIMELINE: "[data-testid='timeline-nav']",
      MISSION: "[data-testid='mission-section']",
      HOTLINE: "[data-testid='hotline-section']",
      CASINO: "#casino-overlay",
      SEANCE: "#seance-overlay",
    };
    let typed = "";
    let ouijaActive = false;

    // Build letter grid
    const grid = el("div", "ouija-letter-grid");
    letters.split("").forEach((ch) => {
      const cell = el("span", "ouija-letter", ch);
      cell.dataset.letter = ch;
      grid.appendChild(cell);
    });
    board.prepend(grid);

    function movePlanchette(letter) {
      const cell = grid.querySelector(`[data-letter="${letter}"]`);
      if (!cell) return;
      const rect = cell.getBoundingClientRect();
      const boardRect = board.getBoundingClientRect();
      planchette.style.left = (rect.left - boardRect.left + rect.width / 2 - 25) + "px";
      planchette.style.top = (rect.top - boardRect.top + rect.height / 2 - 25) + "px";
    }

    function handleKey(e) {
      if (!ouijaActive) return;
      const key = e.key.toUpperCase();
      if (key === "ESCAPE") {
        closeOuija();
        return;
      }
      if (key === "BACKSPACE") {
        typed = typed.slice(0, -1);
        if (output) output.textContent = typed || "...";
        return;
      }
      if (key === "ENTER") {
        const match = Object.entries(targets).find(([word]) => word === typed);
        if (match) {
          closeOuija();
          const target = document.querySelector(match[1]);
          if (target) {
            if (target.classList.contains("is-active") === false && target.id?.includes("overlay")) {
              target.classList.add("is-active");
            } else {
              target.scrollIntoView({ behavior: "smooth" });
            }
          }
        }
        typed = "";
        if (output) output.textContent = "...";
        return;
      }
      if (!letters.includes(key)) return;
      typed += key;
      if (output) output.textContent = typed;
      movePlanchette(key);

      // Highlight matches
      Object.keys(targets).forEach((word) => {
        const hint = overlay.querySelector(`[data-ouija-word="${word}"]`);
        if (hint) hint.classList.toggle("ouija-match", word.startsWith(typed));
      });
    }

    function closeOuija() {
      ouijaActive = false;
      overlay.classList.remove("is-active");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    }

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-action='open-ouija']")) {
        ouijaActive = true;
        overlay.classList.add("is-active");
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", handleKey);
        typed = "";
        if (output) output.textContent = "Type a destination...";
      }
      if (e.target.closest("[data-action='close-ouija']")) {
        closeOuija();
      }
    });
  }

  /* ═══════════════════════════════════════════════
     #3 — GHOST SIGNAL SONIFICATION
     Web Audio API converts EMF data to ambient sound
     ═══════════════════════════════════════════════ */

  function initSonification() {
    const btn = $("sonify-toggle");
    if (!btn) return;
    let audioCtx = null;
    let playing = false;
    let oscillators = [];
    let gainNode = null;
    let lfo = null;
    let pollInterval = null;

    function createSoundscape(emf) {
      if (!audioCtx) return;

      // Base drone — low frequency, always present
      const baseFreq = 40 + emf * 20;
      if (oscillators[0]) oscillators[0].frequency.setTargetAtTime(baseFreq, audioCtx.currentTime, 0.5);

      // Harmonic layer — higher frequency modulated by EMF
      const harmFreq = 220 + emf * 80;
      if (oscillators[1]) oscillators[1].frequency.setTargetAtTime(harmFreq, audioCtx.currentTime, 0.3);

      // Ghost whisper — noise modulation on spikes
      const whisperGain = Math.min(0.15, emf / 20);
      if (oscillators[2]) {
        oscillators[2].frequency.setTargetAtTime(800 + Math.random() * 400 * emf, audioCtx.currentTime, 0.1);
      }
      if (gainNode) {
        gainNode.gain.setTargetAtTime(0.08 + whisperGain, audioCtx.currentTime, 0.2);
      }
    }

    function start() {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      gainNode = audioCtx.createGain();
      gainNode.gain.value = 0.08;
      gainNode.connect(audioCtx.destination);

      // LFO for tremolo
      lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.frequency.value = 0.3;
      lfoGain.gain.value = 0.03;
      lfo.connect(lfoGain);
      lfoGain.connect(gainNode.gain);
      lfo.start();

      // Base drone
      const osc1 = audioCtx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.value = 55;
      osc1.connect(gainNode);
      osc1.start();

      // Harmonic
      const osc2 = audioCtx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.value = 220;
      const osc2Gain = audioCtx.createGain();
      osc2Gain.gain.value = 0.04;
      osc2.connect(osc2Gain);
      osc2Gain.connect(gainNode);
      osc2.start();

      // Ghost whisper
      const osc3 = audioCtx.createOscillator();
      osc3.type = "sawtooth";
      osc3.frequency.value = 800;
      const osc3Gain = audioCtx.createGain();
      osc3Gain.gain.value = 0.02;
      osc3.connect(osc3Gain);
      osc3Gain.connect(gainNode);
      osc3.start();

      oscillators = [osc1, osc2, osc3];

      pollInterval = setInterval(async () => {
        try {
          const r = await fetch("/api/v1/ghost-emf/current");
          const d = await r.json();
          createSoundscape(d.numericValue ?? 0);
        } catch {}
      }, 2000);

      playing = true;
      btn.textContent = "Stop Listening";
      btn.classList.add("is-active");
    }

    function stop() {
      oscillators.forEach((o) => { try { o.stop(); } catch {} });
      if (lfo) try { lfo.stop(); } catch {}
      if (audioCtx) audioCtx.close();
      clearInterval(pollInterval);
      oscillators = [];
      audioCtx = null;
      playing = false;
      btn.textContent = "Listen to the Ghost";
      btn.classList.remove("is-active");
    }

    btn.addEventListener("click", () => playing ? stop() : start());
  }

  /* ═══════════════════════════════════════════════
     #4 — CONSPIRACY STRING BOARD
     Interactive evidence board with draggable red strings
     ═══════════════════════════════════════════════ */

  function initStringBoard() {
    const overlay = $("stringboard-overlay");
    if (!overlay) return;
    const canvas = overlay.querySelector(".stringboard-canvas");
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    let boardActive = false;
    let panX = 0, panY = 0, dragging = false, lastX = 0, lastY = 0;
    let zoom = 1;

    const nodes = [
      { id: "emf", label: "EMF Sensor", x: 400, y: 300, color: "#FF1744" },
      { id: "gondor", label: "4 GONDOR", x: 200, y: 150, color: "#7C3AED" },
      { id: "hobbits", label: "The Hobbits", x: 600, y: 150, color: "#7C3AED" },
      { id: "joker", label: "Joker Laughter", x: 100, y: 400, color: "#00E5FF" },
      { id: "porcine", label: "Porcine Directive", x: 700, y: 400, color: "#FF1744" },
      { id: "cern", label: "CERN Question", x: 300, y: 500, color: "#7AFFAE" },
      { id: "radiation", label: "WiFi Radiation", x: 500, y: 500, color: "#FF6D00" },
      { id: "exorcism", label: "Rejected Exorcism", x: 150, y: 300, color: "#7C3AED" },
      { id: "phs06", label: "PHS '06", x: 650, y: 300, color: "#00E5FF" },
      { id: "avatar", label: "Avatar Frame", x: 400, y: 100, color: "#FF1744" },
      { id: "666", label: "666 Rock", x: 250, y: 250, color: "#FF1744" },
      { id: "crop", label: "Crop Circle", x: 550, y: 250, color: "#7AFFAE" },
      { id: "dream", label: "Dream Burden", x: 450, y: 450, color: "#00E5FF" },
      { id: "crystal", label: "Crystal Theory", x: 350, y: 200, color: "#7AFFAE" },
    ];

    const connections = [
      ["emf", "radiation"], ["emf", "cern"], ["gondor", "hobbits"],
      ["joker", "avatar"], ["porcine", "emf"], ["porcine", "666"],
      ["exorcism", "avatar"], ["phs06", "avatar"], ["cern", "crystal"],
      ["dream", "emf"], ["crop", "cern"], ["gondor", "porcine"],
      ["666", "joker"], ["radiation", "phs06"], ["hobbits", "avatar"],
    ];

    function resize() {
      canvas.width = overlay.clientWidth;
      canvas.height = overlay.clientHeight;
      draw();
    }

    function draw() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(panX + w / 2, panY + h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-400, -300);

      // Draw strings
      connections.forEach(([a, b]) => {
        const na = nodes.find((n) => n.id === a);
        const nb = nodes.find((n) => n.id === b);
        if (!na || !nb) return;
        ctx.strokeStyle = "rgba(255, 23, 68, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        // Slight curve
        const mx = (na.x + nb.x) / 2 + (Math.random() - 0.5) * 20;
        const my = (na.y + nb.y) / 2 + (Math.random() - 0.5) * 20;
        ctx.quadraticCurveTo(mx, my, nb.x, nb.y);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw pushpins and labels
      nodes.forEach((node) => {
        // Pushpin
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pin highlight
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.beginPath();
        ctx.arc(node.x - 2, node.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = "#F0E6FF";
        ctx.font = "12px 'Fira Code', monospace";
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, node.y + 22);
      });

      ctx.restore();
    }

    canvas.addEventListener("mousedown", (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.style.cursor = "grabbing";
    });
    canvas.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      panX += e.clientX - lastX;
      panY += e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      draw();
    });
    canvas.addEventListener("mouseup", () => { dragging = false; canvas.style.cursor = "grab"; });
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      zoom = Math.max(0.5, Math.min(3, zoom - e.deltaY * 0.001));
      draw();
    }, { passive: false });

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-action='open-stringboard']")) {
        boardActive = true;
        overlay.classList.add("is-active");
        document.body.style.overflow = "hidden";
        resize();
        window.addEventListener("resize", resize);
      }
      if (e.target.closest("[data-action='close-stringboard']")) {
        boardActive = false;
        overlay.classList.remove("is-active");
        document.body.style.overflow = "";
        window.removeEventListener("resize", resize);
      }
    });
  }

  /* ═══════════════════════════════════════════════
     #5 — TIMELINE TIME MACHINE
     Scroll-driven parallax with wormhole portal effect
     ═══════════════════════════════════════════════ */

  function initTimeMachine() {
    const tlSection = document.querySelector("[data-testid='timeline-nav']");
    if (!tlSection) return;

    // Add portal effect on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const ratio = entry.intersectionRatio;
          entry.target.style.setProperty("--portal-progress", ratio.toFixed(2));
          if (ratio > 0.1) {
            entry.target.classList.add("tl-portal-active");
          } else {
            entry.target.classList.remove("tl-portal-active");
          }
        });
      },
      { threshold: Array.from({ length: 20 }, (_, i) => i / 20) }
    );

    // Observe each timeline card for parallax
    const cards = $$(".tl-card");
    cards.forEach((card) => observer.observe(card));

    // Scroll-driven warp on the timeline section itself
    if (CSS.supports("animation-timeline: scroll()")) {
      tlSection.style.setProperty("animation-timeline", "scroll()");
    }
  }

  /* ═══════════════════════════════════════════════
     #6 — AI DEBATE ARENA
     Two AI instances argue campaign positions live
     ═══════════════════════════════════════════════ */

  function initDebate() {
    const overlay = $("debate-overlay");
    if (!overlay) return;
    const topicBtns = overlay.querySelectorAll("[data-debate-topic]");
    const transcript = overlay.querySelector(".debate-transcript");
    const scoreA = overlay.querySelector(".debate-score-a");
    const scoreB = overlay.querySelector(".debate-score-b");
    let debateActive = false;
    let votes = { for: 0, against: 0 };

    async function startDebate(topic) {
      if (!transcript) return;
      transcript.innerHTML = "";
      votes = { for: 0, against: 0 };
      updateScores();

      const addMessage = (speaker, text, side) => {
        const msg = el("div", `debate-msg debate-${side}`);
        const label = el("span", "debate-speaker", speaker);
        const body = el("p", "debate-text", text);
        msg.append(label, body);
        transcript.appendChild(msg);
        transcript.scrollTop = transcript.scrollHeight;
      };

      addMessage("MODERATOR", `Tonight's topic: ${topic}. Signal AI argues FOR. Shadow AI argues AGAINST.`, "mod");

      try {
        const res = await fetch("/api/v1/debate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        });
        const data = await res.json();
        if (data.rounds) {
          for (const round of data.rounds) {
            await new Promise((r) => setTimeout(r, 1500));
            addMessage("SIGNAL AI", round.for, "for");
            await new Promise((r) => setTimeout(r, 1500));
            addMessage("SHADOW AI", round.against, "against");
          }
          addMessage("MODERATOR", "The debate concludes. Cast your vote below.", "mod");
        }
      } catch {
        addMessage("SYSTEM", "Debate API unavailable. The signal is disrupted.", "mod");
      }
    }

    function updateScores() {
      if (scoreA) scoreA.textContent = votes.for;
      if (scoreB) scoreB.textContent = votes.against;
    }

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-action='open-debate']")) {
        overlay.classList.add("is-active");
        document.body.style.overflow = "hidden";
        debateActive = true;
      }
      if (e.target.closest("[data-action='close-debate']")) {
        overlay.classList.remove("is-active");
        document.body.style.overflow = "";
        debateActive = false;
      }
      const topicBtn = e.target.closest("[data-debate-topic]");
      if (topicBtn && debateActive) {
        startDebate(topicBtn.dataset.debateTopic);
      }
      if (e.target.closest("[data-vote='for']")) {
        votes.for++;
        updateScores();
      }
      if (e.target.closest("[data-vote='against']")) {
        votes.against++;
        updateScores();
      }
    });
  }

  /* ═══════════════════════════════════════════════
     #7 — GHOST DETECTOR PWA
     Device magnetometer as local EMF detector
     ═══════════════════════════════════════════════ */

  function initGhostDetector() {
    const panel = $("ghost-detector");
    if (!panel) return;
    const localReading = panel.querySelector(".detector-local-value");
    const remoteReading = panel.querySelector(".detector-remote-value");
    const meterFill = panel.querySelector(".detector-meter-fill");
    const statusText = panel.querySelector(".detector-status");

    let sensorAvailable = false;

    // Try Magnetometer API
    if ("Magnetometer" in window) {
      try {
        const magnetometer = new Magnetometer({ frequency: 10 });
        magnetometer.addEventListener("reading", () => {
          const magnitude = Math.sqrt(magnetometer.x ** 2 + magnetometer.y ** 2 + magnetometer.z ** 2);
          const mG = magnitude * 10; // Tesla to milliGauss approximation
          if (localReading) localReading.textContent = mG.toFixed(2);
          if (meterFill) meterFill.style.width = Math.min(100, mG * 10) + "%";
          sensorAvailable = true;
        });
        magnetometer.addEventListener("error", () => {
          if (statusText) statusText.textContent = "Magnetometer permission denied";
        });
        magnetometer.start();
      } catch {
        if (statusText) statusText.textContent = "Magnetometer not available — showing remote sensor only";
      }
    } else if (window.DeviceOrientationEvent) {
      // Fallback: use device orientation compass as rough proxy
      window.addEventListener("deviceorientation", (e) => {
        if (e.alpha !== null) {
          const pseudo = Math.abs(e.alpha % 90) / 30;
          if (localReading) localReading.textContent = pseudo.toFixed(2);
          if (meterFill) meterFill.style.width = Math.min(100, pseudo * 20) + "%";
          sensorAvailable = true;
        }
      });
    } else {
      if (statusText) statusText.textContent = "No device sensors — showing remote sensor only";
    }

    // Poll remote sensor
    setInterval(async () => {
      try {
        const r = await fetch("/api/v1/ghost-emf/current");
        const d = await r.json();
        if (remoteReading) remoteReading.textContent = (d.numericValue ?? 0).toFixed(3);
      } catch {}
    }, 3000);
  }

  /* ═══════════════════════════════════════════════
     #8 — ENTROPY DICE CASINO
     Provably fair games powered by true EMF entropy
     ═══════════════════════════════════════════════ */

  function initCasino() {
    const overlay = $("casino-overlay");
    if (!overlay) return;
    const diceResult = overlay.querySelector(".casino-dice-result");
    const coinResult = overlay.querySelector(".casino-coin-result");
    const streakDisplay = overlay.querySelector(".casino-streak");
    const historyList = overlay.querySelector(".casino-history");
    let streak = 0;
    let lastResult = null;

    async function getEntropyNumber(max) {
      try {
        const r = await fetch("/api/v1/ghost-emf/entropy");
        const d = await r.json();
        // Use entropy bits to seed a pseudo-random selection
        const seed = d.entropyBits * 1000 + Date.now();
        return Math.floor((seed % max) + 1);
      } catch {
        return Math.floor(Math.random() * max) + 1;
      }
    }

    async function rollDice() {
      if (diceResult) diceResult.textContent = "...";
      diceResult?.classList.add("casino-rolling");
      const val = await getEntropyNumber(6);
      setTimeout(() => {
        const faces = ["", "\u2680", "\u2681", "\u2682", "\u2683", "\u2684", "\u2685"];
        if (diceResult) {
          diceResult.textContent = faces[val];
          diceResult.classList.remove("casino-rolling");
        }
        updateStreak("dice-" + val);
        addHistory(`Dice: ${val} ${faces[val]}`);
      }, 600);
    }

    async function flipCoin() {
      if (coinResult) coinResult.textContent = "...";
      coinResult?.classList.add("casino-flipping");
      const val = await getEntropyNumber(2);
      setTimeout(() => {
        const face = val === 1 ? "HEADS" : "TAILS";
        if (coinResult) {
          coinResult.textContent = face;
          coinResult.classList.remove("casino-flipping");
        }
        updateStreak("coin-" + face);
        addHistory(`Coin: ${face}`);
      }, 500);
    }

    function updateStreak(result) {
      if (result === lastResult) {
        streak++;
      } else {
        streak = 1;
        lastResult = result;
      }
      if (streakDisplay) {
        streakDisplay.textContent = streak > 1 ? `${streak}x streak!` : "";
        if (streak >= 5) streakDisplay.classList.add("casino-hot-streak");
        else streakDisplay.classList.remove("casino-hot-streak");
      }
    }

    function addHistory(text) {
      if (!historyList) return;
      const item = el("div", "casino-history-item", text);
      historyList.prepend(item);
      if (historyList.children.length > 20) historyList.lastChild.remove();
    }

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-action='open-casino']")) {
        overlay.classList.add("is-active");
        document.body.style.overflow = "hidden";
      }
      if (e.target.closest("[data-action='close-casino']")) {
        overlay.classList.remove("is-active");
        document.body.style.overflow = "";
      }
      if (e.target.closest("[data-action='roll-dice']")) rollDice();
      if (e.target.closest("[data-action='flip-coin']")) flipCoin();
    });
  }

  /* ═══════════════════════════════════════════════
     #9 — MUD CAMPAIGN HQ
     Text adventure exploring the campaign as a game
     ═══════════════════════════════════════════════ */

  function initCampaignHQ() {
    const overlay = $("campaign-hq-overlay");
    if (!overlay) return;
    const output = overlay.querySelector(".hq-output");
    const input = overlay.querySelector(".hq-input");
    if (!output || !input) return;

    const rooms = {
      lobby: {
        desc: "You stand in the lobby of the Ghost Signal Campaign Headquarters. A giant EMF sensor hums on the wall. Doors lead NORTH to the War Room, EAST to the Entropy Lab, and SOUTH to the Hotline Center.",
        exits: { north: "warroom", east: "lab", south: "hotline" },
        items: ["campaign poster", "ghost sensor readings"],
      },
      warroom: {
        desc: "The War Room. Screens display live EMF data, conspiracy string boards, and a countdown to Election Day 2028. A portrait of Tom Greene hangs above the motto: 'I want to throw the Piggy.' Exits: SOUTH to Lobby, EAST to Dossier Vault.",
        exits: { south: "lobby", east: "vault" },
        items: ["federal reserve abolition plan", "UBI whitepaper"],
      },
      lab: {
        desc: "The Entropy Lab. A GQ EMF-390 sensor sits in a Faraday cage, generating true random numbers from electromagnetic fluctuations. Monitors show real-time entropy calculations. A sign reads: 'No algorithm can fake this.' Exit: WEST to Lobby.",
        exits: { west: "lobby" },
        items: ["entropy crystal", "iron washer"],
      },
      hotline: {
        desc: "The Hotline Center. Phones ring with transmissions from across the country. A recording plays: 'Everything you say is recorded, transcribed, and published.' Exit: NORTH to Lobby, EAST to Memorial.",
        exits: { north: "lobby", east: "memorial" },
        items: ["phone transcripts", "666 sticker"],
      },
      vault: {
        desc: "The Dossier Vault. Filing cabinets labeled: 4 GONDOR, Crop Circle, Dream Burden, PHS '06, Celestial Hallucinations. Red string connects them all. A single overhead bulb swings. Exit: WEST to War Room.",
        exits: { west: "warroom" },
        items: ["classified dossier", "red string"],
      },
      memorial: {
        desc: "A quiet memorial room. Gravestones for relationships that didn't survive the signal. A candle flickers. 'RIP Friends & Family' is etched into a stone tablet. Exit: WEST to Hotline Center.",
        exits: { west: "hotline" },
        items: ["memorial candle", "old photograph"],
      },
    };

    let currentRoom = "lobby";
    let inventory = [];

    function print(text, cls = "") {
      const line = el("div", "hq-line " + cls, text);
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    }

    function look() {
      const room = rooms[currentRoom];
      print(room.desc, "hq-desc");
      if (room.items.length > 0) {
        print("You see: " + room.items.join(", "), "hq-items");
      }
    }

    function processCommand(cmd) {
      const parts = cmd.toLowerCase().trim().split(/\s+/);
      const verb = parts[0];
      const noun = parts.slice(1).join(" ");

      print(`> ${cmd}`, "hq-input-echo");

      if (["n", "north", "s", "south", "e", "east", "w", "west"].includes(verb)) {
        const dirMap = { n: "north", s: "south", e: "east", w: "west" };
        const dir = dirMap[verb] || verb;
        const room = rooms[currentRoom];
        if (room.exits[dir]) {
          currentRoom = room.exits[dir];
          print("---");
          look();
        } else {
          print("You can't go that way.");
        }
      } else if (verb === "look" || verb === "l") {
        look();
      } else if (verb === "take" || verb === "get") {
        const room = rooms[currentRoom];
        const idx = room.items.findIndex((i) => i.toLowerCase().includes(noun));
        if (idx >= 0) {
          const item = room.items.splice(idx, 1)[0];
          inventory.push(item);
          print(`You take the ${item}.`);
        } else {
          print("You don't see that here.");
        }
      } else if (verb === "inventory" || verb === "i") {
        print(inventory.length ? "Carrying: " + inventory.join(", ") : "Your hands are empty.");
      } else if (verb === "help") {
        print("Commands: look, north/south/east/west (or n/s/e/w), take [item], inventory, help");
      } else {
        print("The signal doesn't understand that. Try 'help'.");
      }
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value.trim()) {
        processCommand(input.value.trim());
        input.value = "";
      }
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-action='open-campaign-hq']")) {
        overlay.classList.add("is-active");
        document.body.style.overflow = "hidden";
        output.innerHTML = "";
        currentRoom = "lobby";
        inventory = [];
        print("=== GHOST SIGNAL CAMPAIGN HQ ===", "hq-title");
        print("A text adventure through the campaign. Type 'help' for commands.", "hq-subtitle");
        print("---");
        look();
        input.focus();
      }
      if (e.target.closest("[data-action='close-campaign-hq']")) {
        overlay.classList.remove("is-active");
        document.body.style.overflow = "";
      }
    });
  }

  /* ═══════════════════════════════════════════════
     #10 — DOSSIER CARD SHUFFLE
     Tinder-style swipe interface for evidence cards
     ═══════════════════════════════════════════════ */

  function initCardShuffle() {
    const overlay = $("shuffle-overlay");
    if (!overlay) return;
    const deck = overlay.querySelector(".shuffle-deck");
    const scoreEl = overlay.querySelector(".shuffle-score");
    const countEl = overlay.querySelector(".shuffle-count");
    const resultEl = overlay.querySelector(".shuffle-result");
    if (!deck) return;

    const cards = [
      { title: "4 GONDOR", body: "Lord of the Rings license plate spotted across state lines.", severity: 5 },
      { title: "The Crop Circle", body: "Found hiking in an unusual direction with a friend who got a royal flush.", severity: 5 },
      { title: "Dream Burden", body: "Bizarre dreams. A shaggy ghost dog. Unsettling physical sensations.", severity: 4 },
      { title: "The CERN Question", body: "A scientist headed to CERN described teleportation as already possible.", severity: 5 },
      { title: "Joker Laughter", body: "Chaotic, theatrical, spiritually charged cackling in a white chariot.", severity: 5 },
      { title: "Porcine Directive", body: "He broke D.C.'s Porcine Directive — and the haunting started.", severity: 5 },
      { title: "The Volume Hack", body: "A hacker remotely adjusting the computer's volume. Nobody else in the room.", severity: 4 },
      { title: "WiFi Radiation", body: "WiFi SSID renamed to 'Radiation TDR' — related to research at Rutgers.", severity: 5 },
      { title: "PHS '06", body: "The ghost spoke: 'Parsippany High School. 06.' The haunting has a yearbook.", severity: 5 },
      { title: "Rejected Exorcism", body: "Multiple priests rejected the exorcism. All of them were scared.", severity: 4 },
      { title: "Crystal Theory", body: "Crystalline consciousness — willing to break down perception itself.", severity: 3 },
      { title: "Celestial Hallucinations", body: "God erased everything with infinite hallucinations into the next dimension.", severity: 5 },
      { title: "Avatar Frame", body: "Angel, prophet, god, demon. Graceful until you mention it. Then brutal.", severity: 5 },
      { title: "666 Rock", body: "666 spray painted at a scenic lake. Scrubbed clean. Washington next.", severity: 5 },
    ];

    let currentIndex = 0;
    let believe = 0;
    let total = 0;

    function renderCard() {
      if (currentIndex >= cards.length) {
        showResult();
        return;
      }
      deck.innerHTML = "";
      const card = cards[currentIndex];
      const cardEl = el("div", "shuffle-card");
      cardEl.innerHTML = `
        <span class="shuffle-label">EVIDENCE #${currentIndex + 1}</span>
        <h3 class="shuffle-title">${card.title}</h3>
        <p class="shuffle-body">${card.body}</p>
        <div class="shuffle-severity">${"\u2588".repeat(card.severity)}</div>
        <div class="shuffle-actions">
          <button class="shuffle-btn shuffle-doubt" data-action="shuffle-left">Prove It</button>
          <button class="shuffle-btn shuffle-believe" data-action="shuffle-right">I Believe</button>
        </div>
      `;
      deck.appendChild(cardEl);
      if (countEl) countEl.textContent = `${currentIndex + 1} / ${cards.length}`;
    }

    function showResult() {
      const pct = Math.round((believe / cards.length) * 100);
      let tier, desc;
      if (pct >= 80) { tier = "TRUE BELIEVER"; desc = "You see the pattern. The signal chose well."; }
      else if (pct >= 50) { tier = "OPEN MIND"; desc = "Skeptical but curious. The signal respects that."; }
      else if (pct >= 20) { tier = "HARD SKEPTIC"; desc = "You need more proof. Fair. Check the EMF data."; }
      else { tier = "TOTAL DENIER"; desc = "You reject the evidence. The ghost notes your position."; }

      deck.innerHTML = "";
      if (resultEl) {
        resultEl.innerHTML = `
          <div class="shuffle-result-card">
            <span class="shuffle-result-tier">${tier}</span>
            <p class="shuffle-result-score">${pct}% belief compatibility</p>
            <p class="shuffle-result-desc">${desc}</p>
            <p class="shuffle-result-share">Share your result: ghost.megabyte.space/belief/${pct}</p>
          </div>
        `;
      }
    }

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-action='open-shuffle']")) {
        overlay.classList.add("is-active");
        document.body.style.overflow = "hidden";
        currentIndex = 0;
        believe = 0;
        total = 0;
        if (resultEl) resultEl.innerHTML = "";
        renderCard();
      }
      if (e.target.closest("[data-action='close-shuffle']")) {
        overlay.classList.remove("is-active");
        document.body.style.overflow = "";
      }
      if (e.target.closest("[data-action='shuffle-right']")) {
        believe++;
        currentIndex++;
        renderCard();
      }
      if (e.target.closest("[data-action='shuffle-left']")) {
        currentIndex++;
        renderCard();
      }
    });
  }

  /* ═══════════════════════════════════════════════
     #11 — LIVE CALL TRANSCRIPT THEATER
     Real-time typing animation of incoming calls
     ═══════════════════════════════════════════════ */

  function initTranscriptTheater() {
    const theater = $("transcript-theater");
    if (!theater) return;
    const display = theater.querySelector(".theater-display");
    const statusEl = theater.querySelector(".theater-status");
    if (!display) return;

    let lastId = null;
    let typing = false;

    async function pollTranscripts() {
      try {
        const r = await fetch("/api/v1/transmissions/live?limit=1");
        const data = await r.json();
        if (data.entries?.length > 0) {
          const latest = data.entries[0];
          if (latest.id !== lastId && !typing) {
            lastId = latest.id;
            await typeText(latest);
          }
        }
      } catch {}
    }

    async function typeText(entry) {
      typing = true;
      if (statusEl) statusEl.textContent = "LIVE TRANSMISSION INCOMING...";
      display.innerHTML = "";

      const header = el("div", "theater-header");
      header.textContent = `${entry.source === "call" ? "CALL" : "CHAT"} — ${new Date(entry.created_at).toLocaleTimeString()}`;
      display.appendChild(header);

      const textEl = el("div", "theater-text");
      display.appendChild(textEl);

      const text = entry.transcript || entry.message || "...";
      for (let i = 0; i < text.length; i++) {
        textEl.textContent += text[i];
        display.scrollTop = display.scrollHeight;
        await new Promise((r) => setTimeout(r, 30 + Math.random() * 50));
      }

      if (statusEl) statusEl.textContent = "TRANSMISSION COMPLETE";
      typing = false;
    }

    setInterval(pollTranscripts, 8000);
    pollTranscripts();
  }

  /* ═══════════════════════════════════════════════
     #12 — GLITCH ART GENERATOR
     Upload a photo, haunt it with EMF-seeded glitches
     ═══════════════════════════════════════════════ */

  function initGlitchArt() {
    const overlay = $("glitch-overlay");
    if (!overlay) return;
    const fileInput = overlay.querySelector(".glitch-file-input");
    const canvas = overlay.querySelector(".glitch-canvas");
    const ctx = canvas?.getContext("2d");
    const intensitySlider = overlay.querySelector(".glitch-intensity");
    const downloadBtn = overlay.querySelector("[data-action='download-glitch']");
    if (!ctx || !fileInput) return;

    let sourceImage = null;
    let emfSeed = 0;

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          sourceImage = img;
          canvas.width = Math.min(800, img.width);
          canvas.height = Math.min(600, (img.height / img.width) * canvas.width);
          applyGlitch();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    async function fetchEMFSeed() {
      try {
        const r = await fetch("/api/v1/ghost-emf/current");
        const d = await r.json();
        emfSeed = d.numericValue ?? 0;
      } catch { emfSeed = Math.random() * 5; }
    }

    function applyGlitch() {
      if (!sourceImage || !ctx) return;
      const w = canvas.width, h = canvas.height;
      const intensity = intensitySlider ? parseFloat(intensitySlider.value) : 0.5;
      const glitchLevel = intensity * (1 + emfSeed);

      // Draw base image
      ctx.drawImage(sourceImage, 0, 0, w, h);

      // Get pixel data
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // Channel shift
      const shift = Math.floor(glitchLevel * 15);
      for (let y = 0; y < h; y++) {
        if (Math.random() < glitchLevel * 0.3) {
          const sliceHeight = 1 + Math.floor(Math.random() * 5 * glitchLevel);
          for (let sy = 0; sy < sliceHeight && y + sy < h; sy++) {
            for (let x = 0; x < w; x++) {
              const i = ((y + sy) * w + x) * 4;
              const shiftedI = ((y + sy) * w + Math.min(w - 1, x + shift)) * 4;
              data[i] = data[shiftedI]; // Red channel shift
            }
          }
          y += sliceHeight;
        }
      }

      // Scanline corruption
      for (let y = 0; y < h; y++) {
        if (Math.random() < glitchLevel * 0.1) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            data[i] = 255; // Red flash
            data[i + 1] = Math.floor(data[i + 1] * 0.3);
            data[i + 2] = Math.floor(data[i + 2] * 0.3);
          }
        }
      }

      // Block corruption
      const blocks = Math.floor(glitchLevel * 5);
      for (let b = 0; b < blocks; b++) {
        const bx = Math.floor(Math.random() * w);
        const by = Math.floor(Math.random() * h);
        const bw = 20 + Math.floor(Math.random() * 60 * glitchLevel);
        const bh = 5 + Math.floor(Math.random() * 20 * glitchLevel);
        for (let y = by; y < by + bh && y < h; y++) {
          for (let x = bx; x < bx + bw && x < w; x++) {
            const i = (y * w + x) * 4;
            data[i] = (data[i] + 128) % 256;
            data[i + 1] = (data[i + 1] + 64) % 256;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Ghost watermark
      ctx.fillStyle = "rgba(255, 23, 68, 0.3)";
      ctx.font = "10px 'Fira Code', monospace";
      ctx.fillText(`ghost.megabyte.space // EMF: ${emfSeed.toFixed(3)}`, 10, h - 10);
    }

    intensitySlider?.addEventListener("input", () => applyGlitch());

    downloadBtn?.addEventListener("click", () => {
      const link = document.createElement("a");
      link.download = "ghost-glitch.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-action='open-glitch']")) {
        overlay.classList.add("is-active");
        document.body.style.overflow = "hidden";
        fetchEMFSeed();
      }
      if (e.target.closest("[data-action='close-glitch']")) {
        overlay.classList.remove("is-active");
        document.body.style.overflow = "";
      }
      if (e.target.closest("[data-action='reglitch']")) {
        fetchEMFSeed().then(() => applyGlitch());
      }
    });
  }

  /* ═══════════════════════════════════════════════
     #13 — ELECTION NIGHT SIMULATOR
     Interactive electoral map with ghost activity
     ═══════════════════════════════════════════════ */

  function initElectionMap() {
    const overlay = $("election-overlay");
    if (!overlay) return;
    const mapContainer = overlay.querySelector(".election-map");
    const infoPanel = overlay.querySelector(".election-info");
    const voteCounter = overlay.querySelector(".election-votes");
    if (!mapContainer) return;

    const states = [
      { abbr: "NJ", name: "New Jersey", ev: 14, relevance: "Campaign HQ. Morristown — Washington's second winter encampment. Ground zero.", x: 82, y: 35 },
      { abbr: "NY", name: "New York", ev: 28, relevance: "Church of God cult meeting. 4 GONDOR spotted en route.", x: 80, y: 28 },
      { abbr: "PA", name: "Pennsylvania", ev: 19, relevance: "4 GONDOR — Pennsylvania plate on a Kia Stinger.", x: 76, y: 35 },
      { abbr: "MA", name: "Massachusetts", ev: 11, relevance: "Cousin first mentioned 4 GONDOR. Family signal hub.", x: 88, y: 26 },
      { abbr: "DC", name: "Washington D.C.", ev: 3, relevance: "The Porcine Directive. The Federal Reserve. The target.", x: 78, y: 40 },
      { abbr: "CA", name: "California", ev: 54, relevance: "Tech capital. AI-augmented Presidency starts here.", x: 12, y: 40 },
      { abbr: "TX", name: "Texas", ev: 40, relevance: "Energy independence. Fed opposition stronghold.", x: 40, y: 60 },
      { abbr: "FL", name: "Florida", ev: 30, relevance: "Swing state. UBI resonance highest here.", x: 75, y: 68 },
      { abbr: "OH", name: "Ohio", ev: 17, relevance: "Rust belt. Workers against the Fed.", x: 70, y: 38 },
      { abbr: "MS", name: "Mississippi", ev: 6, relevance: "601 area code. The hotline's home state.", x: 58, y: 58 },
      { abbr: "IL", name: "Illinois", ev: 19, relevance: "Lincoln's state. Entropy meets politics.", x: 58, y: 36 },
      { abbr: "GA", name: "Georgia", ev: 16, relevance: "Swing state. Digital infrastructure hub.", x: 70, y: 55 },
    ];

    let totalVotes = 0;
    let ghostActivity = {};

    function renderMap() {
      mapContainer.innerHTML = "";
      states.forEach((s) => {
        const dot = el("button", "election-state");
        dot.style.left = s.x + "%";
        dot.style.top = s.y + "%";
        dot.textContent = s.abbr;
        dot.title = s.name;
        const ghost = ghostActivity[s.abbr] || 0;
        dot.style.setProperty("--ghost-intensity", Math.min(1, ghost / 5));
        dot.addEventListener("click", () => {
          if (infoPanel) {
            infoPanel.innerHTML = `
              <h4>${s.name} (${s.ev} electoral votes)</h4>
              <p>${s.relevance}</p>
              <p class="election-ghost-level">Ghost activity: ${ghost.toFixed(1)} mG</p>
            `;
          }
          totalVotes += s.ev;
          if (voteCounter) voteCounter.textContent = `${totalVotes} / 270`;
        });
        mapContainer.appendChild(dot);
      });
    }

    async function fetchGhostActivity() {
      try {
        const r = await fetch("/api/v1/ghost-emf/current");
        const d = await r.json();
        const base = d.numericValue ?? 0;
        states.forEach((s) => {
          ghostActivity[s.abbr] = base + (Math.random() - 0.5) * 2;
        });
        renderMap();
      } catch {}
    }

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-action='open-election']")) {
        overlay.classList.add("is-active");
        document.body.style.overflow = "hidden";
        totalVotes = 0;
        if (voteCounter) voteCounter.textContent = "0 / 270";
        fetchGhostActivity();
      }
      if (e.target.closest("[data-action='close-election']")) {
        overlay.classList.remove("is-active");
        document.body.style.overflow = "";
      }
    });
  }

  /* ═══════════════════════════════════════════════
     #14 — SCROLL-DRIVEN POSSESSION SEQUENCE
     Headshot morphs through angel/prophet/god/demon
     ═══════════════════════════════════════════════ */

  function initPossessionSequence() {
    const headshot = document.querySelector(".candidate-headshot");
    if (!headshot) return;

    // Track scroll progress across the full page
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollPct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);

        // Phase 1: Angel (0-25%) — soft glow
        // Phase 2: Prophet (25-50%) — golden tint
        // Phase 3: God (50-75%) — radiant white
        // Phase 4: Demon (75-100%) — red distortion
        let hue, saturate, brightness, glow, shadow;

        if (scrollPct < 0.25) {
          const t = scrollPct / 0.25;
          hue = 0;
          saturate = 1;
          brightness = 1 + t * 0.3;
          glow = `0 0 ${20 + t * 40}px rgba(124, 58, 237, ${0.3 + t * 0.4})`;
          shadow = "angel";
        } else if (scrollPct < 0.5) {
          const t = (scrollPct - 0.25) / 0.25;
          hue = t * 30;
          saturate = 1.2;
          brightness = 1.3 - t * 0.1;
          glow = `0 0 ${40 + t * 30}px rgba(255, 215, 0, ${0.3 + t * 0.3})`;
          shadow = "prophet";
        } else if (scrollPct < 0.75) {
          const t = (scrollPct - 0.5) / 0.25;
          hue = 30 - t * 30;
          saturate = 0.5 + t * 0.5;
          brightness = 1.2 + t * 0.5;
          glow = `0 0 ${60 + t * 40}px rgba(255, 255, 255, ${0.4 + t * 0.3})`;
          shadow = "god";
        } else {
          const t = (scrollPct - 0.75) / 0.25;
          hue = -20 * t;
          saturate = 1.5 + t * 1;
          brightness = 1.7 - t * 0.7;
          glow = `0 0 ${80 + t * 40}px rgba(255, 23, 68, ${0.5 + t * 0.4})`;
          shadow = "demon";
        }

        headshot.style.filter = `hue-rotate(${hue}deg) saturate(${saturate}) brightness(${brightness})`;
        headshot.style.boxShadow = glow;
        headshot.dataset.phase = shadow;

        // At 100% scroll, invert the page briefly
        if (scrollPct > 0.98) {
          document.body.classList.add("possession-complete");
        } else {
          document.body.classList.remove("possession-complete");
        }

        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ═══════════════════════════════════════════════
     INIT ALL
     ═══════════════════════════════════════════════ */

  function init() {
    initSeance();
    initOuija();
    initSonification();
    initStringBoard();
    initTimeMachine();
    initDebate();
    initGhostDetector();
    initCasino();
    initCampaignHQ();
    initCardShuffle();
    initTranscriptTheater();
    initGlitchArt();
    initElectionMap();
    initPossessionSequence();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", GhostFeatures.init);
