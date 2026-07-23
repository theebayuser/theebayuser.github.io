/* site.js — Thue–Morse rules, the plate slideshow, and the chalk figure. */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Thue–Morse dividers ------------------------------------------------
     t(n) = parity of the number of 1s in the binary expansion of n.
     0110100110010110... — the square-free-ish word this whole site is fond of. */

  function thueMorse(n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var bits = 0, k = i;
      while (k) { bits += k & 1; k >>= 1; }
      out.push(bits & 1);
    }
    return out;
  }

  function fillStrips() {
    var strips = document.querySelectorAll(".tm");
    Array.prototype.forEach.call(strips, function (strip) {
      var n = parseInt(strip.getAttribute("data-n"), 10) || 24;
      var word = thueMorse(n);
      var frag = document.createDocumentFragment();
      word.forEach(function (bit) {
        var tick = document.createElement("i");
        if (bit === 0) tick.className = "z";
        frag.appendChild(tick);
      });
      strip.setAttribute("aria-hidden", "true");
      strip.appendChild(frag);
    });
  }

  /* --- Plate slideshow ---------------------------------------------------- */

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

  /* --- The chalk figure ---------------------------------------------------
     p(t) = R1·e^{it} + R2·e^{−2it} — two epicycles tracing a deltoid,
     drawn the way you'd draw it on a board: slowly, leaving the line behind. */

  function initFigure(canvas) {
    var ctx = canvas.getContext("2d");
    var R1 = 0.30, R2 = 0.15;
    var w = 0, h = 0, cx = 0, cy = 0, scale = 1;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2; cy = h / 2;
      scale = Math.min(w, h);
    }

    function point(t) {
      return {
        x: cx + scale * (R1 * Math.cos(t) + R2 * Math.cos(-2 * t)),
        y: cy + scale * (R1 * Math.sin(t) + R2 * Math.sin(-2 * t))
      };
    }

    function draw(upTo) {
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(233,237,243,0.10)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, scale * (R1 + R2), 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "#58C4DD";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      var steps = 480;
      for (var s = 0; s <= steps; s++) {
        var t = (s / steps) * Math.PI * 2;
        if (t > upTo) break;
        var p = point(t);
        if (s === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();

      if (upTo < Math.PI * 2) {
        var tip = point(upTo);
        ctx.fillStyle = "#FFD866";
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    resize();

    if (reduced) {
      draw(Math.PI * 2);
      window.addEventListener("resize", function () { resize(); draw(Math.PI * 2); });
      return;
    }

    var t = 0, running = true, raf = null, last = null;
    var TAU = Math.PI * 2;

    draw(0);

    function frame(now) {
      if (!running) { raf = null; return; }
      if (last === null) last = now;
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt * 1.1;
      if (t > TAU + 1.6) { t = 0; }
      draw(Math.min(t, TAU));
      raf = window.requestAnimationFrame(frame);
    }

    function start() {
      if (raf === null) { running = true; last = null; raf = window.requestAnimationFrame(frame); }
    }
    function stop() {
      running = false;
      if (raf !== null) { window.cancelAnimationFrame(raf); raf = null; }
    }

    window.addEventListener("resize", function () { resize(); draw(Math.min(t, TAU)); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
      }, { threshold: 0.1 }).observe(canvas);
    } else {
      start();
    }
  }

  /* --- boot --------------------------------------------------------------- */

  function boot() {
    fillStrips();
    Array.prototype.forEach.call(document.querySelectorAll("[data-show]"), initShow);
    var fig = document.getElementById("figure-canvas");
    if (fig) initFigure(fig);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
