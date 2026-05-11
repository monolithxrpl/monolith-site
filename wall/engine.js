window.MONOLITH_ENGINE_CLONE_LOADED = true;
if (!window.MONOLITH_ENGINE_BOOTED) {
  window.MONOLITH_ENGINE_BOOTED = true;
(() => {
const FEED_URL = "/assets/feed.json?cb=" + Date.now();

    const MONOLITH_TILE = "ORIGIN";
    const MONOLITH_TAG  = "MONOLITH";
    const MONOLITH_LOGO = "/assets/monolith_logo.webp";

    
      const PLACEHOLDER_IMG = "/assets/xrp_logo.webp";
const MONOLITH_WALLET = "r9iKXkMGF2HxAEsCLqdrghWpJmfFZN1Gw8";

const CREATOR_TILE = "";
const CREATOR_TAG  = "";
const CREATOR_LOGO_CANDIDATES = [];
let CREATOR_LOGO = "";

    const vp    = document.getElementById("vp");
    const world = document.getElementById("world");
    const panel = document.getElementById("panel");
    const toast = document.getElementById("toast");

    const el = {
      q: document.getElementById("q"),
      go: document.getElementById("go"),
      kTaken: document.getElementById("kTaken"),
      close: document.getElementById("close"),

      ptitle: document.getElementById("ptitle"),
      psub: document.getElementById("psub"),
      vTile: document.getElementById("vTile"),
      vTag: document.getElementById("vTag"),
      vTs: document.getElementById("vTs"),

      vVerified: document.getElementById("vVerified"),

      vWalletWrap: document.getElementById("vWalletWrap"),

        vHandleWrap: document.getElementById("vHandleWrap"),
        vHandle: document.getElementById("vHandle"),
      vWalletMasked: document.getElementById("vWalletMasked"),
      vWalletFull: document.getElementById("vWalletFull"),
      revealWallet: document.getElementById("revealWallet"),
      hideWallet: document.getElementById("hideWallet"),
      copyWallet: document.getElementById("copyWallet"),

      vLinkWrap: document.getElementById("vLinkWrap"),
      vLink: document.getElementById("vLink"),
      vMedia: document.getElementById("vMedia"),

      vNote: document.getElementById("vNote"),
      vBody: document.getElementById("vBody"),

      btnCenter: document.getElementById("btnCenter"),
      btnNav: document.getElementById("btnNav"),
      btnBrand: document.getElementById("btnBrand"),
      btnSat: document.getElementById("btnSat")
    };

    const STEP = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--step").trim(), 10) || 128;
    const TILE = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--tile").trim(), 10) || 118;

    const state = {
      camX: 0, camY: 0,
      vx: 0, vy: 0,

      down: false,
      pid: null,
      lastX: 0, lastY: 0,

      moved: false,
      dragging: false,
      dragStartX: 0,
      dragStartY: 0,
      DRAG_MOUSE: 7,
      DRAG_TOUCH: 4,

      cols: 0, rows: 0,
      pool: [],
      POOL_PAD: 6,
      lastVW: 0,
      lastVH: 0,

      taken: new Set(),
      marksByTile: new Map(),
      backendMarksByTile: new Map(),

      lastKey: "",
      raf: 0,

      walletFull: "",
      walletMasked: "",
      walletPublic: false,
      walletRevealed: false,

zoom: 0.65,
      ZMIN: 0.05,
      ZMAX: 2.75,

      ptrs: new Map(),
      pinch: null,

      movedDist: 0,
      justPinchedUntil: 0
    };

  window.MONOLITH_STATE = state;

    function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

    function toastShow(msg, kind){
      toast.className = "toast " + (kind || "");
      toast.textContent = msg;
      requestAnimationFrame(() => toast.classList.add("show"));
      clearTimeout(toast._t);
      toast._t = setTimeout(() => toast.classList.remove("show"), 1400);
    }

    function tileIdFromCoords(gx, gy){
  if(window.coordDisplayFromG) return window.coordDisplayFromG(gx, gy);
  const ax=Math.abs(gx), ay=Math.abs(gy);
  const sx=gx<0?"W":"E";
  const sy=gy<0?"S":"N";
  return sx+ax+"-"+sy+ay;
}

function coordLabelFromG(gx, gy){
  gx = Number(gx)||0;
  gy = Number(gy)||0;
  if(gx===0 && gy===0) return "ORIGIN";

  const ax = Math.abs(gx);
  const ay = Math.abs(gy);

  const x = gx>0 ? `E-${ax}` : gx<0 ? `W-${ax}` : "";
  const y = gy>0 ? `N-${ay}` : gy<0 ? `S-${ay}` : "N-0";

  if(x && y) return `${y} / ${x}`;
  return x || y;
}


    function parseQueryToCoords(str){
      let raw = String(str || "").trim().toUpperCase().replace(/[–—−]/g, "-");
      // Option A labels: "N-11 / E-23" or "N-11/E-23" or "W-5"
      const raw0 = String(str || "").trim().toUpperCase();
      if(raw0 === "ORIGIN"){
        return { gx:0, gy:0, tile: tileIdFromCoords(0,0), raw: raw0 };
      }
      if(raw0.includes("N-") || raw0.includes("S-") || raw0.includes("E-") || raw0.includes("W-")){
        const parts = raw0.replace(/\s+/g,"").split("/");
        let gx = null, gy = null;
        for(const part of parts){
          const m = part.match(/^([NSEW])\-?(\d+)$/);
          if(!m) continue;
          const d = m[1];
          const n = parseInt(m[2], 10);
          if(d === "E") gx = n;
          else if(d === "W") gx = -n;
          else if(d === "N") gy = n;
          else if(d === "S") gy = -n;
        }
        if(gx !== null || gy !== null){
          gx = (gx === null) ? 0 : gx;
          gy = (gy === null) ? 0 : gy;
          return { gx, gy, tile: tileIdFromCoords(gx,gy), raw: raw0 };
        }
      }

      raw = raw.replace(/\s+/g, "");

      if(/^-?\d+,\s*-?\d+$/.test(raw)){
        const parts = raw.split(",");
        const gx = parseInt(parts[0].trim(), 10);
        const gy = parseInt(parts[1].trim(), 10);
        if(Number.isFinite(gx) && Number.isFinite(gy)){
          return { gx, gy, tile: tileIdFromCoords(gx, gy), raw };
        }
      }

      let m = raw.match(/^([NS])(\d+)-([EW])(\d+)$/);
      if(m){
        const gyN = parseInt(m[2], 10);
        const gy = (m[1] === "N" ? gyN : -gyN);
        const gxE = parseInt(m[4], 10);
        const gx = (m[3] === "E" ? gxE : -gxE);
        if(Number.isFinite(gx) && Number.isFinite(gy)){
          return { gx, gy, tile: tileIdFromCoords(gx, gy), raw };
        }
      }

      m = raw.match(/^([NS])(\d+)([EW])(\d+)$/);
      if(m){
        const gyN = parseInt(m[2], 10);
        const gy = (m[1] === "N" ? gyN : -gyN);
        const gxE = parseInt(m[4], 10);
        const gx = (m[3] === "E" ? gxE : -gxE);
        if(Number.isFinite(gx) && Number.isFinite(gy)){
          return { gx, gy, tile: tileIdFromCoords(gx, gy), raw };
        }
      }

      m = raw.match(/^([NSEW])(\d+)$/);
      if(m){
        const n = parseInt(m[2], 10);
        const gx = (m[1] === "E" ? n : m[1] === "W" ? -n : 0);
        const gy = (m[1] === "N" ? n : m[1] === "S" ? -n : 0);
        if(Number.isFinite(gx) && Number.isFinite(gy)){
          return { gx, gy, tile: tileIdFromCoords(gx, gy), raw };
        }
      }

      m = raw.match(/^([EW])(\d+)-([NS])(\d+)$/);
      if(m){
        const gx = parseInt(m[2], 10) * (m[1] === "W" ? -1 : 1);
        const gyN = parseInt(m[4], 10);
        const gy = (m[3] === "N" ? gyN : -gyN);
        if(Number.isFinite(gx) && Number.isFinite(gy)){
          return { gx, gy, tile: tileIdFromCoords(gx, gy), raw };
        }
      }

      m = raw.match(/^([EW])(\d+)([NS])(\d+)$/);
      if(m){
        const gx = parseInt(m[2], 10) * (m[1] === "W" ? -1 : 1);
        const gyN = parseInt(m[4], 10);
        const gy = (m[3] === "N" ? gyN : -gyN);
        if(Number.isFinite(gx) && Number.isFinite(gy)){
          return { gx, gy, tile: tileIdFromCoords(gx, gy), raw };
        }
      }

      return null;
    }

    function mulberry32(seed){
      let t = seed >>> 0;
      return function(){
        t += 0x6D2B79F5;
        let x = Math.imul(t ^ (t >>> 15), 1 | t);
        x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
      };
    }

    function hashStr(str){
      let h = 2166136261 >>> 0;
      for(let i=0;i<str.length;i++){
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    }

    function makeSpraySVG(seedStr){
      const rnd = mulberry32(hashStr(seedStr));
      const p = [];
      const count = 26;

      for(let i=0;i<count;i++){
        const x = Math.floor(rnd() * TILE);
        const y = Math.floor(rnd() * TILE);
        const r = 6 + Math.floor(rnd() * 20);
        const a = 0.10 + rnd() * 0.22;
        const g = rnd() < 0.72 ? "47,191,107" : "255,225,117";
        p.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(${g},${a.toFixed(3)})" />`);
      }
      return `<svg viewBox="0 0 ${TILE} ${TILE}" width="${TILE}" height="${TILE}" xmlns="http://www.w3.org/2000/svg">${p.join("")}</svg>`;
    }

    function mediaHTML(src, alt){
      return `<div class="mediaWrap"><img src="${src}" alt="${alt || ""}" /></div>`;
    }

    function closePanel(){ panel.classList.remove("open"); }

    function maskWallet(addr){
      const w = String(addr || "").trim();
      if(!w) return "";
      if(w.length <= 10) return w;
      const a = w.slice(0,4);
      const b = w.slice(-3);
      return `${a}...${b}`;
    }

    function setWalletUI(addr, isPublic, verified){
      const w = String(addr || "").trim();

      state.walletFull = w;
      state.walletMasked = w ? maskWallet(w) : "";
      state.walletPublic = !!isPublic;
      state.walletRevealed = false;

      el.vVerified.style.display = (verified && w) ? "inline-flex" : "none";

      el.vWalletMasked.textContent = state.walletMasked ? state.walletMasked : "None";
      el.vWalletFull.textContent = w ? w : "None";

      el.vWalletMasked.style.display = "inline";
      el.vWalletFull.style.display = "none";

      el.revealWallet.style.display = (w && state.walletPublic) ? "inline-flex" : "none";
      el.hideWallet.style.display = "none";
      el.copyWallet.style.display = "none";
    }

    function revealWallet(){
      if(!state.walletPublic || !state.walletFull) return;
      state.walletRevealed = true;
      el.vWalletFull.style.display = "inline";
      el.vWalletMasked.style.display = "none";
      el.revealWallet.style.display = "none";
      el.hideWallet.style.display = "inline-flex";
      el.copyWallet.style.display = "inline-flex";
    }

    function hideWallet(){
      state.walletRevealed = false;
      el.vWalletFull.style.display = "none";
      el.vWalletMasked.style.display = "inline";
      el.hideWallet.style.display = "none";
      el.copyWallet.style.display = "none";
      el.revealWallet.style.display = (state.walletFull && state.walletPublic) ? "inline-flex" : "none";
    }

    async function copyWallet(){
      if(!state.walletPublic || !state.walletRevealed || !state.walletFull){
        toastShow("reveal first", "warn");
        return;
      }
      const w = String(state.walletFull || "").trim();
      try{
        await navigator.clipboard.writeText(w);
        toastShow("copied", "good");
      }catch(_){
        try{
          const ta = document.createElement("textarea");
          ta.value = w;
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand("copy");
          ta.remove();
          toastShow("copied", "good");
        }catch(__){
          toastShow("copy fail", "bad");
        }
      }
    }

    function isPublicWallet(mark){
      if(!mark) return false;
      const a = mark.wallet_public === true;
      const b = String(mark.wallet_visibility || "").toLowerCase() === "public";
      const c = String(mark.visibility || "").toLowerCase() === "public";
      const d = String(mark.public_wallet || "").toLowerCase() === "true";
      return !!(a || b || c || d);
    }

    function cleanLinkRaw(s){
      let v = String(s || "").trim();
      v = v.replace(/\s+/g, "");
      return v;
    }

    function isXHandle(v){
      return /^@[A-Za-z0-9_]{1,15}$/.test(v);
    }

    function isHttpsUrl(v){
      if(!v.startsWith("https://")) return false;
      if(v.length < 9) return false;
      if(v.length > 120) return false;
      if(/[<>\s]/.test(v)) return false;
      return true;
    }

    function shortUrl(u){
      if(u.length <= 44) return u;
      const a = u.slice(0, 26);
      const b = u.slice(-14);
      return a + "…" + b;
    }
    function setHandleUI(raw){
      const v = (raw || "").toString().trim();
      if(!el.vHandleWrap) return;

      el.vHandleWrap.innerHTML = "";

      const s = document.createElement("span");
      s.id = "vHandle";
      s.textContent = v || "None";
      el.vHandleWrap.appendChild(s);
    }

    function setLinkUI(linkStr){
      const raw = cleanLinkRaw(linkStr);
      el.vLinkWrap.innerHTML = "";
      if(!raw){
        const s = document.createElement("span");
        s.id = "vLink";
        s.textContent = "None";
        el.vLinkWrap.appendChild(s);
        return;
      }

      if(isXHandle(raw)){
        const user = raw.slice(1);
        const a = document.createElement("a");
        a.className = "linka";
        a.href = "https://x.com/" + encodeURIComponent(user);
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = raw;
        el.vLinkWrap.appendChild(a);
        return;
      }

      if(isHttpsUrl(raw)){
        const a = document.createElement("a");
        a.className = "linka";
        a.href = raw;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = shortUrl(raw);
        el.vLinkWrap.appendChild(a);
        return;
      }

      const s = document.createElement("span");
      s.id = "vLink";
      s.textContent = "None";
      el.vLinkWrap.appendChild(s);
    }

    async function resolveFirstWorking(cands){
      for(const url of cands){
        try{
          const ok = await new Promise((res) => {
            const img = new Image();
            img.onload = () => res(true);
            img.onerror = () => res(false);
            img.src = url + "?cb=" + Date.now();
          });
          if(ok) return url;
        }catch(_){}
      }
      return cands[0];
    }

    function pickCellFromPoint(x,y){
      try{
        var els = document.elementsFromPoint ? document.elementsFromPoint(x,y) : [];
        for(var i=0;i<els.length;i++){
          var el=els[i]; if(!el) continue;
          var c=(el.classList&&el.classList.contains("cell"))?el:(el.closest?el.closest(".cell"):null);
          if(c) return c;
        }
      }catch(_){}
      return null;
    }

    function tileFromCell(cell){
      try{
        if(!cell) return "";
        var gx = parseInt(cell.getAttribute("data-gx")||"",10);
        var gy = parseInt(cell.getAttribute("data-gy")||"",10);
        var t =
          cell.getAttribute("data-tile") ||
          cell.getAttribute("data-id") ||
          cell.id ||
          (Number.isFinite(gx) && Number.isFinite(gy) ? tileIdFromCoords(gx, gy) : "");
        return (t||"").toString().trim();
      }catch(_){ return ""; }
    }


    function parseTileMetadata(tile){
      const raw = tile && (tile.metadata || tile.metadata_json || tile.metadataJson);
      if(!raw) return {};
      if(typeof raw === "object") return raw;
      if(typeof raw === "string"){
        try{ return JSON.parse(raw || "{}"); }catch(_){ return {}; }
      }
      return {};
    }

    function applyBackendTileToPanel(apiTile){
      if(!apiTile || !apiTile.coordinate) return;

      const meta = parseTileMetadata(apiTile);
      const coord = String(apiTile.coordinate || "").trim().toUpperCase();
      const tag = apiTile.owner_tag || apiTile.ownerTag || "TAKEN";
      const wallet = apiTile.owner_wallet || apiTile.ownerWallet || "";
      const handle = meta.xHandle || apiTile.x_handle || apiTile.xHandle || "";
      const note = meta.note || apiTile.note || "";
      const link = apiTile.website_url || apiTile.websiteUrl || "";
      const img = apiTile.image_url || apiTile.imageUrl || "";
      const when = apiTile.updated_at || apiTile.claimed_at || apiTile.created_at || "None";

      el.vTile.textContent = coord;
      el.vTag.textContent = tag || "TAKEN";
      el.vTs.textContent = when;
      el.vNote.textContent = note ? String(note) : "None";

      setWalletUI(String(wallet || ""), false, !!wallet);
      setHandleUI(handle || "");
      setLinkUI(link || "");

      if(el.vMedia){
        el.vMedia.innerHTML = img ? mediaHTML(img, coord) : "";
      }

      el.vBody.textContent = "";
    }

    function backendCoordFromPanel(tile, gx, gy){
      const rawTile = String(tile || "").trim().toUpperCase();

      if(rawTile && rawTile !== "ORIGIN"){
        const compact = rawTile.replace(/\s+/g, "").replace(/[–—−]/g, "-");

        if(/^([NSEW])-?([0-9]+)$/.test(compact)){
          return compact.replace(/^([NSEW])-?([0-9]+)$/,"$1$2");
        }

        if(/^([NS])-?([0-9]+)([EW])-?([0-9]+)$/.test(compact)){
          return compact.replace(/^([NS])-?([0-9]+)([EW])-?([0-9]+)$/,"$1$2$3$4");
        }

        if(compact.includes("/")){
          const parts = compact.split("/");
          let y = "";
          let x = "";

          for(const part of parts){
            const m = part.match(/^([NSEW])-?([0-9]+)$/);
            if(!m) continue;
            if(m[1] === "N" || m[1] === "S") y = m[1] + m[2];
            if(m[1] === "E" || m[1] === "W") x = m[1] + m[2];
          }

          if(y || x) return y + x;
        }
      }

      gx = Number(gx);
      gy = Number(gy);

      if(Number.isFinite(gx) && Number.isFinite(gy)){
        if(gx === 0 && gy === 0) return "ORIGIN";

        const y = gy > 0 ? "N" + gy : gy < 0 ? "S" + Math.abs(gy) : "";
        const x = gx > 0 ? "E" + gx : gx < 0 ? "W" + Math.abs(gx) : "";

        if(y && x) return y + x;
        return y || x || rawTile;
      }

      return rawTile === "ORIGIN" ? "ORIGIN" : rawTile.replace(/^([NSEW])-([0-9]+)$/,"$1$2");
    }

    async function refreshPanelFromBackend(tile, gx, gy){
      try{
        const clean = backendCoordFromPanel(tile, gx, gy);
        if(!clean) return;

        const res = await fetch("/api/tile/" + encodeURIComponent(clean), { cache:"no-store" });
        if(!res.ok) return;

        const data = await res.json().catch(() => ({}));
        if(!data || !data.ok || !data.tile) return;

        const meta = parseTileMetadata(data.tile);
        const backendCoord = String(data.tile.coordinate || "").trim().toUpperCase();
        const visibleTile = String(tile || "").trim().toUpperCase();
        const cellTile = (Number.isFinite(Number(gx)) && Number.isFinite(Number(gy)))
          ? tileIdFromCoords(Number(gx), Number(gy))
          : "";

        const keys = new Set([
          visibleTile,
          backendCoord,
          backendCoordFromPanel(tile, gx, gy),
          cellTile
        ].filter(Boolean));

        const mark = {
          id: data.tile.id || null,
          tile: backendCoord || visibleTile || cellTile,
          gx: Number.isFinite(Number(gx)) ? Number(gx) : null,
          gy: Number.isFinite(Number(gy)) ? Number(gy) : null,
          tag: data.tile.owner_tag || data.tile.ownerTag || null,
          ts: data.tile.updated_at || data.tile.claimed_at || data.tile.created_at || null,
          img: data.tile.image_url || data.tile.imageUrl || null,
          wallet: data.tile.owner_wallet || data.tile.ownerWallet || null,
          wallet_public: false,
          wallet_visibility: null,
          visibility: null,
          public_wallet: null,
          handle: meta.xHandle || data.tile.x_handle || data.tile.xHandle || null,
          link: data.tile.website_url || data.tile.websiteUrl || null,
          note: meta.note || data.tile.note || null
        };

        for(const key of keys){
          state.taken.add(key);
          state.backendMarksByTile.set(key, mark);
          state.marksByTile.set(key, mark);
        }

        for(const cell of state.pool){
          const cellKey = String(cell && cell.getAttribute("data-tile") || "").trim().toUpperCase();
          if(cell && keys.has(cellKey)){
            const cgx = parseInt(cell.getAttribute("data-gx") || "0", 10);
            const cgy = parseInt(cell.getAttribute("data-gy") || "0", 10);
            setCell(cell, cgx, cgy);
          }
        }

        state.lastKey = "";
        requestAnimationFrame(() => {
          try{ renderPool(); }catch(_){}
        });

        // Disabled: backend refresh must not overwrite the visible panel after click.
      }catch(_){}
    }

    function openPanel(tile, gx, gy){
      const mark = state.backendMarksByTile.get(tile) || state.marksByTile.get(tile) || null;
      const taken = state.taken.has(tile);

      const markTag = (mark && typeof mark.tag === "string") ? mark.tag.trim().toUpperCase() : "";
      const isMonolith = (tile === MONOLITH_TILE) || (markTag === MONOLITH_TAG);
const hasCreator = !!(CREATOR_TILE || CREATOR_TAG);
const isCreator  = hasCreator && (
  (CREATOR_TILE && tile === CREATOR_TILE) ||
  (CREATOR_TAG  && markTag === CREATOR_TAG)
);

      el.vTile.textContent = (window.coordDisplayFromG ? window.coordDisplayFromG(gx, gy) : tile);

      if(mark){
        el.vTag.textContent = mark.tag || "TAKEN";
        el.vTs.textContent  = mark.ts || "None";
        el.vNote.textContent = mark.note ? String(mark.note) : "None";

        if(isMonolith && !mark.note) el.vNote.textContent = "Leave your mark. Live forever.";
// no creator fallback note

        if(isMonolith){
          setWalletUI(MONOLITH_WALLET, false, true);
        } else {
          const w = mark.wallet ? String(mark.wallet) : "";
          setWalletUI(w, isPublicWallet(mark), !!w);
        }

        setHandleUI(mark.handle || "");

          setLinkUI(mark.link || "");

        el.vBody.textContent = "";
} else {
        el.vTag.textContent = taken ? "TAKEN" : "OPEN";
        el.vTs.textContent  = "None";

        if(isMonolith){
          setWalletUI(MONOLITH_WALLET, false, true);
          el.vNote.textContent = "Leave your mark. Live forever.";
        } else if(isCreator){
          setWalletUI("", false, false);
// no creator fallback note
        } else {
          setWalletUI("", false, false);
          el.vNote.textContent = "None";
        }

        setHandleUI("");

          setLinkUI("");

        el.vBody.textContent = "";
}

      el.ptitle.textContent = "Tile " + tile;
      el.psub.textContent = "Tap a tile to inspect. Drag to move. Wheel or pinch to zoom.";

        // panel media
        if(el.vMedia){
          const img=(mark&&typeof mark.img==="string"&&mark.img.trim())?mark.img.trim():"";
          const src=
            isMonolith?MONOLITH_LOGO:
            isCreator ?CREATOR_LOGO :
            img?img:
            taken?PLACEHOLDER_IMG:
            "";
          el.vMedia.innerHTML=src?mediaHTML(src,tile):"";
        }

      panel.classList.add("open");
      // Disabled: backend refresh was poisoning panel/feed maps after click.
    }

    function ensurePool(){
      const vv = window.visualViewport; const w = vv ? vv.width : vp.clientWidth;
      const vv2 = window.visualViewport; const h = vv2 ? vv2.height : vp.clientHeight;

      const visW = w / state.zoom;
      const visH = h / state.zoom;

        const cols = Math.ceil(visW / STEP) + state.POOL_PAD * 2 + 10;
        const rows = Math.ceil(visH / STEP) + state.POOL_PAD * 2 + 22;

        if(cols === state.cols && rows === state.rows && state.pool.length && state.lastVW === w && state.lastVH === h){
          return;
        }

        state.lastVW = w; state.lastVH = h;

      state.cols = cols;
      state.rows = rows;
      state.pool = [];
      world.innerHTML = "";

      const n = cols * rows;
      for(let i=0;i<n;i++){
        const d = document.createElement("div");
        d.className = "cell";
        d.innerHTML = `<div class="spray"></div><div class="tag"></div><div class="id"></div>`;
        world.appendChild(d);
        state.pool.push(d);

        d.addEventListener("click", () => {
          if(state.moved) return;
          const gx = parseInt(d.getAttribute("data-gx") || "0", 10);
          const gy = parseInt(d.getAttribute("data-gy") || "0", 10);
          const tile = d.getAttribute("data-tile") || tileIdFromCoords(gx, gy);
          openPanel(tile, gx, gy);
        }, { passive:true });
      }
    }

    function setCell(cell, gx, gy){
      const tile = tileIdFromCoords(gx, gy);
      const mark = state.backendMarksByTile.get(tile) || state.marksByTile.get(tile) || null;
      const taken = state.taken.has(tile);

      cell.style.left = (gx * STEP) + "px";
      cell.style.top  = ((-gy) * STEP) + "px";

      cell.setAttribute("data-gx", String(gx));
      cell.setAttribute("data-gy", String(gy));
      cell.setAttribute("data-tile", tile);

      cell.className = "cell" + (taken ? " taken" : "");
      cell.setAttribute("aria-label", `Tile ${tile} ${taken ? "taken" : "open"}`);

      const spray = cell.querySelector(".spray");
      const tag = cell.querySelector(".tag");
      const id = cell.querySelector(".id");

      if(id){ id.textContent = (gx===0 && gy===0) ? "ORIGIN" : tile; }

      if(tag){
        const hideExteriorLabels =
          document.body.classList.contains("view-default") ||
          document.body.classList.contains("view-brand") ||
          document.body.classList.contains("view-imageonly");

        if(hideExteriorLabels){
          tag.textContent = "";
        }else if(mark && mark.tag){
          tag.textContent = mark.tag;
        }else{
          tag.textContent = taken ? "TAKEN" : "";
        }
      }

      if(spray){
        const markTag = (mark && typeof mark.tag === "string") ? mark.tag.trim().toUpperCase() : "";
        const isMonolith = (tile === MONOLITH_TILE) || (markTag === MONOLITH_TAG);
const hasCreator = !!(CREATOR_TILE || CREATOR_TAG);
const isCreator  = hasCreator && (
  (CREATOR_TILE && tile === CREATOR_TILE) ||
  (CREATOR_TAG  && markTag === CREATOR_TAG)
);

        const img = (mark && typeof mark.img === "string" && mark.img.trim()) ? mark.img.trim() : "";

        if(isMonolith){
          spray.innerHTML = mediaHTML(MONOLITH_LOGO, "MONOLITH");

} else if(isCreator){
          spray.innerHTML = mediaHTML(CREATOR_LOGO, "MRCAULIMAN");
        } else if(img){
          spray.innerHTML = mediaHTML(img, tile);
        } else {
          spray.innerHTML = mediaHTML(PLACEHOLDER_IMG, "XRP");
        }
      }
    }

    function renderPool(){
      ensurePool();

      const w = vp.clientWidth;
      const h = vp.clientHeight;

      const halfW = (w * 0.5) / state.zoom;
      const halfH = (h * 0.5) / state.zoom;

      const startGX = Math.floor((state.camX - halfW) / STEP) - state.POOL_PAD;
      const startGY = Math.floor((-state.camY - halfH) / STEP) - state.POOL_PAD;

      const key = `${startGX},${startGY},${state.cols},${state.rows},${state.taken.size},${state.marksByTile.size},${state.backendMarksByTile.size},${state.zoom.toFixed(3)}`;
      if(key === state.lastKey) return;
      state.lastKey = key;

      let i = 0;
      for(let ry=0; ry<state.rows; ry++){
        for(let rx=0; rx<state.cols; rx++){
          const gx = startGX + rx;
          const gy = startGY + ry;
          setCell(state.pool[i++], gx, gy);
        }
      }
    }

function centerOriginOnce(){
  if(state._originCentered) return;
  state._originCentered = true;

  // camX/camY are WORLD pixel coords that land at screen center.
  // Center ORIGIN tile at grid 0,0 by targeting tile center.
  state.camX = (STEP * 0.5);
  state.camY = (STEP * 0.5);

  state.zoom = clamp(0.55, state.ZMIN, state.ZMAX);
  updateWorldTransform();
  if(typeof schedulePoolUpdate === "function") schedulePoolUpdate();
}

function applyView(mode){
  // Camera presets only. No new coordinate system.
  // camX/camY are world pixel coords that land at screen center.

  // Do not switch views mid-gesture
  if(state.down || state.pinch || state.dragging) return;

  // Presets, tune here only
  const PRESET = {
    brand:   { zoom: 0.65, camX: (STEP * 0.5), camY: (STEP * 0.5) },
    sat:   { zoom: 0.18, camX: (STEP * 0.5), camY: (STEP * 0.5) }
  };

  const key = (mode === "sat") ? "sat" : "brand";

  // Save last user view once per entry into a preset mode
  if(!state._viewMode || state._viewMode === "free"){
    state._viewLast = { camX: state.camX, camY: state.camY, zoom: state.zoom };
  }

  state._viewMode = key;
  try{ document.body.classList.toggle("view-default", false); }catch(_){}
  try{ document.body.classList.toggle("view-brand", key === "brand"); }catch(_){}
  try{ document.body.classList.toggle("view-imageonly", key === "brand" || key === "sat"); }catch(_){}

  state.zoom = clamp(PRESET[key].zoom, state.ZMIN, state.ZMAX);
  
  updateWorldTransform();
  renderPool();
}

function restoreView(){
  if(!state._viewLast) return;
  if(state.down || state.pinch || state.dragging) return;
  state.camX = state._viewLast.camX;
  state.camY = state._viewLast.camY;
  state.zoom = clamp(state._viewLast.zoom, state.ZMIN, state.ZMAX);
  state._viewMode = "free";
  try{ document.body.classList.remove("view-default"); document.body.classList.remove("view-brand"); document.body.classList.remove("view-imageonly"); }catch(_){ }
  updateWorldTransform();
  renderPool();
}

function centerOriginNow(){
  if(state.down || state.pinch || state.dragging) return;
  state._viewMode = "free";
  try{ document.body.classList.remove("view-default"); document.body.classList.remove("view-brand"); document.body.classList.remove("view-imageonly"); }catch(_){}
  state.zoom = clamp(0.55, state.ZMIN, state.ZMAX);
  state.camX = (STEP * 0.5);
  state.camY = (STEP * 0.5);
  updateWorldTransform();
  renderPool();
}

function updateWorldTransform(){
  const w = vp.clientWidth;
  const h = vp.clientHeight;

  // No rounding. Rounding causes jitter on high-res trackpads
  const tx = (w * 0.5) - (state.camX * state.zoom);
  const ty = (h * 0.5) - (state.camY * state.zoom);

  world.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${state.zoom})`;
}

    function tick(){
      if(!state.down && !state.pinch){
        state.vx *= 0.85;
        state.vy *= 0.85;

        if(Math.abs(state.vx) < 0.06) state.vx = 0;
        if(Math.abs(state.vy) < 0.06) state.vy = 0;

        state.camX -= state.vx;
        state.camY -= state.vy;
      }

      updateWorldTransform();
      renderPool();

      state.raf = requestAnimationFrame(tick);
    }

    function onDown(e){
        try{
          const t = e && e.target;
          state.downFromWall = !!(t === vp || t === world || (t && t.closest && t.closest("#world")));
        }catch(_){ state.downFromWall = false; }
      state.ptrs.set(e.pointerId, { x:e.clientX, y:e.clientY });

      if(state.pid === null){
        state.down = true;
        state.pid = e.pointerId;

        state.lastX = e.clientX;
        state.lastY = e.clientY;

        state.dragStartX = e.clientX;
        state.dragStartY = e.clientY;

        state.moved = false;
        state.dragging = false;
        state.movedDist = 0;

        state.vx = 0;
        state.vy = 0;
      }

      try{ vp.setPointerCapture(e.pointerId); } catch(_){}
    }

    function beginPinchIfReady(){
      if(state.ptrs.size !== 2) return;

      const pts = Array.from(state.ptrs.values());
      const a = pts[0], b = pts[1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;

      const dist = Math.hypot(dx, dy);
      const midX = (a.x + b.x) * 0.5;
      const midY = (a.y + b.y) * 0.5;

      const w = vp.clientWidth;
      const h = vp.clientHeight;

      const anchorWX = state.camX + (midX - w*0.5) / state.zoom;
      const anchorWY = state.camY + (midY - h*0.5) / state.zoom;

      state.vx = 0;
      state.vy = 0;

      state.pinch = {
        startDist: dist,
        startZoom: state.zoom,
        anchorWX, anchorWY
      };

      state.justPinchedUntil = performance.now() + 120;

      state.dragging = false;
      vp.classList.remove("dragging");


          if(_upIsMouse && !_upWasDrag && _upX !== null && _upY !== null){

            _openCellUnderPoint(_upX, _upY);

          }

        // DESKTOP CLICK-FALLBACK: if we did not really drag, open the tile under cursor
        if (e && e.pointerType === "mouse" && state.movedDist < 12) {
          const rect = vp.getBoundingClientRect();
          const sx = e.clientX - rect.left;
          const sy = e.clientY - rect.top;
          const wx = state.camX + (sx - vp.clientWidth * 0.5) / Math.max(0.2, state.zoom);
          const wy = state.camY + (sy - vp.clientHeight * 0.5) / Math.max(0.2, state.zoom);
          const gx = Math.round(wx / STEP);
          const gy = -Math.round(wy / STEP);
          const tile = tileIdFromCoords(gx, gy);
          openPanel(tile, gx, gy);
        }

    }

    function applyZoomAtScreen(newZoom, screenX, screenY){
      const w = vp.clientWidth;
      const h = vp.clientHeight;

      const wx = state.camX + (screenX - w*0.5) / state.zoom;
      const wy = state.camY + (screenY - h*0.5) / state.zoom;

      state.zoom = clamp(newZoom, state.ZMIN, state.ZMAX);

      state.camX = wx - (screenX - w*0.5) / state.zoom;
      state.camY = wy - (screenY - h*0.5) / state.zoom;

      state.lastKey = "";
      renderPool();
    }

    function hardResetDrag(){
  try{
    state.down = false;
    state.dragging = false;
    state.moved = false;
    state.movedDist = 0;
    state.pid = null;
    state.pinch = null;
    try{ if(state.ptrs && state.ptrs.clear) state.ptrs.clear(); }catch(_){ }
    vp.classList.remove("dragging");
  }catch(_){ }
}

function onMove(e){
    // DESKTOP CAPTURE FIX: if mouse buttons are up, treat as release
    if(e && e.pointerType === "mouse" && typeof e.buttons === "number" && e.buttons === 0){
      try{ if(state.ptrs) state.ptrs.delete(e.pointerId); }catch(_){ }
      state.down = false;
      state.dragging = false;
      state.moved = false;
      state.movedDist = 0;
      state.pid = null;
      try{ if(state.ptrs && state.ptrs.clear) state.ptrs.clear(); }catch(_){ }
      vp.classList.remove("dragging");
      try{ vp.releasePointerCapture(e.pointerId); }catch(_){ }
      return;
    }


    // DESKTOP CAPTURE FIX: if mouse buttons are up, we missed pointerup, so kill drag + release capture
    if(e && e.pointerType === "mouse" && typeof e.buttons === "number" && e.buttons === 0){
      try{ vp.releasePointerCapture(e.pointerId); }catch(_){ }
      try{ hardResetDrag(); }catch(_){
        // fallback if hardResetDrag is not in scope
        try{ state.down=false; state.dragging=false; state.moved=false; state.movedDist=0; state.pid=null; if(state.ptrs&&state.ptrs.clear) state.ptrs.clear(); vp.classList.remove("dragging"); }catch(__){}
      }
      return;
    }

      if(state.ptrs.has(e.pointerId)){
        state.ptrs.set(e.pointerId, { x:e.clientX, y:e.clientY });
      }

      if(state.ptrs.size === 2){
        if(!state.pinch) beginPinchIfReady();
        if(state.pinch){
          const pts = Array.from(state.ptrs.values());
          const a = pts[0], b = pts[1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);

          const midX = (a.x + b.x) * 0.5;
          const midY = (a.y + b.y) * 0.5;

          const targetZoom = clamp(state.pinch.startZoom * (dist / Math.max(20, state.pinch.startDist)), state.ZMIN, state.ZMAX);

          const w = vp.clientWidth;
          const h = vp.clientHeight;

          state.zoom = targetZoom;
          state.camX = state.pinch.anchorWX - (midX - w*0.5) / state.zoom;
          state.camY = state.pinch.anchorWY - (midY - h*0.5) / state.zoom;

          state.vx = 0;
          state.vy = 0;

          state.lastKey = "";
            return;
        }
      }

      if(!state.down || e.pointerId !== state.pid) return;

      const dx = e.clientX - state.lastX;
      const dy = e.clientY - state.lastY;

      state.lastX = e.clientX;
      state.lastY = e.clientY;

      state.movedDist += Math.abs(dx) + Math.abs(dy);

      const distFromStart = Math.abs(e.clientX - state.dragStartX) + Math.abs(e.clientY - state.dragStartY);
      const thresh = (e.pointerType === "mouse") ? state.DRAG_MOUSE : state.DRAG_TOUCH;

      if(!state.dragging){
        if(distFromStart < thresh) return;

        state.dragging = true;
        state.moved = true;
        vp.classList.add("dragging");

        state.vx = 0;
        state.vy = 0;
        return;
      }

      const s = Math.max(0.2, state.zoom);
      state.camX -= dx / s;
      state.camY -= dy / s;

      const vx = (dx / s);
      const vy = (dy / s);

      const vmax = 45;
      state.vx = clamp(vx, -vmax, vmax);
      state.vy = clamp(vy, -vmax, vmax);
    }

    function onUp(e){

        // FORCE_OPEN_REALCELL
        try{
          var drag = false;
          try{ drag = !!(state && (state.dragging || (state.movedDist||0) >= 12)); }catch(_){ }
            try{
              if(e && e.pointerType === "touch"){
                if(state && state.ptrs && state.ptrs.size >= 2) drag = true;
                if(state && state.pinch) drag = true;
                if(performance.now() < (state.justPinchedUntil||0)) drag = true;
                if((state.movedDist||0) >= 8) drag = true;
              }
            }catch(_){ }
          if(!drag && state && state.downFromWall && e && e.clientX != null && e.clientY != null){
              var _hit = document.elementFromPoint(e.clientX, e.clientY);
              if(_hit && _hit.closest && _hit.closest(".top, .panel")){ /* UI tap */ }
              else{
                var cell = pickCellFromPoint(e.clientX, e.clientY);
                var tile = tileFromCell(cell);
                if(tile){
                  try{ openPanel(tile, 0, 0); }catch(_){ }
                }
              }
            }
        }catch(_){ }

          try{ if(state) state.downFromWall = false; }catch(_){ }

      // DESKTOP OPEN FIX: click is unreliable after pointer capture. Open tile on mouse pointerup when not dragging

    const _upIsMouse = !!(e && e.pointerType === "mouse");

    const _upX = (e && typeof e.clientX === "number") ? e.clientX : null;

    const _upY = (e && typeof e.clientY === "number") ? e.clientY : null;

    const _upMoved = (state.movedDist || 0);

    const _upWasDrag = !!(state.dragging || _upMoved >= 12);

    function _intAttr(el, keys){

      for(const k of keys){

        const v = el.getAttribute(k);

        if(v !== null && v !== ""){

          const n = parseInt(v, 10);

          if(Number.isFinite(n)) return n;

        }

      }

      return 0;

    }

    function _openCellUnderPoint(x,y){

      try{

        const elAt = document.elementFromPoint(x,y);

        const cell = elAt && elAt.closest ? elAt.closest(".cell") : null;

        if(!cell) return false;

        const gx = _intAttr(cell, ["data-gx","data-x","data-col","data-c","data-i"]);

        const gy = _intAttr(cell, ["data-gy","data-y","data-row","data-r","data-j"]);

        const tile = cell.getAttribute("data-tile") || cell.getAttribute("data-id") || cell.id || tileIdFromCoords(gx, gy);

        openPanel(tile, gx, gy);

        return true;

      }catch(_){ return false; }

    }

      state.ptrs.delete(e.pointerId);

      if(state.ptrs.size < 2){
        if(state.pinch){
          state.justPinchedUntil = performance.now() + 140;
        }
        state.pinch = null;
      }

      if(e.pointerId === state.pid){
        if(state.ptrs.size > 0){
          const nextId = Array.from(state.ptrs.keys())[0];
          const nextPt = state.ptrs.get(nextId);

          state.pid = nextId;
          state.lastX = nextPt ? nextPt.x : state.lastX;
          state.lastY = nextPt ? nextPt.y : state.lastY;

          state.dragStartX = state.lastX;
          state.dragStartY = state.lastY;

          state.down = true;

          state.dragging = false;
          vp.classList.remove("dragging");
          return;
        }
      }

      if(state.ptrs.size === 0){
        state.down = false;
        state.pid = null;
        state.dragging = false;
        vp.classList.remove("dragging");

        const recentlyPinched = performance.now() < state.justPinchedUntil;

        if(!state.moved || recentlyPinched || state.movedDist < 12){
          state.vx = 0;
          state.vy = 0;
        }

        setTimeout(() => { state.moved = false; }, 0);
      }
    }

function onWheel(e){
  e.preventDefault();
  state.vx = 0;
  state.vy = 0;
  state.dragging = false;
  vp.classList.remove("dragging");

  const w = vp.clientWidth;
  const h = vp.clientHeight;

  const rect = vp.getBoundingClientRect();
  const sx = clamp(e.clientX - rect.left, 0, w);
  const sy = clamp(e.clientY - rect.top, 0, h);

  let delta = e.deltaY || 0;

  // normalize wheel units across devices
  if(e.deltaMode === 1) delta *= 16;       // lines -> px
  else if(e.deltaMode === 2) delta *= 800; // pages -> px

  // trackpad tends to be small deltas at high frequency
  const isTrackpad = Math.abs(delta) < 80;

  // tune sensitivity per device
  const k = isTrackpad ? 0.0014 : 0.0011;

  // ctrlKey or metaKey means gesture zoom on some browsers, damp it
  const ctrlBoost = (e.ctrlKey || e.metaKey) ? 0.65 : 1.0;

  const factor = Math.exp(-delta * k * ctrlBoost);
  const newZoom = state.zoom * factor;

  applyZoomAtScreen(newZoom, sx, sy);
}

    function centerOn(gx, gy){
      state.camX = gx * STEP;
      state.camY = -gy * STEP;

      state.vx = 0;
      state.vy = 0;

      state.down = false;
      state.dragging = false;
      state.pinch = null;
      state.pid = null;
      try{ if(state.ptrs && state.ptrs.clear) state.ptrs.clear(); }catch(e){}
      vp.classList.remove("dragging");

      state.lastKey = "";
      renderPool();
    }

    function handleGo(){
      const p = parseQueryToCoords(el.q.value);
      if(!p){
        toastShow("bad query", "bad");
        return;
      }
      centerOn(p.gx, p.gy);
      setTimeout(() => { refreshPanelFromBackend(p.tile, p.gx, p.gy); }, 120);
      setTimeout(() => { refreshPanelFromBackend(p.tile, p.gx, p.gy); }, 650);
      toastShow("jump " + p.tile, "good");
    }

    function handleDirectTileLink(){
      const params = new URLSearchParams(window.location.search);
      const directTile = params.get("tile");
      if(!directTile) return;
      const p = parseQueryToCoords(directTile);
      if(!p) return;
      if(el.q) el.q.value = p.tile;
      centerOn(p.gx, p.gy);
      openPanel(p.tile, p.gx, p.gy);
      toastShow("tile " + p.tile, "good");
    }

    setTimeout(handleDirectTileLink, 250);

    async function loadFeed(){
      try{
        const res = await fetch(FEED_URL, { cache: "no-store" });
        if(!res.ok) throw new Error("feed http " + res.status);
        const data = await res.json();

        const taken = new Set();
        const marks = new Map();

        if(Array.isArray(data)){
          for(const it of data){
            if(!it) continue;
            const gx = (it.gx!=null) ? parseInt(it.gx,10) : null;
            const gy = (it.gy!=null) ? parseInt(it.gy,10) : null;
            const tile = (Number.isFinite(gx) && Number.isFinite(gy))
              ? tileIdFromCoords(gx, gy)
              : String(it.tile || "").trim().toUpperCase();
            if(!tile) continue;
            taken.add(tile);
            marks.set(tile, {
              id: it.id || null,
              tile,
              gx: Number.isFinite(it.gx) ? it.gx : null,
              gy: Number.isFinite(it.gy) ? it.gy : null,
              tag: it.tag || null,
              ts: it.ts || null,
              img: it.img || null,
              wallet: it.wallet || null,

              wallet_public: it.wallet_public === true,
              wallet_visibility: it.wallet_visibility || null,
              visibility: it.visibility || null,
              public_wallet: it.public_wallet || null,

              handle: it.handle || null,
                link: it.link || null,
              note: it.note || null
            });
          }
        }

        state.taken = taken;
        state.marksByTile = marks;

        el.kTaken.textContent = String(state.taken.size);

        state.lastKey = "";
      }catch(_){
        toastShow("feed fail", "warn");
      }
    }

    function startNearSeed(){
      centerOn(0, 0);
      closePanel();
    }

    el.copyWallet.addEventListener("click", copyWallet, { passive:true });
    el.revealWallet.addEventListener("click", revealWallet, { passive:true });
    el.hideWallet.addEventListener("click", hideWallet, { passive:true });

    
el.close.addEventListener("click", function(e){
  try{ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); }catch(_){}
  closePanel();
}, { passive:false, capture:true });

    el.go.addEventListener("click", handleGo, { passive:true });
    el.q.addEventListener("keydown", (e) => { if(e.key === "Enter") handleGo(); }, { passive:true });

    vp.addEventListener("pointerdown", onDown, { passive:false });
    vp.addEventListener("pointermove", onMove, { passive:false });
    vp.addEventListener("pointerup", onUp, { passive:false });
    vp.addEventListener("pointercancel", onUp, { passive:false });



    // DESKTOP CAPTURE FIX: if capture is lost, vp\.dragging can stick forever
    vp.addEventListener("lostpointercapture", function(e){
      try{
        if(state.ptrs && state.ptrs.delete) state.ptrs.delete(e.pointerId);
      }catch(_){ }
      try{ hardResetDrag(); }catch(_){
        try{
          state.down = false;
          state.dragging = false;
          state.moved = false;
          state.movedDist = 0;
          state.pid = null;
          try{ if(state.ptrs && state.ptrs.clear) state.ptrs.clear(); }catch(__){ }
          vp.classList.remove("dragging");
        }catch(__){ }
      }
    }, { passive:true });

    // DESKTOP CAPTURE FIX: if capture is lost, force-reset drag state
    function onLostPointerCapture(e){
      try{
        if(state && state.ptrs){
          try{ state.ptrs.delete(e.pointerId); }catch(_){ }
        }
        state.down = false;
        state.dragging = false;
        state.moved = false;
        state.movedDist = 0;
        state.pid = null;
        try{ if(state.ptrs && state.ptrs.clear) state.ptrs.clear(); }catch(_){ }
        vp.classList.remove("dragging");try{ document.body.classList.remove("grabbing"); }catch(_){ }
      }catch(_){ }
    }
    vp.addEventListener("lostpointercapture", onLostPointerCapture, { passive:true });

    // DESKTOP SAFETY: ensure pointer events always reach handlers even if pointer leaves vp
    window.addEventListener("pointermove", onMove, { passive:false, capture:true });
    window.addEventListener("pointerup", onUp, { passive:false, capture:true });
    window.addEventListener("pointercancel", onUp, { passive:false, capture:true });

    vp.addEventListener("wheel", onWheel, { passive:false });



    function hardResetDrag(){
      try{
        state.down = false;
        state.dragging = false;
        state.moved = false;
        state.movedDist = 0;
        state.pid = null;
        try{ if(state.ptrs && state.ptrs.clear) state.ptrs.clear(); }catch(_){ }
        vp.classList.remove("dragging");try{ document.body.classList.remove("grabbing"); }catch(_){ }
      }catch(_){ }
    }

    window.addEventListener("mousemove", function(e){
      if(e && typeof e.buttons === "number" && e.buttons === 0) hardResetDrag();
    }, true);
    window.addEventListener("mouseup", hardResetDrag, true);
    window.addEventListener("mouseleave", hardResetDrag, true);
    window.addEventListener("blur", hardResetDrag, true);
    document.addEventListener("visibilitychange", function(){ if(document.hidden) hardResetDrag(); }, true);

    // DESKTOP MOUSE WATCHDOG: if mouse buttons are up, drag must be off
    window.addEventListener("mousemove", function(e){
      if(e && typeof e.buttons === "number" && e.buttons === 0){
        hardResetDrag();
      }
    }, true);
    window.addEventListener("mouseup", function(){ hardResetDrag(); }, true);
    window.addEventListener("blur", function(){ hardResetDrag(); }, true);

    if(el.btnCenter){
      el.btnCenter.addEventListener("click", () => {
        centerOriginNow();
        toastShow("centered", "good");
      }, { passive:true });
    }

    if(el.btnNav){
      el.btnNav.addEventListener("click", () => {
        state._viewMode = "free";
        try{
          document.body.classList.remove("view-default");
          document.body.classList.remove("view-brand");
          document.body.classList.remove("view-imageonly");
        }catch(_){}
        state.zoom = clamp(0.65, state.ZMIN, state.ZMAX);
        updateWorldTransform();
        renderPool();
        toastShow("navigation", "good");
      }, { passive:true });
    }

    if(el.btnBrand){
      el.btnBrand.addEventListener("click", () => {
        applyView("brand");
        toastShow("brand view", "good");
      }, { passive:true });
    }

    if(el.btnSat){
      el.btnSat.addEventListener("click", () => {
        applyView("sat");
        toastShow("satellite view", "good");
      }, { passive:true });
    }
    centerOriginOnce();
    renderPool();
    requestAnimationFrame(tick);

    resolveFirstWorking(CREATOR_LOGO_CANDIDATES).then((u) => {
      CREATOR_LOGO = u;
      state.lastKey = "";
    });

    loadFeed().then(() => {
    centerOriginOnce();

    // Entry default view only. Navigation View remains original.
    try{ document.body.classList.add("view-default"); }catch(_){}
    state.zoom = clamp(0.38, state.ZMIN, state.ZMAX);
    draw();
  });
    setInterval(loadFeed, 15000);
  })();
}
