(function(){
  function btn(){ return document.getElementById("monolithWallSignIn"); }

  function removeSignLink(){
    const old = document.getElementById("monolithWallSignLink");
    if (old) old.remove();
  }

  function showSignLink(signUrl){
    removeSignLink();

    const b = btn();
    if (!b || !signUrl) return;

    const a = document.createElement("a");
    a.id = "monolithWallSignLink";
    a.className = "btn";
    a.href = signUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "Open Xaman";
    a.style.marginLeft = "6px";

    b.insertAdjacentElement("afterend", a);
  }

  async function signIn(){
    const b = btn();
    if (!b || !window.MonolithSession) return;

    const current = window.MonolithSession.get();
    if (current && current.payloadUuid) {
      const verified = await window.MonolithSession.verify();
      if (verified.ok) {
        alert("Signed in as " + verified.session.sourceCoordinate);
        window.MonolithSession.render();
        return;
      }

      showSignLink(current.signUrl);
      alert("Session exists but is not signed yet. Open Xaman, approve it, then click Sign In again.");
      return;
    }

    const source = prompt("Enter YOUR MONOLITH tile coordinate to sign in:");
    if (!source) return;

    b.disabled = true;
    b.textContent = "Creating sign-in...";

    try {
      const session = await window.MonolithSession.start(source);
      showSignLink(session.signUrl);
      b.textContent = "Check Sign-In";
      b.disabled = false;
      window.MonolithSession.render();
      alert("Open Xaman, approve the owner sign-in, then click Check Sign-In.");
    } catch (e) {
      alert(e.message || "Sign-in failed.");
      b.textContent = "Sign In";
      b.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", function(){
    const b = btn();
    if (b) b.addEventListener("click", signIn);

    if (window.MonolithSession) {
      const session = window.MonolithSession.get();
      if (session && session.signUrl) showSignLink(session.signUrl);
      window.MonolithSession.render();
    }
  });
})();
