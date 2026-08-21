/* =========================================================
   SyncDrop — site behaviour
   Vanilla JS. No dependencies.
   ========================================================= */
(function () {
  "use strict";

  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = reduceQuery.matches;

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ------------------------------------------------------
     1. Navigation
     ------------------------------------------------------ */
  function initNav() {
    var nav = $(".nav");
    var burger = $(".burger");
    var mobile = $(".mobile");
    if (!nav) return;

    var stuck = false;
    function onScroll() {
      var should = window.scrollY > 8;
      if (should !== stuck) {
        stuck = should;
        nav.classList.toggle("is-stuck", stuck);
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (burger && mobile) {
      var setMenu = function (open) {
        burger.setAttribute("aria-expanded", String(open));
        mobile.classList.toggle("is-open", open);
        burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        document.body.style.overflow = open ? "hidden" : "";
      };

      burger.addEventListener("click", function () {
        setMenu(burger.getAttribute("aria-expanded") !== "true");
      });

      $$("a", mobile).forEach(function (a, i) {
        a.style.animationDelay = 40 + i * 45 + "ms";
        a.addEventListener("click", function () { setMenu(false); });
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") setMenu(false);
      });

      window.addEventListener("resize", function () {
        if (window.innerWidth > 900) setMenu(false);
      });
    }

    /* active section highlighting */
    var links = $$(".nav__links a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;

    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = a;
    });

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("is-active"); });
        var active = map[en.target.id];
        if (active) active.classList.add("is-active");
      });
    }, { rootMargin: "-46% 0px -50% 0px", threshold: 0 });

    Object.keys(map).forEach(function (id) {
      spy.observe(document.getElementById(id));
    });
  }

  /* ------------------------------------------------------
     2. Scroll progress bar
     ------------------------------------------------------ */
  function initProgress() {
    var bar = $(".progress");
    if (!bar) return;
    var ticking = false;

    function paint() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = "scaleX(" + Math.min(1, Math.max(0, pct)) + ")";
      ticking = false;
    }
    paint();
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }, { passive: true });
  }

  /* ------------------------------------------------------
     3. Scroll reveal + stagger
     ------------------------------------------------------ */
  function initReveal() {
    var items = $$(".rv");

    /* stagger children inside .stagger containers */
    $$(".stagger").forEach(function (group) {
      $$(".rv", group).forEach(function (el, i) {
        el.style.setProperty("--d", Math.min(i, 9) * 70 + "ms");
      });
    });

    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.06 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------
     4. Stat count-up
     ------------------------------------------------------ */
  function initCounters() {
    var nums = $$("[data-count]");
    if (!nums.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduced) { el.textContent = target + suffix; return; }

      var dur = 1500;
      var start = null;
      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    if (!("IntersectionObserver" in window)) {
      nums.forEach(run);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------
     5. Pointer spotlight on cards
     ------------------------------------------------------ */
  function initSpotlight() {
    if (reduced || !window.matchMedia("(hover: hover)").matches) return;
    var pending = false;
    var last = null;

    document.addEventListener("pointermove", function (e) {
      last = e;
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        if (!last) return;
        var card = last.target.closest && last.target.closest(".card");
        if (!card) return;
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (last.clientX - r.left) + "px");
        card.style.setProperty("--my", (last.clientY - r.top) + "px");
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------
     6. Generated bar fields (hero backdrop + card equaliser)
     ------------------------------------------------------ */
  function seeded(i) {
    var x = Math.sin(i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  function fillBars(el, count, minDur, maxDur) {
    if (!el) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var b = document.createElement("i");
      var r = seeded(i + 1);
      var r2 = seeded(i + 101);
      b.style.animationDuration = (minDur + r * (maxDur - minDur)).toFixed(2) + "s";
      b.style.animationDelay = (-r2 * 3).toFixed(2) + "s";
      b.style.height = (28 + r2 * 72).toFixed(1) + "%";
      frag.appendChild(b);
    }
    el.appendChild(frag);
  }

  function initBars() {
    var hero = $(".hero__bars");
    if (hero) {
      var n = window.innerWidth < 720 ? 30 : 66;
      fillBars(hero, n, 2.2, 4.4);
    }
    $$(".eq").forEach(function (eq) {
      var frag = document.createDocumentFragment();
      for (var i = 0; i < 30; i++) {
        var b = document.createElement("i");
        var r = seeded(i + 7);
        b.style.height = (38 + seeded(i + 55) * 62).toFixed(1) + "%";
        b.style.animationDuration = (1.1 + r * 1.5).toFixed(2) + "s";
        b.style.animationDelay = (-seeded(i + 33) * 2.4).toFixed(2) + "s";
        frag.appendChild(b);
      }
      eq.appendChild(frag);
    });
  }

  /* ------------------------------------------------------
     7. The lip-sync demo
        A speech-shaped envelope drives BOTH the waveform
        under the playhead and the mouth on the face, so the
        two are visibly locked together.
     ------------------------------------------------------ */
  var SYLLABLES = [
    0.92, 0.34, 0.78, 1.00, 0.22, 0.62, 0.88, 0.44,
    0.96, 0.30, 0.71, 0.53, 1.00, 0.26, 0.83, 0.40,
    0.68, 0.90, 0.36, 0.75
  ];
  var PHRASE = 6.4;   /* seconds before a short breath */
  var RATE   = 3.6;   /* syllables per second */

  function envelope(t) {
    if (t < 0) return 0;
    var p = t * RATE;
    var i = Math.floor(p) % SYLLABLES.length;
    var f = p - Math.floor(p);
    var shape = Math.pow(Math.sin(Math.PI * f), 0.62);
    var v = SYLLABLES[i] * shape;

    var phase = t % PHRASE;
    if (phase > PHRASE - 1.05) {
      v *= Math.max(0, 1 - (phase - (PHRASE - 1.05)) / 0.55);
    }
    v *= 0.86 + 0.14 * Math.sin(t * 24.1);
    return v < 0 ? 0 : (v > 1 ? 1 : v);
  }

  function mouthPath(a) {
    var cx = 200, cy = 176;
    var w = 30 + a * 5.5;
    var h = 1.5 + a * 15;
    return "M" + (cx - w) + " " + cy +
           " Q " + cx + " " + (cy - h * 0.95) + " " + (cx + w) + " " + cy +
           " Q " + cx + " " + (cy + h * 1.15) + " " + (cx - w) + " " + cy + " Z";
  }

  function fmt(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function initDemo() {
    var cv    = $("#waveCanvas");
    var mouth = $("#mouth");
    var teeth = $("#teeth");
    var jaw   = $("#jaw");
    var brows = $("#brows");
    var eyes  = $("#eyes");
    var fill  = $("#demoFill");
    var clock = $("#demoTime");
    if (!cv || !mouth) return;

    var ctx = cv.getContext("2d");
    var W = 0, H = 0, dpr = 1;

    function resize() {
      var r = cv.getBoundingClientRect();
      if (!r.width) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    var PITCH = 6.5, BARW = 2.8, DT = 0.05, DUR = 12;

    function drawWave(now) {
      if (!W) { resize(); if (!W) return; }
      ctx.clearRect(0, 0, W, H);

      var mid = H / 2;
      var playX = Math.round(W * 0.5) + 0.5;
      var kPlay = Math.round(playX / PITCH);
      var count = Math.ceil(W / PITCH) + 3;
      var step = Math.floor(now / DT);
      var xOff = -((now / DT) - step) * PITCH;

      var grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, "rgba(45,212,191,.85)");
      grad.addColorStop(0.55, "rgba(34,211,238,.95)");
      grad.addColorStop(1, "rgba(168,85,247,.9)");

      for (var k = 0; k < count; k++) {
        var x = k * PITCH + xOff;
        if (x < -PITCH || x > W + PITCH) continue;
        var a = envelope((step + k - kPlay) * DT);
        var h = 2 + a * (H * 0.40);
        var past = x <= playX;

        ctx.fillStyle = past ? grad : "rgba(255,255,255,.16)";
        ctx.globalAlpha = past ? 1 : 0.85;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x - BARW / 2, mid - h, BARW, h * 2, BARW / 2);
          ctx.fill();
        } else {
          ctx.fillRect(x - BARW / 2, mid - h, BARW, h * 2);
        }
      }
      ctx.globalAlpha = 1;

      /* playhead */
      ctx.strokeStyle = "rgba(255,255,255,.92)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(playX, 6);
      ctx.lineTo(playX, H - 6);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.beginPath();
      ctx.moveTo(playX - 4, 2);
      ctx.lineTo(playX + 4, 2);
      ctx.lineTo(playX, 8);
      ctx.closePath();
      ctx.fill();
    }

    var blinkAt = 2.2;
    var t0 = null;

    function frame(ts) {
      if (t0 === null) t0 = ts;
      var now = (ts - t0) / 1000;
      var a = envelope(now);

      drawWave(now);

      mouth.setAttribute("d", mouthPath(a));
      if (teeth) {
        var tw = (30 + a * 5.5) * 0.58;
        var th = Math.min(3.4, a * 5.2);
        teeth.setAttribute("rx", tw.toFixed(1));
        teeth.setAttribute("ry", Math.max(0.2, th).toFixed(1));
        teeth.setAttribute("cy", (176 - Math.max(0, a * 15 - 1) * 0.42).toFixed(1));
        teeth.setAttribute("opacity", Math.max(0, Math.min(0.5, a * 1.4 - 0.34)).toFixed(2));
      }
      if (jaw) jaw.setAttribute("transform", "translate(0 " + (a * 3.2).toFixed(2) + ")");
      if (brows) brows.setAttribute("transform", "translate(0 " + (-a * 1.6).toFixed(2) + ")");

      /* occasional blink — squash the eye group about its own centre */
      if (eyes) {
        if (now >= blinkAt) {
          var d = now - blinkAt;
          if (d < 0.17) {
            var open = Math.max(0.05, Math.abs(1 - d / 0.085));
            eyes.setAttribute("transform", "translate(200 106) scale(1 " + open.toFixed(3) + ") translate(-200 -106)");
          } else {
            eyes.removeAttribute("transform");
            blinkAt = now + 2.6 + seeded(Math.floor(now) + 1) * 3.6;
          }
        }
      }

      /* transport */
      var pos = now % DUR;
      if (fill) fill.style.width = (pos / DUR * 100).toFixed(2) + "%";
      if (clock) clock.textContent = fmt(pos);

      requestAnimationFrame(frame);
    }

    if (reduced) {
      /* one static, representative frame */
      drawWave(0.42);
      mouth.setAttribute("d", mouthPath(0.55));
      if (fill) fill.style.width = "34%";
      if (clock) clock.textContent = "00:04";
      return;
    }
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------
     Boot
     ------------------------------------------------------ */
  function boot() {
    initNav();
    initProgress();
    initBars();
    initReveal();
    initCounters();
    initSpotlight();
    initDemo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  /* react if the user flips the motion preference */
  var onPrefChange = function () {
    reduced = reduceQuery.matches;
    if (reduced) $$(".rv").forEach(function (el) { el.classList.add("is-in"); });
  };
  if (reduceQuery.addEventListener) reduceQuery.addEventListener("change", onPrefChange);
  else if (reduceQuery.addListener) reduceQuery.addListener(onPrefChange);
})();
