(function () {
  "use strict";

  var STORAGE_KEY = "ali-consent";
  var MAP_SRC = "https://www.google.com/maps?q=Flurlgasse+4,+94315+Straubing,+Germany&output=embed";

  function safeGet(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
  function safeSet(key, value) { try { window.localStorage.setItem(key, value); } catch (e) { /* ignorieren */ } }
  function safeRemove(key) { try { window.localStorage.removeItem(key); } catch (e) { /* ignorieren */ } }

  /* Jahr */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Header-Zustand */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile Navigation */
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("main-nav");
  function setNav(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    nav.classList.toggle("open", open);
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setNav(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setNav(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        setNav(false);
        toggle.focus();
      }
    });
  }

  /* Reveal-Animationen */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* Leistungen filtern */
  var filterBtns = document.querySelectorAll(".filter");
  var serviceEls = document.querySelectorAll("#services .service");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = btn.getAttribute("data-filter");
      filterBtns.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      serviceEls.forEach(function (s) {
        var show = f === "alle" || s.getAttribute("data-cat") === f;
        s.hidden = !show;
        if (show) s.classList.add("visible");
      });
    });
  });

  /* Bild-Fallback */
  document.querySelectorAll(".g-item img, .hero-frame img").forEach(function (img) {
    img.addEventListener("error", function () {
      var parent = img.closest(".g-item");
      if (parent) parent.classList.add("img-failed");
      else img.style.display = "none";
    });
  });

  /* Dialoge */
  function openDialog(dlg) {
    if (!dlg) return;
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
  }
  function closeDialog(dlg) {
    if (!dlg) return;
    if (typeof dlg.close === "function") dlg.close();
    else dlg.removeAttribute("open");
  }

  var lastTrigger = null;
  document.addEventListener("click", function (e) {
    var openBtn = e.target.closest("[data-dialog]");
    if (openBtn) {
      lastTrigger = openBtn;
      openDialog(document.getElementById(openBtn.getAttribute("data-dialog")));
      return;
    }
    var closeBtn = e.target.closest("[data-close]");
    if (closeBtn) {
      closeDialog(closeBtn.closest("dialog"));
      return;
    }
    if (e.target.tagName === "DIALOG") closeDialog(e.target);
  });
  document.querySelectorAll("dialog").forEach(function (d) {
    d.addEventListener("close", function () {
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    });
  });

  /* Lightbox */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  document.querySelectorAll(".g-item").forEach(function (btn) {
    btn.addEventListener("click", function () {
      lastTrigger = btn;
      lightboxImg.src = btn.getAttribute("data-full");
      lightboxImg.alt = btn.getAttribute("data-alt") || "";
      openDialog(lightbox);
    });
  });
  if (lightbox) {
    lightbox.addEventListener("close", function () { lightboxImg.src = ""; });
  }

  /* Google Maps (erst nach Einwilligung) */
  var mapCard = document.querySelector(".map-card");
  function loadMap() {
    if (!mapCard || mapCard.querySelector("iframe")) return;
    var iframe = document.createElement("iframe");
    iframe.src = MAP_SRC;
    iframe.title = "Karte: ALI Hairstylist, Flurlgasse 4, 94315 Straubing";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.setAttribute("allowfullscreen", "");
    mapCard.innerHTML = "";
    mapCard.appendChild(iframe);
  }
  function resetMap() {
    if (!mapCard) return;
    mapCard.innerHTML =
      '<div class="map-consent" id="map-consent">' +
      "<p><strong>Karte laden</strong></p>" +
      "<p>Beim Laden der Karte werden Daten (z. B. Ihre IP-Adresse) an Google übertragen. Mehr dazu in der " +
      '<button type="button" class="link-btn" data-dialog="dlg-datenschutz">Datenschutzerklärung</button>.</p>' +
      '<button type="button" class="btn btn-primary" id="map-load">Google Maps laden</button>' +
      "</div>";
  }
  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "map-load") loadMap();
  });

  /* Cookie-Banner / Einwilligung */
  var banner = document.getElementById("cookie-banner");
  function showBanner() { if (banner) banner.hidden = false; }
  function hideBanner() { if (banner) banner.hidden = true; }

  function applyConsent(value) {
    if (value === "all") loadMap();
    else if (mapCard && mapCard.querySelector("iframe")) resetMap();
  }

  var stored = safeGet(STORAGE_KEY);
  if (stored === "all" || stored === "necessary") applyConsent(stored);
  else showBanner();

  var btnNecessary = document.getElementById("cookie-necessary");
  var btnAll = document.getElementById("cookie-all");
  if (btnNecessary) btnNecessary.addEventListener("click", function () {
    safeSet(STORAGE_KEY, "necessary");
    applyConsent("necessary");
    hideBanner();
  });
  if (btnAll) btnAll.addEventListener("click", function () {
    safeSet(STORAGE_KEY, "all");
    applyConsent("all");
    hideBanner();
  });

  var settingsBtn = document.getElementById("cookie-settings");
  if (settingsBtn) settingsBtn.addEventListener("click", function () {
    safeRemove(STORAGE_KEY);
    resetMap();
    showBanner();
    if (btnNecessary) btnNecessary.focus();
  });
})();