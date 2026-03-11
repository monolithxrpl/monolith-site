/* MONOLITH CLAIM PRICING PREVIEW v1 */
(function(){
"use strict";
function el(id){return document.getElementById(id)}
function api(){return window.MONOLITH_CLAIM_PRICING||null}
function parseCoords(a,raw){
  if(!a) return null;
  if(typeof a.parseCoords==="function") return a.parseCoords(raw);
  if(typeof a.parseTileInput==="function") return a.parseTileInput(raw);
  return null;
}
function tierFor(a,gx,gy){
  if(!a) return "standard";
  if(typeof a.tierFor==="function") return a.tierFor(gx,gy);
  if(typeof a.tier==="function") return a.tier(gx,gy);
  return "standard";
}
function format(a,t){
  if(a && typeof a.formatPreview==="function") return a.formatPreview(t);
  if(t==="na") return { badge:"NOT AVAILABLE", price:null, note:"This coordinate is locked." };
  if(t==="premium") return { badge:"PREMIUM", price:"50 XRP", note:"Premium tile. Launch price." };
  return { badge:null, price:"50 XRP", note:"Standard tile. Fixed price." };
}
function render(raw){
  var box=el("pricePreview");
  if(!box) return;
  var b=el("priceBadge"), p=el("priceValue"), n=el("priceNote");
  var a=api();
  var s=String(raw||"").trim();
  if(!s){ b.style.display="none"; p.textContent=""; n.textContent="Enter a coordinate to preview pricing."; return; }
  var c=parseCoords(a,s);
  if(!c){ b.style.display="none"; p.textContent=""; n.textContent="Invalid coordinate format."; return; }
  var t=tierFor(a,c.gx,c.gy);
  var out=format(a,t);
  if(out.badge){ b.style.display="inline-block"; b.textContent=out.badge; b.className="badge "+(t==="na"?"na":"premium"); }
  else { b.style.display="none"; b.textContent=""; b.className="badge"; }
  p.textContent=out.price ? ("Price: "+out.price) : "";
  n.textContent=out.note||"";
}
function hook(){
  var tile=el("tile");
  if(!tile) return;
  tile.addEventListener("input", function(){ render(tile.value); });
  tile.addEventListener("change", function(){ render(tile.value); });
  setTimeout(function(){ render(tile.value); }, 250);
  var _n=el("priceNote"); if(_n) _n.textContent="Pricing preview loaded. Type a coordinate to see tier + price."; 
  var last = tile.value;
  setInterval(function(){
    if(tile.value !== last){ last = tile.value; render(tile.value); }
  }, 300);
  var gen=el("gen");
  if(gen) gen.addEventListener("click", function(){ setTimeout(function(){ render(tile.value); }, 0); });
}
document.addEventListener("DOMContentLoaded", hook);
})();
