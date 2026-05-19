(function(){
  const KEY = "monolithOwnerSession";

  function norm(v){
    return String(v || "").trim().toUpperCase().replace(/\s+/g, "");
  }

  function viewedReturnUrl(){
    return location.pathname + location.search;
  }

  function getSession(){
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !s.sourceCoordinate || !s.payloadUuid) return null;
      return s;
    } catch (_) {
      return null;
    }
  }

  function setSession(data){
    sessionStorage.setItem(KEY, JSON.stringify(data));
  }

  function clearSession(){
    sessionStorage.removeItem(KEY);
  }

  async function postJson(url, body){
    const res = await fetch(url, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  async function startSession(sourceCoordinate){
    sourceCoordinate = norm(sourceCoordinate);
    if (!sourceCoordinate) throw new Error("source_coordinate_required");

    const started = await postJson("/api/tile/edit/start", {
      coordinate:sourceCoordinate,
      returnUrl:viewedReturnUrl()
    });

    if (!started.res.ok || !started.data.ok || !started.data.auth || !started.data.auth.payloadUuid) {
      const err = new Error(started.data.error || "owner_signin_failed");
      err.data = started.data;
      throw err;
    }

    const session = {
      sourceCoordinate,
      payloadUuid:started.data.auth.payloadUuid,
      signUrl:started.data.auth.signUrl || "",
      createdAt:Date.now()
    };

    setSession(session);
    return session;
  }

  async function verifySession(){
    const session = getSession();
    if (!session) return { ok:false, error:"no_owner_session" };

    const verified = await postJson("/api/tile/edit/verify", {
      coordinate:session.sourceCoordinate,
      payloadUuid:session.payloadUuid
    });

    if (verified.res.ok && verified.data.ok && verified.data.ownerVerified) {
      session.ownerWallet = verified.data.signer || verified.data.ownerWallet || "";
      setSession(session);
      return { ok:true, session, data:verified.data };
    }

    return { ok:false, session, error:verified.data.error || "owner_session_not_verified", data:verified.data };
  }

  function renderStatus(){
    const nodes = document.querySelectorAll("[data-monolith-session-status]");
    const session = getSession();

    nodes.forEach((node) => {
      node.textContent = session ? "Signed in: " + session.sourceCoordinate : "Not signed in";
    });

    document.querySelectorAll("[data-monolith-session-signout]").forEach((node) => {
      node.style.display = session ? "" : "none";
    });
  }

  window.MonolithSession = {
    key:KEY,
    norm,
    get:getSession,
    set:setSession,
    clear:function(){
      clearSession();
      renderStatus();
    },
    start:startSession,
    verify:verifySession,
    render:renderStatus
  };

  document.addEventListener("DOMContentLoaded", function(){
    document.querySelectorAll("[data-monolith-session-signout]").forEach((node) => {
      node.addEventListener("click", function(){
        clearSession();
        renderStatus();
      });
    });

    renderStatus();
  });
})();
