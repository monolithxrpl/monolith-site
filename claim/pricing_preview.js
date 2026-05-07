/* MONOLITH CLAIM PRICING PREVIEW v2 - feed-aware USD preview */
(function(){
"use strict";

var feedIndex = {
  loaded: false,
  byTile: {},
  byCoord: {}
};

function el(id){ return document.getElementById(id); }
function api(){ return window.MONOLITH_CLAIM_PRICING || null; }
function coordKey(gx, gy){ return String(parseInt(gx || 0, 10)) + "," + String(parseInt(gy || 0, 10)); }

function parseCoords(a, raw){
  if(!a) return null;
  if(typeof a.parseCoords === "function") return a.parseCoords(raw);
  return null;
}

function tierFor(a, gx, gy){
  if(!a) return "standard";
  if(typeof a.tierFor === "function") return a.tierFor(gx, gy);
  return "standard";
}

function format(a, tier){
  if(a && typeof a.formatPreview === "function") return a.formatPreview(tier);
  if(tier === "reserved") return { badge:"RESERVED", price:"$99 USD", note:"Reserved coordinate. $99 USD approval only." };
  if(tier === "taken") return { badge:"TAKEN", price:null, note:"This coordinate is already occupied." };
  if(tier === "signature") return { badge:"SIGNATURE", price:"$499 USD", note:"Signature tile. Paid in $XRP through Xaman. Live quote expires in 5 minutes." };
  if(tier === "premium") return { badge:"PREMIUM", price:"$249 USD", note:"Premium tile. Paid in $XRP through Xaman. Live quote expires in 5 minutes." };
  return { badge:"REGULAR", price:"$99 USD", note:"Regular tile. Paid in $XRP through Xaman. Live quote expires in 5 minutes." };
}

function recordTierOverride(c){
  if(!feedIndex.loaded || !c) return null;

  var rec = feedIndex.byTile[String(c.tile || "").toUpperCase()] || feedIndex.byCoord[coordKey(c.gx, c.gy)];
  if(!rec) return null;

  var tag = String(rec.tag || "").toUpperCase();
  var tier = String(rec.tier || "").toLowerCase();

  if(tag === "RESERVED" || tier === "reserved" || rec.locked === true) return "reserved";
  if(tag && tag !== "YOUR BRAND HERE") return "taken";

  return null;
}

function setBadgeClass(badge, tier){
  badge.className = "badge " + String(tier || "standard").toLowerCase();
}

function render(raw){
  var box = el("pricePreview");
  if(!box) return;

  var b = el("priceBadge");
  var p = el("priceValue");
  var n = el("priceNote");

  if(!b || !p || !n) return;

  var a = api();
  var s = String(raw || "").trim();

  if(!s){
    b.style.display = "none";
    p.textContent = "";
    n.textContent = "Enter a coordinate to preview USD pricing.";
    return;
  }

  var c = parseCoords(a, s);

  if(!c){
    b.style.display = "none";
    p.textContent = "";
    n.textContent = "Enter a valid coordinate like N8W24, S4W1, or -24,8.";
    return;
  }

  var override = recordTierOverride(c);
  var axisOnly = /^[NSEW][0-9]+$/.test(s);
  var baseTier = tierFor(a, c.gx, c.gy);
  var tier = baseTier === "na" ? "na" : (axisOnly ? "signature" : (override || baseTier));
  var out = format(a, tier);

  if(out.badge){
    b.style.display = "inline-block";
    b.textContent = out.badge;
    setBadgeClass(b, tier);
  } else {
    b.style.display = "none";
    b.textContent = "";
    b.className = "badge";
  }

  p.textContent = out.price ? ("Price: " + out.price) : "";
  n.textContent = out.note || "";
}

function loadFeed(){
  return fetch("/assets/feed.json?cb=" + Date.now(), { cache:"no-store" })
    .then(function(r){ return r.json(); })
    .then(function(feed){
      feedIndex.loaded = true;
      feedIndex.byTile = {};
      feedIndex.byCoord = {};

      if(Array.isArray(feed)){
        feed.forEach(function(x){
          if(!x) return;
          if(x.tile) feedIndex.byTile[String(x.tile).toUpperCase()] = x;
          if(typeof x.gx !== "undefined" && typeof x.gy !== "undefined") {
            feedIndex.byCoord[coordKey(x.gx, x.gy)] = x;
          }
        });
      }
    })
    .catch(function(){
      feedIndex.loaded = false;
    });
}

function hook(){
  var tile = el("tile");
  if(!tile) return;

  function current(){
    render(String(tile.value || "").toUpperCase().replace(/-/g,""));
  }

  tile.addEventListener("input", current);
  tile.addEventListener("change", current);

  var note = el("priceNote");
  if(note) note.textContent = "Enter a coordinate to preview USD pricing.";

  loadFeed().then(current);

  var gen = el("gen");
  if(gen) gen.addEventListener("click", function(){ setTimeout(current, 0); });
}

document.addEventListener("DOMContentLoaded", hook);
})();
