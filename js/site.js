/* ZE-OTEL site script: menu, quick-contact dock, form helpers, project filters, lightbox, UTM capture, event tracking. */
(function () {
  "use strict";
  var doc = document, html = doc.documentElement, ar = html.lang === "ar";
  var preview = doc.body.classList.contains("preview");

  /* ---- mobile menu */
  var burger = doc.getElementById("burger"), nav = doc.getElementById("mainnav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); burger.focus(); }
    });
  }

  /* ---- quick-contact dock (mobile) and floating WhatsApp (desktop):
     appear after the first screen, step aside while a form or the footer is on screen */
  var dock = doc.getElementById("dock"), fab = doc.getElementById("fabwa");
  var blockers = 0, scrolled = false;
  function paint() {
    var show = scrolled && blockers === 0;
    if (dock) dock.classList.toggle("show", show);
    if (fab) fab.classList.toggle("show", show);
  }
  function onScroll() { var s = window.scrollY > Math.min(520, window.innerHeight * 0.7); if (s !== scrolled) { scrolled = s; paint(); } }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var was = en.target._in || false;
        if (en.isIntersecting !== was) { en.target._in = en.isIntersecting; blockers += en.isIntersecting ? 1 : -1; }
      });
      paint();
    }, { threshold: 0.05 });
    doc.querySelectorAll("form, .site-foot, .trio-sec").forEach(function (el) { io.observe(el); });
  }

  /* ---- project filters */
  var chips = doc.querySelectorAll(".chip[data-filter]");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var f = c.getAttribute("data-filter");
      chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
      doc.querySelectorAll(".grid-all .pcard").forEach(function (p) { p.hidden = !(f === "all" || p.getAttribute("data-kind") === f); });
      track("filter_" + f);
    });
  });

  /* ---- project gallery: swipe strip on phones, lightbox with previous/next everywhere */
  var rtl = html.dir === "rtl";
  var gal = doc.getElementById("gallery");
  var items = gal ? [].slice.call(gal.querySelectorAll(".gal-btn")) : [];
  var lb = doc.getElementById("lightbox");
  if (gal && items.length) {
    var wrap = gal.closest(".gal-wrap"), counter = wrap.querySelector(".gal-i");
    var step = function () { var li = gal.querySelector("li"); return li ? li.getBoundingClientRect().width + 12 : 1; };
    var current = function () { return Math.min(items.length - 1, Math.max(0, Math.round(Math.abs(gal.scrollLeft) / step()))); };
    gal.addEventListener("scroll", function () { if (counter) counter.textContent = current() + 1; }, { passive: true });
    var go = function (d) { gal.scrollBy({ left: (rtl ? -1 : 1) * d * step(), behavior: "smooth" }); };
    var gp = wrap.querySelector(".gal-prev"), gn = wrap.querySelector(".gal-next");
    if (gp) gp.addEventListener("click", function () { go(-1); });
    if (gn) gn.addEventListener("click", function () { go(1); });
  }
  if (lb && lb.showModal && items.length) {
    var lbImg = lb.querySelector("img"), lbCap = lb.querySelector(".lb-cap"), idx = 0;
    var show = function (i) {
      idx = (i + items.length) % items.length;
      var b = items[idx];
      lbImg.src = b.getAttribute("data-full"); lbImg.alt = b.getAttribute("data-cap");
      lbCap.textContent = b.getAttribute("data-cap") + "  ·  " + (idx + 1) + " / " + items.length;
    };
    items.forEach(function (b, i) {
      b.addEventListener("click", function () { show(i); lb.showModal(); track("gallery_open"); });
    });
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(idx - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") show(idx + (rtl ? -1 : 1));
      if (e.key === "ArrowLeft") show(idx + (rtl ? 1 : -1));
    });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    var sx = null, sy = 0;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(idx + ((dx < 0) !== rtl ? 1 : -1));
      else if (dy > 90) lb.close();
    });
  }

  /* ---- scroll reveal: chosen sections glide in from the side as they enter the screen.
     Content is visible by default; motion is added only when JS runs and the visitor allows motion. */
  var motionOK = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (motionOK && "IntersectionObserver" in window) {
    var plan = [
      [".hero-in > *", "up", 90, true],
      [".feature-copy", "start"], [".feature-media", "end"],
      [".sec-head", "up"],
      [".spaces .space", "up", 90],
      [".why-head", "start"], [".why-list li", "end", 80],
      [".pcards .pcard", "up", 90],
      [".start-copy", "start"], [".start-form", "end"],
      [".svc-row li", "up", 70],
      [".markets > div", "start"], [".mlist", "end"],
      [".catmag-media", "start"], [".catmag > div", "end"],
      [".cblock:not(.flip) .cb-media", "start"], [".cblock:not(.flip) .cb-copy", "end"],
      [".cblock.flip .cb-media", "end"], [".cblock.flip .cb-copy", "start"],
      [".pstep:nth-child(odd) .pstep-media", "start"], [".pstep:nth-child(even) .pstep-media", "end"],
      [".pstep .pstep-body", "up"],
      [".trio .trio-card", "up", 100],
      [".pd-facts", "start"], [".pcta", "end"],
      [".gal-wrap", "up"],
      [".locs .loc", "up", 90], [".mcards .mcard", "up", 50], [".toc li", "up", 70], [".dl-card", "up", 100],
      [".three li", "up", 90], [".mats li", "up", 50], [".reflist li", "up", 50]
    ];
    var targets = [];
    plan.forEach(function (p) {
      doc.querySelectorAll(p[0]).forEach(function (el, i) {
        if (el.hasAttribute("data-rv")) return;
        el.setAttribute("data-rv", p[1]);
        if (p[2]) el.style.transitionDelay = Math.min(i, 5) * p[2] + "ms";
        targets.push(el);
      });
    });
    html.classList.add("rv-on");
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("rv-in");
          rio.unobserve(en.target);
          setTimeout(function () { en.target.style.transitionDelay = ""; }, 1600);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    targets.forEach(function (el) { rio.observe(el); });
    // safety net: never leave anything hidden (print, very tall elements, old browsers)
    window.addEventListener("beforeprint", function () { targets.forEach(function (el) { el.classList.add("rv-in"); }); });
    setTimeout(function () { targets.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight) el.classList.add("rv-in"); }); }, 2500);
  }

  /* ---- assembly video: load when near, play once when half visible, step labels follow the playback */
  var av = doc.querySelector(".assemble-media video");
  if (av) {
    var steps = [].slice.call(doc.querySelectorAll(".assemble-steps li"));
    var replay = doc.querySelector(".assemble-replay");
    var lightUp = function (n) { steps.forEach(function (s, i) { s.classList.toggle("on", i < n); }); };
    var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var slow = navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ""));
    var showEnd = function () { av.poster = av.getAttribute("data-poster-end"); lightUp(steps.length); };
    if (still || slow || !("IntersectionObserver" in window)) { showEnd(); }
    else {
      var size = window.matchMedia("(max-width: 860px)").matches ? "sm" : "lg";
      var loaded = false, played = false;
      var load = function () {
        if (loaded) return; loaded = true;
        av.innerHTML = '<source src="' + av.getAttribute("data-" + size + "-webm") + '" type="video/webm"><source src="' + av.getAttribute("data-" + size + "-mp4") + '" type="video/mp4">';
        av.preload = "auto"; av.load();
      };
      var play = function () {
        var pr = av.play();
        if (pr && pr.catch) pr.catch(showEnd);
        track("assembly_video_play");
      };
      new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { load(); o.disconnect(); } }, { rootMargin: "400px 0px" }).observe(av);
      new IntersectionObserver(function (es, o) { if (es[0].isIntersecting && !played) { played = true; load(); play(); o.disconnect(); } }, { threshold: 0.5 }).observe(av);
      av.addEventListener("timeupdate", function () { if (av.duration) lightUp(Math.min(steps.length, Math.floor(av.currentTime / av.duration * steps.length) + 1)); });
      av.addEventListener("ended", function () { lightUp(steps.length); if (replay) replay.hidden = false; });
      av.addEventListener("error", showEnd, true);
      if (replay) replay.addEventListener("click", function () { replay.hidden = true; lightUp(0); av.currentTime = 0; play(); });
    }
  }

  /* ---- first-touch attribution (30 days), copied into every form */
  var KEY = "zeotel_attr", attr = null, q = new URLSearchParams(location.search);
  try { attr = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  if (attr && Date.now() - attr.t > 30 * 864e5) attr = null;
  if (q.get("utm_source") || !attr) {
    var ref = "";
    try { ref = doc.referrer ? new URL(doc.referrer).hostname : ""; } catch (e) {}
    attr = { t: Date.now(), utm_source: q.get("utm_source") || ref || "direct", utm_medium: q.get("utm_medium") || (ref ? "referral" : "none"),
      utm_campaign: q.get("utm_campaign") || "", utm_content: q.get("utm_content") || "", landing_page: location.pathname, referrer: doc.referrer || "" };
    try { localStorage.setItem(KEY, JSON.stringify(attr)); } catch (e) {}
  }

  /* ---- forms */
  doc.querySelectorAll("form[data-form]").forEach(function (f) {
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "landing_page", "referrer"].forEach(function (k) {
      var i = f.querySelector('input[name="' + k + '"]'); if (i) i.value = attr[k] || "";
    });
    // prefill from links such as /contact/?type=hotel&scope=lobby&country=saudi-arabia&ref=radisson
    var set = function (name, val) { var el = f.querySelector('[name="' + name + '"]'); if (el && val && el.querySelector('option[value="' + val + '"]')) el.value = val; };
    set("project_type", q.get("type")); set("country", q.get("country"));
    if (q.get("scope")) { var cb = f.querySelector('input[name="scope[]"][value="' + q.get("scope") + '"]'); if (cb) cb.checked = true; }
    var refIn = f.querySelector('input[name="ref"]'); if (refIn) refIn.value = q.get("ref") || "";

    var started = false;
    f.addEventListener("input", function () { if (!started) { started = true; track(f.getAttribute("name") + "_start"); } });

    f.addEventListener("submit", function (e) {
      var ok = true, first = null;
      f.querySelectorAll("[required]").forEach(function (el) {
        var v = el.type === "checkbox" ? el.checked : el.value.trim() !== "";
        if (v && el.type === "email") v = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value.trim());
        if (v && el.name === "contact") v = /@/.test(el.value) ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value.trim()) : el.value.replace(/\D/g, "").length >= 7;
        el.classList.toggle("invalid", !v); el.setAttribute("aria-invalid", v ? "false" : "true");
        if (!v) { ok = false; first = first || el; }
      });
      var err = f.querySelector(".ferr:not(.ferr-file)"); if (err) err.hidden = ok;
      var file = f.querySelector('input[type="file"]'), fe = f.querySelector(".ferr-file");
      if (file && file.files[0] && file.files[0].size > 8 * 1024 * 1024) { ok = false; if (fe) fe.hidden = false; first = first || file; }
      else if (fe) fe.hidden = true;
      if (!ok) { e.preventDefault(); if (first) first.focus(); track(f.getAttribute("name") + "_error"); return; }
      track(f.getAttribute("name") + "_submit");
      if (preview) { e.preventDefault(); location.href = f.getAttribute("action"); }
      else { var b = f.querySelector('button[type="submit"]'); if (b) { b.disabled = true; b.textContent = ar ? "جارٍ الإرسال…" : "Sending…"; } }
    });
  });

  /* ---- event tracking: pushes to dataLayer (GA4 / GTM) when present */
  function track(name, extra) {
    var d = { event: "zeotel_" + name, lang: html.lang, page: location.pathname };
    if (extra) for (var k in extra) d[k] = extra[k];
    window.dataLayer = window.dataLayer || []; window.dataLayer.push(d);
  }
  doc.addEventListener("click", function (e) {
    var a = e.target.closest("[data-track]"); if (!a || a.tagName === "BUTTON") return;
    track(a.getAttribute("data-track"), { href: a.getAttribute("href") || "" });
  });
})();
