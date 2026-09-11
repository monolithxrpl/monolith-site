(function(){
  function btn(){
    return document.getElementById("monolithWallSignIn");
  }

  function removeSignLink(){
    const old = document.getElementById("monolithWallSignLink");
    if (old) old.remove();
  }

  function removeResetLink(){
    const old = document.getElementById("monolithWallResetSignIn");
    if (old) old.remove();
  }

  function resetSignInUI(){
    if (!window.MonolithSession) return;
    window.MonolithSession.clear();
    removeSignLink();
    removeResetLink();
    const b = btn();
    if (b) {
      b.disabled = false;
      b.textContent = "Sign In";
    }
  }

  function showResetLink(){
    removeResetLink();

    const b = btn();
    if (!b) return;

    const r = document.createElement("button");
    r.id = "monolithWallResetSignIn";
    r.className = "btn";
    r.type = "button";
    r.textContent = "Reset Sign-In";
    r.style.marginLeft = "6px";
    r.onclick = resetSignInUI;

    b.insertAdjacentElement("afterend", r);
  }

  function openXaman(signUrl){
    removeSignLink();

    if (!signUrl) {
      throw new Error("xaman_sign_url_missing");
    }

    showResetLink();
    window.location.href = signUrl;
  }

  async function signInFlow(){
    const b = btn();
    if (!b || !window.MonolithSession) return;

    const current = window.MonolithSession.get();

    if (current && current.ownerVerified) {
      resetSignInUI();
      return;
    }

    if (current && !current.ownerVerified) {
      b.disabled = true;
      b.textContent = "Checking...";

      const verified = await window.MonolithSession.verify();

      b.disabled = false;

      if (verified.ok) {
        removeSignLink();
        removeResetLink();
        b.textContent = "Sign Out";
        return;
      }

      if (verified.cleared) {
        removeSignLink();
        removeResetLink();
        b.textContent = "Sign In";
        return;
      }

      b.textContent = "Check Sign-In";
      openXaman(current.signUrl);
      return;
    }

    const source = prompt("Enter YOUR MONOLITH tile coordinate to sign in:");
    if (!source) return;

    b.disabled = true;
    b.textContent = "Creating...";

    try {
      const session = await window.MonolithSession.start(source);
      b.textContent = "Check Sign-In";
      b.disabled = false;
      openXaman(session.signUrl);
    } catch (e) {
      resetSignInUI();
      alert(e.message || "Sign-in failed.");
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
      removeResetLink();
    } else if (session) {
      b.textContent = "Check Sign-In";
      showResetLink();
    } else {
      b.textContent = "Sign In";
      removeSignLink();
      removeResetLink();
    }

    window.MonolithSession.render();
  });
})();
