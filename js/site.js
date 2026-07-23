/* site.js — Thue–Morse rules, the plate slideshow, and the drawn figures. */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var INK = "#211E17";
  var INK_FAINT = "rgba(33, 30, 23, 0.12)";
  var BALLPOINT = "#2358A7";
  var LAUREL = "#96772B";

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

  /* --- Thue–Morse --------------------------------------------------------
     t(n) = parity of the number of 1s in the binary expansion of n.
     0110100110010110... the word these rules are drawn from. */

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
    /* Observers and transitions are throttled while the tab is hidden, which
       would strand text at opacity 0. Nobody is watching an entrance they
       cannot see, so only hide content when the page is actually visible. */
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

    /* Last resort: whatever has not revealed by now gets its natural styles
       back. Content being readable outranks the entrance. */
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
    /* rAF and transitions are both suspended in a background tab. Reveal on a
       timer as well, then drop the classes so the hero rests at its natural
       styles no matter whether the transition ever ran. */
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

  /* --- a canvas that draws itself, then rests ----------------------------
     Shared plumbing for the plotted figures: DPR scaling, pause when
     off-screen, one static complete drawing under reduced motion. */

  function plotter(canvas, spec) {
    var ctx = canvas.getContext("2d");
    var w = 0, h = 0;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function paint(progress) {
      ctx.clearRect(0, 0, w, h);
      spec.draw(ctx, w, h, progress);
    }

    resize();

    if (reduced) {
      paint(1);
      window.addEventListener("resize", function () { resize(); paint(1); });
      return;
    }

    var p = 0, running = false, raf = null, last = null;
    var speed = 1 / spec.seconds;
    var hold = spec.hold || 1.4;
    var holding = 0;

    paint(0);

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

  /* --- fig. 0: a deltoid, from two epicycles -----------------------------
     p(t) = R1·e^{it} + R2·e^{−2it}, drawn the way you'd draw it on paper. */

  function deltoid(ctx, w, h, progress) {
    var R1 = 0.30, R2 = 0.15;
    var cx = w / 2, cy = h / 2, scale = Math.min(w, h);
    var TAU = Math.PI * 2;
    var upTo = progress * TAU;

    function point(t) {
      return {
        x: cx + scale * (R1 * Math.cos(t) + R2 * Math.cos(-2 * t)),
        y: cy + scale * (R1 * Math.sin(t) + R2 * Math.sin(-2 * t))
      };
    }

    ctx.strokeStyle = INK_FAINT;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, scale * (R1 + R2), 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = BALLPOINT;
    ctx.lineWidth = 1.75;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    var steps = 480;
    for (var s = 0; s <= steps; s++) {
      var t = (s / steps) * TAU;
      if (t > upTo) break;
      var pt = point(t);
      if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    if (progress < 1) {
      var tip = point(upTo);
      ctx.fillStyle = LAUREL;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 3.5, 0, TAU);
      ctx.fill();
    }
  }

  /* --- fig. 1: the Lorenz attractor --------------------------------------
     x' = σ(y−x), y' = x(ρ−z)−y, z' = xy−βz, integrated small-step and
     projected on the x–z plane. Two lobes, never once repeating. */

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

  function lorenz(ctx, w, h, progress) {
    var pts = lorenzPoints();
    var pad = 18;
    var sx = (w - pad * 2) / 46;
    var sy = (h - pad * 2) / 46;
    var s = Math.min(sx, sy);
    var cx = w / 2, cy = h / 2;

    function at(i) {
      return [cx + pts[i][0] * s, cy + (25 - pts[i][1]) * s];
    }

    /* the whole path, faint, the way a plotter's pencil guide would sit
       under the ink. Keeps the frame from ever being empty. */
    ctx.strokeStyle = INK_FAINT;
    ctx.lineWidth = 0.7;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    for (var g = 0; g < pts.length; g += 2) {
      var gp = at(g);
      if (g === 0) ctx.moveTo(gp[0], gp[1]); else ctx.lineTo(gp[0], gp[1]);
    }
    ctx.stroke();

    ctx.strokeStyle = BALLPOINT;
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
      ctx.fillStyle = LAUREL;
      ctx.beginPath();
      ctx.arc(tip[0], tip[1], 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* --- the Thue–Morse difference table ------------------------------------
     Ink the cell at (i, j) when t(i) and t(j) disagree. Since the parity of
     the binary digit sum adds under XOR, that cell is exactly t(i XOR j), so
     the whole square is one more picture of the same word. It comes out
     self-similar: every quadrant is the picture one size down, which is the
     doubling rule on the research page seen from above. */

  function tmGrid(ctx, w, h, progress) {
    var n = 32;
    var word = thueMorse(n);
    var side = Math.min(w, h);
    var cell = side / n;
    var ox = (w - side) / 2;
    var oy = (h - side) / 2;
    var rows = Math.ceil(n * progress);

    /* the finished square, faint, so the figure is never an empty box */
    ctx.fillStyle = INK;
    ctx.globalAlpha = 0.10;
    for (var gj = 0; gj < n; gj++) {
      for (var gi = 0; gi < n; gi++) {
        if (word[gi] !== word[gj]) {
          ctx.fillRect(ox + gi * cell, oy + gj * cell, cell + 0.5, cell + 0.5);
        }
      }
    }

    ctx.globalAlpha = 0.82;
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < n; i++) {
        if (word[i] !== word[j]) {
          ctx.fillRect(ox + i * cell, oy + j * cell, cell + 0.5, cell + 0.5);
        }
      }
    }
    ctx.globalAlpha = 1;

    if (progress < 1 && rows > 0) {
      ctx.fillStyle = LAUREL;
      ctx.fillRect(ox, oy + (rows - 1) * cell, side, 1.5);
    }
  }

  /* --- Ulam's spiral ------------------------------------------------------
     Walk the integers in a square spiral, ink a dot on the primes. The
     diagonals that show up are the whole point, and nobody knows why. */

  function ulam(canvas) {
    var ctx = canvas.getContext("2d");
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var w = rect.width, h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var cells = 41;
    var cell = Math.min(w, h) / cells;
    var dot = Math.max(1.4, cell * 0.30);
    var n = cells * cells;

    var sieve = new Uint8Array(n + 1);
    sieve[0] = sieve[1] = 1;
    for (var p = 2; p * p <= n; p++) {
      if (!sieve[p]) for (var m = p * p; m <= n; m += p) sieve[m] = 1;
    }

    var x = 0, y = 0, dx = 1, dy = 0, len = 1, done = 0;
    var cx = w / 2, cy = h / 2;
    ctx.fillStyle = INK;
    for (var k = 1; k <= n; k++) {
      if (!sieve[k]) {
        ctx.globalAlpha = 0.78;
        ctx.beginPath();
        ctx.arc(cx + x * cell, cy + y * cell, dot, 0, Math.PI * 2);
        ctx.fill();
      }
      x += dx; y += dy; done++;
      if (done === len) {
        done = 0;
        var t = dx; dx = -dy; dy = t;
        if (dy === 0) len++;
      }
    }
    ctx.globalAlpha = 1;
  }

  /* --- the 404 Mandelbrot, stippled once in ink --------------------------- */

  function mandelbrot(canvas) {
    var ctx = canvas.getContext("2d");
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var w = rect.width, h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

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
          ctx.fillStyle = INK;
          ctx.globalAlpha = 0.82;
          ctx.fillRect(px, py, step, step);
        } else if (it > 6) {
          ctx.fillStyle = INK;
          ctx.globalAlpha = Math.min(0.4, it / 90);
          ctx.fillRect(px, py, step, step);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  /* --- the goal panel, made runnable -------------------------------------
     The static markup already shows a closed proof, so this only ever
     *removes* something and offers to put it back. */

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

    apply.addEventListener("click", function () {
      if (gens.length - 1 < MAX) step();
    });
    back.addEventListener("click", function () {
      gens = ["0"];
      render();
    });

    gens = ["0"];
    render();
  }

  /* --- counting up -------------------------------------------------------- */

  function initCounts() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    if (reduced || document.visibilityState === "hidden") return;

    Array.prototype.forEach.call(els, function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var final = el.textContent;
      onceInView(el, function () {
        var start = null;
        var dur = 650;
        function tick(now) {
          if (start === null) start = now;
          var t = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - t, 3);
          if (t < 1) {
            el.textContent = Math.round(target * eased).toLocaleString();
            window.requestAnimationFrame(tick);
          } else {
            el.textContent = final;
          }
        }
        el.textContent = "0";
        window.requestAnimationFrame(tick);
        /* if rAF never runs, put the real number back */
        window.setTimeout(function () { el.textContent = final; }, 1500);
      }, 0.4);
    });
  }

  /* --- reading progress, written in Thue–Morse ---------------------------- */

  function initProgress() {
    var bar = document.querySelector("[data-progress]");
    if (!bar) return;
    var canvas = document.createElement("canvas");
    bar.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var w = 0;

    function paint() {
      w = window.innerWidth;
      var dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(2 * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = "2px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, 2);
      var word = thueMorse(Math.ceil(w / 7));
      for (var i = 0; i < word.length; i++) {
        ctx.fillStyle = word[i] ? INK : "rgba(33,30,23,0.28)";
        ctx.fillRect(i * 7, 0, 4, 2);
      }
    }

    /* scrollHeight forces layout, so measure it on resize and keep the scroll
       handler to arithmetic and one style write. Updating synchronously means
       the bar still tracks when rAF is throttled. */
    var max = 0;
    function measure() {
      max = document.documentElement.scrollHeight - window.innerHeight;
    }
    function update() {
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.width = (p * 100) + "%";
    }

    paint();
    measure();
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", function () { paint(); measure(); update(); });
    window.setTimeout(function () { measure(); update(); }, 600);
  }

  /* --- number keys -------------------------------------------------------- */

  function initKeys() {
    var map = {
      "1": "research.html", "2": "lean.html", "3": "manim.html",
      "4": "beyond.html", "5": "cv.html", "0": "index.html"
    };
    document.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      var el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" ||
                 el.isContentEditable || el.hasAttribute("data-show"))) return;
      var dest = map[e.key];
      if (dest) { window.location.href = dest; }
    });
  }

  /* --- boot --------------------------------------------------------------- */

  function boot() {
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
    if (mb) mandelbrot(mb);

    var us = document.getElementById("figure-ulam");
    if (us) ulam(us);

    var goal = document.querySelector(".goal");
    if (goal) initGoal(goal);

    var morph = document.querySelector("[data-morphism]");
    if (morph) initMorphism(morph);

    initCounts();
    initProgress();
    initKeys();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
