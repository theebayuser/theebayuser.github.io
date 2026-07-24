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
      ink4: v("--ink-4"),
      guide: v("--fig-guide"),
      ballpoint: v("--ballpoint"),
      qed: v("--qed"),
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

  /* Text figures (the wordart block, the Pascal triangles) ink in a row at a
     time on first view, the way a plotter lays down type. Same fail-open
     contract as the reveals: JS wraps the rows and hides them, the classes come
     off afterwards, and without JS nothing is ever hidden. */
  function initInkRows() {
    var blocks = document.querySelectorAll(".wordart, .sierpinski");
    if (!blocks.length || reduced || document.visibilityState === "hidden") return;

    Array.prototype.forEach.call(blocks, function (pre) {
      var rows = pre.innerHTML.split("\n");
      if (rows.length < 2) return;
      /* join with nothing, not "\n": each row is its own block now, and inside a
         <pre> the separating newlines would be rendered too and double the height */
      pre.innerHTML = rows.map(function (r) { return "<span>" + r + "</span>"; }).join("");
      pre.classList.add("ink-rows", "ink-pre");
      Array.prototype.forEach.call(pre.children, function (row, i) {
        row.style.transitionDelay = (i * 40) + "ms";
      });

      function done() {
        pre.classList.remove("ink-pre", "ink-draw");
        Array.prototype.forEach.call(pre.children, function (row) {
          row.style.transitionDelay = "";
        });
      }

      onceInView(pre, function () {
        pre.classList.add("ink-draw");
        window.setTimeout(done, 400 + pre.children.length * 40);
      }, 0.1);

      /* last resort, same as the reveals: never leave type invisible */
      window.setTimeout(done, 8000);
    });
  }

  /* The ballpoint underlines. CSS ships them drawn, so nothing depends on this
     running; here we take the stroke back to zero and let it draw itself as the
     phrase arrives. One shot, then the classes come off. */
  function initUlines() {
    var marks = document.querySelectorAll(".uline");
    if (!marks.length || reduced || document.visibilityState === "hidden") return;

    Array.prototype.forEach.call(marks, function (el) {
      el.classList.add("uline-pre");
      onceInView(el, function () {
        window.setTimeout(function () { el.classList.add("uline-in"); }, 140);
        window.setTimeout(function () {
          el.classList.remove("uline-pre", "uline-in");
        }, 1100);
      }, 0.9);
    });

    /* last resort: never leave a phrase without its mark */
    window.setTimeout(function () {
      Array.prototype.forEach.call(marks, function (el) {
        el.classList.remove("uline-pre", "uline-in");
      });
    }, 9000);
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

  /* --- the Thue–Morse turtle ---------------------------------------------
     Drive a pen with the word: on a 1 step forward, on a 0 turn 60°. The path
     never closes and wanders off, which is the honest and interesting part, so
     the caption claims nothing more than that. */

  var tmTurtleCache = null;
  function tmTurtlePoints() {
    if (tmTurtleCache) return tmTurtleCache;
    var N = 4096, word = thueMorse(N);
    var x = 0, y = 0, th = 0, pts = [[0, 0]];
    var minx = 0, maxx = 0, miny = 0, maxy = 0;
    for (var n = 0; n < N; n++) {
      if (word[n]) { x += Math.cos(th); y += Math.sin(th); pts.push([x, y]); }
      else { th += Math.PI / 3; }
      if (x < minx) minx = x; if (x > maxx) maxx = x;
      if (y < miny) miny = y; if (y > maxy) maxy = y;
    }
    tmTurtleCache = { pts: pts, minx: minx, maxx: maxx, miny: miny, maxy: maxy };
    return tmTurtleCache;
  }

  function tmTurtle(ctx, w, h, progress, pal) {
    var T = tmTurtlePoints(), pts = T.pts, pad = 16;
    var s = Math.min((w - pad * 2) / (T.maxx - T.minx), (h - pad * 2) / (T.maxy - T.miny));
    var ox = (w - (T.maxx - T.minx) * s) / 2 - T.minx * s;
    var oy = (h - (T.maxy - T.miny) * s) / 2 - T.miny * s;
    function at(i) { return [ox + pts[i][0] * s, oy + pts[i][1] * s]; }

    ctx.strokeStyle = pal.guide; ctx.lineWidth = 0.7;
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath();
    for (var g = 0; g < pts.length; g++) {
      var gp = at(g); if (g === 0) ctx.moveTo(gp[0], gp[1]); else ctx.lineTo(gp[0], gp[1]);
    }
    ctx.stroke();

    ctx.strokeStyle = pal.ballpoint; ctx.lineWidth = 1; ctx.globalAlpha = 0.85;
    ctx.beginPath();
    var upTo = Math.max(1, Math.floor(pts.length * progress));
    for (var i = 0; i < upTo; i++) {
      var p = at(i); if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (progress < 1 && upTo > 0) {
      var tip = at(upTo - 1);
      ctx.fillStyle = pal.laurel;
      ctx.beginPath(); ctx.arc(tip[0], tip[1], 3, 0, Math.PI * 2); ctx.fill();
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
  function pickAnchors(primes, maxR, count, side) {
    var wants = [0.20, 0.38, 0.55, 0.70, 0.83, 0.93];
    /* keep the numerals apart in proportion to the figure, or a narrow
       viewport shrinks every gap below a fixed threshold and strands them */
    var apart = Math.max(24, Math.min(46, (side || 400) * 0.11));
    var picked = [];
    for (var i = 0; i < count; i++) {
      var wantR = wants[i] * maxR;
      var wantA = (-Math.PI / 2) + (i / count) * Math.PI * 2;
      var best = null, bestCost = Infinity;
      primes.forEach(function (pr) {
        var da = Math.abs(Math.atan2(Math.sin(pr.a - wantA), Math.cos(pr.a - wantA)));
        var cost = Math.abs(pr.r - wantR) / maxR * 2 + da;
        var clash = picked.some(function (q) { return Math.hypot(q.x - pr.x, q.y - pr.y) < apart; });
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

    /* the caption doubles as a readout: idle it names the figure, on hover it
       reads back the section, its phrase, and which prime the numeral sits on */
    var readout = document.querySelector("[data-spiral-readout]");
    var idle = readout ? readout.textContent : "";

    function place() {
      var side = Math.min(canvas.clientWidth, canvas.clientHeight);
      if (side < 40) return;                 /* not laid out yet; try again when it is */
      var res = ulam(canvas);
      var anchors = pickAnchors(res.primes, res.maxR, chips.length, side);
      Array.prototype.forEach.call(chips, function (chip, i) {
        var a = anchors[i];
        if (!a) { chip.style.display = "none"; return; }
        chip.style.display = "";
        chip.style.left = a.x + "px";
        chip.style.top = a.y + "px";
        chip.title = "prime " + a.n;
        chip.setAttribute("data-prime", a.n);
      });
    }

    onRepaint(place);
    window.addEventListener("resize", place);

    /* hover on either side lights the other and reads the pair back */
    Array.prototype.forEach.call(chips, function (chip) {
      var href = chip.getAttribute("href");
      var row = document.querySelector('.toc-line a[href="' + href + '"], .toc a[href="' + href + '"]');
      function on() {
        chip.classList.add("is-hot");
        if (row) row.classList.add("is-hot");
        if (readout) {
          var prime = chip.getAttribute("data-prime");
          var phrase = chip.getAttribute("data-phrase") || "";
          readout.textContent = phrase + (prime ? " · prime " + prime : "");
        }
      }
      function off() {
        chip.classList.remove("is-hot");
        if (row) row.classList.remove("is-hot");
        if (readout) readout.textContent = idle;
      }
      chip.addEventListener("mouseenter", on);
      chip.addEventListener("mouseleave", off);
      chip.addEventListener("focus", on);
      chip.addEventListener("blur", off);
      if (row) {
        row.addEventListener("mouseenter", on);
        row.addEventListener("mouseleave", off);
        row.addEventListener("focus", on);
        row.addEventListener("blur", off);
      }
    });
  }

  /* --- the prerequisite graph, used as this page's navigation --------------
     The chart is the real thing that happened: two chains, one through school
     and one through contests, meeting where the research starts. Each node is
     a button; the sections below it stay the complete, no-JS version. */

  var EDU_NODES = [
    { x: 0.06, y: 0.22, t: "Dougherty Valley",
      kind: "Dougherty Valley High School", when: "2023 – 2027",
      body: "San Ramon, California. Expected graduation June 2027, GPA 4.5 / 4.0.",
      more: "#schools", moreText: "schools" },
    { x: 0.06, y: 0.76, t: "AMC · AIME",
      kind: "AMC 10/12, then AIME", when: "2023 – 2026",
      body: "Where the mathematics stopped being homework. Three AIME qualifications and Distinguished Honor Roll on the AMC.",
      more: "#results", moreText: "results" },
    { x: 0.28, y: 0.10, t: "AP CS A · CS P",
      kind: "AP Computer Science A and Principles", when: "2024 – 2026",
      body: "The first place I had to write something that either compiled or did not. Good practice for a proof assistant.",
      more: "#coursework", moreText: "coursework" },
    { x: 0.28, y: 0.44, t: "college, concurrent",
      kind: "Cerro Coso and San Diego City College", when: "2025 – 2027",
      body: "Concurrent enrollment, because the mathematics I wanted was not offered at school. Taken alongside a full high-school schedule.",
      more: "#schools", moreText: "schools" },
    { x: 0.28, y: 0.76, t: "olympiad, self-taught",
      kind: "Olympiad mathematics, on my own", when: "2025 – 2026",
      body: "Combinatorics, elementary number theory, algebra, geometry. No course for any of it, which meant learning how to be stuck productively.",
      more: "#coursework", moreText: "self-taught" },
    { x: 0.53, y: 0.72, t: "discrete structures",
      kind: "Discrete structures", when: "college",
      body: "Induction, counting, graphs, and the first formal proofs I was asked to write down rather than wave at.",
      more: "#coursework", moreText: "coursework" },
    { x: 0.53, y: 0.20, t: "calculus 1–3",
      kind: "Calculus 1 through 3", when: "college",
      body: "Single variable through multivariable. Useful, and also the clearest lesson that computation and proof are different skills.",
      more: "#coursework", moreText: "coursework" },
    { x: 0.53, y: 0.44, t: "linear algebra, ODEs",
      kind: "Linear algebra and differential equations", when: "college",
      body: "Structure over calculation: bases, maps, and what stays fixed when everything else moves.",
      more: "#coursework", moreText: "coursework" },
    { x: 0.53, y: 0.84, t: "USAMO 2026",
      kind: "USA Mathematical Olympiad", when: "2026",
      body: "Qualified in 2026. Six problems, nine hours, and no partial credit for a good feeling about it.",
      more: "#results", moreText: "results" },
    { x: 0.80, y: 0.34, t: "words + avoidance",
      kind: "Combinatorics on words", when: "2025 – present",
      body: "Where the two chains meet, and where the research actually happens. Nobody assigned this one.",
      more: "research.html", moreText: "the research" },
    { x: 0.80, y: 0.70, t: "Lean 4 · Mathlib",
      kind: "Lean 4 and Mathlib", when: "2025 – present",
      body: "No course, no mentor, and nobody at school who had heard of it. I read the manual, broke things, and read the errors until they stopped being noise.",
      more: "lean.html", moreText: "the formalization" },
    { x: 0.66, y: 0.60, t: "combinatorics, proof writing",
      kind: "Combinatorics and proof writing", when: "college",
      body: "A small branch off the linear-algebra term: organized casework, generating functions, and writing an argument to be checked rather than believed. The habits research actually runs on.",
      more: "#coursework", moreText: "coursework" }
  ];

  var EDU_EDGES = [
    [0, 2], [0, 3], [1, 4], [4, 8], [3, 5], [3, 6], [6, 7],
    [2, 10], [5, 10], [7, 9], [8, 9], [9, 10], [7, 11]
  ];

  function eduGraph(root) {
    var wrap = root.querySelector(".graph-wrap");
    var canvas = wrap && wrap.querySelector("canvas");
    var pop = root.querySelector(".node-pop");
    if (!canvas || !pop) return;

    var here = 9;
    var chips = EDU_NODES.map(function (nd, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "node-chip";
      b.textContent = nd.t;
      b.setAttribute("aria-pressed", i === here ? "true" : "false");
      wrap.appendChild(b);
      b.addEventListener("click", function () { select(i); });
      return b;
    });

    /* Wide, the chart reads left to right as two chains meeting. Narrow, that
       cannot fit, so the same nodes stack into one column in the order they
       actually happened. Same graph, same edges, one turn of the page. */
    var EDU_COLUMN = [0, 2, 3, 6, 7, 11, 5, 1, 4, 8, 9, 10];

    function pt(i, w, h) {
      if (w < 560) {
        var row = EDU_COLUMN.indexOf(i);
        return {
          x: w / 2,
          y: 20 + (row / (EDU_COLUMN.length - 1)) * (h - 40)
        };
      }
      return { x: 20 + EDU_NODES[i].x * (w - 40), y: 18 + EDU_NODES[i].y * (h - 36) };
    }

    function draw() {
      if (canvas.clientWidth < 40) return;   /* not laid out yet */
      var m = fitCanvas(canvas);
      var ctx = m.ctx, w = m.w, h = m.h;
      var pal = palette();

      var narrow = w < 560;
      ctx.lineWidth = 1;
      EDU_EDGES.forEach(function (e) {
        var a = pt(e[0], w, h), b = pt(e[1], w, h);
        var live = e[0] === here || e[1] === here;
        ctx.strokeStyle = live ? pal.ballpoint : pal.guide;
        var mx, my;
        if (narrow) {
          /* one column: bow each edge out to the side so a long jump between
             chains is visibly a different edge from a step to the next row */
          var rows = Math.abs(EDU_COLUMN.indexOf(e[1]) - EDU_COLUMN.indexOf(e[0]));
          mx = a.x + (e[0] % 2 ? -1 : 1) * Math.min(w * 0.34, 14 + rows * 16);
          my = (a.y + b.y) / 2;
        } else {
          mx = (a.x + b.x) / 2;
          my = (a.y + b.y) / 2 - Math.abs(b.x - a.x) * 0.12;
        }
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(mx, my, b.x, b.y);
        ctx.stroke();
      });

      /* In one column the chip sits on the node, so it is the node. */
      if (!narrow) {
        EDU_NODES.forEach(function (nd, i) {
          var p = pt(i, w, h);
          var hot = i === here;
          ctx.fillStyle = pal.paper;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = hot ? pal.ballpoint : pal.ink3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, hot ? 4 : 2.4, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      var column = w < 560;
      chips.forEach(function (chip, i) {
        var p = pt(i, w, h);
        /* keep the whole label on the paper: a node near an edge would
           otherwise hang its chip off the side of the figure */
        var half = chip.offsetWidth / 2;
        chip.style.left = Math.min(Math.max(p.x, half + 2), w - half - 2) + "px";
        chip.style.top = (column ? p.y : p.y + (EDU_NODES[i].y > 0.5 ? 20 : -20)) + "px";
      });
    }

    function select(i) {
      here = i;
      var nd = EDU_NODES[i];
      chips.forEach(function (c, k) { c.setAttribute("aria-pressed", k === i ? "true" : "false"); });
      pop.innerHTML = "";

      var head = document.createElement("div");
      head.className = "np-head";
      var kind = document.createElement("span");
      kind.className = "np-kind";
      kind.textContent = nd.kind;
      var when = document.createElement("span");
      when.className = "np-when";
      when.textContent = nd.when;
      head.appendChild(kind);
      head.appendChild(when);

      var body = document.createElement("p");
      body.className = "np-body";
      body.textContent = nd.body;

      var more = document.createElement("p");
      more.className = "np-more";
      var link = document.createElement("a");
      link.href = nd.more;
      link.textContent = nd.moreText + " ↓";
      if (nd.more.indexOf("#") !== 0) link.textContent = nd.moreText + " →";
      more.appendChild(link);

      pop.appendChild(head);
      pop.appendChild(body);
      pop.appendChild(more);
      draw();
    }

    root.setAttribute("data-edu-graph", "on");
    select(here);
    onRepaint(draw);
    window.addEventListener("resize", draw);
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
          ctx.fillStyle = pal.ballpoint;
          ctx.globalAlpha = 0.82;
          ctx.fillRect(px, py, step, step);
        } else if (it > 6) {
          ctx.fillStyle = pal.ballpoint;
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

  /* --- tailpieces: one closing ornament per page -------------------------
     Dense, emergent things rather than thin closed curves: a random walk that
     thickens where it revisits, a strange attractor stippled into smoke, a
     clustered network. Each draws through palette() (so the night board flips
     them) and off a seeded PRNG (so every repaint is the identical picture).
     All bail while the canvas is unlaid-out, e.g. a backgrounded tab. */

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* index: one pen, left to run, thickening the paper where it crosses itself.
     A tight heading wander keeps it compact so the ink builds real density
     rather than a thin scribble sprawling across the frame. */
  function inkWalk(canvas) {
    if (canvas.clientWidth < 40) return;
    var m = fitCanvas(canvas), ctx = m.ctx, w = m.w, h = m.h, pal = palette();
    var rnd = mulberry32(20260724), N = 90000, step = 1.5;
    var x = 0, y = 0, a = 0, cx = 0, cy = 0;
    var xs = new Float32Array(N), ys = new Float32Array(N);
    var minx = 0, maxx = 0, miny = 0, maxy = 0;
    for (var i = 0; i < N; i++) {
      a += (rnd() - 0.5) * 2.6;                 /* turns hard, so it folds back on itself */
      x += Math.cos(a) * step; y += Math.sin(a) * step;
      cx += (x - cx) * 0.0006; cy += (y - cy) * 0.0006;   /* gentle pull toward the mean */
      x -= cx * 0.0006; y -= cy * 0.0006;
      xs[i] = x; ys[i] = y;
      if (x < minx) minx = x; if (x > maxx) maxx = x;
      if (y < miny) miny = y; if (y > maxy) maxy = y;
    }
    var pad = 14;
    var s = Math.min((w - pad * 2) / (maxx - minx), (h - pad * 2) / (maxy - miny));
    var ox = (w - (maxx - minx) * s) / 2 - minx * s;
    var oy = (h - (maxy - miny) * s) / 2 - miny * s;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = pal.ballpoint;
    ctx.globalAlpha = 0.22; ctx.lineWidth = 1; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(ox + xs[0] * s, oy + ys[0] * s);
    for (var j = 1; j < N; j++) ctx.lineTo(ox + xs[j] * s, oy + ys[j] * s);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /* animations: a Clifford strange attractor, 40k points stippled into density */
  function attractor(canvas) {
    if (canvas.clientWidth < 40) return;
    var m = fitCanvas(canvas), ctx = m.ctx, w = m.w, h = m.h, pal = palette();
    var A = 1.5, B = -1.8, C = 1.6, D = 0.9, N = 42000;
    var x = 0.1, y = 0.1, i;
    var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    var xs = new Float32Array(N), ys = new Float32Array(N);
    for (i = 0; i < N; i++) {
      var nx = Math.sin(A * y) + C * Math.cos(A * x);
      var ny = Math.sin(B * x) + D * Math.cos(B * y);
      x = nx; y = ny; xs[i] = x; ys[i] = y;
      if (i > 100) {
        if (x < minx) minx = x; if (x > maxx) maxx = x;
        if (y < miny) miny = y; if (y > maxy) maxy = y;
      }
    }
    var pad = 12;
    var s = Math.min((w - pad * 2) / (maxx - minx), (h - pad * 2) / (maxy - miny));
    var ox = (w - (maxx - minx) * s) / 2 - minx * s;
    var oy = (h - (maxy - miny) * s) / 2 - miny * s;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = pal.ballpoint; ctx.globalAlpha = 0.16;
    for (i = 100; i < N; i++) ctx.fillRect(ox + xs[i] * s, oy + ys[i] * s, 1, 1);
    ctx.globalAlpha = 1;
  }

  /* projects: a clustered network in ink, the way an organization actually looks */
  function inkNetwork(canvas) {
    if (canvas.clientWidth < 40) return;
    var m = fitCanvas(canvas), ctx = m.ctx, w = m.w, h = m.h, pal = palette();
    var rnd = mulberry32(510), pad = 22;
    var hubs = [[0.24, 0.34], [0.72, 0.26], [0.6, 0.74], [0.32, 0.72]];
    var nodes = [], ni;
    hubs.forEach(function (hb, hc) {
      var cx = pad + hb[0] * (w - pad * 2), cy = pad + hb[1] * (h - pad * 2);
      var count = 7 + Math.floor(rnd() * 6);
      for (var k = 0; k < count; k++) {
        var ang = rnd() * Math.PI * 2, rad = Math.pow(rnd(), 0.6) * Math.min(w, h) * 0.14;
        nodes.push({ x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad, c: hc, deg: 0 });
      }
    });
    var edges = [];
    function link(i, j) { edges.push([i, j]); nodes[i].deg++; nodes[j].deg++; }
    for (ni = 0; ni < nodes.length; ni++) {
      for (var nj = ni + 1; nj < nodes.length; nj++) {
        var d = Math.hypot(nodes[ni].x - nodes[nj].x, nodes[ni].y - nodes[nj].y);
        var same = nodes[ni].c === nodes[nj].c;
        if (same && d < Math.min(w, h) * 0.18 && rnd() < 0.55) link(ni, nj);
        else if (!same && rnd() < 0.012) link(ni, nj);   /* a few bridges */
      }
    }
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = pal.ballpoint; ctx.globalAlpha = 0.35; ctx.lineWidth = 0.6;
    ctx.beginPath();
    edges.forEach(function (e) {
      ctx.moveTo(nodes[e[0]].x, nodes[e[0]].y);
      ctx.lineTo(nodes[e[1]].x, nodes[e[1]].y);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
    nodes.forEach(function (nd) {
      var r = 1.6 + Math.min(nd.deg, 6) * 0.7;
      ctx.fillStyle = pal.paper;
      ctx.beginPath(); ctx.arc(nd.x, nd.y, r + 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pal.ballpoint;
      ctx.beginPath(); ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2); ctx.fill();
    });
  }

  /* education: the roots of every cubic with small integer coefficients, plotted
     in the complex plane. Normalize each ax^3 + bx^2 + cx + d to monic and find
     its three roots by Durand–Kerner iteration, then stipple them. Overlapping
     roots accumulate ink, so the dense self-similar structure near the unit
     circle brightens on its own. The same idea as the artwork it replaces, drawn
     in the page's own ink rather than embedded as a copyrighted raster. */
  function cubicRoots(canvas) {
    if (canvas.clientWidth < 40) return;
    var m = fitCanvas(canvas), ctx = m.ctx, w = m.w, h = m.h, pal = palette();
    var N = 5, R = 2.6;                 /* coefficients in -N..N, view radius R */
    var cx = w / 2, cy = h / 2, s = Math.min(w, h) / (2 * R);

    /* one Durand–Kerner pass over a monic cubic x^3 + Bx^2 + Cx + D. Returns the
       three roots as [re, im] pairs. */
    var zr = [0, 0, 0], zi = [0, 0, 0];
    function solve(B, C, D) {
      /* seed the three roots off the unit circle so they separate cleanly */
      zr[0] = 0.4;  zi[0] = 0.9;
      zr[1] = -0.9; zi[1] = 0.4;
      zr[2] = -0.4; zi[2] = -0.9;
      for (var it = 0; it < 30; it++) {
        for (var i = 0; i < 3; i++) {
          var xr = zr[i], xi = zi[i];
          /* p(x) = x^3 + Bx^2 + Cx + D, by Horner */
          var pr = xr + B, pi = xi;                         /* x + B */
          var t = pr * xr - pi * xi; pi = pr * xi + pi * xr; pr = t + C;  /* *x + C */
          t = pr * xr - pi * xi; pi = pr * xi + pi * xr; pr = t + D;      /* *x + D */
          /* denominator: product of (x_i - x_j) for j != i */
          var dr = 1, di = 0;
          for (var j = 0; j < 3; j++) {
            if (j === i) continue;
            var ar = xr - zr[j], ai = xi - zi[j];
            var nr = dr * ar - di * ai;
            di = dr * ai + di * ar; dr = nr;
          }
          /* x_i -= p / denom */
          var den = dr * dr + di * di;
          if (den < 1e-18) continue;
          var qr = (pr * dr + pi * di) / den;
          var qi = (pi * dr - pr * di) / den;
          zr[i] = xr - qr; zi[i] = xi - qi;
        }
      }
    }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = pal.ballpoint;
    ctx.globalAlpha = 0.20;
    for (var a = 1; a <= N; a++) {           /* a > 0 covers the sign symmetry */
      for (var b = -N; b <= N; b++) {
        for (var c = -N; c <= N; c++) {
          for (var d = -N; d <= N; d++) {
            solve(b / a, c / a, d / a);
            for (var k = 0; k < 3; k++) {
              var px = cx + zr[k] * s, py = cy - zi[k] * s;
              if (px < 0 || px > w || py < 0 || py > h) continue;
              ctx.fillRect(px, py, 1, 1);
            }
          }
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  /* --- the goal panel, made runnable -------------------------------------- */

  /* The proof, one tactic per click. Each state is what the assistant would
     print at that point; the tactic on the button is the next line of the
     script. Simplified for reading, and the static HTML keeps the closed
     proof so a no-JS reader still sees a finished theorem. */
  var GOAL_STEPS = [
    { hyp: ["w : Word Bool", "hw : w = thueMorse"],
      goal: "⊢ OverlapFree w",
      tactic: "rw [hw]", node: 0 },
    { hyp: ["w : Word Bool", "hw : w = thueMorse"],
      goal: "⊢ OverlapFree thueMorse",
      tactic: "by_contra hov", node: 1 },
    { hyp: ["hov : ¬ OverlapFree thueMorse"],
      goal: "⊢ False",
      tactic: "obtain ⟨i, hmin⟩ := shortest_overlap hov", node: 2 },
    { hyp: ["i : ℕ", "hmin : ShortestOverlapAt thueMorse i"],
      goal: "⊢ False",
      tactic: "rcases Nat.even_or_odd i with he | ho", node: 3 },
    { hyp: ["hmin : ShortestOverlapAt thueMorse i", "he : Even i"],
      goal: "⊢ False    (case 1 of 2)",
      tactic: "exact descend_even hmin he", node: 4 },
    { hyp: ["hmin : ShortestOverlapAt thueMorse i", "ho : Odd i"],
      goal: "⊢ False    (case 2 of 2)",
      tactic: "exact descend_odd hmin ho", node: 5 }
  ];

  /* The same proof as a tree. The script is a straight line until the parity
     split, which is the one place the argument actually branches, so that is
     the one place the picture branches too. `closedAt` is the step index by
     which a node's whole subtree is discharged. */
  var PROOF_TREE = {
    nodes: [
      { x: 0.07, y: 0.50, activeAt: 0, closedAt: 6 },
      { x: 0.26, y: 0.50, activeAt: 1, closedAt: 6 },
      { x: 0.45, y: 0.50, activeAt: 2, closedAt: 6 },
      { x: 0.63, y: 0.50, activeAt: 3, closedAt: 6 },
      { x: 0.86, y: 0.22, activeAt: 4, closedAt: 5, label: "i even" },
      { x: 0.86, y: 0.78, activeAt: 5, closedAt: 6, label: "i odd" }
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]]
  };

  function drawProofTree(canvas, step) {
    if (canvas.clientWidth < 40) return;
    var m = fitCanvas(canvas), ctx = m.ctx, w = m.w, h = m.h, pal = palette();
    var pad = 16;
    function pt(n) {
      return { x: pad + n.x * (w - pad * 2), y: pad + n.y * (h - pad * 2) };
    }

    ctx.clearRect(0, 0, w, h);

    /* edges first, so the nodes sit on top of them */
    ctx.lineWidth = 1;
    PROOF_TREE.edges.forEach(function (e) {
      var a = pt(PROOF_TREE.nodes[e[0]]), b = pt(PROOF_TREE.nodes[e[1]]);
      var reached = step >= PROOF_TREE.nodes[e[1]].activeAt;
      ctx.strokeStyle = reached ? pal.ink3 : pal.guide;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      /* a branch bows out so the two cases read as two paths, not one line */
      if (a.y !== b.y) ctx.quadraticCurveTo((a.x + b.x) / 2, b.y, b.x, b.y);
      else ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    PROOF_TREE.nodes.forEach(function (n) {
      var p = pt(n);
      var closed = step >= n.closedAt;
      var active = !closed && step === n.activeAt;
      var reached = step >= n.activeAt;

      /* knock the paper out behind each node so edges never show through */
      ctx.fillStyle = pal.paper;
      ctx.beginPath(); ctx.arc(p.x, p.y, 6.5, 0, Math.PI * 2); ctx.fill();

      if (closed) {
        ctx.fillStyle = pal.qed;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
      } else if (active) {
        ctx.fillStyle = pal.ballpoint;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = pal.ballpoint;
        ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = reached ? pal.ink3 : pal.ink4;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.stroke();
      }

      if (n.label) {
        ctx.fillStyle = closed ? pal.qed : (reached ? pal.ink3 : pal.ink4);
        ctx.font = '10px ' + '"IBM Plex Mono", monospace';
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(n.label, p.x + 11, p.y);
      }
    });
  }

  function initGoal(panel) {
    var bar = panel.querySelector(".goal-bar");
    var body = panel.querySelector(".goal-body");
    if (!bar || !body) return;

    panel.setAttribute("data-enhanced", "");

    var run = document.createElement("button");
    run.type = "button";
    run.className = "btn-tactic";

    var reset = document.createElement("button");
    reset.type = "button";
    reset.className = "goal-reset";
    reset.textContent = "reset";
    reset.hidden = true;

    bar.appendChild(run);
    bar.appendChild(reset);

    var step = 0;
    var tree = panel.parentNode.querySelector(".goal-tree canvas");
    if (tree) {
      onRepaint(function () { drawProofTree(tree, step); });
      window.addEventListener("resize", function () { drawProofTree(tree, step); });
    }

    function render() {
      if (tree) drawProofTree(tree, step);
      if (step < GOAL_STEPS.length) {
        var s = GOAL_STEPS[step];
        var hyp = document.createElement("span");
        hyp.className = "hyp";
        hyp.textContent = s.hyp.join("\n");
        var tgt = document.createElement("span");
        tgt.className = "goal-target";
        tgt.textContent = s.goal + " ";
        var cur = document.createElement("span");
        cur.className = "goal-cursor";
        cur.setAttribute("aria-hidden", "true");
        tgt.appendChild(cur);
        body.textContent = "";
        body.appendChild(hyp);
        body.appendChild(document.createTextNode("\n"));
        body.appendChild(tgt);
        run.disabled = false;
        run.textContent = s.tactic;
        panel.classList.remove("is-run");
        reset.hidden = (step === 0);
      } else {
        panel.classList.add("is-run");
        run.disabled = true;
        run.textContent = "✓ kernel accepted";
        reset.hidden = false;
      }
    }

    run.addEventListener("click", function () { if (step < GOAL_STEPS.length) { step++; render(); } });
    reset.addEventListener("click", function () { step = 0; render(); });

    /* On paper the reader cannot press anything, so print the closed proof */
    window.addEventListener("beforeprint", function () {
      step = GOAL_STEPS.length;
      render();
    });

    render();
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

      var total = 0;
      data.channels.forEach(function (ch) {
        var cell = root.querySelector('[data-platform="' + ch.platform + '"] .lg-count');
        if (typeof ch.followers === "number" && ch.followers > 0) total += ch.followers;
        if (!cell || typeof ch.followers !== "number") return;
        /* zero means "not written down yet", not "nobody follows this" */
        if (ch.followers <= 0) return;
        var text = ch.followers.toLocaleString();
        cell.setAttribute("data-empty", "false");
        onceInView(cell, function () { countUp(cell, ch.followers, text); }, 0.4);
      });

      var sumCell = root.querySelector("[data-ledger-total]");
      if (sumCell && total > 0) {
        var sumText = total.toLocaleString();
        sumCell.setAttribute("data-empty", "false");
        onceInView(sumCell, function () { countUp(sumCell, total, sumText); }, 0.4);
      }
    }, function () { /* dashes stay, links still work */ });
  }

  /* --- reading progress, written in Thue–Morse ---------------------------- */

  function initProgress() {
    var bar = document.querySelector("[data-progress]");
    if (!bar) return;
    /* the whole strip is always present; reading lights its boxes left to right,
       and scrolling back turns them off again. No stretching, just blinking in. */
    bar.style.width = "100%";
    var canvas = document.createElement("canvas");
    bar.appendChild(canvas);
    var ctx = canvas.getContext("2d");

    var STEP = 7, BOX = 4;
    var word = [], n = 0, max = 0, w = 0;

    function layout() {
      w = window.innerWidth;
      n = Math.ceil(w / STEP);
      word = thueMorse(n);
      var dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(2 * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = "2px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      var pal = palette();
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      var lit = Math.round(p * n);
      ctx.clearRect(0, 0, w, 2);
      ctx.fillStyle = pal.ink;
      for (var i = 0; i < n; i++) {
        if (i < lit) ctx.globalAlpha = word[i] ? 1 : 0.55;
        else ctx.globalAlpha = 0.12;
        ctx.fillRect(i * STEP, 0, BOX, 2);
      }
      ctx.globalAlpha = 1;
    }

    function measure() { max = document.documentElement.scrollHeight - window.innerHeight; }

    onRepaint(function () { layout(); draw(); });
    measure();
    window.addEventListener("scroll", draw, { passive: true });
    window.addEventListener("resize", function () { layout(); measure(); draw(); });
    window.setTimeout(function () { measure(); draw(); }, 600);
  }

  /* --- films: seamless muted loops, no player chrome ---------------------
     Each [data-film] video autoplays muted and loops while it is on screen and
     pauses when it scrolls away, so the shelf feels alive without a control bar.
     A click toggles play/pause for anyone who wants to stop one. Under
     prefers-reduced-motion nothing autoplays: the poster frame holds and a click
     starts it. Progressive enhancement: the muted/loop/autoplay attributes in the
     HTML already do the right thing with no JS at all. */
  function initFilms() {
    var films = document.querySelectorAll("[data-film]");
    if (!films.length) return;

    Array.prototype.forEach.call(films, function (v) {
      v.removeAttribute("controls");
      v.muted = true;
      v.setAttribute("tabindex", "0");
      v.style.cursor = "pointer";

      function toggle() {
        if (v.paused) { v.muted = true; v.play().catch(function () {}); }
        else { v.pause(); }
      }
      v.addEventListener("click", toggle);
      v.addEventListener("keydown", function (e) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); }
      });

      if (reduced) return;   /* no autoplay under reduced motion */

      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { v.muted = true; v.play().catch(function () {}); }
            else { v.pause(); }
          });
        }, { threshold: 0.35 }).observe(v);
      } else {
        v.muted = true; v.play().catch(function () {});
      }
    });
  }

  /* --- texview: the recompile button ------------------------------------
     The preview pane ships fully rendered in the HTML. Pressing recompile clears
     it to a one-line "compiling" beat, then re-reveals the same typeset formulas
     with a short stagger, the way Overleaf flashes when you hit the button.
     No-JS readers keep the finished render and never see the button do nothing:
     the button is only wired up here. */
  function initTexview() {
    var view = document.querySelector("[data-texview]");
    if (!view) return;
    var out = view.querySelector("[data-tv-out]");
    var run = view.querySelector("[data-tv-run]");
    if (!out || !run) return;

    var rendered = out.innerHTML;
    var busy = false;

    /* Hold the render in JS and empty the pane: an editor shows nothing until you
       press the button. The HTML shipped the finished solution, so a no-JS reader
       keeps it; only once we know JS runs do we take it away. */
    out.classList.add("tv-idle");
    out.innerHTML = '<span class="tv-wait">no output yet · press compile</span>';

    /* Paper has no buttons. Anyone printing the page gets the solution, not an
       empty pane waiting for a press that can never happen. */
    window.addEventListener("beforeprint", function () {
      if (out.classList.contains("tv-idle")) {
        out.classList.remove("tv-idle");
        out.innerHTML = rendered;
      }
    });

    function show() {
      out.classList.remove("tv-compiling", "tv-idle");
      out.innerHTML = rendered;
      run.innerHTML = "&#9654;&nbsp;recompile";
      if (reduced) { busy = false; run.removeAttribute("disabled"); return; }
      /* reflow so the animation restarts, then reveal */
      void out.offsetWidth;
      out.classList.add("tv-fresh");
      window.setTimeout(function () {
        out.classList.remove("tv-fresh");
        busy = false;
        run.removeAttribute("disabled");
      }, 500);
    }

    run.addEventListener("click", function () {
      if (busy) return;
      busy = true;
      run.setAttribute("disabled", "");

      if (reduced) {
        /* no beat under reduced motion: the output simply appears */
        show();
        return;
      }

      out.classList.remove("tv-fresh");
      out.classList.remove("tv-idle");
      out.classList.add("tv-compiling");
      out.innerHTML = '<span class="tv-wait">compiling…</span>';
      window.setTimeout(show, 380);
    });
  }

  /* --- keys: sections by number, and the board after dark ----------------- */

  function typingContext() {
    var el = document.activeElement;
    return !!(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" ||
      el.isContentEditable || el.hasAttribute("data-show")));
  }

  var fadeTimer = null;

  /* Flipping the board swaps every token at once, which snaps hard. Turn on
     colour transitions for the length of the swap only, so the page dissolves
     between the two palettes rather than cutting, then take them off again so
     nothing else on the page inherits a transition it did not ask for. */
  function crossfadeBoard() {
    if (reduced) return;
    var root = document.documentElement;
    root.classList.add("board-fading");
    if (fadeTimer) window.clearTimeout(fadeTimer);
    fadeTimer = window.setTimeout(function () {
      root.classList.remove("board-fading");
      fadeTimer = null;
    }, 300);
  }

  function applyBoard(on) {
    document.documentElement.classList.toggle("board", on);
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-board-toggle]"),
      function (b) { b.setAttribute("aria-pressed", on ? "true" : "false"); }
    );
    repaintAll();
  }

  function setBoard(on) {
    crossfadeBoard();
    applyBoard(on);
    try { window.localStorage.setItem("board", on ? "1" : "0"); } catch (err) {}
  }

  /* The print sheet forces the paper palette, but a canvas is a raster: a figure
     drawn in chalk stays chalk and prints as nothing on white. Drop the board for
     the duration of the print and redraw every figure in ink, then put it back. */
  function initPrint() {
    var wasBoard = false;
    window.addEventListener("beforeprint", function () {
      wasBoard = document.documentElement.classList.contains("board");
      if (wasBoard) {
        document.documentElement.classList.remove("board");
        repaintAll();
      }
    });
    window.addEventListener("afterprint", function () {
      if (wasBoard) {
        document.documentElement.classList.add("board");
        repaintAll();
        wasBoard = false;
      }
    });
  }

  function initKeys() {
    var map = {
      "1": "research.html", "2": "lean.html", "3": "manim.html",
      "4": "education.html", "5": "projects.html", "6": "cv.pdf",
      "0": "index.html"
    };

    try {
      if (window.localStorage.getItem("board") === "1") applyBoard(true);
    } catch (e) { /* private mode */ }

    /* the visible handle for the same switch the `b` key throws */
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-board-toggle]"),
      function (btn) {
        btn.addEventListener("click", function () {
          setBoard(!document.documentElement.classList.contains("board"));
        });
      }
    );

    document.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (typingContext()) return;

      if (e.key === "b" || e.key === "B") {
        setBoard(!document.documentElement.classList.contains("board"));
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
    initInkRows();
    initUlines();
    Array.prototype.forEach.call(document.querySelectorAll("[data-show]"), initShow);

    var fig0 = document.getElementById("figure-deltoid");
    if (fig0) plotter(fig0, { draw: deltoid, seconds: 5.6, hold: 1.6 });

    var fig1 = document.getElementById("figure-lorenz");
    if (fig1) plotter(fig1, { draw: lorenz, seconds: 11, hold: 2.4 });

    var fig2 = document.getElementById("figure-tmgrid");
    if (fig2) plotter(fig2, { draw: tmGrid, seconds: 3.2, hold: 2.6 });

    var mb = document.getElementById("figure-mandelbrot");
    if (mb) onRepaint(function () { mandelbrot(mb); });

    var turtle = document.getElementById("figure-turtle");
    if (turtle) plotter(turtle, { draw: tmTurtle, seconds: 6, hold: 2.4 });

    [["figure-walk", inkWalk], ["figure-attractor", attractor],
     ["figure-network", inkNetwork], ["figure-roots", cubicRoots]
    ].forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (el) onRepaint(function () { pair[1](el); });
    });

    var eg = document.querySelector("[data-edu-graph]");
    if (eg) eduGraph(eg);

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
    initFilms();
    initTexview();
    initProgress();
    initPrint();
    initKeys();

    /* A tab that boots in the background lays out at zero size, so anything
       measured from the DOM (the spiral numerals, the graph nodes) would be
       placed against nothing. Draw it all again the first time we are
       actually looked at. */
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") repaintAll();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
