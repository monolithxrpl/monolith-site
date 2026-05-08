/* MONOLITH CLAIM PRICING v4 - no manual review lane */
(function () {
  "use strict";

  var PRICE_REGULAR_USD = 99;
  var PRICE_PREMIUM_USD = 249;
  var PRICE_SIGNATURE_USD = 499;

  var UNAVAILABLE_NUMBERS = [666];
  var SIGNATURE_NUMBERS = [
    42, 67, 69, 86, 143, 314, 404, 420, 589,
    777, 808, 888, 911, 999, 1337, 1776,
    1978, 2012, 2026
  ];

  var SIGNATURE_REPEATS = [
    111, 222, 333, 444, 555, 777, 888, 999,
    1111, 2222, 3333, 4444, 5555, 7777, 8888, 9999
  ];

  var PREMIUM_NUMBERS = [
    10, 11, 22, 25, 33, 44, 50, 55, 66,
    75, 77, 99, 100, 200, 300, 400, 500
  ];

  function absInt(v) {
    return Math.abs(parseInt(v || "0", 10));
  }

  function hasNumber(gx, gy, nums) {
    gx = absInt(gx);
    gy = absInt(gy);

    for (var i = 0; i < nums.length; i++) {
      if (gx === nums[i] || gy === nums[i]) return true;
    }

    return false;
  }

  function tileFromCoords(gx, gy) {
    gx = parseInt(gx || "0", 10);
    gy = parseInt(gy || "0", 10);

    if (gx === 0 && gy === 0) return "ORIGIN";

    var ns = gy > 0 ? "N" + gy : gy < 0 ? "S" + Math.abs(gy) : "";
    var ew = gx > 0 ? "E" + gx : gx < 0 ? "W" + Math.abs(gx) : "";

    return (ns + ew).toUpperCase();
  }

  function isUnavailable(gx, gy) {
    return hasNumber(gx, gy, UNAVAILABLE_NUMBERS);
  }
  function isAxisOnly(gx, gy) {
    gx = parseInt(gx || "0", 10);
    gy = parseInt(gy || "0", 10);

    return (gx === 0) !== (gy === 0);
  }

  function isSignature(gx, gy) {
    return hasNumber(gx, gy, SIGNATURE_NUMBERS) || hasNumber(gx, gy, SIGNATURE_REPEATS);
  }

  function isPremium(gx, gy) {
    return hasNumber(gx, gy, PREMIUM_NUMBERS);
  }

  function tierFor(gx, gy) {
    if (isUnavailable(gx, gy)) return "na";
    if (isAxisOnly(gx, gy)) return "signature";
    if (isSignature(gx, gy)) return "signature";
    if (isPremium(gx, gy)) return "premium";

    return "regular";
  }

  function parseCoords(input) {
    var raw = String(input || "").trim();
    if (!raw) return null;

    var s = raw.toUpperCase().replace(/-/g, "").replace(/\s+/g, "");

    var coord = raw.match(/^(-?\d+)\s*,\s*(-?\d+)$/);
    if (coord) {
      var rawX = parseInt(coord[1], 10);
      var rawY = parseInt(coord[2], 10);

      return {
        gx: rawX,
        gy: rawY,
        tile: tileFromCoords(rawX, rawY)
      };
    }

    if (s === "ORIGIN") {
      return {
        gx: 0,
        gy: 0,
        tile: "ORIGIN"
      };
    }

    var axis = s.match(/^([NSEW])(\d+)$/);
    if (axis) {
      var axisX = 0;
      var axisY = 0;
      var value = parseInt(axis[2], 10);

      if (axis[1] === "N") axisY = value;
      if (axis[1] === "S") axisY = -value;
      if (axis[1] === "E") axisX = value;
      if (axis[1] === "W") axisX = -value;

      return {
        gx: axisX,
        gy: axisY,
        tile: tileFromCoords(axisX, axisY)
      };
    }

    var nsFirst = s.match(/^([NS])(\d+)([EW])(\d+)$/);
    if (nsFirst) {
      var nsY = nsFirst[1] === "N" ? parseInt(nsFirst[2], 10) : -parseInt(nsFirst[2], 10);
      var ewX = nsFirst[3] === "E" ? parseInt(nsFirst[4], 10) : -parseInt(nsFirst[4], 10);

      return {
        gx: ewX,
        gy: nsY,
        tile: tileFromCoords(ewX, nsY)
      };
    }

    var ewFirst = s.match(/^([EW])(\d+)([NS])(\d+)$/);
    if (ewFirst) {
      var ewFirstX = ewFirst[1] === "E" ? parseInt(ewFirst[2], 10) : -parseInt(ewFirst[2], 10);
      var nsFirstY = ewFirst[3] === "N" ? parseInt(ewFirst[4], 10) : -parseInt(ewFirst[4], 10);

      return {
        gx: ewFirstX,
        gy: nsFirstY,
        tile: tileFromCoords(ewFirstX, nsFirstY)
      };
    }

    return null;
  }

  function formatPreview(tier) {
    if (tier === "reserved") {
      return {
        badge: "RESERVED",
        price: "$" + PRICE_REGULAR_USD + " USD",
        note: "Reserved coordinate. The real tier price still applies."
      };
    }

    if (tier === "taken") {
      return {
        badge: "TAKEN",
        price: null,
        note: "This coordinate is already occupied."
      };
    }

    if (tier === "na") {
      return {
        badge: "NOT AVAILABLE",
        price: null,
        note: "This coordinate is locked and cannot be purchased."
      };
    }
    if (tier === "signature") {
      return {
        badge: "SIGNATURE",
        price: "$" + PRICE_SIGNATURE_USD + " USD",
        note: "Signature tile. Paid in $XRP through Xaman. Live quote expires in 5 minutes."
      };
    }

    if (tier === "premium") {
      return {
        badge: "PREMIUM",
        price: "$" + PRICE_PREMIUM_USD + " USD",
        note: "Premium tile. Paid in $XRP through Xaman. Live quote expires in 5 minutes."
      };
    }

    return {
      badge: "REGULAR",
      price: "$" + PRICE_REGULAR_USD + " USD",
      note: "Regular tile. Paid in $XRP through Xaman. Live quote expires in 5 minutes."
    };
  }

  window.MONOLITH_CLAIM_PRICING = {
    parseCoords: parseCoords,
    tileFromCoords: tileFromCoords,
    tierFor: tierFor,
    formatPreview: formatPreview,
    isUnavailable: isUnavailable,
    isAxisOnly: isAxisOnly,
    isSignature: isSignature,
    isPremium: isPremium,
    policy: {
      unavailable: UNAVAILABLE_NUMBERS,
      signature: SIGNATURE_NUMBERS,
      signatureRepeats: SIGNATURE_REPEATS,
      premium: PREMIUM_NUMBERS
    },
    usdPrices: {
      regular: PRICE_REGULAR_USD,
      premium: PRICE_PREMIUM_USD,
      signature: PRICE_SIGNATURE_USD
    }
  };
})();
