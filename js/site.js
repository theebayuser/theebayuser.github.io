/* site.js — Thue–Morse rules, the drawn figures, and the things you can press. */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- palette ------------------------------------------------------------
     Canvases cannot read CSS variables, so read them once from the document
     and hand them out. Cleared when the board flips, so every figure redraws
     itself in chalk without knowing that is what happened. */

  var PAL = null;
  var repaints = [];

  function palette() {
    if (PAL) return PAL;
    var cs = getComputedStyle(document.documentElement);
    function v(name) { return cs.getPropertyValue(name).trim(); }
    PAL = {
      ink: v("--ink"),
      ink3: v("--ink-3"),
      guide: v("--fig-guide"),
      ballpoint: v("--ballpoint"),
      laurel: v("--laurel"),
      paper: v("--paper")
    };
    return PAL;
  }

  function onRepaint(fn) { repaints.push(fn); fn(); }

  function repaintAll() {
    PAL = null;
    palette();
    repaints.forEach(function (fn) { fn(); });
  }

  /* --- helpers ------------------------------------------------------------ */

  function onceInView(el, fn, threshold) {
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.unobserve(e.target); fn(); }
      });
    }, { threshold: threshold || 0.15 });
    io.observe(el);
  }

  function fitCanvas(canvas) {
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    return { ctx: ctx, w: rect.width, h: rect.height };
  }

  function countUp(el, target, finalText) {
    if (reduced || document.visibilityState === "hidden") { el.textContent = finalText; return; }
    var start = null, dur = 650;
    function tick(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      if (t < 1) {
        el.textContent = Math.round(target * eased).toLocaleString();
        window.requestAnimationFrame(tick);
      } else {
        el.textContent = finalText;
      }
    }
    el.textContent = "0";
    window.requestAnimationFrame(tick);
    window.setTimeout(function () { el.textContent = finalText; }, 1500);
  }

  /* --- Thue–Morse --------------------------------------------------------
     t(n) = parity of the number of 1s in the binary expansion of n. */

  function thueMorse(n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var bits = 0, k = i;
      while (k) { bits += k & 1; k >>= 1; }
      out.push(bits & 1);
    }
    return out;
  }

  function renderTicks(el, bits) {
    var frag = document.createDocumentFragment();
    bits.forEach(function (bit) {
      var tick = document.createElement("i");
      if (bit === 0) tick.className = "z";
      frag.appendChild(tick);
    });
    el.textContent = "";
    el.appendChild(frag);
  }

  function fillStrips() {
    Array.prototype.forEach.call(document.querySelectorAll(".tm"), function (strip) {
      var n = parseInt(strip.getAttribute("data-n"), 10) || 24;
      strip.setAttribute("aria-hidden", "true");
      renderTicks(strip, thueMorse(n));

      if (reduced || document.visibilityState === "hidden") return;

      strip.classList.add("tm-pre");
      var ticks = strip.querySelectorAll("i");
      Array.prototype.forEach.call(ticks, function (t, i) {
        t.style.transitionDelay = (i * 14) + "ms";
      });
      onceInView(strip, function () {
        strip.classList.add("tm-draw");
        window.setTimeout(function () {
          strip.classList.remove("tm-pre", "tm-draw");
          Array.prototype.forEach.call(ticks, function (t) { t.style.transitionDelay = ""; });
        }, 1400);
      }, 0.2);
    });
  }

  /* --- scroll reveals ----------------------------------------------------- */

  function initReveals() {
    if (reduced) return;
    if (document.visibilityState === "hidden") return;

    Array.prototype.forEach.call(document.querySelectorAll("[data-reveal-group]"), function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.setAttribute("data-reveal", "");
        child.style.transitionDelay = (i * 50) + "ms";
      });
    });

    var items = document.querySelectorAll("[data-reveal]");
    Array.prototype.forEach.call(items, function (el) {
      el.classList.add("rv");
      onceInView(el, function () {
        el.classList.add("rv-in");
        window.setTimeout(function () {
          el.classList.remove("rv", "rv-in");
          el.style.transitionDelay = "";
        }, 1200);
      }, 0.12);
    });

    window.setTimeout(function () {
      Array.prototype.forEach.call(items, function (el) {
        el.classList.remove("rv", "rv-in");
        el.style.transitionDelay = "";
      });
    }, 8000);
  }

  function initTitleBlock() {
    var tb = document.querySelector("[data-titleblock]");
    if (!tb || reduced) return;
    tb.classList.add("tb-anim");
    function reveal() { tb.classList.add("tb-in"); }
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(reveal);
    });
    window.setTimeout(reveal, 400);
    window.setTimeout(function () {
      tb.classList.remove("tb-anim", "tb-in");
    }, 1400);
  }

  /* --- plate slideshow ---------------------------------------------------- */

  function initShow(root) {
    var slides = root.querySelectorAll(".show-slide");
    if (!slides.length) return;
    var capEl = root.querySelector("[data-show-cap]");
    var numEl = root.querySelector("[data-show-num]");
    var countEl = root.querySelector("[data-show-count]");
    var prev = root.querySelector("[data-show-prev]");
    var next = root.querySelector("[data-show-next]");
    var i = 0;

    if (countEl) countEl.textContent = "of " + slides.length;

    function show(n) {
      i = (n + slides.length) % slides.length;
      Array.prototype.forEach.call(slides, function (s, k) {
        s.setAttribute("data-active", k === i ? "true" : "false");
        s.setAttribute("aria-hidden", k === i ? "false" : "true");
      });
      var active = slides[i];
      if (capEl) capEl.textContent = active.getAttribute("data-caption") || "";
      if (numEl) numEl.textContent = "Plate " + toRoman(i + 1);
    }

    if (prev) prev.addEventListener("click", function () { show(i - 1); });
    if (next) next.addEventListener("click", function () { show(i + 1); });

    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { show(i - 1); e.preventDefault(); }
      if (e.key === "ArrowRight") { show(i + 1); e.preventDefault(); }
    });

    show(0);
  }

  function toRoman(n) {
    var map = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    var out = "";
    map.forEach(function (pair) {
      while (n >= pair[0]) { out += pair[1]; n -= pair[0]; }
    });
    return out;
  }

  /* --- a canvas that draws itself, then rests ---------------------------- */

  function plotter(canvas, spec) {
    var ctx = canvas.getContext("2d");
    var w = 0, h = 0;

    function resize() {
      var m = fitCanvas(canvas);
      ctx = m.ctx; w = m.w; h = m.h;
    }

    function paint(progress) {
      ctx.clearRect(0, 0, w, h);
      spec.draw(ctx, w, h, progress, palette());
    }

    resize();

    if (reduced) {
      paint(1);
      repaints.push(function () { paint(1); });
      window.addEventListener("resize", function () { resize(); paint(1); });
      return;
    }

    var p = 0, running = false, raf = null, last = null;
    var speed = 1 / spec.seconds;
    var hold = spec.hold || 1.4;
    var holding = 0;

    paint(0);
    repaints.push(function () { paint(p); });

    function frame(now) {
      if (!running) { raf = null; return; }
      if (last === null) last = now;
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (p < 1) {
        p = Math.min(1, p + dt * speed);
      } else {
        holding += dt;
        if (holding > hold) { p = 0; holding = 0; }
      }
      paint(p);
      raf = window.requestAnimationFrame(frame);
    }

    function start() {
      if (raf === null) { running = true; last = null; raf = window.requestAnimationFrame(frame); }
    }
    function stop() {
      running = false;
      if (raf !== null) { window.cancelAnimationFrame(raf); raf = null; }
    }

    window.addEventListener("resize", function () { resize(); paint(p); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
      }, { threshold: 0.1 }).observe(canvas);
    } else {
      start();
    }
  }

  /* --- fig. 0: a deltoid, from two epicycles ----------------------------- */

  function deltoidPoint(t, cx, cy, scale) {
    var R1 = 0.30, R2 = 0.15;
    return {
      x: cx + scale * (R1 * Math.cos(t) + R2 * Math.cos(-2 * t)),
      y: cy + scale * (R1 * Math.sin(t) + R2 * Math.sin(-2 * t))
    };
  }

  function deltoid(ctx, w, h, progress, pal) {
    var cx = w / 2, cy = h / 2, scale = Math.min(w, h);
    var TAU = Math.PI * 2;
    var upTo = progress * TAU;

    ctx.strokeStyle = pal.guide;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, scale * 0.45, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = pal.ballpoint;
    ctx.lineWidth = 1.75;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    var steps = 480;
    for (var s = 0; s <= steps; s++) {
      var t = (s / steps) * TAU;
      if (t > upTo) break;
      var pt = deltoidPoint(t, cx, cy, scale);
      if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    if (progress < 1) {
      var tip = deltoidPoint(upTo, cx, cy, scale);
      ctx.fillStyle = pal.laurel;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 3.5, 0, TAU);
      ctx.fill();
    }
  }

  /* --- fig. 1: the Lorenz attractor -------------------------------------- */

  var lorenzPath = null;

  function lorenzPoints() {
    if (lorenzPath) return lorenzPath;
    var sigma = 10, rho = 28, beta = 8 / 3, dt = 0.005;
    var x = 0.9, y = 0, z = 1.2;
    var pts = [];
    for (var i = 0; i < 7000; i++) {
      var dx = sigma * (y - x);
      var dy = x * (rho - z) - y;
      var dz = x * y - beta * z;
      x += dx * dt; y += dy * dt; z += dz * dt;
      if (i > 200) pts.push([x, z]);
    }
    lorenzPath = pts;
    return pts;
  }

  function lorenz(ctx, w, h, progress, pal) {
    var pts = lorenzPoints();
    var pad = 18;
    var s = Math.min((w - pad * 2) / 46, (h - pad * 2) / 46);
    var cx = w / 2, cy = h / 2;

    function at(i) { return [cx + pts[i][0] * s, cy + (25 - pts[i][1]) * s]; }

    ctx.strokeStyle = pal.guide;
    ctx.lineWidth = 0.7;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    for (var g = 0; g < pts.length; g += 2) {
      var gp = at(g);
      if (g === 0) ctx.moveTo(gp[0], gp[1]); else ctx.lineTo(gp[0], gp[1]);
    }
    ctx.stroke();

    ctx.strokeStyle = pal.ballpoint;
    ctx.lineWidth = 0.9;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    var upTo = Math.floor(pts.length * progress);
    for (var i = 0; i < upTo; i++) {
      var p = at(i);
      if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (progress < 1 && upTo > 0) {
      var tip = at(upTo - 1);
      ctx.fillStyle = pal.laurel;
      ctx.beginPath();
      ctx.arc(tip[0], tip[1], 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* --- fig. 2: the Thue–Morse difference table --------------------------- */

  function tmGrid(ctx, w, h, progress, pal) {
    var n = 32;
    var word = thueMorse(n);
    var side = Math.min(w, h);
    var cell = side / n;
    var ox = (w - side) / 2;
    var oy = (h - side) / 2;
    var rows = Math.ceil(n * progress);

    ctx.fillStyle = pal.ink;
    ctx.globalAlpha = 0.10;
    for (var gj = 0; gj < n; gj++) {
      for (var gi = 0; gi < n; gi++) {
        if (word[gi] !== word[gj]) ctx.fillRect(ox + gi * cell, oy + gj * cell, cell + 0.5, cell + 0.5);
      }
    }

    ctx.globalAlpha = 0.82;
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < n; i++) {
        if (word[i] !== word[j]) ctx.fillRect(ox + i * cell, oy + j * cell, cell + 0.5, cell + 0.5);
      }
    }
    ctx.globalAlpha = 1;

    if (progress < 1 && rows > 0) {
      ctx.fillStyle = pal.laurel;
      ctx.fillRect(ox, oy + (rows - 1) * cell, side, 1.5);
    }
  }

  /* --- Ulam's spiral, with the contents filed among the primes ------------ */

  function ulam(canvas) {
    var m = fitCanvas(canvas);
    var ctx = m.ctx, w = m.w, h = m.h;
    var pal = palette();

    var cells = 41;
    var cell = Math.min(w, h) / cells;
    var dot = Math.max(1.4, cell * 0.30);
    var n = cells * cells;

    var sieve = new Uint8Array(n + 1);
    sieve[0] = sieve[1] = 1;
    for (var p = 2; p * p <= n; p++) {
      if (!sieve[p]) for (var mm = p * p; mm <= n; mm += p) sieve[mm] = 1;
    }

    var x = 0, y = 0, dx = 1, dy = 0, len = 1, done = 0;
    var cx = w / 2, cy = h / 2;
    var primes = [];

    ctx.fillStyle = pal.ink;
    for (var k = 1; k <= n; k++) {
      if (!sieve[k]) {
        var px = cx + x * cell, py = cy + y * cell;
        ctx.globalAlpha = 0.78;
        ctx.beginPath();
        ctx.arc(px, py, dot, 0, Math.PI * 2);
        ctx.fill();
        primes.push({ n: k, x: px, y: py, r: Math.hypot(x, y), a: Math.atan2(y, x) });
      }
      x += dx; y += dy; done++;
      if (done === len) {
        done = 0;
        var t = dx; dx = -dy; dy = t;
        if (dy === 0) len++;
      }
    }
    ctx.globalAlpha = 1;

    return { primes: primes, maxR: cells / 2 };
  }

  /* Pick well-separated primes to hang the section numerals on: one per
     angular sector, each at its own distance from the middle. */
  function pickAnchors(primes, maxR, count) {
    var wants = [0.20, 0.38, 0.55, 0.70, 0.83, 0.93];
    var picked = [];
    for (var i = 0; i < count; i++) {
      var wantR = wants[i] * maxR;
      var wantA = (-Math.PI / 2) + (i / count) * Math.PI * 2;
      var best = null, bestCost = Infinity;
      primes.forEach(function (pr) {
        var da = Math.abs(Math.atan2(Math.sin(pr.a - wantA), Math.cos(pr.a - wantA)));
        var cost = Math.abs(pr.r - wantR) / maxR * 2 + da;
        var clash = picked.some(function (q) { return Math.hypot(q.x - pr.x, q.y - pr.y) < 46; });
        if (!clash && cost < bestCost) { bestCost = cost; best = pr; }
      });
      if (best) picked.push(best);
    }
    return picked;
  }

  function initSpiralNav(wrap) {
    var canvas = wrap.querySelector("canvas");
    var chips = wrap.querySelectorAll(".ulam-node");
    if (!canvas || !chips.length) return;

    function place() {
      var res = ulam(canvas);
      var anchors = pickAnchors(res.primes, res.maxR, chips.length);
      Array.prototype.forEach.call(chips, function (chip, i) {
        var a = anchors[i];
        if (!a) { chip.style.display = "none"; return; }
        chip.style.display = "";
        chip.style.left = a.x + "px";
        chip.style.top = a.y + "px";
        chip.title = "prime " + a.n;
      });
    }

    onRepaint(place);
    window.addEventListener("resize", place);

    /* hover on either side lights the other */
    Array.prototype.forEach.call(chips, function (chip) {
      var href = chip.getAttribute("href");
      var row = document.querySelector('.toc a[href="' + href + '"]');
      function on() { chip.classList.add("is-hot"); if (row) row.classList.add("is-hot"); }
      function off() { chip.classList.remove("is-hot"); if (row) row.classList.remove("is-hot"); }
      chip.addEventListener("mouseenter", on);
      chip.addEventListener("mouseleave", off);
      if (row) {
        row.addEventListener("mouseenter", on);
        row.addEventListener("mouseleave", off);
        row.addEventListener("focus", on);
        row.addEventListener("blur", off);
      }
    });
  }

  /* --- the prerequisite graph, as actually experienced -------------------- */

  function prereqGraph(canvas) {
    var m = fitCanvas(canvas);
    var ctx = m.ctx, w = m.w, h = m.h;
    var pal = palette();

    var nodes = [
      { x: 0.10, y: 0.22, t: "arithmetic" },
      { x: 0.36, y: 0.12, t: "olympiad" },
      { x: 0.64, y: 0.22, t: "words" },
      { x: 0.89, y: 0.13, t: "avoidance" },
      { x: 0.11, y: 0.74, t: "logic" },
      { x: 0.37, y: 0.86, t: "types" },
      { x: 0.64, y: 0.74, t: "Lean 4" },
      { x: 0.89, y: 0.86, t: "Mathlib" }
    ];
    var edges = [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 7], [1, 5], [2, 6], [3, 6]];
    var here = 3;

    function pt(i) { return { x: 16 + nodes[i].x * (w - 32), y: 14 + nodes[i].y * (h - 28) }; }

    ctx.strokeStyle = pal.guide;
    ctx.lineWidth = 1;
    edges.forEach(function (e) {
      var a = pt(e[0]), b = pt(e[1]);
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - Math.abs(b.x - a.x) * 0.14;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(mx, my, b.x, b.y);
      ctx.stroke();
    });

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "11px ui-monospace, Menlo, monospace";
    nodes.forEach(function (nd, i) {
      var p = pt(i);
      var hot = i === here;
      ctx.fillStyle = pal.paper;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hot ? pal.laurel : pal.ink;
      ctx.beginPath();
      ctx.arc(p.x, p.y, hot ? 4 : 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hot ? pal.ink : pal.ink3;
      ctx.fillText(nd.t, p.x, p.y + (nd.y > 0.5 ? 16 : -14));
    });
  }

  /* --- the 404 Mandelbrot, stippled once in ink --------------------------- */

  function mandelbrot(canvas) {
    var m = fitCanvas(canvas);
    var ctx = m.ctx, w = m.w, h = m.h;
    var pal = palette();

    var step = 2;
    for (var py = 0; py < h; py += step) {
      for (var px = 0; px < w; px += step) {
        var x0 = (px / w) * 3.0 - 2.1;
        var y0 = (py / h) * 2.4 - 1.2;
        var x = 0, y = 0, it = 0;
        while (x * x + y * y <= 4 && it < 40) {
          var xt = x * x - y * y + x0;
          y = 2 * x * y + y0;
          x = xt;
          it++;
        }
        if (it === 40) {
          ctx.fillStyle = pal.ink;
          ctx.globalAlpha = 0.82;
          ctx.fillRect(px, py, step, step);
        } else if (it > 6) {
          ctx.fillStyle = pal.ink;
          ctx.globalAlpha = Math.min(0.4, it / 90);
          ctx.fillRect(px, py, step, step);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  /* --- small glyphs on the selected-work cards ---------------------------- */

  function glyph(canvas) {
    var kind = canvas.getAttribute("data-glyph");
    var m = fitCanvas(canvas);
    var ctx = m.ctx, w = m.w, h = m.h;
    var pal = palette();

    if (kind === "word") {
      var bits = thueMorse(14);
      var gap = w / 14;
      bits.forEach(function (b, i) {
        ctx.fillStyle = b ? pal.ink : pal.paper;
        ctx.strokeStyle = pal.guide;
        ctx.lineWidth = 1;
        var x = i * gap, y = h / 2 - 5;
        if (b) ctx.fillRect(x, y, 3, 10);
        else ctx.strokeRect(x + 0.5, y + 0.5, 2, 9);
      });
    } else if (kind === "grid") {
      var n = 8, word = thueMorse(n), side = Math.min(w, h), cell = side / n;
      var ox = (w - side) / 2, oy = (h - side) / 2;
      ctx.fillStyle = pal.ink;
      ctx.globalAlpha = 0.72;
      for (var j = 0; j < n; j++) {
        for (var i = 0; i < n; i++) {
          if (word[i] !== word[j]) ctx.fillRect(ox + i * cell, oy + j * cell, cell + 0.4, cell + 0.4);
        }
      }
      ctx.globalAlpha = 1;
    } else if (kind === "curve") {
      var cx = w / 2, cy = h / 2, scale = Math.min(w, h) * 1.7;
      ctx.strokeStyle = pal.ballpoint;
      ctx.lineWidth = 1.2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (var s = 0; s <= 160; s++) {
        var t = (s / 160) * Math.PI * 2;
        var pp = deltoidPoint(t, cx, cy, scale);
        if (s === 0) ctx.moveTo(pp.x, pp.y); else ctx.lineTo(pp.x, pp.y);
      }
      ctx.stroke();
    }
  }

  /* --- the goal panel, made runnable -------------------------------------- */

  function initGoal(panel) {
    var bar = panel.querySelector(".goal-bar");
    var target = panel.querySelector(".goal-target");
    if (!bar || !target) return;

    panel.setAttribute("data-enhanced", "");

    var cursor = document.createElement("span");
    cursor.className = "goal-cursor";
    cursor.setAttribute("aria-hidden", "true");
    target.appendChild(cursor);

    var run = document.createElement("button");
    run.type = "button";
    run.className = "btn-tactic";
    run.textContent = "by exact tm_overlapFree";

    var reset = document.createElement("button");
    reset.type = "button";
    reset.className = "goal-reset";
    reset.textContent = "reset";
    reset.hidden = true;

    bar.appendChild(run);
    bar.appendChild(reset);

    run.addEventListener("click", function () {
      panel.classList.add("is-run");
      run.disabled = true;
      run.textContent = "✓ kernel accepted";
      reset.hidden = false;
    });

    reset.addEventListener("click", function () {
      panel.classList.remove("is-run");
      run.disabled = false;
      run.textContent = "by exact tm_overlapFree";
      reset.hidden = true;
    });
  }

  /* --- the morphism, one press at a time ---------------------------------- */

  function initMorphism(root) {
    var out = root.querySelector("[data-morphism-out]");
    if (!out) return;
    var MAX = 8;
    var gens = [];

    var bar = document.createElement("div");
    bar.className = "morph-bar";

    var apply = document.createElement("button");
    apply.type = "button";
    apply.className = "btn";
    apply.textContent = "Apply 0 → 01, 1 → 10";

    var back = document.createElement("button");
    back.type = "button";
    back.className = "btn";
    back.textContent = "Reset";

    var meta = document.createElement("p");
    meta.className = "morph-meta";

    bar.appendChild(apply);
    bar.appendChild(back);
    bar.appendChild(meta);
    out.parentNode.insertBefore(bar, out.nextSibling);

    function render() {
      out.textContent = gens.join("\n");
      var n = gens.length - 1;
      var len = gens[n].length;
      meta.textContent = n >= MAX
        ? "generation " + n + " · length " + len + " · the fixed point continues forever"
        : "generation " + n + " · length " + len;
      apply.disabled = n >= MAX;
    }

    function step() {
      var last = gens[gens.length - 1];
      var next = "";
      for (var i = 0; i < last.length; i++) {
        next += last.charAt(i) === "0" ? "01" : "10";
      }
      gens.push(next);
      render();
    }

    apply.addEventListener("click", function () { if (gens.length - 1 < MAX) step(); });
    back.addEventListener("click", function () { gens = ["0"]; render(); });

    gens = ["0"];
    render();
  }

  /* --- counting up -------------------------------------------------------- */

  function initCounts() {
    var els = document.querySelectorAll("[data-count]");
    Array.prototype.forEach.call(els, function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var final = el.textContent;
      onceInView(el, function () { countUp(el, target, final); }, 0.4);
    });
  }

  /* --- the ledger ---------------------------------------------------------
     Follower counts cannot be read from the browser: none of the three
     platforms allow it. So they are kept by hand in data/socials.json and
     stamped with the date they were true. If the fetch fails the dashes
     stay and every link still works. */

  var ledgerPromise = null;

  function loadLedger() {
    if (ledgerPromise) return ledgerPromise;
    if (!window.fetch) return Promise.reject();
    ledgerPromise = fetch("data/socials.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); });
    return ledgerPromise;
  }

  function initLedger() {
    var root = document.querySelector("[data-ledger]");
    var nowEls = document.querySelectorAll("[data-now]");
    if (!root && !nowEls.length) return;

    loadLedger().then(function (data) {
      if (nowEls.length && data.now) {
        Array.prototype.forEach.call(nowEls, function (el) { el.textContent = data.now; });
      }
      if (!root || !data.channels) return;

      var stamp = root.querySelector("[data-ledger-stamp]");
      if (stamp && data.updated) {
        stamp.textContent = "counts kept by hand · last checked " + data.updated;
      }

      data.channels.forEach(function (ch) {
        var cell = root.querySelector('[data-platform="' + ch.platform + '"] .lg-count');
        if (!cell || typeof ch.followers !== "number") return;
        var text = ch.followers.toLocaleString();
        cell.setAttribute("data-empty", "false");
        onceInView(cell, function () { countUp(cell, ch.followers, text); }, 0.4);
      });
    }, function () { /* dashes stay, links still work */ });
  }

  /* --- reading progress, written in Thue–Morse ---------------------------- */

  function initProgress() {
    var bar = document.querySelector("[data-progress]");
    if (!bar) return;
    var canvas = document.createElement("canvas");
    bar.appendChild(canvas);
    var ctx = canvas.getContext("2d");

    function paint() {
      var w = window.innerWidth;
      var dpr = window.devicePixelRatio || 1;
      var pal = palette();
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(2 * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = "2px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, 2);
      var word = thueMorse(Math.ceil(w / 7));
      for (var i = 0; i < word.length; i++) {
        ctx.globalAlpha = word[i] ? 1 : 0.3;
        ctx.fillStyle = pal.ink;
        ctx.fillRect(i * 7, 0, 4, 2);
      }
      ctx.globalAlpha = 1;
    }

    var max = 0;
    function measure() { max = document.documentElement.scrollHeight - window.innerHeight; }
    function update() {
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.width = (p * 100) + "%";
    }

    onRepaint(paint);
    measure();
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", function () { paint(); measure(); update(); });
    window.setTimeout(function () { measure(); update(); }, 600);
  }

  /* --- keys: sections by number, and the board after dark ----------------- */

  function typingContext() {
    var el = document.activeElement;
    return !!(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" ||
      el.isContentEditable || el.hasAttribute("data-show")));
  }

  function applyBoard(on) {
    document.documentElement.classList.toggle("board", on);
    repaintAll();
  }

  function initKeys() {
    var map = {
      "1": "research.html", "2": "lean.html", "3": "manim.html",
      "4": "education.html", "5": "personal.html", "6": "cv.html",
      "0": "index.html"
    };

    try {
      if (window.localStorage.getItem("board") === "1") applyBoard(true);
    } catch (e) { /* private mode */ }

    document.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (typingContext()) return;

      if (e.key === "b" || e.key === "B") {
        var on = !document.documentElement.classList.contains("board");
        applyBoard(on);
        try { window.localStorage.setItem("board", on ? "1" : "0"); } catch (err) {}
        return;
      }

      var dest = map[e.key];
      if (dest) window.location.href = dest;
    });
  }

  /* --- boot --------------------------------------------------------------- */

  function boot() {
    palette();
    fillStrips();
    initTitleBlock();
    initReveals();
    Array.prototype.forEach.call(document.querySelectorAll("[data-show]"), initShow);

    var fig0 = document.getElementById("figure-deltoid");
    if (fig0) plotter(fig0, { draw: deltoid, seconds: 5.6, hold: 1.6 });

    var fig1 = document.getElementById("figure-lorenz");
    if (fig1) plotter(fig1, { draw: lorenz, seconds: 11, hold: 2.4 });

    var fig2 = document.getElementById("figure-tmgrid");
    if (fig2) plotter(fig2, { draw: tmGrid, seconds: 3.2, hold: 2.6 });

    var mb = document.getElementById("figure-mandelbrot");
    if (mb) onRepaint(function () { mandelbrot(mb); });

    var pg = document.getElementById("figure-prereq");
    if (pg) onRepaint(function () { prereqGraph(pg); });

    var spiral = document.querySelector("[data-spiral]");
    if (spiral) initSpiralNav(spiral);
    else {
      var us = document.getElementById("figure-ulam");
      if (us) onRepaint(function () { ulam(us); });
    }

    var glyphs = document.querySelectorAll("[data-glyph]");
    if (glyphs.length) {
      onRepaint(function () {
        Array.prototype.forEach.call(glyphs, glyph);
      });
    }

    var goal = document.querySelector(".goal");
    if (goal) initGoal(goal);

    var morph = document.querySelector("[data-morphism]");
    if (morph) initMorphism(morph);

    initCounts();
    initLedger();
    initProgress();
    initKeys();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
