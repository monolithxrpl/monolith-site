/* MONOLITH CLAIM PRICING v1 */
(function () {
  "use strict";

  var BASE_PRICE_XRP = 50;
  var PRICE_STANDARD_XRP = 50;
  var PRICE_PREMIUM_XRP = 150;
  var PRICE_ELITE_XRP = 500;


  // Only forever lock
  function isNA(gx, gy) {
    gx = Math.abs(parseInt(gx || "0", 10));
    gy = Math.abs(parseInt(gy || "0", 10));
    return gx === 666 || gy === 666;
  }

  // Premium tier numbers
  function isElite(gx, gy) {
    gx = Math.abs(parseInt(gx || "0", 10));
    gy = Math.abs(parseInt(gy || "0", 10));

    // Special high-demand numbers are still PREMIUM, not "special"
    var special = [589, 143, 69, 67, 420, 777, 888];
    for (var i = 0; i < special.length; i++) {
      if (gx === special[i] || gy === special[i]) return true;
    }

    // Repeats 11..99 on either axis
    if (gx !== 0 && gx <= 99 && gx % 11 === 0) return true;
    if (gy !== 0 && gy <= 99 && gy % 11 === 0) return true;

    // Hundreds milestones
    var hundreds = [100, 200, 300, 400, 500];
    for (var j = 0; j < hundreds.length; j++) {
      if (gx === hundreds[j] || gy === hundreds[j]) return true;
    }

    return false;
  }

  function isPremium(gx, gy) {
    gx = Math.abs(parseInt(gx || "0", 10));
    gy = Math.abs(parseInt(gy || "0", 10));
    if (gx !== 0 && gx <= 99 && gx % 11 === 0) return true;
    if (gy !== 0 && gy <= 99 && gy % 11 === 0) return true;
    var hundreds = [100, 200, 300, 400, 500];
    for (var j = 0; j < hundreds.length; j++) {
      if (gx === hundreds[j] || gy === hundreds[j]) return true;
    }
    return false;
  }

  function tierFor(gx, gy) {
    if (isNA(gx, gy)) return "na";
    if (isElite(gx, gy)) return "elite";
    if (isPremium(gx, gy)) return "premium";
    return "standard";
  }

  // Human input to gx/gy
function parseCoords(input) {
  var raw = String(input || "").trim();
  if (!raw) return null;

  var s = raw.toUpperCase().replace(/-/g, "");

  var coord = raw.match(/^(-?\d+)\s*,\s*(-?\d+)$/);
  if (coord) {
    return {
      gx: parseInt(coord[1], 10),
      gy: parseInt(coord[2], 10)
    };
  }

  var m = s.match(/^([NS])(\d+)([EW])(\d+)$/);
  if (m) {
    var gy = m[1] === "N" ? parseInt(m[2], 10) : -parseInt(m[2], 10);
    var gx = m[3] === "E" ? parseInt(m[4], 10) : -parseInt(m[4], 10);
    return { gx: gx, gy: gy };
  }

  m = s.match(/^([EW])(\d+)([NS])(\d+)$/);
  if (!m) return null;

  var gx = m[1] === "E" ? parseInt(m[2], 10) : -parseInt(m[2], 10);
  var gy = m[3] === "N" ? parseInt(m[4], 10) : -parseInt(m[4], 10);

  return { gx: gx, gy: gy };
}

  function formatPreview(tier) {
    if (tier === "na") return { badge: "NOT AVAILABLE", price: null, note: "This coordinate is locked." };
    if (tier === "elite") return { badge: "PREMIUM", price: String(PRICE_ELITE_XRP) + " XRP", note: "Premium tile. Elite tier." };
    if (tier === "premium") return { badge: "PREMIUM", price: String(PRICE_PREMIUM_XRP) + " XRP", note: "Premium tile. Launch price." };
    return { badge: null, price: String(PRICE_STANDARD_XRP) + " XRP", note: "Standard tile. Fixed price." };
  }

  // UI wiring (safe, no hard dependency on your existing IDs)
  function findTileInput() {
    var selectors = [
      "#tile",
      "#coord",
      "#coords",
      "#coordinate",
      "input[name='tile']",
      "input[name='coord']",
      "input[name='coords']",
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }

  function ensureBox(afterEl) {
    var box = document.getElementById("monolithPricePreview");
    if (box) return box;

    box = document.createElement("div");
    box.id = "monolithPricePreview";
    box.style.marginTop = "10px";
    box.style.padding = "10px 12px";
    box.style.border = "1px solid rgba(255,255,255,.12)";
    box.style.borderRadius = "10px";
    box.style.background = "rgba(0,0,0,.25)";
    box.style.fontSize = "14px";
    box.style.lineHeight = "1.35";

    var badge = document.createElement("div");
    badge.id = "monolithPriceBadge";
    badge.style.fontWeight = "800";
    badge.style.letterSpacing = ".4px";
    badge.style.marginBottom = "4px";

    var price = document.createElement("div");
    price.id = "monolithPriceValue";
    price.style.fontWeight = "700";
    price.style.marginBottom = "4px";

    var note = document.createElement("div");
    note.id = "monolithPriceNote";
    note.style.opacity = ".85";

    box.appendChild(badge);
    box.appendChild(price);
    box.appendChild(note);

    if (afterEl && afterEl.parentNode) {
      afterEl.parentNode.insertBefore(box, afterEl.nextSibling);
    } else {
      document.body.appendChild(box);
    }

    return box;
  }

  function renderForInputValue(v) {
    var c = parseCoords(v);
    var badgeEl = document.getElementById("monolithPriceBadge");
    var priceEl = document.getElementById("monolithPriceValue");
    var noteEl = document.getElementById("monolithPriceNote");

    if (!badgeEl || !priceEl || !noteEl) return;

    if (!c) {
      badgeEl.textContent = "";
      priceEl.textContent = "";
      noteEl.textContent = "";
      return;
    }

    var t = tierFor(c.gx, c.gy);
    var p = formatPreview(t);

    badgeEl.textContent = p.badge ? p.badge : "";
    priceEl.textContent = p.price ? ("Preview: " + p.price) : "Preview: NOT AVAILABLE";
    noteEl.textContent = p.note || "";
  }

  function boot() {
    var input = findTileInput();
    if (!input) return;

    ensureBox(input);
    renderForInputValue(input.value);

    input.addEventListener("input", function () {
      renderForInputValue(input.value);
    });

    input.addEventListener("change", function () {
      renderForInputValue(input.value);
    });
  }

  window.MONOLITH_CLAIM_PRICING = {
    parseCoords: parseCoords,
    tierFor: tierFor,
    formatPreview: formatPreview,
    basePriceXrp: BASE_PRICE_XRP
  };

  document.addEventListener("DOMContentLoaded", boot);
})();
