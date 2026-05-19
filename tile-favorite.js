(function(){
  function viewedCoord(){
    const qs = new URLSearchParams(location.search);
    const pathParts = location.pathname.split("/").filter(Boolean);
    const pathTile = pathParts[0] === "tile" && pathParts[1] ? pathParts[1] : "";
    return String(qs.get("tile") || pathTile || "ORIGIN").trim().toUpperCase();
  }

  function norm(v){
    return String(v || "").trim().toUpperCase().replace(/\s+/g, "");
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

  async function addFavoriteToTopSix(){
    const btn = document.getElementById("favoriteBtn");
    if (!btn) return;

    const targetCoordinate = viewedCoord();
    const source = prompt("Enter YOUR tile coordinate to add " + targetCoordinate + " to your Top 6:");
    if (!source) return;

    const sourceCoordinate = norm(source);

    if (!sourceCoordinate) return;

    if (sourceCoordinate === targetCoordinate) {
      alert("You cannot favorite your own tile.");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Creating owner sign-in...";

    try {
      const start = await jsonFetch("/api/tile/edit/start", { coordinate:sourceCoordinate });

      if (!start.res.ok || !start.data.ok || !start.data.auth || !start.data.auth.payloadUuid) {
        alert(start.data.error || "Owner sign-in failed.");
        btn.disabled = false;
        btn.textContent = "♡ Add to Top 6";
        return;
      }

      if (start.data.auth.signUrl) {
        window.open(start.data.auth.signUrl, "_blank", "noopener,noreferrer");
      }

      alert("Approve the owner sign-in in Xaman, then press OK here to continue.");

      async function submitFavorite(replaceIndex){
        const body = {
          sourceCoordinate,
          targetCoordinate,
          payloadUuid:start.data.auth.payloadUuid
        };

        if (Number.isInteger(replaceIndex)) body.replaceIndex = replaceIndex;

        return jsonFetch("/api/tile/favorite", body);
      }

      btn.textContent = "Verifying owner...";
      let result = await submitFavorite();

      if (result.res.status === 409 && result.data && result.data.error === "top_six_full") {
        const list = Array.isArray(result.data.favoriteTiles) ? result.data.favoriteTiles : [];
        const choice = prompt(
          "Your Top 6 is full. Choose slot 1-6 to replace:\n" +
          list.map((x, i) => (i + 1) + ". " + x).join("\n")
        );

        if (!choice) {
          btn.disabled = false;
          btn.textContent = "♡ Add to Top 6";
          return;
        }

        const idx = Number(choice) - 1;

        if (!Number.isInteger(idx) || idx < 0 || idx > 5) {
          alert("Invalid slot.");
          btn.disabled = false;
          btn.textContent = "♡ Add to Top 6";
          return;
        }

        result = await submitFavorite(idx);
      }

      if (!result.res.ok || !result.data.ok) {
        alert(result.data.error || "Favorite failed.");
        btn.disabled = false;
        btn.textContent = "♡ Add to Top 6";
        return;
      }

      btn.textContent = result.data.alreadyFavorited ? "♥ Already Top 6" : "♥ Added to Top 6";
      setTimeout(() => location.reload(), 900);
    } catch (e) {
      alert("Favorite failed.");
      btn.disabled = false;
      btn.textContent = "♡ Add to Top 6";
    }
  }

  document.addEventListener("DOMContentLoaded", function(){
    const btn = document.getElementById("favoriteBtn");
    if (btn) btn.addEventListener("click", addFavoriteToTopSix);
  });
})();
