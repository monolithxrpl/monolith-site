(function(){
  const STORE_KEY = "monolithFavoritePending";

  function viewedCoord(){
    const qs = new URLSearchParams(location.search);
    const pathParts = location.pathname.split("/").filter(Boolean);
    const pathTile = pathParts[0] === "tile" && pathParts[1] ? pathParts[1] : "";
    return String(qs.get("tile") || pathTile || "ORIGIN").trim().toUpperCase();
  }

  function norm(v){
    return String(v || "").trim().toUpperCase().replace(/\s+/g, "");
  }

  function btn(){
    return document.getElementById("favoriteBtn");
  }

  function getPending(){
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    } catch (_) {
      return null;
    }
  }

  function setPending(data){
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }

  function clearPending(){
    localStorage.removeItem(STORE_KEY);
  }

  function setButton(text, disabled){
    const b = btn();
    if (!b) return;
    b.textContent = text;
    b.disabled = Boolean(disabled);
  }

  function removeSignLink(){
    const old = document.getElementById("favoriteSignLink");
    if (old) old.remove();
  }

  function showSignLink(signUrl){
    removeSignLink();

    const b = btn();
    if (!b || !signUrl) return;

    const a = document.createElement("a");
    a.id = "favoriteSignLink";
    a.className = "btn";
    a.href = signUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "Open Xaman Sign-In";
    a.style.marginLeft = "8px";

    b.insertAdjacentElement("afterend", a);
  }

  async function jsonFetch(url, body){
    const res = await fetch(url, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  async function startFavorite(){
    const targetCoordinate = viewedCoord();

    const source = prompt("Enter YOUR tile coordinate to add " + targetCoordinate + " to your Top 6:");
    if (!source) return;

    const sourceCoordinate = norm(source);

    if (!sourceCoordinate) return;

    if (sourceCoordinate === targetCoordinate) {
      alert("You cannot favorite your own tile.");
      return;
    }

    setButton("Creating owner sign-in...", true);

    try {
      const start = await jsonFetch("/api/tile/edit/start", { coordinate:sourceCoordinate });

      if (!start.res.ok || !start.data.ok || !start.data.auth || !start.data.auth.payloadUuid) {
        alert(start.data.error || "Owner sign-in failed.");
        setButton("♡ Add to Top 6", false);
        return;
      }

      const pending = {
        sourceCoordinate,
        targetCoordinate,
        payloadUuid:start.data.auth.payloadUuid,
        signUrl:start.data.auth.signUrl || "",
        createdAt:Date.now()
      };

      setPending(pending);
      showSignLink(pending.signUrl);
      setButton("I Signed — Save Top 6", false);

      alert("Open the Xaman sign-in link, approve with the owner wallet, then click I Signed — Save Top 6.");
    } catch (e) {
      alert("Favorite failed.");
      setButton("♡ Add to Top 6", false);
    }
  }

  async function submitFavorite(replaceIndex){
    const pending = getPending();
    if (!pending || pending.targetCoordinate !== viewedCoord()) {
      clearPending();
      setButton("♡ Add to Top 6", false);
      return;
    }

    const body = {
      sourceCoordinate:pending.sourceCoordinate,
      targetCoordinate:pending.targetCoordinate,
      payloadUuid:pending.payloadUuid
    };

    if (Number.isInteger(replaceIndex)) body.replaceIndex = replaceIndex;

    return jsonFetch("/api/tile/favorite", body);
  }

  async function finishFavorite(){
    setButton("Verifying owner...", true);

    try {
      let result = await submitFavorite();

      if (!result) return;

      if (result.res.status === 409 && result.data && result.data.error === "owner_signin_not_signed") {
        showSignLink(getPending() && getPending().signUrl);
        alert("Xaman sign-in is not signed yet. Open the sign-in link, approve it, then click I Signed — Save Top 6 again.");
        setButton("I Signed — Save Top 6", false);
        return;
      }

      if (result.res.status === 409 && result.data && result.data.error === "top_six_full") {
        const list = Array.isArray(result.data.favoriteTiles) ? result.data.favoriteTiles : [];
        const choice = prompt(
          "Your Top 6 is full. Choose slot 1-6 to replace:\n" +
          list.map((x, i) => (i + 1) + ". " + x).join("\n")
        );

        if (!choice) {
          setButton("I Signed — Save Top 6", false);
          return;
        }

        const idx = Number(choice) - 1;

        if (!Number.isInteger(idx) || idx < 0 || idx > 5) {
          alert("Invalid slot.");
          setButton("I Signed — Save Top 6", false);
          return;
        }

        result = await submitFavorite(idx);
      }

      if (!result.res.ok || !result.data.ok) {
        alert(result.data.error || "Favorite failed.");
        setButton("I Signed — Save Top 6", false);
        return;
      }

      clearPending();
      removeSignLink();

      setButton(result.data.alreadyFavorited ? "♥ Already Top 6" : "♥ Added to Top 6", true);
      setTimeout(() => location.reload(), 900);
    } catch (e) {
      alert("Favorite failed.");
      setButton("I Signed — Save Top 6", false);
    }
  }

  function hydratePending(){
    const pending = getPending();
    if (!pending || pending.targetCoordinate !== viewedCoord()) return;

    showSignLink(pending.signUrl);
    setButton("I Signed — Save Top 6", false);
  }

  async function handleClick(){
    const pending = getPending();

    if (pending && pending.targetCoordinate === viewedCoord()) {
      await finishFavorite();
      return;
    }

    await startFavorite();
  }

  document.addEventListener("DOMContentLoaded", function(){
    const b = btn();
    if (!b) return;

    b.addEventListener("click", handleClick);
    hydratePending();
  });
})();
