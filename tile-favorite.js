(function(){
  function viewedCoord(){
    const qs = new URLSearchParams(location.search);
    const pathParts = location.pathname.split("/").filter(Boolean);
    const pathTile = pathParts[0] === "tile" && pathParts[1] ? pathParts[1] : "";
    return String(qs.get("tile") || pathTile || "ORIGIN").trim().toUpperCase();
  }

  function btn(){
    return document.getElementById("favoriteBtn");
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
    a.textContent = "Open Xaman";
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

  async function ensureSession(){
    if (!window.MonolithSession) {
      alert("Owner session system is not loaded.");
      return null;
    }

    let session = window.MonolithSession.get();

    if (!session) {
      const source = prompt("Enter YOUR MONOLITH tile coordinate to sign in:");
      if (!source) return null;

      const b = btn();
      if (b) {
        b.disabled = true;
        b.textContent = "Creating sign-in...";
      }

      try {
        session = await window.MonolithSession.start(source);
        showSignLink(session.signUrl);

        if (b) {
          b.disabled = false;
          b.textContent = "I Signed — Add to Top 6";
        }

        if (window.MonolithSession.render) window.MonolithSession.render();

        alert("Open Xaman, approve the owner sign-in, then click I Signed — Add to Top 6.");
        return null;
      } catch (e) {
        alert(e.message || "Owner sign-in failed.");
        if (b) {
          b.disabled = false;
          b.textContent = "♡ Add to Top 6";
        }
        return null;
      }
    }

    const verified = await window.MonolithSession.verify();

    if (!verified.ok) {
      showSignLink(session.signUrl);

      const b = btn();
      if (b) b.textContent = "I Signed — Add to Top 6";

      alert("Owner sign-in is not verified yet. Open Xaman, approve it, then click I Signed — Add to Top 6 again.");
      return null;
    }

    removeSignLink();
    if (window.MonolithSession.render) window.MonolithSession.render();
    return verified.session;
  }

  async function submitFavorite(session, replaceIndex){
    const body = {
      sourceCoordinate:session.sourceCoordinate,
      targetCoordinate:viewedCoord(),
      payloadUuid:session.payloadUuid
    };

    if (Number.isInteger(replaceIndex)) body.replaceIndex = replaceIndex;

    return jsonFetch("/api/tile/favorite", body);
  }

  async function addFavoriteToTopSix(){
    const b = btn();
    if (!b) return;

    const targetCoordinate = viewedCoord();

    b.disabled = true;
    b.textContent = "Checking sign-in...";

    try {
      const session = await ensureSession();

      if (!session) {
        b.disabled = false;
        return;
      }

      if (session.sourceCoordinate === targetCoordinate) {
        alert("You cannot favorite your own tile.");
        b.disabled = false;
        b.textContent = "♡ Add to Top 6";
        return;
      }

      b.textContent = "Saving Top 6...";

      let result = await submitFavorite(session);

      if (result.res.status === 409 && result.data && result.data.error === "top_six_full") {
        const list = Array.isArray(result.data.favoriteTiles) ? result.data.favoriteTiles : [];
        const choice = prompt(
          "Your Top 6 is full. Choose slot 1-6 to replace:\n" +
          list.map((x, i) => (i + 1) + ". " + x).join("\n")
        );

        if (!choice) {
          b.disabled = false;
          b.textContent = "♡ Add to Top 6";
          return;
        }

        const idx = Number(choice) - 1;

        if (!Number.isInteger(idx) || idx < 0 || idx > 5) {
          alert("Invalid slot.");
          b.disabled = false;
          b.textContent = "♡ Add to Top 6";
          return;
        }

        result = await submitFavorite(session, idx);
      }

      if (!result.res.ok || !result.data.ok) {
        alert(result.data.error || "Favorite failed.");
        b.disabled = false;
        b.textContent = "♡ Add to Top 6";
        return;
      }

      b.textContent = result.data.alreadyFavorited ? "♥ Already Top 6" : "♥ Added to Top 6";
      setTimeout(() => location.reload(), 900);
    } catch (e) {
      alert("Favorite failed.");
      b.disabled = false;
      b.textContent = "♡ Add to Top 6";
    }
  }

  document.addEventListener("DOMContentLoaded", function(){
    const b = btn();
    if (!b) return;

    b.addEventListener("click", addFavoriteToTopSix);

    if (window.MonolithSession) {
      const s = window.MonolithSession.get();
      if (s && s.sourceCoordinate) b.textContent = "♡ Add to Top 6";
    }
  });
})();
