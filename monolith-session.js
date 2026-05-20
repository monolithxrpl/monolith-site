(function(){
  const KEY = "monolithOwnerSession";
  const MAX_AGE_MS = 12 * 60 * 60 * 1000;

  function norm(v){
    return String(v || "").trim().toUpperCase().replace(/\s+/g, "");
  }

  function viewedReturnUrl(){
    return location.pathname + location.search;
  }

  function getSession(){
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;

      const s = JSON.parse(raw);
      if (!s || !s.sourceCoordinate || !s.payloadUuid) return null;

      if (s.createdAt && Date.now() - Number(s.createdAt) > MAX_AGE_MS) {
        clearSession();
        return null;
      }

      return s;
    } catch (_) {
      return null;
    }
  }

  function setSession(data){
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function clearSession(){
    localStorage.removeItem(KEY);
    localStorage.removeItem("monolithFavoritePending");
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
      ownerVerified:false,
      ownerWallet:"",
      createdAt:Date.now()
    };

    setSession(session);
    renderStatus();
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
      session.ownerVerified = true;
      session.ownerWallet = verified.data.signer || verified.data.ownerWallet || "";
      session.verifiedAt = Date.now();
      setSession(session);
      renderStatus();
      return { ok:true, session, data:verified.data };
    }

    const error = String(verified.data.error || "owner_session_not_verified");

    const pendingErrors = new Set([
      "owner_signin_not_signed",
      "payload_not_signed",
      "not_signed",
      "pending",
      "owner_session_pending"
    ]);

    const terminalErrors = new Set([
      "owner_signin_rejected",
      "payload_rejected",
      "rejected",
      "cancelled",
      "canceled",
      "expired",
      "payload_expired",
      "owner_signin_expired",
      "wallet_not_owner",
      "wrong_wallet",
      "owner_wallet_mismatch",
      "signer_not_owner",
      "tile_owner_mismatch",
      "payload_not_found",
      "not_found",
      "owner_session_not_verified"
    ]);

    if (terminalErrors.has(error) || !pendingErrors.has(error)) {
      clearSession();
      renderStatus();
      return {
        ok:false,
        session:null,
        cleared:true,
        error,
        data:verified.data
      };
    }

    session.ownerVerified = false;
    setSession(session);
    renderStatus();

    return {
      ok:false,
      session,
      cleared:false,
      error,
      data:verified.data
    };
  }

  function renderStatus(){
    const session = getSession();
    const verified = Boolean(session && session.ownerVerified);

    document.querySelectorAll("[data-monolith-session-status]").forEach((node) => {
      node.textContent = verified ? "Signed in: " + session.sourceCoordinate : "Not signed in";
      node.style.display = "none";
    });

    document.querySelectorAll("[data-monolith-session-signout]").forEach((node) => {
      node.style.display = "none";
    });

    document.querySelectorAll("[data-monolith-session-toggle]").forEach((node) => {
      node.textContent = verified ? "Sign Out" : (session ? "Check Sign-In" : "Sign In");
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


  function hydrateReturnPayload(){
    const qs = new URLSearchParams(location.search);
    const payloadUuid = qs.get("payload") || qs.get("payloadUuid") || qs.get("payload_uuid") || "";
    const sourceCoordinate = norm(qs.get("edit") || qs.get("coordinate") || "");

    if (!payloadUuid || !sourceCoordinate) return false;

    const existing = getSession();
    const keep = existing && existing.payloadUuid === payloadUuid ? existing : {};

    setSession({
      sourceCoordinate,
      payloadUuid,
      signUrl:keep.signUrl || "",
      ownerVerified:false,
      ownerWallet:"",
      createdAt:keep.createdAt || Date.now(),
      hydratedFromReturn:true
    });

    return true;
  }

  function cleanReturnPayloadUrl(){
    try {
      const u = new URL(location.href);
      u.searchParams.delete("payload");
      u.searchParams.delete("payloadUuid");
      u.searchParams.delete("payload_uuid");
      u.searchParams.delete("edit");
      history.replaceState(null, "", u.pathname + (u.search ? u.search : "") + u.hash);
    } catch (_) {}
  }

  document.addEventListener("DOMContentLoaded", function(){
    const hydrated = hydrateReturnPayload();
    renderStatus();

    if (hydrated) {
      verifySession().then((result) => {
        if (result && result.ok) cleanReturnPayloadUrl();
        renderStatus();
      }).catch(() => renderStatus());
    }
  });
})();

