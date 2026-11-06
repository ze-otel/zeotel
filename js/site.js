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

  /* ---- phone field with searchable country code (all countries; our markets first) */
  (function () {
    var RAW = "AC247,AD376,AE971,AF93,AG1,AI1,AL355,AM374,AO244,AR54,AS1,AT43,AU61,AW297,AX358,AZ994,BA387,BB1,BD880,BE32,BF226,BG359,BH973,BI257,BJ229,BL590,BM1,BN673,BO591,BQ599,BR55,BS1,BT975,BW267,BY375,BZ501,CA1,CC61,CD243,CF236,CG242,CH41,CI225,CK682,CL56,CM237,CN86,CO57,CR506,CU53,CV238,CW599,CX61,CY357,CZ420,DE49,DJ253,DK45,DM1,DO1,DZ213,EC593,EE372,EG20,EH212,ER291,ES34,ET251,FI358,FJ679,FK500,FM691,FO298,FR33,GA241,GB44,GD1,GE995,GF594,GG44,GH233,GI350,GL299,GM220,GN224,GP590,GQ240,GR30,GT502,GU1,GW245,GY592,HK852,HN504,HR385,HT509,HU36,ID62,IE353,IL972,IM44,IN91,IO246,IQ964,IR98,IS354,IT39,JE44,JM1,JO962,JP81,KE254,KG996,KH855,KI686,KM269,KN1,KP850,KR82,KW965,KY1,KZ7,LA856,LB961,LC1,LI423,LK94,LR231,LS266,LT370,LU352,LV371,LY218,MA212,MC377,MD373,ME382,MF590,MG261,MH692,MK389,ML223,MM95,MN976,MO853,MP1,MQ596,MR222,MS1,MT356,MU230,MV960,MW265,MX52,MY60,MZ258,NA264,NC687,NE227,NF672,NG234,NI505,NL31,NO47,NP977,NR674,NU683,NZ64,OM968,PA507,PE51,PF689,PG675,PH63,PK92,PL48,PM508,PR1,PS970,PT351,PW680,PY595,QA974,RE262,RO40,RS381,RU7,RW250,SA966,SB677,SC248,SD249,SE46,SG65,SH290,SI386,SJ47,SK421,SL232,SM378,SN221,SO252,SR597,SS211,ST239,SV503,SX1,SY963,SZ268,TA290,TC1,TD235,TG228,TH66,TJ992,TK690,TL670,TM993,TN216,TO676,TR90,TT1,TV688,TW886,TZ255,UA380,UG256,US1,UY598,UZ998,VA39,VC1,VE58,VG1,VI1,VN84,VU678,WF681,WS685,XK383,YE967,YT262,ZA27,ZM260,ZW263";
    var TOP = ["SA", "AE", "QA", "KW", "BH", "OM", "JO", "LB", "LY", "TR", "PS"];
    var EX = { SA: "51 234 5678", AE: "50 123 4567", QA: "3312 3456", KW: "500 12345", BH: "3600 1234", OM: "9212 3456", JO: "7 9012 3456", LB: "71 123 456", LY: "91 234 5678", TR: "501 234 56 78", PS: "599 123 456" };
    var COUNTRY_FIELD = { "saudi-arabia": "SA", uae: "AE", qatar: "QA", kuwait: "KW", bahrain: "BH", oman: "OM", jordan: "JO", lebanon: "LB", libya: "LY", turkey: "TR", palestine: "PS" };
    var nameEn = null, nameAr = null;
    try { nameEn = new Intl.DisplayNames(["en"], { type: "region" }); nameAr = new Intl.DisplayNames(["ar"], { type: "region" }); } catch (e) {}
    var list = RAW.split(",").map(function (x) {
      var iso = x.slice(0, 2), dial = x.slice(2);
      var en = nameEn ? nameEn.of(iso) : iso, arn = nameAr ? nameAr.of(iso) : iso;
      return { iso: iso, dial: dial, en: en, ar: arn, flag: String.fromCodePoint.apply(null, iso.split("").map(function (c) { return 127397 + c.charCodeAt(0); })) };
    });
    var byIso = {}; list.forEach(function (c) { byIso[c.iso] = c; });
    var collator = new Intl.Collator(ar ? "ar" : "en");
    var ordered = TOP.map(function (i) { return byIso[i]; }).filter(Boolean)
      .concat(list.filter(function (c) { return TOP.indexOf(c.iso) < 0; }).sort(function (a, b) { return collator.compare(ar ? a.ar : a.en, ar ? b.ar : b.en); }));
    var guess = (function () {
      var langs = navigator.languages || [navigator.language || ""];
      for (var i = 0; i < langs.length; i++) { var m = /-([A-Z]{2})$/i.exec(langs[i]); if (m && byIso[m[1].toUpperCase()] && TOP.indexOf(m[1].toUpperCase()) > -1) return m[1].toUpperCase(); }
      return "SA";
    })();
    var norm = function (s) { return (s || "").toLowerCase().replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي"); };

    doc.querySelectorAll("[data-tel]").forEach(function (box, n) {
      var btn = box.querySelector(".tel-cc"), input = box.querySelector("input[type=tel]"), isoIn = box.querySelector("input[name=phone_country]");
      var pop = box.querySelector(".tel-pop"), search = box.querySelector(".tel-search"), ul = box.querySelector(".tel-list");
      var current = null, active = -1, shown = [];
      var set = function (iso, focus) {
        current = byIso[iso] || byIso.SA;
        btn.querySelector(".tel-flag").textContent = current.flag;
        btn.querySelector(".tel-dial").textContent = "+" + current.dial;
        btn.setAttribute("aria-label", (ar ? "رمز الدولة: " + current.ar : "Country code: " + current.en) + " +" + current.dial);
        input.placeholder = EX[current.iso] || "";
        if (isoIn) isoIn.value = current.iso;
        if (focus) input.focus();
      };
      var render = function (q) {
        var t = norm(q.trim()).replace(/^\+/, "");
        shown = !t ? ordered : ordered.filter(function (c) {
          return norm(c.en).indexOf(t) > -1 || norm(c.ar).indexOf(t) > -1 || c.dial.indexOf(t) === 0 || c.iso.toLowerCase() === t;
        });
        ul.innerHTML = shown.length ? shown.map(function (c, i) {
          var sep = !t && i === TOP.length ? ' class="tel-sep"' : "";
          return '<li role="option" id="tel' + n + "-" + c.iso + '" data-iso="' + c.iso + '"' + sep + ' aria-selected="' + (current && c.iso === current.iso) + '"><span class="tel-flag">' + c.flag + '</span><span class="tel-name">' + (ar ? c.ar : c.en) + '</span><span class="tel-code" dir="ltr">+' + c.dial + "</span></li>";
        }).join("") : '<li class="tel-none">' + (ar ? "لا توجد نتائج" : "No results") + "</li>";
        active = -1;
      };
      var mark = function (i) {
        var items = ul.querySelectorAll("li[data-iso]"); if (!items.length) return;
        active = (i + items.length) % items.length;
        items.forEach(function (li, k) { li.classList.toggle("on", k === active); });
        items[active].scrollIntoView({ block: "nearest" });
        search.setAttribute("aria-activedescendant", items[active].id);
      };
      var open = function () { pop.hidden = false; btn.setAttribute("aria-expanded", "true"); search.value = ""; render(""); search.focus(); };
      var close = function (back) { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); if (back) btn.focus(); };
      btn.addEventListener("click", function () { pop.hidden ? open() : close(true); });
      search.addEventListener("input", function () { render(search.value); if (search.value) mark(0); });
      search.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") { e.preventDefault(); mark(active + 1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); mark(active - 1); }
        else if (e.key === "Enter") { e.preventDefault(); var li = ul.querySelectorAll("li[data-iso]")[active < 0 ? 0 : active]; if (li) { set(li.getAttribute("data-iso"), true); close(); } }
        else if (e.key === "Escape") { e.preventDefault(); close(true); }
      });
      ul.addEventListener("click", function (e) { var li = e.target.closest("li[data-iso]"); if (li) { set(li.getAttribute("data-iso"), true); close(); track("phone_country_pick"); } });
      doc.addEventListener("click", function (e) { if (!pop.hidden && !box.contains(e.target)) close(); });
      // follow the form's country field when the visitor picks a country
      var form = box.closest("form"), cf = form && form.querySelector("select[name=country]");
      if (cf) cf.addEventListener("change", function () { var iso = COUNTRY_FIELD[cf.value]; if (iso && !input.value.trim()) set(iso); });
      // typing a full international number (+971…) switches the code automatically
      input.addEventListener("input", function () {
        var v = input.value.replace(/[^\d+]/g, "");
        if (v.charAt(0) === "+") { for (var len = 4; len >= 1; len--) { var d = v.slice(1, 1 + len), hit = list.filter(function (c) { return c.dial === d; }); if (hit.length) { var pick = hit.filter(function (c) { return TOP.indexOf(c.iso) > -1; })[0] || hit[0]; set(pick.iso); input.value = input.value.replace(/^\s*\+\s*\d{1,4}[\s-]*/, "").replace(/^\+/, ""); break; } } }
      });
      // on submit the phone is sent in full international form
      if (form) form.addEventListener("submit", function () {
        var v = input.value.trim();
        if (v && v.charAt(0) !== "+") input.value = "+" + current.dial + " " + v.replace(/^0+/, "");
      }, true);
      set(guess);
    });
  })();

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
      // quick form: an email OR a phone number is enough
      if (f.querySelector("[data-need-contact]")) {
        var em = f.querySelector('input[name="email"]'), ph = f.querySelector('input[name="phone"]');
        var emOk = !!em && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value.trim()), phOk = !!ph && ph.value.replace(/\D/g, "").length >= 6;
        var anyOk = emOk || phOk;
        [em, ph].forEach(function (x) { if (x) { var bad = !anyOk || (x === em && !!x.value.trim() && !emOk); x.classList.toggle("invalid", bad); x.setAttribute("aria-invalid", bad ? "true" : "false"); if (bad) { ok = false; first = first || x; } } });
      }
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
