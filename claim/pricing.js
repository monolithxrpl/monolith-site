/* MONOLITH CLAIM PRICING v2 - USD anchor, XRP payment rail */
(function () {
  "use strict";

  var PRICE_STANDARD_USD = 99;
  var PRICE_PREMIUM_USD = 249;
  var PRICE_SIGNATURE_USD = 499;

  function absInt(v) {
    return Math.abs(parseInt(v || "0", 10));
  }

  function tileFromCoords(gx, gy) {
    gx = parseInt(gx || "0", 10);
    gy = parseInt(gy || "0", 10);
    if (gx === 0 && gy === 0) return "ORIGIN";

    var ns = gy > 0 ? "N" + gy : gy < 0 ? "S" + Math.abs(gy) : "";
    var ew = gx > 0 ? "E" + gx : gx < 0 ? "W" + Math.abs(gx) : "";

    return (ns + ew).toUpperCase();
  }

  function isNA(gx, gy) {
    gx = absInt(gx);
    gy = absInt(gy);
    return gx === 666 || gy === 666;
  }

  function isSignature(gx, gy) {
    gx = absInt(gx);
    gy = absInt(gy);

    var signature = [589, 143, 69, 67, 420, 777, 888];
    for (var i = 0; i < signature.length; i++) {
      if (gx === signature[i] || gy === signature[i]) return true;
    }

    return false;
  }

  function isPremium(gx, gy) {
    gx = absInt(gx);
    gy = absInt(gy);

    if (gx !== 0 && gx <= 99 && gx % 11 === 0) return true;
    if (gy !== 0 && gy <= 99 && gy % 11 === 0) return true;

    var hundreds = [100, 200, 300, 400, 500];
    for (var i = 0; i < hundreds.length; i++) {
      if (gx === hundreds[i] || gy === hundreds[i]) return true;
    }

    return false;
  }

  function tierFor(gx, gy) {
    if (isNA(gx, gy)) return "na";
    if (isSignature(gx, gy)) return "signature";
    if (isPremium(gx, gy)) return "premium";
    return "standard";
  }

  function parseCoords(input) {
    var raw = String(input || "").trim();
    if (!raw) return null;

    var s = raw.toUpperCase().replace(/-/g, "").replace(/\s+/g, "");

    var coord = raw.match(/^(-?\d+)\s*,\s*(-?\d+)$/);
    if (coord) {
      var cgx = parseInt(coord[1], 10);
      var cgy = parseInt(coord[2], 10);
      return { gx: cgx, gy: cgy, tile: tileFromCoords(cgx, cgy) };
    }

    if (s === "ORIGIN") return { gx: 0, gy: 0, tile: "ORIGIN" };

    var m = s.match(/^([NS])(\d+)([EW])(\d+)$/);
    if (m) {
      var gy = m[1] === "N" ? parseInt(m[2], 10) : -parseInt(m[2], 10);
      var gx = m[3] === "E" ? parseInt(m[4], 10) : -parseInt(m[4], 10);
      return { gx: gx, gy: gy, tile: tileFromCoords(gx, gy) };
    }

    m = s.match(/^([EW])(\d+)([NS])(\d+)$/);
    if (!m) return null;

    gx = m[1] === "E" ? parseInt(m[2], 10) : -parseInt(m[2], 10);
    gy = m[3] === "N" ? parseInt(m[4], 10) : -parseInt(m[4], 10);

    return { gx: gx, gy: gy, tile: tileFromCoords(gx, gy) };
  }

  function formatPreview(tier) {
    if (tier === "reserved") return {
      badge: "RESERVED",
      price: "Manual",
      note: "Reserved coordinate. Manual approval only."
    };

    if (tier === "taken") return {
      badge: "TAKEN",
      price: null,
      note: "This coordinate is already occupied."
    };

    if (tier === "na") return {
      badge: "NOT AVAILABLE",
      price: null,
      note: "This coordinate is locked."
    };

    if (tier === "signature") return {
      badge: "SIGNATURE",
      price: "$" + PRICE_SIGNATURE_USD + " USD",
      note: "Signature tile. Paid in $XRP through Xaman. Live quote expires in 5 minutes."
    };

    if (tier === "premium") return {
      badge: "PREMIUM",
      price: "$" + PRICE_PREMIUM_USD + " USD",
      note: "Premium tile. Paid in $XRP through Xaman. Live quote expires in 5 minutes."
    };

    return {
      badge: "REGULAR",
      price: "$" + PRICE_STANDARD_USD + " USD",
      note: "Regular tile. Paid in $XRP through Xaman. Live quote expires in 5 minutes."
    };
  }

  window.MONOLITH_CLAIM_PRICING = {
    parseCoords: parseCoords,
    tileFromCoords: tileFromCoords,
    tierFor: tierFor,
    formatPreview: formatPreview,
    usdPrices: {
      standard: PRICE_STANDARD_USD,
      premium: PRICE_PREMIUM_USD,
      signature: PRICE_SIGNATURE_USD,
      reserved: "manual"
    }
  };
})();
