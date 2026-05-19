(function(){
  function btn(){
    return document.getElementById("monolithWallSignIn");
  }

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

  async function signInFlow(){
    const b = btn();
    if (!b || !window.MonolithSession) return;

    const current = window.MonolithSession.get();

    if (current && current.ownerVerified) {
      window.MonolithSession.clear();
      removeSignLink();
      b.textContent = "Sign In";
      return;
    }

    if (current && !current.ownerVerified) {
      b.disabled = true;
      b.textContent = "Checking...";

      const verified = await window.MonolithSession.verify();

      b.disabled = false;

      if (verified.ok) {
        removeSignLink();
        b.textContent = "Sign Out";
        return;
      }

      showSignLink(current.signUrl);
      b.textContent = "Check Sign-In";
      return;
    }

    const source = prompt("Enter YOUR MONOLITH tile coordinate to sign in:");
    if (!source) return;

    b.disabled = true;
    b.textContent = "Creating...";

    try {
      const session = await window.MonolithSession.start(source);
      showSignLink(session.signUrl);
      b.textContent = "Check Sign-In";
      b.disabled = false;
    } catch (e) {
      alert(e.message || "Sign-in failed.");
      b.textContent = "Sign In";
      b.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", function(){
    const b = btn();
    if (!b || !window.MonolithSession) return;

    b.setAttribute("data-monolith-session-toggle", "1");
    b.addEventListener("click", signInFlow);

    const session = window.MonolithSession.get();

    if (session && session.ownerVerified) {
      b.textContent = "Sign Out";
      removeSignLink();
    } else if (session) {
      b.textContent = "Check Sign-In";
      showSignLink(session.signUrl);
    } else {
      b.textContent = "Sign In";
      removeSignLink();
    }

    window.MonolithSession.render();
  });
})();
