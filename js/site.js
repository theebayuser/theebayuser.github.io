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

    /* Marks already on the first screen all come into view at once, and three
       strokes drawing together reads as decoration. Those get an ordered delay
       so the eye follows them down the page; a mark scrolled to later draws at
       once, because a stagger there would just feel like lag. */
    var above = 0;
    Array.prototype.forEach.call(marks, function (el) {
      el.classList.add("uline-pre");
      var top = el.getBoundingClientRect().top;
      var wait = top < window.innerHeight ? 140 + (above++) * 220 : 140;
      onceInView(el, function () {
        window.setTimeout(function () { el.classList.add("uline-in"); }, wait);
        window.setTimeout(function () {
          el.classList.remove("uline-pre", "uline-in");
        }, wait + 960);
      }, 0.9);
    });

    /* last resort: never leave a phrase without its mark */
    window.setTimeout(function () {
      Array.prototype.forEach.call(marks, function (el) {
        el.classList.remove("uline-pre", "uline-in");
      });
    }, 9000);
  }

  /* The word art, made to answer the pointer. Every glyph gets its own span and
     its centre is cached once; a rAF-throttled move tints the letters inside two
     radii. Pointer devices only, and colour/weight only, so nothing reflows and
     a touch screen or a no-JS reader sees the same static block. */
  function initWordart() {
    var pre = document.querySelector(".wordart");
    if (!pre) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    var NEAR = 34, MID = 76;   /* radii in px, measured from the glyph centre */
    var cells = [];
    var raf = null, pending = null;

    /* wrap every glyph, keeping the <b>/<i> shading the markup already carries */
    function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.nodeValue.split("").forEach(function (ch) {
            if (ch === "\n") { frag.appendChild(document.createTextNode(ch)); return; }
            var sp = document.createElement("span");
            sp.textContent = ch;
            frag.appendChild(sp);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          wrap(child);
        }
      });
    }

    function measure() {
      cells = [];
      var box = pre.getBoundingClientRect();
      Array.prototype.forEach.call(pre.querySelectorAll("span"), function (sp) {
        if (sp.childNodes.length !== 1 || sp.firstChild.nodeType !== 3) return;
        var r = sp.getBoundingClientRect();
        if (!r.width) return;
        cells.push({
          el: sp,
          x: r.left - box.left + r.width / 2,
          y: r.top - box.top + r.height / 2,
          state: 0
        });
      });
    }

    function apply(mx, my) {
      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        var dx = c.x - mx, dy = c.y - my;
        var d2 = dx * dx + dy * dy;
        var want = d2 < NEAR * NEAR ? 2 : (d2 < MID * MID ? 1 : 0);
        if (want === c.state) continue;
        c.state = want;
        c.el.className = want === 2 ? "wa-near" : (want === 1 ? "wa-mid" : "");
      }
    }

    function onMove(e) {
      var box = pre.getBoundingClientRect();
      pending = [e.clientX - box.left, e.clientY - box.top];
      if (raf) return;
      raf = window.requestAnimationFrame(function () {
        raf = null;
        if (pending) apply(pending[0], pending[1]);
      });
    }

    var armed = false;
    function arm() {
      if (armed) return;
      armed = true;
      wrap(pre);
      pre.classList.add("wa-live");
      measure();
      pre.addEventListener("pointermove", onMove);
      window.addEventListener("resize", measure);
    }

    pre.addEventListener("pointerenter", function (e) { arm(); onMove(e); });
    pre.addEventListener("pointerleave", function () {
      pending = null;
      apply(-9999, -9999);
    });
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

  /* --- the curve glyph's helper (a deltoid, from two epicycles) ---------- */

  function deltoidPoint(t, cx, cy, scale) {
    var R1 = 0.30, R2 = 0.15;
    return {
      x: cx + scale * (R1 * Math.cos(t) + R2 * Math.cos(-2 * t)),
      y: cy + scale * (R1 * Math.sin(t) + R2 * Math.sin(-2 * t))
    };
  }

  /* --- a double pendulum ------------------------------------------------- */

  /* Two arms swinging under gravity. The equations are short, the motion is
     not: change the start by a hair and the path is different forever, which
     is the whole reason to animate it rather than post the finished curve.
     Integrated once with RK4 and cached, then replayed by the plotter. */

  var pendulumPath = null;

  function pendulumStates() {
    if (pendulumPath) return pendulumPath;

    var G = 9.81, L1 = 1, L2 = 1, M1 = 1, M2 = 1;

    /* y = [th1, w1, th2, w2] */
    function deriv(y) {
      var th1 = y[0], w1 = y[1], th2 = y[2], w2 = y[3];
      var d = th1 - th2;
      var den = 2 * M1 + M2 - M2 * Math.cos(2 * d);

      var a1 = (-G * (2 * M1 + M2) * Math.sin(th1)
                - M2 * G * Math.sin(th1 - 2 * th2)
                - 2 * Math.sin(d) * M2 * (w2 * w2 * L2 + w1 * w1 * L1 * Math.cos(d)))
               / (L1 * den);

      var a2 = (2 * Math.sin(d) * (w1 * w1 * L1 * (M1 + M2)
                + G * (M1 + M2) * Math.cos(th1)
                + w2 * w2 * L2 * M2 * Math.cos(d)))
               / (L2 * den);

      return [w1, a1, w2, a2];
    }

    function step(y, dt) {
      function add(a, b, k) {
        return [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k, a[3] + b[3] * k];
      }
      var k1 = deriv(y);
      var k2 = deriv(add(y, k1, dt / 2));
      var k3 = deriv(add(y, k2, dt / 2));
      var k4 = deriv(add(y, k3, dt));
      return [
        y[0] + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
        y[1] + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
        y[2] + dt / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
        y[3] + dt / 6 * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3])
      ];
    }

    /* a start with enough energy to go over the top, so the trace fills the
       disc rather than rocking in a corner of it */
    var y = [2.35, 0, 2.20, 0];
    var dt = 0.004, N = 3400;
    var out = new Float32Array(N * 4);   /* x1, y1, x2, y2 per frame */
    for (var i = 0; i < N; i++) {
      var x1 = L1 * Math.sin(y[0]), yy1 = L1 * Math.cos(y[0]);
      out[i * 4]     = x1;
      out[i * 4 + 1] = yy1;
      out[i * 4 + 2] = x1 + L2 * Math.sin(y[2]);
      out[i * 4 + 3] = yy1 + L2 * Math.cos(y[2]);
      y = step(y, dt);
    }
    pendulumPath = out;
    return out;
  }

  function pendulum(ctx, w, h, progress, pal) {
    var pts = pendulumStates();
    var N = pts.length / 4;
    var reach = 2.05;                       /* L1 + L2, plus a hair of margin */
    var s = Math.min(w, h) / (2 * reach) * 0.92;
    var cx = w / 2, cy = h / 2;   /* the reachable disc is centred on the pivot */

    function px(i) { return cx + pts[i * 4 + 2] * s; }
    function py(i) { return cy + pts[i * 4 + 3] * s; }

    /* the whole path, faint, so frame zero is never an empty box */
    ctx.strokeStyle = pal.guide;
    ctx.lineWidth = 1;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (var g = 0; g < N; g += 2) {
      if (g === 0) ctx.moveTo(px(g), py(g)); else ctx.lineTo(px(g), py(g));
    }
    ctx.stroke();

    var upTo = Math.max(1, Math.floor(progress * (N - 1)));

    ctx.strokeStyle = pal.ballpoint;
    ctx.lineWidth = 1.2;
    ctx.lineCap = "round";
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(px(0), py(0));
    for (var i = 1; i <= upTo; i++) ctx.lineTo(px(i), py(i));
    ctx.stroke();
    ctx.globalAlpha = 1;

    /* the mechanism itself, at the head of the trace */
    var jx = cx + pts[upTo * 4] * s, jy = cy + pts[upTo * 4 + 1] * s;
    var tx = px(upTo), ty = py(upTo);

    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(jx, jy); ctx.lineTo(tx, ty);
    ctx.stroke();

    ctx.fillStyle = pal.ink;
    ctx.beginPath(); ctx.arc(cx, cy, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(jx, jy, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pal.laurel;
    ctx.beginPath(); ctx.arc(tx, ty, 4.2, 0, Math.PI * 2); ctx.fill();
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

  /* The walk and the ink are separate, because the numerals are positioned from
     the whole prime list while only part of it has been drawn yet: the figure
     animates, the navigation on top of it must not move. */
  /* The cell size comes from the *height* and the width takes as many cells as
     it can hold, so a wide frame shows a band across the middle of the spiral
     rather than a square island with margins. The walk itself is unchanged and
     still runs k = 1, 2, 3, … outward; cells outside the band are simply not
     kept, which is what makes the band a real window onto the spiral and not a
     different figure. */
  function ulamWalk(w, h) {
    var cellsY = 41;
    var cell = h / cellsY;
    var cellsX = Math.max(cellsY, Math.ceil(w / cell));
    var halfX = cellsX / 2, halfY = cellsY / 2;
    /* walk the square that circumscribes the band, or its ends stay empty */
    var n = cellsX * cellsX;

    var sieve = new Uint8Array(n + 1);
    sieve[0] = sieve[1] = 1;
    for (var p = 2; p * p <= n; p++) {
      if (!sieve[p]) for (var mm = p * p; mm <= n; mm += p) sieve[mm] = 1;
    }

    var x = 0, y = 0, dx = 1, dy = 0, len = 1, done = 0;
    var cx = w / 2, cy = h / 2;
    var primes = [];

    for (var k = 1; k <= n; k++) {
      if (!sieve[k] && Math.abs(x) <= halfX && Math.abs(y) <= halfY) {
        primes.push({
          n: k, x: cx + x * cell, y: cy + y * cell, gx: x, gy: y
        });
      }
      x += dx; y += dy; done++;
      if (done === len) {
        done = 0;
        var t = dx; dx = -dy; dy = t;
        if (dy === 0) len++;
      }
    }

    return {
      primes: primes, maxRX: halfX, maxRY: halfY,
      dot: Math.max(1.4, cell * 0.30)
    };
  }

  /* How far the numeral stands off the prime it labels, and how much bare paper is
     cleared around the circled prime itself. The chip's own clearing is a rectangle
     taken from the chip, not a disc: clearing a disc at the prime while the chip sat
     34px away punched a visible hole beside every label and left the label itself on
     undisturbed stipple, which is exactly backwards. */
  var ULAM_LEAD = 34;
  var ULAM_CLEAR = 11;
  var ULAM_PAD = 6;
  /* The gap is measured from the chip's edge, not its centre, so the leader is the
     same length whichever way it points. Offsetting by a fixed radius instead left
     the sideways numerals almost touching their prime (the chip is 30px wide and
     24px tall) while the ones above and below had a clear stub of line. */
  var ULAM_GAP = 13;

  /* Stipple the primes in spiral order, out to `progress` of the way round.
     The field is the quiet layer here and the six anchored primes are the loud
     one, which is the opposite of how this figure first shipped: at alpha 0.78 the
     ornament was darker than the navigation drawn on top of it. Anchors also punch
     a clearing in the stipple and carry a leader out to their numeral, so a label
     never sits on top of its own subject. */
  function ulamDraw(ctx, walk, progress, anchors) {
    var upTo = Math.floor(walk.primes.length * (progress === undefined ? 1 : progress));
    var pal = palette();
    var marks = anchors || [];
    var i, k;

    ctx.fillStyle = pal.ink;
    ctx.globalAlpha = 0.66;
    for (i = 0; i < upTo; i++) {
      var pr = walk.primes[i];
      var clear = false;
      for (k = 0; k < marks.length; k++) {
        var mk = marks[k];
        if (mk.prime !== pr &&
            Math.hypot(mk.prime.x - pr.x, mk.prime.y - pr.y) < ULAM_CLEAR) {
          clear = true; break;
        }
        if (Math.abs(pr.x - mk.cx) < mk.hw + ULAM_PAD &&
            Math.abs(pr.y - mk.cy) < mk.hh + ULAM_PAD) {
          clear = true; break;
        }
      }
      if (clear) continue;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, walk.dot, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* Each anchor appears exactly when the walk reaches it, so the marks arrive
       with the ink rather than sitting on an empty frame. */
    for (k = 0; k < marks.length; k++) {
      var a = marks[k];
      if (walk.primes.indexOf(a.prime) >= upTo) continue;
      var px = a.prime.x, py = a.prime.y;
      var ring = walk.dot + 3.5;

      /* the prime stays ink and gets circled in pen, the way you would mark one on
         a printed table. A filled ballpoint blob was tried first and read as a UI
         pin dropped on the drawing rather than a mark made on it. */
      var out = (a.dist === undefined ? ULAM_LEAD : a.dist - a.half) - 1;
      ctx.strokeStyle = pal.ballpoint;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + Math.cos(a.off) * (ring + 2), py + Math.sin(a.off) * (ring + 2));
      ctx.lineTo(px + Math.cos(a.off) * out, py + Math.sin(a.off) * out);
      ctx.stroke();

      ctx.fillStyle = pal.ink;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(px, py, walk.dot, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, ring, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function ulam(canvas, progress) {
    var m = fitCanvas(canvas);
    var walk = ulamWalk(m.w, m.h);
    ulamDraw(m.ctx, walk, progress);
    return walk;
  }

  /* Pick six well-separated primes to hang the section numerals on, ordered
     **outward from the middle**: 01 on the smallest of the six, 06 on the largest.
     That is the figure's own logic rather than an arrangement, and because the walk
     runs outward too, it means the numerals land 01 through 06 in sequence as the
     spiral inks itself in.

     Distance is measured the way the walk measures it, per axis and by the larger
     of the two (`max`, not `hypot`), because Ulam's walk goes out in square rings:
     an elliptical radius would call a prime 40 cells east and one 20 cells north
     equally far out when the first arrives four times later in the walk. Angles are
     stepped by the golden angle so no two numerals share a flank at any count. */
  function pickAnchors(primes, maxRX, maxRY, count, side, w, h) {
    var GOLDEN = 2.399963;
    /* nominal chip half-extents, since nothing has been measured at pick time, and
       the clear space its **box** must keep from every frame edge. Testing the
       centre instead let a numeral's top edge come within 18px of the frame. */
    var NHW = 15, NHH = 13, MARGIN = 14;
    var apart = Math.max(52, Math.min(104, (side || 400) * 0.12));
    var cx = w / 2, cy = h / 2;

    /* The numeral stands off its prime rather than covering it. Straight out from
       the middle is the first choice, so the leader reads as radial; near an edge
       it swings around until the chip lands back on the paper. */
    function offsetFor(pr) {
      var base = (pr.gx || pr.gy) ? Math.atan2(pr.y - cy, pr.x - cx) : -Math.PI / 2;
      for (var t = 0; t < 8; t++) {
        var swing = t ? (t % 2 ? 1 : -1) * Math.ceil(t / 2) * (Math.PI / 4) : 0;
        var ang = base + swing;
        var dx = Math.cos(ang), dy = Math.sin(ang);
        var half = Math.min(
          Math.abs(dx) > 1e-6 ? NHW / Math.abs(dx) : Infinity,
          Math.abs(dy) > 1e-6 ? NHH / Math.abs(dy) : Infinity
        );
        var d = half + ULAM_GAP;
        var x = pr.x + dx * d, y = pr.y + dy * d;
        if (x - NHW >= MARGIN && x + NHW <= w - MARGIN &&
            y - NHH >= MARGIN && y + NHH <= h - MARGIN) return ang;
      }
      return null;
    }

    var picked = [];
    for (var i = 0; i < count; i++) {
      var tr = 0.22 + (i / (count - 1)) * 0.66;        /* 0.22 innermost … 0.88 out */
      var ta = -Math.PI / 2 + i * GOLDEN;
      var chosen = null;
      /* If nothing satisfies the spacing, loosen it and go again rather than return
         five numerals: this is navigation, and a missing section is not an option. */
      for (var pass = 0; pass < 4 && !chosen; pass++) {
        var room = apart * (1 - pass * 0.2);
        var bestCost = Infinity;
        /* eslint-disable no-loop-func */
        primes.forEach(function (pr) {
          var nx = pr.gx / maxRX, ny = pr.gy / maxRY;
          var rad = Math.max(Math.abs(nx), Math.abs(ny));
          var da = Math.atan2(ny, nx) - ta;
          da = Math.atan2(Math.sin(da), Math.cos(da));
          var cost = Math.abs(rad - tr) * 2.4 + Math.abs(da) / Math.PI;
          if (cost >= bestCost) return;
          var clash = picked.some(function (q) {
            return Math.hypot(q.prime.x - pr.x, q.prime.y - pr.y) < room;
          });
          if (clash) return;
          var off = offsetFor(pr);
          if (off === null) return;
          bestCost = cost;
          chosen = { prime: pr, off: off };
        });
        /* eslint-enable no-loop-func */
      }
      if (chosen) picked.push(chosen);
    }

    /* Assign them to 01…06 by where they actually fall in the walk, so the claim
       "01 is the smallest of the six" is true by construction and not by hoping the
       targets came out in order. */
    picked.sort(function (a, b) { return a.prime.n - b.prime.n; });
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

    /* The walk inks itself in over ~2.6s on first view and then rests. It does
       not loop like the other plotted figures: this one is the contents, and
       numerals that kept disappearing would be navigation that comes and goes. */
    var DRAW_MS = 2600;
    var ctx = null, walk = null, view = { w: 0, h: 0 };
    var anchors = [];               /* the six primes the numerals are filed on */
    var lands = [];                 /* chip i lands when the walk passes lands[i] */
    var p = 1;                      /* 1 until the animation actually takes over */

    function layout() {
      var side = Math.min(canvas.clientWidth, canvas.clientHeight);
      if (side < 40) return false;           /* not laid out yet; try again when it is */
      var m = fitCanvas(canvas);
      ctx = m.ctx; view = { w: m.w, h: m.h };
      walk = ulamWalk(m.w, m.h);
      anchors = pickAnchors(walk.primes, walk.maxRX, walk.maxRY, chips.length, side, m.w, m.h);
      lands = [];
      Array.prototype.forEach.call(chips, function (chip, i) {
        var a = anchors[i];
        if (!a) { chip.style.display = "none"; return; }
        chip.style.display = "";
        /* Measured, so the clearing is the chip's real footprint and the standoff is
           its real edge. A chip that has not laid out yet falls back to its CSS
           minimum rather than collapsing onto the prime. */
        a.hw = (chip.offsetWidth || 30) / 2;
        a.hh = (chip.offsetHeight || 24) / 2;
        var dx = Math.cos(a.off), dy = Math.sin(a.off);
        /* where the leader leaves the chip: the ray from its centre meets its box */
        a.half = Math.min(
          Math.abs(dx) > 1e-6 ? a.hw / Math.abs(dx) : Infinity,
          Math.abs(dy) > 1e-6 ? a.hh / Math.abs(dy) : Infinity
        );
        a.dist = a.half + ULAM_GAP;
        /* the numeral stands off the prime at the end of its leader, never on it */
        a.cx = a.prime.x + dx * a.dist;
        a.cy = a.prime.y + dy * a.dist;
        chip.style.left = a.cx + "px";
        chip.style.top = a.cy + "px";
        chip.title = "prime " + a.prime.n;
        chip.setAttribute("data-prime", a.prime.n);
        lands[i] = walk.primes.indexOf(a.prime) / walk.primes.length;
      });
      return true;
    }

    function land() {
      Array.prototype.forEach.call(chips, function (chip, i) {
        if (p >= (lands[i] === undefined ? 0 : lands[i])) chip.classList.remove("spiral-pre");
      });
    }

    function paint() {
      if (!walk) return;
      ctx.clearRect(0, 0, view.w, view.h);
      ulamDraw(ctx, walk, p, anchors);
    }

    /* a repaint (the night board, a resize) redraws whatever is drawn so far,
       never jumps the figure to finished mid-walk */
    function redraw() { if (layout()) { paint(); land(); } }

    var started = false, done = false;

    /* Finishing must also stop the loop. A failsafe that only sets p = 1 gets
       overwritten by the next frame, which is how this first shipped: the
       contents sat permanently half drawn with the numerals outside the ink. */
    function finish() {
      if (done) return;
      done = true;
      p = 1;
      redraw();
    }

    function run() {
      started = true;
      var t0 = null;
      function frame(now) {
        if (done) return;
        if (t0 === null) t0 = now;
        p = Math.min(1, (now - t0) / DRAW_MS);
        paint();
        land();
        if (p < 1) window.requestAnimationFrame(frame);
        else done = true;
      }
      window.requestAnimationFrame(frame);
    }

    /* Fails open, like every other reveal here: the hiding class is added by JS,
       so no-JS and reduced-motion readers get the finished contents, and a page
       booted in a background tab never engages the walk at all. Decided before
       the first paint, or the finished figure flashes and then restarts. */
    var animate = !reduced && document.visibilityState !== "hidden";
    if (animate) {
      p = 0;
      Array.prototype.forEach.call(chips, function (chip) {
        chip.classList.add("spiral-pre");
      });
    }

    onRepaint(redraw);
    window.addEventListener("resize", redraw);

    /* Paper never shows a half-finished widget. The walk only starts when the figure
       comes into view, so printing from the top of the page used to put the six
       numerals on a blank frame; the contents are the one figure that must be whole. */
    window.addEventListener("beforeprint", finish);

    if (animate) {
      onceInView(canvas, run, 0.25);
      /* Two last resorts, and they are different cases. A walk that started and
         stalled gets 8s, like every other reveal on the site. A walk that never
         started, because the reader has not scrolled this far, gets much longer:
         cutting it off at 8s would mean nobody who reads the abstract slowly
         ever sees the contents draw. Either way the numerals are navigation and
         must not stay hidden. */
      window.setTimeout(function () { if (started) finish(); }, 8000);
      window.setTimeout(finish, 20000);
    }

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

  /* The positions are hand-placed but not arbitrary: they were moved until no edge
     crosses a chip it does not belong to. Because the chips are opaque, an edge
     passing behind one vanishes and reappears, which reads as piercing the label,
     and five edges were doing it. Six nodes shifted (college, discrete structures,
     calculus, linear algebra, Lean, combinatorics) to open real corridors; the two
     chains and every edge are unchanged. Measured at the 876px layout: every edge
     now clears every unrelated chip by at least 18px and no two chips come within
     36px. Re-check that if a label's wording changes, because the chip widths are
     what the clearances are made of. */
  var EDU_NODES = [
    { x: 0.06, y: 0.22, t: "Dougherty Valley",
      kind: "Dougherty Valley High School", when: "2023 \u2013 2027",
      body: "My high school in San Ramon, California. I graduate in June 2027 with a 4.5 GPA.",
      more: "#schools", moreText: "schools" },
    { x: 0.06, y: 0.76, t: "AMC \u00b7 AIME",
      kind: "AMC 10/12 and AIME", when: "2023 \u2013 2026",
      body: "The AMC is the entry point for competition math in the US, and the AIME is the round after it. I have qualified for the AIME three times and made Distinguished Honor Roll on the AMC.",
      more: "#results", moreText: "results" },
    { x: 0.28, y: 0.10, t: "AP CS A \u00b7 CS P",
      kind: "AP Computer Science A and Principles", when: "2024 \u2013 2026",
      body: "My first real programming classes. Writing code that either compiles or does not turned out to be good preparation for a proof assistant.",
      more: "#coursework", moreText: "coursework" },
    { x: 0.28, y: 0.43, t: "college, concurrent",
      kind: "Cerro Coso and San Diego City College", when: "2025 \u2013 2027",
      body: "Concurrent enrollment means taking college classes for college credit while still in high school. I do it because the math I want is not offered at my school.",
      more: "#schools", moreText: "schools" },
    { x: 0.28, y: 0.76, t: "olympiad, self-taught",
      kind: "Olympiad mathematics, self-taught", when: "2025 \u2013 2026",
      body: "Combinatorics, number theory, algebra, and geometry. There is no class for any of it, so all of it came from books, handouts, and old contests.",
      more: "#coursework", moreText: "self-taught" },
    { x: 0.32, y: 0.60, t: "discrete structures",
      kind: "Discrete structures", when: "college",
      body: "Induction, counting, graphs, and formal proof writing. This is the class where I first had to write proofs properly instead of explaining them out loud.",
      more: "#coursework", moreText: "coursework" },
    { x: 0.56, y: 0.11, t: "calculus 1\u20133",
      kind: "Calculus 1 through 3", when: "college",
      body: "Single variable through multivariable calculus. Useful everywhere, and a good reminder that computing something and proving it are different skills.",
      more: "#coursework", moreText: "coursework" },
    { x: 0.52, y: 0.44, t: "linear algebra, ODEs",
      kind: "Linear algebra and differential equations", when: "college",
      body: "Linear algebra is about structure: bases, maps, and what stays fixed when everything else changes. Differential equations put that structure to work.",
      more: "#coursework", moreText: "coursework" },
    { x: 0.53, y: 0.84, t: "USAMO 2026",
      kind: "USA Mathematical Olympiad", when: "2026",
      body: "The USAMO is the national olympiad, invitation only through the AMC and AIME. Six proof-based problems over nine hours across two days. I qualified in 2026.",
      more: "#results", moreText: "results" },
    { x: 0.80, y: 0.34, t: "words + avoidance",
      kind: "Combinatorics on words", when: "2025 \u2013 present",
      body: "The study of infinite sequences of symbols and which patterns they can avoid forever. This is where both chains meet, and it is the research I actually do.",
      more: "research.html", moreText: "the research" },
    { x: 0.82, y: 0.68, t: "Lean 4 \u00b7 Mathlib",
      kind: "Lean 4 and Mathlib", when: "2025 \u2013 present",
      body: "Lean is a proof assistant and Mathlib is its crowdsourced library of formalized mathematics. I taught myself both from the manual and a lot of error messages.",
      more: "lean.html", moreText: "the formalization" },
    { x: 0.77, y: 0.88, t: "combinatorics, proof writing",
      kind: "Combinatorics and proof writing", when: "college",
      body: "A branch off the linear algebra term: organized casework, generating functions, and writing arguments meant to be checked rather than believed. These are the habits research runs on.",
      more: "#coursework", moreText: "coursework" }
  ];

  var EDU_EDGES = [
    [0, 2], [0, 3], [1, 4], [4, 8], [3, 5], [3, 6], [6, 7],
    [2, 10], [5, 10], [7, 9], [8, 9], [9, 10], [7, 11]
  ];

  /* Who required whom. A prerequisite chart is a directed graph and the direction is
     the whole content of it, so both are precomputed once and every reachable node
     upstream and downstream of a selection is what the drawing actually highlights.
     Adjacent edges alone, which is what this used to light, answer a much less
     interesting question than "what did this need, and where did it lead". */
  function eduRelations() {
    var parents = EDU_NODES.map(function () { return []; });
    var kids = EDU_NODES.map(function () { return []; });
    EDU_EDGES.forEach(function (e) { kids[e[0]].push(e[1]); parents[e[1]].push(e[0]); });
    function reach(from, via) {
      var seen = {}, queue = via[from].slice();
      while (queue.length) {
        var n = queue.shift();
        if (seen[n]) continue;
        seen[n] = true;
        queue = queue.concat(via[n]);
      }
      return seen;
    }
    return {
      parents: parents, kids: kids,
      up: EDU_NODES.map(function (nd, i) { return reach(i, parents); }),
      down: EDU_NODES.map(function (nd, i) { return reach(i, kids); })
    };
  }

  /* Where the ray leaving a box's centre crosses its edge. Edges are clipped to this
     at both ends so a line never runs under a label and out the far side, which is
     what made the chart read as a tangle: the chips are opaque, so an edge crossing
     one looked exactly like an edge piercing it. */
  function boxExit(hw, hh, dx, dy) {
    var tx = Math.abs(dx) > 1e-6 ? hw / Math.abs(dx) : Infinity;
    var ty = Math.abs(dy) > 1e-6 ? hh / Math.abs(dy) : Infinity;
    return Math.min(tx, ty);
  }

  function eduGraph(root) {
    var wrap = root.querySelector(".graph-wrap");
    var canvas = wrap && wrap.querySelector("canvas");
    var pop = root.querySelector(".node-pop");
    if (!canvas || !pop) return;

    var rel = eduRelations();
    var here = 9;
    var preview = -1;               /* hovered node: highlights without taking the card */

    var chips = EDU_NODES.map(function (nd, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "node-chip";
      b.textContent = nd.t;
      b.setAttribute("aria-pressed", i === here ? "true" : "false");
      wrap.appendChild(b);
      b.addEventListener("click", function () { select(i); });
      /* Hover shows the chain but never rewrites the card: a card that changed under
         a moving pointer would flicker its way across the whole figure. */
      b.addEventListener("pointerenter", function () { preview = i; draw(); });
      b.addEventListener("pointerleave", function () { preview = -1; draw(); });
      b.addEventListener("keydown", function (e) { onKey(e, i); });
      return b;
    });

    /* Wide, the chart reads left to right as two chains meeting. Narrow, that
       cannot fit, so the same nodes stack into one column in the order they
       actually happened. Same graph, same edges, one turn of the page.

       The flip used to be a bare `w < 560` in here, which was both too late and in
       the wrong units. The chips are a fixed pixel size while their positions are
       fractions of the width, so at a 652px canvas "college, concurrent" and
       "linear algebra, ODEs" came within 2px of each other and the chart was
       unreadable across the whole 560-to-760 band. It is also CSS, not JS, that
       turns the box from 2:1 into the tall 3:5 the column needs, so the two have to
       flip on the same signal or one of them lays twelve rows out inside a wide
       box. Both now read the same 760px query. */
    var narrowQ = window.matchMedia("(max-width: 760px)");
    function isNarrow() { return narrowQ.matches; }
    var EDU_COLUMN = [0, 2, 3, 6, 7, 11, 5, 1, 4, 8, 9, 10];

    function pt(i, w, h) {
      if (isNarrow()) {
        var row = EDU_COLUMN.indexOf(i);
        return {
          x: w / 2,
          y: 20 + (row / (EDU_COLUMN.length - 1)) * (h - 40)
        };
      }
      return { x: 20 + EDU_NODES[i].x * (w - 40), y: 18 + EDU_NODES[i].y * (h - 36) };
    }

    /* The chip IS the node. It used to sit 20px off a 2.4px dot, which left every
       label floating beside a mark it did not obviously own. */
    function place(w, h) {
      var boxes = [];
      chips.forEach(function (chip, i) {
        var p = pt(i, w, h);
        var hw = chip.offsetWidth / 2, hh = chip.offsetHeight / 2;
        /* keep the whole label on the paper: a node near an edge would
           otherwise hang its chip off the side of the figure */
        var x = Math.min(Math.max(p.x, hw + 2), w - hw - 2);
        chip.style.left = x + "px";
        chip.style.top = p.y + "px";
        boxes[i] = { x: x, y: p.y, hw: hw, hh: hh };
      });
      return boxes;
    }

    function arrow(ctx, x, y, ang) {
      var HEAD = 7, SPREAD = 0.42;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - Math.cos(ang - SPREAD) * HEAD, y - Math.sin(ang - SPREAD) * HEAD);
      ctx.lineTo(x - Math.cos(ang + SPREAD) * HEAD, y - Math.sin(ang + SPREAD) * HEAD);
      ctx.closePath();
      ctx.fill();
    }

    function draw() {
      if (canvas.clientWidth < 40) return;   /* not laid out yet */
      var m = fitCanvas(canvas);
      var ctx = m.ctx, w = m.w, h = m.h;
      var pal = palette();
      var narrow = isNarrow();
      var boxes = place(w, h);

      /* A hovered node previews its chain; with nothing hovered the selection owns
         the drawing. Either way exactly one node is the subject. */
      var focus = preview >= 0 ? preview : here;
      var soft = preview >= 0 && preview !== here;
      var up = rel.up[focus], down = rel.down[focus];

      /* off first, then descendants, then the required chain on top, so the line a
         reader is meant to follow is never crossed by a faded one */
      var lanes = [[], [], []];
      EDU_EDGES.forEach(function (e) {
        var lane = 0;
        if ((up[e[0]] || e[0] === focus) && (up[e[1]] || e[1] === focus)) lane = 2;
        else if ((down[e[0]] || e[0] === focus) && (down[e[1]] || e[1] === focus)) lane = 1;
        lanes[lane].push(e);
      });

      lanes.forEach(function (group, lane) {
        ctx.strokeStyle = lane ? pal.ballpoint : pal.guide;
        ctx.fillStyle = lane ? pal.ballpoint : pal.guide;
        ctx.lineWidth = lane === 2 ? 1.4 : 1;
        ctx.globalAlpha = lane === 1 ? 0.45 : (soft && lane === 2 ? 0.7 : 1);
        group.forEach(function (e) {
          var a = boxes[e[0]], b = boxes[e[1]];
          var mx, my;
          if (narrow) {
            /* one column: bow each edge out to the side so a long jump between
               chains is visibly a different edge from a step to the next row */
            var rows = Math.abs(EDU_COLUMN.indexOf(e[1]) - EDU_COLUMN.indexOf(e[0]));
            mx = a.x + (e[0] % 2 ? -1 : 1) * Math.min(w * 0.34, 14 + rows * 16);
            my = (a.y + b.y) / 2;
          } else {
            /* Bow in proportion to the span. Clipping fixes the ends of an edge but
               not its middle, and the long diagonal from USAMO up to the research
               used to run straight through the "combinatorics, proof writing" chip,
               which reads as piercing it because the chip is opaque. A deeper bow
               carries the long edges over the labels between their endpoints. */
            mx = (a.x + b.x) / 2;
            my = (a.y + b.y) / 2 - Math.abs(b.x - a.x) * 0.22;
          }

          /* clip both ends to the chips, leaving the arrowhead just off the border */
          var d0x = mx - a.x, d0y = my - a.y;
          var t0 = boxExit(a.hw, a.hh, d0x, d0y) + 3;
          var n0 = Math.hypot(d0x, d0y) || 1;
          var sx = a.x + (d0x / n0) * t0, sy = a.y + (d0y / n0) * t0;

          var d1x = b.x - mx, d1y = b.y - my;
          var t1 = boxExit(b.hw, b.hh, d1x, d1y) + 4;
          var n1 = Math.hypot(d1x, d1y) || 1;
          var ex = b.x - (d1x / n1) * t1, ey = b.y - (d1y / n1) * t1;

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(mx, my, ex, ey);
          ctx.stroke();
          arrow(ctx, ex, ey, Math.atan2(d1y, d1x));
        });
      });
      ctx.globalAlpha = 1;

      /* one attribute per chip, so the states cannot drift out of step */
      chips.forEach(function (chip, i) {
        chip.setAttribute("data-rel",
          i === focus ? "self" : up[i] ? "up" : down[i] ? "down" : "off");
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

      /* Counted from the graph, never written down, so the line cannot drift out of
         agreement with the edges the reader is looking at. */
      function tally(set) {
        var n = 0;
        for (var k in set) if (set[k]) n++;
        return n;
      }
      var needed = tally(rel.up[i]), led = tally(rel.down[i]);
      var chain = document.createElement("p");
      chain.className = "np-chain";
      chain.textContent = needed === 0 && led === 0
        ? "stands on its own"
        : "needed " + needed + " · led to " + led;

      var more = document.createElement("p");
      more.className = "np-more";
      var link = document.createElement("a");
      link.href = nd.more;
      link.textContent = nd.moreText + " ↓";
      if (nd.more.indexOf("#") !== 0) link.textContent = nd.moreText + " →";
      more.appendChild(link);

      pop.appendChild(head);
      pop.appendChild(chain);
      pop.appendChild(body);
      pop.appendChild(more);
      draw();
    }

    /* Walking the chart with the keyboard should follow the chart, not the DOM: left
       and right step along the prerequisite direction, up and down move between the
       nodes sharing a column. Tab order stays the platform's, on real buttons. */
    function onKey(e, i) {
      var go = -1;
      var step = e.key === "ArrowDown" ? 1 : -1;
      if (e.key === "ArrowLeft") go = rel.parents[i][0];
      else if (e.key === "ArrowRight") go = rel.kids[i][0];
      else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        if (isNarrow()) {
          /* stacked, the only neighbours are the rows above and below */
          var row = EDU_COLUMN.indexOf(i);
          go = EDU_COLUMN[row + step];
        } else {
          /* Grouped by column with a loose tolerance: the nodes in a column no
             longer share an exact x, because several were nudged apart to open
             corridors for the edges. */
          var col = EDU_NODES
            .map(function (nd, k) { return { k: k, x: nd.x, y: nd.y }; })
            .filter(function (n) { return Math.abs(n.x - EDU_NODES[i].x) < 0.05; })
            .sort(function (a, b) { return a.y - b.y; });
          var at = col.map(function (n) { return n.k; }).indexOf(i);
          var next = col[at + step];
          if (next) go = next.k;
        }
      } else return;

      e.preventDefault();
      if (go === undefined || go < 0) return;
      select(go);
      chips[go].focus();
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
    /* R was 2.6 and left the structure sitting in the middle 40% of the frame as a
       pale haze. Almost every root of a small integer cubic lies inside |z| < 2,
       so the outer plane was empty paper; this is a crop, not a change to the
       mathematics, and out-of-frame points were already being skipped. */
    var N = 5, R = 1.9;                 /* coefficients in -N..N, view radius R */
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
    ctx.globalAlpha = 0.3;
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
      goal: "\u22a2 OverlapFree w",
      tactic: "rw [hw]" },
    { hyp: ["w : Word Bool", "hw : w = thueMorse"],
      goal: "\u22a2 OverlapFree thueMorse",
      tactic: "intro u hu hov" },
    { hyp: ["u : Word Bool", "hu : 0 < u.length", "hov : Overlaps u thueMorse"],
      goal: "\u22a2 False",
      tactic: "exact parity_clash hu hov" }
  ];

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

    function render() {
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

    /* The static HTML ships six generations as plain text, so a no-JS reader
       sees the word growing. JS replaces that with the derivation view: same
       content, but the substitution is visible instead of implied. */
    var panel = document.createElement("div");
    panel.className = "morph";
    out.parentNode.insertBefore(panel, out);
    out.remove();

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
    panel.parentNode.insertBefore(bar, panel.nextSibling);

    var gens = ["0"];

    /* one glyph, inked by which letter it is */
    function glyph(ch) {
      var el = document.createElement(ch === "1" ? "b" : "i");
      el.textContent = ch;
      return el;
    }

    /* A row. `paired` groups the letters two at a time and rules each pair off
       underneath, so you can see which parent letter each pair came from. */
    function row(word, n, paired) {
      var g = document.createElement("div");
      g.className = "morph-gen";

      var lab = document.createElement("span");
      lab.className = "morph-lab";
      lab.textContent = "n = " + n + " · " + word.length +
        (word.length === 1 ? " letter" : " letters");

      var w = document.createElement("span");
      w.className = "morph-word";

      if (paired) {
        for (var k = 0; k < word.length; k += 2) {
          var pair = document.createElement("span");
          pair.className = "morph-pair";
          pair.appendChild(glyph(word.charAt(k)));
          if (k + 1 < word.length) pair.appendChild(glyph(word.charAt(k + 1)));
          pair.style.animationDelay = Math.min(k * 12, 600) + "ms";
          w.appendChild(pair);
        }
      } else {
        for (var i2 = 0; i2 < word.length; i2++) w.appendChild(glyph(word.charAt(i2)));
      }

      g.appendChild(lab);
      g.appendChild(w);
      return g;
    }

    function render(grew) {
      panel.textContent = "";
      gens.forEach(function (word, n) {
        var isLast = n === gens.length - 1;
        var g = row(word, n, grew && isLast && n > 0);
        if (isLast) g.className += " is-new";
        panel.appendChild(g);
      });
      var n = gens.length - 1;
      meta.textContent = n >= MAX
        ? "generation " + n + " · the fixed point continues forever"
        : "";
      apply.disabled = n >= MAX;
    }

    function step() {
      var last = gens[gens.length - 1];
      var next = "";
      for (var i3 = 0; i3 < last.length; i3++) {
        next += last.charAt(i3) === "0" ? "01" : "10";
      }
      gens.push(next);
      render(true);
    }

    apply.addEventListener("click", function () { if (gens.length - 1 < MAX) step(); });
    back.addEventListener("click", function () { gens = ["0"]; render(false); });

    /* Open on the same six generations the static HTML ships, so turning JS on
       never shows less than turning it off. Reset still goes back to one letter. */
    while (gens.length < 6) {
      var seed = gens[gens.length - 1], grown = "";
      for (var q = 0; q < seed.length; q++) grown += seed.charAt(q) === "0" ? "01" : "10";
      gens.push(grown);
    }
    render(false);
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
    var reachEls = document.querySelectorAll("[data-reach-total]");
    if (!root && !nowEls.length && !reachEls.length) return;

    loadLedger().then(function (data) {
      if (nowEls.length && data.now) {
        Array.prototype.forEach.call(nowEls, function (el) { el.textContent = data.now; });
      }

      /* The headline figure and the ledger read from the same file, so the claim
         at the top of the page and the account at the foot cannot disagree. */
      if (reachEls.length && data.channels) {
        var reachSum = 0;
        data.channels.forEach(function (ch) {
          if (typeof ch.followers === "number" && ch.followers > 0) reachSum += ch.followers;
        });
        if (reachSum > 0) {
          var reachText = reachSum.toLocaleString();
          Array.prototype.forEach.call(reachEls, function (el) {
            el.setAttribute("data-count", String(reachSum));
            onceInView(el, function () { countUp(el, reachSum, reachText); }, 0.4);
          });
        }
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

      /* Hover-scrub: with a fine pointer, dragging across the frame seeks the
         reel, so a film becomes something you can read at your own pace rather
         than only watch. A hairline under the frame shows where you are.
         Touch keeps tap-to-toggle, since there is no hover to key it off. */
      var plate = v.closest(".plate");
      if (plate && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        var scrub = document.createElement("div");
        scrub.className = "plate-scrub";
        var fill = document.createElement("i");
        scrub.appendChild(fill);
        v.parentNode.insertBefore(scrub, v.nextSibling);

        var seeking = false, lastSeek = 0;

        /* Throttled on the clock rather than on rAF: this is direct manipulation,
           and rAF is throttled in a background tab, which would leave the reel
           frozen under a moving cursor. Seeking is cheap; 40ms is smooth. */
        v.addEventListener("pointermove", function (e) {
          if (e.pointerType !== "mouse") return;
          var r = v.getBoundingClientRect();
          if (!r.width) return;

          if (!seeking) {
            seeking = true;
            plate.classList.add("is-scrubbing");
            v.pause();
          }
          /* the hairline rides the foot of the frame */
          scrub.style.top = (v.offsetTop + v.offsetHeight - 2) + "px";

          var want = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
          fill.style.width = (want * 100).toFixed(1) + "%";

          var now = e.timeStamp || Date.now();
          if (now - lastSeek < 40) return;
          lastSeek = now;
          if (v.duration && isFinite(v.duration)) {
            v.currentTime = Math.max(0, Math.min(v.duration - 0.05, want * v.duration));
          }
        });

        v.addEventListener("pointerleave", function () {
          if (!seeking) return;
          seeking = false;
          plate.classList.remove("is-scrubbing");
          if (!reduced) { v.muted = true; v.play().catch(function () {}); }
        });
      }

      if (reduced) return;   /* no autoplay under reduced motion */

      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            /* a reel being scrubbed must not be restarted by the observer */
            if (e.isIntersecting) {
              if (!e.target.closest(".plate.is-scrubbing")) {
                v.muted = true; v.play().catch(function () {});
              }
            } else { v.pause(); }
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

  /* --- the desk you can move ----------------------------------------------
     The stack was already "the work as it sits on a desk", but the only thing you
     could do to a sheet was click it. Now a sheet can be picked up and put down
     anywhere on the page, which is what the metaphor was claiming all along.

     Pointer-only, and deliberately so: dragging needs `touch-action: none`, which
     would take vertical scrolling away over the stack, and a portfolio you cannot
     scroll on a phone is broken. Same restriction the word art and the film scrub
     already use. Touch keeps tap-to-open. */

  function initDesk() {
    var stack = document.querySelector("[data-desk]");
    var note = document.querySelector("[data-desk-note]");
    if (!stack || !note) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    var sheets = Array.prototype.slice.call(stack.querySelectorAll(".sheet"));
    if (!sheets.length) return;

    var KEY = "desk";
    var DEAD = 6;                   /* same deadband as the bar-hide listener */
    var EDGE = 8;
    var offs = sheets.map(function () { return { x: 0, y: 0 }; });
    var docW = 0, docH = 0;

    /* Measured before any stored offset is applied. Clamping keeps every sheet
       inside this box, so the box never grows and the number stays good: a
       transform does not reflow, but it does extend the scrollable overflow, and
       an unclamped drag would add scrollbars to the page. */
    function measure() {
      docW = document.documentElement.scrollWidth;
      docH = document.documentElement.scrollHeight;
    }

    /* the independent `translate` property, so the fan rotation in `transform` is
       never touched — see the note above `.sheet` in the stylesheet */
    function set(el, i, x, y) {
      offs[i].x = x; offs[i].y = y;
      el.style.translate = x || y ? x + "px " + y + "px" : "";
    }

    /* the sheet's page-space box with its own offset taken back out */
    function homeBox(el, i) {
      var r = el.getBoundingClientRect();
      return {
        left: r.left + window.pageXOffset - offs[i].x,
        top: r.top + window.pageYOffset - offs[i].y,
        w: r.width, h: r.height
      };
    }

    function clampTo(box, x, y) {
      x = Math.max(EDGE - box.left, Math.min(x, docW - EDGE - box.left - box.w));
      y = Math.max(EDGE - box.top, Math.min(y, docH - EDGE - box.top - box.h));
      return [x, y];
    }

    function save() {
      try { window.sessionStorage.setItem(KEY, JSON.stringify(offs)); } catch (err) {}
    }

    var tidy = document.createElement("button");
    tidy.type = "button";
    tidy.className = "desk-tidy";
    tidy.textContent = "tidy the desk";
    tidy.hidden = true;
    note.appendChild(tidy);

    /* no dead control: the reset only exists once something has actually moved */
    function reflect() {
      tidy.hidden = !offs.some(function (o) { return o.x || o.y; });
    }

    tidy.addEventListener("click", function () {
      sheets.forEach(function (el, i) {
        window.setTimeout(function () { set(el, i, 0, 0); }, reduced ? 0 : i * 60);
      });
      try { window.sessionStorage.removeItem(KEY); } catch (err) {}
      tidy.hidden = true;
    });

    sheets.forEach(function (el, i) {
      /* stop the browser's own link-dragging without preventDefault on pointerdown,
         which would also cost the sheet its focus */
      el.draggable = false;

      /* A drag ends in a click on the link, and that one click has to be dropped.
         Doing it by attaching a one-shot listener and removing it on a timer was
         racy in both directions: the timer could fire before the click (and the
         drag would navigate) or after the next real click (and a genuine click
         would be eaten). A flag set on release, cleared by the click it is meant
         for, and cleared again by the next press, cannot land either way. */
      var justDragged = false;

      el.addEventListener("click", function (ev) {
        if (!justDragged) return;
        justDragged = false;
        ev.preventDefault();
        ev.stopPropagation();
      }, true);

      el.addEventListener("pointerdown", function (e) {
        if (e.button !== 0) return;
        justDragged = false;
        var sx = e.clientX, sy = e.clientY;
        var bx = offs[i].x, by = offs[i].y;
        var box = null, moved = false;

        /* Captured on the press, not once the deadband is crossed. Waiting meant a
           fast first movement could leave the sheet before capture was taken, and
           since the listeners live on the element, the drag then never started at
           all. Capture does not suppress the click, so the link is unaffected. */
        try { el.setPointerCapture(e.pointerId); } catch (err) {}

        function move(ev) {
          var dx = ev.clientX - sx, dy = ev.clientY - sy;
          /* Under the deadband nothing happens at all, so a click with a two-pixel
             twitch in it still follows the link like any other link. */
          if (!moved) {
            if (Math.hypot(dx, dy) < DEAD) return;
            moved = true;
            box = homeBox(el, i);
            el.classList.add("is-held");
          }
          var p = clampTo(box, bx + dx, by + dy);
          set(el, i, p[0], p[1]);
        }

        function up() {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerup", up);
          el.removeEventListener("pointercancel", up);
          if (!moved) return;
          el.classList.remove("is-held");
          justDragged = true;
          save();
          reflect();
        }

        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", up);
        el.addEventListener("pointercancel", up);
      });
    });

    /* A narrower window can leave a sheet parked off the page with no way back,
       so every stored position is re-clamped whenever the box changes.

       The bail is the same one the figures use, for the same reason: a page that
       boots in a background tab measures zero, and clamping every sheet against a
       zero-width document would pin the whole desk into the corner with no resize
       event coming to undo it. Leave the offsets alone and try again when the page
       is actually looked at. */
    function reclamp() {
      if (document.documentElement.clientWidth < 40) return;
      measure();
      sheets.forEach(function (el, i) {
        var p = clampTo(homeBox(el, i), offs[i].x, offs[i].y);
        set(el, i, p[0], p[1]);
      });
      reflect();
    }

    measure();
    try {
      var saved = JSON.parse(window.sessionStorage.getItem(KEY) || "null");
      if (saved && saved.length === sheets.length) {
        sheets.forEach(function (el, i) { set(el, i, saved[i].x || 0, saved[i].y || 0); });
      }
    } catch (err) {}
    reflect();
    reclamp();

    window.addEventListener("resize", reclamp);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") reclamp();
    });
    stack.setAttribute("data-desk", "on");
    note.setAttribute("data-on", "");
  }

  /* --- a handle you copy --------------------------------------------------
     Discord has no link format, so the handle is the thing itself. The static
     markup is a <span> carrying it in plain text: nothing is hidden and there is
     no dead control with JS off. JS promotes it to a real <button>, so the
     keyboard and screen-reader behaviour come from the platform rather than from
     a hand-rolled role="button". */

  function initCopy() {
    Array.prototype.forEach.call(
      document.querySelectorAll("span[data-copy]"),
      function (seed) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = seed.className;
        btn.setAttribute("data-copy", seed.getAttribute("data-copy"));
        var name = seed.getAttribute("aria-label") || seed.getAttribute("title");
        if (name) { btn.setAttribute("aria-label", name); btn.title = name; }
        btn.innerHTML = seed.innerHTML;
        seed.parentNode.replaceChild(btn, seed);
        wireCopy(btn);
      }
    );
  }

  function wireCopy(btn) {
    var value = btn.getAttribute("data-copy");
    var out = btn.querySelector("[data-copy-label]");
    var idle = out ? out.textContent : "";
    var timer = null;

    /* every copy needs a state, including the icon-only one in the footer,
       where there is no label to swap and the tint is the whole confirmation */
    function said(ok) {
      if (out) out.textContent = ok ? "copied" : value;
      btn.classList.add(ok ? "is-copied" : "is-copy-failed");
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        if (out) out.textContent = idle;
        btn.classList.remove("is-copied", "is-copy-failed");
      }, 1400);
    }

    /* If the clipboard is refused, and it is refused more often than you would
       think (no secure context, no permission, an embedded browser), select the
       handle instead. The highlight is the instruction: the reader can copy it
       by hand, which is all a Discord handle ever needed. */
    function offerSelection() {
      if (!out || !window.getSelection || !document.createRange) return;
      try {
        var range = document.createRange();
        range.selectNodeContents(out);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (err) { /* nothing better to offer */ }
    }

    /* execCommand is deprecated and still the only thing that works without a
       secure context, which is exactly the case when someone opens this over
       plain http or from a file:// copy */
    function legacy() {
      var ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
      document.body.removeChild(ta);
      if (!ok) offerSelection();
      said(ok);
    }

    btn.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () { said(true); }, legacy);
      } else {
        legacy();
      }
    });
  }

  /* --- the bar gets out of the way, on a phone ----------------------------
     Six numbered sections and a CV do not fit one row at 375px, so the bar is
     two rows there and about 170px tall, and it is sticky: without this it holds
     a fifth of the screen for the entire scroll. Scrolling down tucks it away,
     scrolling up brings it straight back.

     Synchronous on a passive listener, never rAF, for the same reason the
     reading-progress strip is: rAF is throttled in a background tab and the bar
     would freeze in whatever state it was last in. And the class is only ever
     *added* by JS, so nothing can leave the navigation hidden. */

  function initBarHide() {
    var bar = document.querySelector(".topbar");
    if (!bar) return;
    var narrow = window.matchMedia("(max-width: 760px)");
    var last = window.scrollY || window.pageYOffset || 0;
    var tucked = false;

    function show() {
      if (!tucked) return;
      tucked = false;
      bar.classList.remove("is-tucked");
    }

    function onScroll() {
      var y = window.scrollY || window.pageYOffset || 0;
      var dy = y - last;
      if (Math.abs(dy) < 6) return;      /* ignore jitter and rubber-banding */
      last = y;
      if (!narrow.matches) { show(); return; }
      /* the first screen keeps its bar: tucking it there only looks broken */
      if (y < 140) { show(); return; }
      if (dy > 0) {
        if (!tucked) { tucked = true; bar.classList.add("is-tucked"); }
      } else {
        show();
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    /* a keyboard user tabbing into the nav has to be able to see it */
    bar.addEventListener("focusin", show);
    if (narrow.addEventListener) narrow.addEventListener("change", show);
    else if (narrow.addListener) narrow.addListener(show);
  }

  function initKeys() {
    var map = {
      "1": "research.html", "2": "lean.html", "3": "manim.html",
      "4": "education.html", "5": "projects.html", "6": "cv.pdf",
      "0": "index.html"
    };

    /* A stored choice always wins. With nothing stored, an OS set to dark gets
       the board on the first visit: the site has had a night palette for five
       rounds and nobody arriving in dark mode ever saw it. The toggle overrides
       and persists from then on, and with no JS everyone gets paper, which is
       the palette the page ships in. */
    try {
      var saved = window.localStorage.getItem("board");
      if (saved === "1") applyBoard(true);
      else if (saved === null &&
               window.matchMedia("(prefers-color-scheme: dark)").matches) {
        applyBoard(true);
      }
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
    initWordart();
    Array.prototype.forEach.call(document.querySelectorAll("[data-show]"), initShow);

    var fig0 = document.getElementById("figure-pendulum");
    if (fig0) plotter(fig0, { draw: pendulum, seconds: 15, hold: 1.4 });

    /* the same attractor stands on two pages: § 03 and the homepage */
    Array.prototype.forEach.call(
      document.querySelectorAll("#figure-lorenz, #figure-lorenz-home"),
      function (el) { plotter(el, { draw: lorenz, seconds: 11, hold: 2.4 }); }
    );

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
    initCopy();
    initDesk();
    initBarHide();
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
