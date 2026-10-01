(() => {
  const { CATS, convert } = window.UNITSMITH;
  const $ = id => document.getElementById(id);
  const LS = "unitsmith.v1";
  const saved = JSON.parse(localStorage.getItem(LS) || "{}");
  const st = Object.assign({ cat: "length", from: "Miles", to: "Bananas", silly: true, sound: true, hist: [], pairs: {} }, saved);
  const save = () => localStorage.setItem(LS, JSON.stringify(st));

  const TAGS = ["Precision conversions, hand-forged.", "Serious math. Unserious units.", "Now with 100% more giraffes.",
    "Certified by absolutely no one.", "Hammering numbers into shape.", "Your bananas, our expertise."];
  $("tag").textContent = TAGS[Math.floor(Math.random() * TAGS.length)];

  const QUIPS = {
    length: ["Measure twice, convert once.", "No rulers were harmed.", "The inch has been exactly 25.4 mm since 1959."],
    mass: ["Weighed on our finest anvil-certified scale.", "Since 2019 the kilogram is defined by Planck's constant, not a metal lump in France."],
    time: ["Time flies like an arrow. Fruit flies like a banana.", "A second = 9,192,631,770 cesium-133 oscillations. We counted."],
    area: ["An acre was once what oxen could plow in a day. The oxen were not consulted."],
    volume: ["A US gallon is exactly 231 cubic inches.", "An imperial pint is ~20% bigger than a US pint. Choose your pub wisely."],
    speed: ["The speed of light is exactly 299,792,458 m/s — by definition, no speeding tickets.", "Vroom, scientifically."],
    energy: ["A food Calorie is 1,000 calories. Nutrition labels: playing it cool.", "Energy can't be created or destroyed. Only converted. By us."],
    power: ["James Watt invented horsepower to sell steam engines. Marketing has always been like this."],
    pressure: ["You're carrying ~14.7 psi of air on every square inch. Stay strong."],
    data: ["A kB is 1,000 bytes; a KiB is 1,024. Drive makers have a favorite.", "Please do not attempt to load the Library of Congress onto floppies."],
    angle: ["A full circle is 2π radians, or one 'why didn't we just use turns?'"],
    freq: ["Hertz proved radio waves exist — then reportedly said they had no practical use."],
    force: ["1 newton ≈ the weight of a small apple. Isaac would approve."],
    fuel: ["mpg: higher is better. L/100 km: lower is better. Chaos is free."]
  };

  /* ---------- formatting ---------- */
  const SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
  function fmt(x) {
    if (x === null || Number.isNaN(x)) return "—";
    if (!Number.isFinite(x)) return "∞ (the forge melted)";
    if (x === 0) return "0";
    const a = Math.abs(x);
    if (a >= 1e12 || a < 1e-6) {
      const [m, e] = x.toExponential(4).split("e");
      return parseFloat(m) + " × 10" + String(parseInt(e)).split("").map(c => SUP[c]).join("");
    }
    const sig = Number(x.toPrecision(9));
    const dec = a >= 1000 ? 2 : a >= 1 ? 6 : 9;
    return sig.toLocaleString("en-US", { maximumFractionDigits: dec });
  }

  const fmtS = x => (Number.isFinite(x) && x !== 0 && Math.abs(x) < 1e12 && Math.abs(x) >= 1e-6) ? Number(x.toPrecision(3)).toLocaleString("en-US", { maximumFractionDigits: 8 }) : fmt(x);

  /* ---------- sound (synthesized, offline) ---------- */
  let ac;
  const A = () => { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); return ac; };
  function env(g, t, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function tone(f, type, dur, vol, when = 0, slideTo) {
    const a = A(), t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    env(g, t, vol, dur); o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, type, f1, f2) {
    const a = A(), t = a.currentTime, b = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
    s.buffer = b; fl.type = type; fl.frequency.setValueAtTime(f1, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, vol, dur); s.connect(fl).connect(g).connect(a.destination); s.start(t);
  }
  const SFX = {
    clang() { [523, 1187, 1795, 2650, 3410].forEach((f, i) => tone(f * (0.98 + Math.random() * 0.04), "sine", 1.3 / (1 + i * 0.5), 0.28 / (i + 1))); noise(0.06, 0.35, "highpass", 2500); },
    tick() { tone(1400, "triangle", 0.05, 0.08); },
    whoosh() { noise(0.35, 0.25, "bandpass", 300, 3500); tone(300, "sine", 0.3, 0.06, 0, 900); },
    boing() { tone(180, "sine", 0.45, 0.25, 0, 620); tone(620, "sine", 0.25, 0.12, 0.2, 260); },
    ahem() { tone(140, "sawtooth", 0.18, 0.06); tone(110, "sawtooth", 0.22, 0.06, 0.18); },
    chime() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, "triangle", 0.5, 0.12, i * 0.08)); },
    sizzle() { noise(0.5, 0.12, "highpass", 5000, 2000); }
  };
  const play = n => { if (st.sound) try { SFX[n](); } catch (e) {} };

  /* ---------- visual fx ---------- */
  const cv = $("fx"), cx = cv.getContext("2d"); let parts = [], running = false;
  function size() { const r = devicePixelRatio || 1; cv.width = innerWidth * r; cv.height = innerHeight * r; cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px"; cx.setTransform(r, 0, 0, r, 0, 0); }
  size(); addEventListener("resize", size);
  function sparks(x, y, n = 70) {
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4, sp = 3 + Math.random() * 9;
      parts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, decay: 0.012 + Math.random() * 0.02, s: 1 + Math.random() * 2.5 });
    }
    if (!running) { running = true; requestAnimationFrame(loop); }
  }
  function loop() {
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => p.life > 0);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.28; p.vx *= 0.985; p.life -= p.decay;
      const c = p.life > 0.6 ? "255,240,200" : p.life > 0.3 ? "255,170,60" : "255,90,20";
      cx.strokeStyle = `rgba(${c},${Math.max(p.life, 0)})`; cx.lineWidth = p.s; cx.lineCap = "round";
      cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(p.x - p.vx * 1.8, p.y - p.vy * 1.8); cx.stroke();
    }
    if (parts.length) requestAnimationFrame(loop); else { running = false; cx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  function flash() { const f = $("flash"); f.classList.remove("go"); void f.offsetWidth; f.classList.add("go"); }
  function shake(el) { el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }
  function rain(emoji, n = 18) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement("div"); s.className = "rain"; s.textContent = emoji;
      s.style.left = Math.random() * 100 + "vw"; s.style.animationDuration = 1.6 + Math.random() * 1.6 + "s";
      s.style.animationDelay = Math.random() * 0.6 + "s"; s.style.fontSize = 20 + Math.random() * 22 + "px";
      document.body.appendChild(s); setTimeout(() => s.remove(), 4000);
    }
  }
  let tt; function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2400); }

  /* ---------- state helpers ---------- */
  const cat = () => CATS.find(c => c.id === st.cat);
  const vis = c => c.units.filter(u => st.silly || !u.x);
  const unit = (c, n) => c.units.find(u => u.n === n);
  function ensureUnits() {
    const c = cat(), v = vis(c);
    if (!v.find(u => u.n === st.from)) st.from = v[0].n;
    if (!v.find(u => u.n === st.to)) st.to = (v.find(u => u.n !== st.from) || v[0]).n;
  }
  function getVal() { const s = $("val").value.replace(/,/g, "").trim(); if (s === "" || s === "-" || s === ".") return NaN; return Number(s); }

  /* ---------- render ---------- */
  function renderChips() {
    $("chips").innerHTML = CATS.map(c => `<button class="chip ${c.id === st.cat ? "sel" : ""}" data-c="${c.id}">${c.icon} ${c.name}</button>`).join("");
    const s = $("chips").querySelector(".sel"); if (s) s.scrollIntoView({ inline: "center", block: "nearest" });
  }
  const ubtn = u => `<span class="em">${u.x ? u.s : "🔩"}</span><span class="nm">${u.n}${u.x ? '<span class="approx">≈</span>' : ""}</span><span class="ch">${u.x ? "" : u.s} ▾</span>`;

  function tempQuip(c) {
    if (c < -273.15) return "Below absolute zero. Physics has filed a formal complaint.";
    if (Math.abs(c + 40) < 0.01) return "−40: the one temperature where °C and °F finally agree.";
    if (c < -20) return "Chicago in January. Bring every coat you own.";
    if (c <= 0) return "Water: solid. Mood: also solid.";
    if (c >= 36 && c <= 38) return "Human body temperature. Hi, human. 👋";
    if (c >= 99.5 && c <= 100.5) return "Water is boiling. So is the forge.";
    if (c >= 1200 && c <= 1600) return "Forge temperature! Steel is glowing. You're speaking our language.";
    if (c >= 5000) return "Roughly the surface of the Sun. Sunscreen will not help.";
    if (c > 40) return "Hot. Like, actually hot.";
    return "A perfectly reasonable temperature. Carry on.";
  }
  function egg(v, from) {
    if (v === 42) return ["The Answer to Life, the Universe, and Everything. Units unspecified.", "🌌"];
    if (v === 88 && from.s === "mph") return ["Great Scott! You're going to see some serious stuff.", "⚡"];
    if (v === 1.21 && from.s === "GW") return ["1.21 gigawatts?! Great Scott!", "⚡"];
    if (v === 9001) return ["It's over 9,000!!!", "💥"];
    if (v === 404) return ["Unit not found. Just kidding, we found it.", "🔍"];
    if (Math.abs(v - Math.PI) < 0.0005) return ["Mmm, pi. Mathematically delicious.", "🥧"];
    if (v === 69) return ["Nice.", "😎"];
    return null;
  }

  let lastResult = NaN;
  function compute(silent) {
    ensureUnits();
    const c = cat(), f = unit(c, st.from), t = unit(c, st.to), v = getVal();
    $("fromBtn").innerHTML = ubtn(f); $("toBtn").innerHTML = ubtn(t);
    const r = Number.isNaN(v) ? NaN : convert(v, f, t);
    lastResult = r;
    $("out").innerHTML = (t.x || f.x ? "≈ " : "") + fmt(r) + ` <span style="font-size:16px;color:var(--steel)">${t.x ? t.s : t.s}</span>`;
    $("note").textContent = t.note || f.note || "";
    let q = "";
    const e = Number.isNaN(v) ? null : egg(v, f);
    if (e) q = e[0];
    else if (c.id === "temp" && !Number.isNaN(v)) q = tempQuip(f.to(v));
    else if (!Number.isNaN(v) && st.silly) {
      const pool = c.units.filter(u => u.x && u.n !== t.n && u.n !== f.n);
      if (pool.length) {
        const p = pool[Math.abs(Math.floor(v * 7 + c.units.indexOf(t) * 3)) % pool.length];
        q = `For scale: that's about ${fmtS(convert(v, f, p))} ${p.n.toLowerCase()} ${p.s}`;
      }
    } else q = (QUIPS[c.id] || [""])[0];
    $("quip").textContent = q;
    renderAll(v, f);
    if (!silent && e) { rain(e[1], 14); play("chime"); }
    st.pairs[st.cat] = [st.from, st.to]; save();
  }

  function renderAll(v, f) {
    const c = cat();
    if (Number.isNaN(v)) { $("all").innerHTML = `<div class="empty">Type a number. The anvil awaits.</div>`; return; }
    $("all").innerHTML = vis(c).filter(u => u.n !== f.n).map(u =>
      `<button class="row ${u.n === st.to ? "cur" : ""}" style="width:100%;text-align:left" data-u="${u.n}"><span class="em">${u.x ? u.s : "🔩"}</span><span class="nm">${u.n}${u.x ? " ≈" : ""}</span><span class="v">${fmt(convert(v, f, u))} ${u.x ? "" : u.s}</span></button>`
    ).join("");
  }

  function renderHist() {
    $("hist").innerHTML = st.hist.length ? st.hist.map((h, i) =>
      `<button class="row" style="width:100%;text-align:left" data-h="${i}"><span class="em">${(CATS.find(c => c.id === h.c) || {}).icon || "⚒️"}</span><span class="nm">${h.txt}</span></button>`).join("")
      : `<div class="empty">Nothing forged yet. Smash that FORGE button.</div>`;
  }
  function addHist() {
    const v = getVal(); if (Number.isNaN(v)) return;
    const txt = `${fmt(v)} ${st.from} → ${fmt(lastResult)} ${st.to}`;
    if (st.hist[0] && st.hist[0].txt === txt) return;
    st.hist.unshift({ c: st.cat, from: st.from, to: st.to, v: $("val").value, txt });
    st.hist = st.hist.slice(0, 15); save(); renderHist();
  }

  /* ---------- picker ---------- */
  let picking = null;
  function openPicker(which) {
    picking = which; $("search").value = ""; drawPicker(); $("sheet").classList.add("open"); play("tick");
  }
  function drawPicker() {
    const q = $("search").value.trim().toLowerCase(), c = cat(), sel = picking === "from" ? st.from : st.to;
    const m = u => !q || u.n.toLowerCase().includes(q) || u.s.toLowerCase().includes(q);
    const row = u => `<button class="pitem ${u.n === sel ? "sel" : ""}" data-p="${u.n}"><span class="em">${u.x ? u.s : "🔩"}</span><span class="nm">${u.n}</span><span style="color:var(--dim)">${u.x ? "≈" : u.s}</span></button>`;
    const ser = c.units.filter(u => !u.x && m(u)), sil = st.silly ? c.units.filter(u => u.x && m(u)) : [];
    $("plist").innerHTML = (ser.length ? `<div class="grp">SERIOUS UNITS</div>` + ser.map(row).join("") : "") +
      (sil.length ? `<div class="grp">SILLY (BUT ACCURATE-ISH) UNITS</div>` + sil.map(row).join("") : "") +
      (!ser.length && !sil.length ? `<div class="empty">No such unit. Yet. The smith is taking notes.</div>` : "");
  }
  $("search").addEventListener("input", drawPicker);
  $("plist").addEventListener("click", e => {
    const b = e.target.closest("[data-p]"); if (!b) return;
    st[picking] = b.dataset.p; $("sheet").classList.remove("open"); play("tick"); compute();
  });
  $("sheet").addEventListener("click", e => { if (e.target.id === "sheet") $("sheet").classList.remove("open"); });

  /* ---------- events ---------- */
  $("chips").addEventListener("click", e => {
    const b = e.target.closest("[data-c]"); if (!b || b.dataset.c === st.cat) return;
    st.cat = b.dataset.c; const p = st.pairs[st.cat];
    const v = vis(cat());
    if (p) { st.from = p[0]; st.to = p[1]; } else { st.from = v[0].n; st.to = (v.find(u => u.x) || v[1]).n; }
    play("tick"); renderChips(); compute();
  });
  $("fromBtn").onclick = () => openPicker("from");
  $("toBtn").onclick = () => openPicker("to");

  let idle;
  $("val").addEventListener("input", () => {
    compute(true); clearTimeout(idle);
    idle = setTimeout(() => { addHist(); const v = getVal(), e = Number.isNaN(v) ? null : egg(v, unit(cat(), st.from)); if (e) { rain(e[1], 14); play("chime"); } }, 1200);
  });
  $("val").addEventListener("focus", () => setTimeout(() => $("val").select(), 30));
  $("neg").onclick = () => { const s = $("val").value.trim(); $("val").value = s.startsWith("-") ? s.slice(1) : "-" + s; play("tick"); compute(true); };
  $("clr").onclick = () => { $("val").value = ""; play("sizzle"); compute(true); $("val").focus(); };

  $("swap").onclick = () => {
    [st.from, st.to] = [st.to, st.from];
    const sw = $("swap"); sw.classList.remove("spin"); void sw.offsetWidth; sw.classList.add("spin");
    play("whoosh"); compute(); shake($("forgecard"));
  };

  $("forge").onclick = () => {
    $("val").blur(); compute();
    const r = $("out").getBoundingClientRect();
    play("clang"); flash(); shake($("forgecard")); sparks(r.left + r.width / 2, r.top + 10, 90);
    const o = $("out"); o.classList.remove("glow"); void o.offsetWidth; o.classList.add("glow");
    const t = unit(cat(), st.to);
    if (t.x && /\p{Extended_Pictographic}/u.test(t.s)) rain(t.s, 16);
    const qs = QUIPS[st.cat]; if (qs && Math.random() < 0.35) toast(qs[Math.floor(Math.random() * qs.length)]);
    addHist();
  };

  $("out").onclick = () => {
    if (Number.isNaN(lastResult)) return;
    const txt = `${fmt(lastResult)} ${st.to}`;
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { toast("Copied! Freshly forged. 📋"); play("tick"); }).catch(() => toast(txt));
  };

  $("all").addEventListener("click", e => {
    const b = e.target.closest("[data-u]"); if (!b) return;
    st.to = b.dataset.u; play("tick"); compute(); scrollTo({ top: 0, behavior: "smooth" });
  });
  $("hist").addEventListener("click", e => {
    const b = e.target.closest("[data-h]"); if (!b) return;
    const h = st.hist[+b.dataset.h]; st.cat = h.c; st.from = h.from; st.to = h.to; $("val").value = h.v;
    const fu = unit(cat(), h.from), tu = unit(cat(), h.to);
    if (!st.silly && ((fu && fu.x) || (tu && tu.x))) { st.silly = true; renderMode(); }
    play("tick"); renderChips(); compute(); scrollTo({ top: 0, behavior: "smooth" });
  });
  $("clrHist").onclick = () => { st.hist = []; save(); renderHist(); play("sizzle"); toast("History melted down. ♨️"); };

  function renderMode() { const m = $("mode"); m.classList.toggle("on", st.silly); m.textContent = st.silly ? "🍌 Silly" : "🎩 Serious"; }
  $("mode").onclick = () => {
    st.silly = !st.silly; renderMode();
    if (st.silly) { play("boing"); rain("🍌", 22); toast("Silly mode: ON. Bananas re-admitted. 🍌"); }
    else { play("ahem"); toast("Serious mode. The bananas have been escorted out. 🎩"); }
    compute(true);
  };
  function renderSnd() { $("snd").textContent = st.sound ? "🔊" : "🔇"; }
  $("snd").onclick = () => { st.sound = !st.sound; save(); renderSnd(); if (st.sound) play("chime"); toast(st.sound ? "Sound on. Clang responsibly." : "Muted. Silent but forging."); };

  // iOS audio unlock on first touch
  document.addEventListener("touchstart", () => { try { A(); } catch (e) {} }, { once: true });

  /* ---------- boot ---------- */
  renderMode(); renderSnd(); renderChips(); renderHist(); compute(true);

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
