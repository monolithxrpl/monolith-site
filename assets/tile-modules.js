/* MONOLITH_COMMERCE_SUITE_V1_20260716 */
(() => {
  const LABELS = {
    p2p_payments: "P2P Payments",
    nft_store: "NFT Store",
    otc_desk: "OTC Desk",
    token_info: "Token Info",
    dex_widget: "DEX Data",
    marketplace: "Tile Market"
  };

  const MODULE_KEYS = Object.keys(LABELS);
  const MODULE_ORDER = new Map(
    MODULE_KEYS.map((key,index)=>[key,index])
  );

  let marketBoxRef = null;

  function orderedModules(modules) {
    return [...modules].sort(
      (a,b)=>
        (MODULE_ORDER.get(a.key) ?? 999) -
        (MODULE_ORDER.get(b.key) ?? 999)
    );
  }
  const LIVE_MODULES = new Set([
    "marketplace",
    "p2p_payments",
    "otc_desk"
  ]);

  function coordinate() {
    const parts = location.pathname.split("/").filter(Boolean);
    const index = parts.indexOf("tile");

    if (index >= 0 && parts[index + 1]) {
      return decodeURIComponent(parts[index + 1]).toUpperCase();
    }

    return (
      new URLSearchParams(location.search).get("tile") || ""
    ).toUpperCase();
  }

  function ownerPayload() {
    const savedCoord = (
      localStorage.getItem("monolith_tile_owner_coordinate") || ""
    ).toUpperCase();

    if (savedCoord !== coordinate()) return "";

    return localStorage.getItem(
      "monolith_tile_owner_payload_uuid"
    ) || "";
  }

  function ownerModeActive() {
    const status = String(
      document.getElementById("ownerModeStatus")?.textContent || ""
    ).toLowerCase();

    return (
      status.includes("owner mode active") ||
      status.includes("owner verified") ||
      status.includes("on-page controls unlocked")
    );
  }

  async function fetchModules() {
    const response = await fetch(
      `/api/tile/${encodeURIComponent(coordinate())}/modules`
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "modules_load_failed");
    }

    return (data.modules || [])
      .filter(module => MODULE_KEYS.includes(module.key))
      .sort((a, b) => {
        return (
          Number(a.sort_order || 0) -
          Number(b.sort_order || 0)
        );
      });
  }

  function publicAction(module) {
    const config = module.config || {};

    if (module.key === "marketplace") {
      return `<div data-commerce-market-slot></div>`;
    }

    if (module.key === "p2p_payments") {
      return `
        <button class="btn commerceModuleAction"
                type="button"
                data-commerce-action="payment">
          Send XRP
        </button>
      `;
    }

    if (module.key === "otc_desk") return `<a class="btn commerceModuleAction" href="/otc/">Open OTC Desk</a>`;
    if (config.url) {
      return `
        <a class="btn commerceModuleAction"
           href="${config.url}"
           target="_blank"
           rel="noopener">
          Open
        </a>
      `;
    }

    return "";
  }

  function syncPaymentVisibility(modules) {
    const p2p=modules.find(m=>m.key==="p2p_payments");
    const show=!!(p2p&&p2p.enabled);
    const box=document.getElementById("supportTileBox");

    if(box) box.style.display=show?"":"none";

    const openPayment=
      new URLSearchParams(location.search).get("pay")==="1";

    if(show&&box&&openPayment){
      window.setTimeout(()=>{
        box.scrollIntoView({
          behavior:"smooth",
          block:"start"
        });

        document
          .getElementById("supportAmountXrp")
          ?.focus();
      },350);
    }
  }

  function renderPublic(modules) {
    const publicRoot = document.getElementById("commercePublicModules");

    if (!publicRoot) return;

    const enabled = orderedModules(modules).filter(module => module.enabled && module.key !== "p2p_payments");

    if (!enabled.length) {
      publicRoot.innerHTML = "";
      return;
    }

    const preservedMarketBox =
      marketBoxRef ||
      document.getElementById("tileMarketBox");

    if (preservedMarketBox) {
      marketBoxRef = preservedMarketBox;
    }

    if (
      preservedMarketBox &&
      preservedMarketBox.parentElement === publicRoot
    ) {
      preservedMarketBox.remove();
    }

    publicRoot.innerHTML = enabled.map(module => {
      if (module.key === "marketplace") {
        return `<div data-commerce-market-slot></div>`;
      }

      return `
        <section class="box commerceModuleCard">
          <div class="commerceModuleTitle">
            ${LABELS[module.key] || module.key}
          </div>

          <div class="commerceModuleDescription">
            ${module.config?.description || (
              LIVE_MODULES.has(module.key)
                ? ""
                : "COMING SOON"
            )}
          </div>

          ${LIVE_MODULES.has(module.key)
            ? publicAction(module)
            : ""}
        </section>
      `;
    }).join("");

    const marketSlot = publicRoot.querySelector(
      "[data-commerce-market-slot]"
    );
    const marketBox =
      preservedMarketBox ||
      document.getElementById("tileMarketBox");

    if (marketBox) {
      if (marketSlot) {
        marketSlot.replaceWith(marketBox);
        marketBox.style.display = "";
      } else {
        marketBox.style.display = "none";
      }
    }

    publicRoot.querySelectorAll(
      '[data-commerce-action="payment"]'
    ).forEach(button => {
      button.addEventListener("click", () => {
        document
          .querySelector(".supportQuickActions")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });

        document
          .getElementById("supportAmountXrp")
          ?.focus();
      });
    });
  }

  function renderOwnerControls(modules) {
    const panel = document.getElementById("tileModulesPanel");
    const hub = document.getElementById("commerceHubBox");
    if (!panel) return;

    let controls = document.getElementById(
      "commerceSuiteOwnerControls"
    );

    if (!controls) {
      controls = document.createElement("div");
      controls.id = "commerceSuiteOwnerControls";
      controls.className = "commerceSuiteOwnerControls";
      panel.appendChild(controls);
    }

    if (!ownerModeActive() || !ownerPayload()) {
      controls.style.display = "none";
      panel.style.display = "none";
      if(hub) hub.style.removeProperty("display");
      return;
    }

    controls.style.display = "";
    panel.style.display = "";
    if(hub) hub.style.display = "";
    controls.innerHTML = `
      <div class="commerceOwnerTitle">
        Owner Module Controls
      </div>

      <div class="commerceOwnerSwitches">
        ${orderedModules(modules).map(module => `
          <label class="commerceSwitchRow">
            <span>${LABELS[module.key] || module.key}</span>

            <input
              type="checkbox"
              data-module-key="${module.key}"
              ${module.enabled ? "checked" : ""}
            />

            <span class="commerceSwitch"></span>
          </label>
        `).join("")}
      </div>

      <div class="write" id="commerceOwnerStatus">
        Switches save immediately.
      </div>
    `;

    controls
      .querySelectorAll("[data-module-key]")
      .forEach(input => {
        input.addEventListener("change", async () => {
          const status = document.getElementById(
            "commerceOwnerStatus"
          );

          input.disabled = true;

          if (status) {
            status.textContent = "Saving module...";
          }

          try {
            const response = await fetch(
              `/api/tile/${encodeURIComponent(coordinate())}/modules`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  module_key: input.dataset.moduleKey,
                  enabled: input.checked,
                  payloadUuid: ownerPayload(),
                  sort_order: modules.findIndex(
                    item => item.key === input.dataset.moduleKey
                  )
                })
              }
            );

            const data = await response.json();

            if (!response.ok || !data.ok) {
              throw new Error(
                data.error || "module_update_failed"
              );
            }

            if (status) {
              status.textContent = "Module updated.";
            }

            await loadCommerceSuite();
          } catch (error) {
            input.checked = !input.checked;

            if (status) {
              status.textContent =
                error.message || "Module update failed.";
            }
          } finally {
            input.disabled = false;
          }
        });
      });
  }

  function setupP2PShareBanner() {
    const urlBox = document.getElementById("p2pShareUrl");
    const copyButton = document.getElementById("p2pCopyLink");
    const shareButton = document.getElementById("p2pShareLink");
    const status = document.getElementById("p2pShareStatus");

    if (!urlBox || !copyButton || !shareButton) return;

    const tileCoordinate = coordinate();
    if (!tileCoordinate) return;

    const paymentUrl =
      `${location.origin}/pay/${encodeURIComponent(tileCoordinate)}`;

    urlBox.textContent = paymentUrl;

    copyButton.onclick = async () => {
      try {
        await navigator.clipboard.writeText(paymentUrl);
        if (status) status.textContent = "Payment link copied.";
      } catch {
        if (status) status.textContent = "Unable to copy payment link.";
      }
    };

    shareButton.onclick = async () => {
      const shareData = {
        title: `Pay ${tileCoordinate} on MONOLITH`,
        text: "Pay this MONOLITH tile directly in XRP.",
        url: paymentUrl
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(paymentUrl);
          if (status) status.textContent = "Payment link copied.";
        }
      } catch (error) {
        if (error?.name !== "AbortError" && status) {
          status.textContent = "Unable to share payment link.";
        }
      }
    };
  }

  async function loadCommerceSuite() {
    try {
      const modules = await fetchModules();
      syncPaymentVisibility(modules);
      renderPublic(modules);
      setupP2PShareBanner();
      renderOwnerControls(modules);
    } catch (error) {
      console.warn("Commerce Suite unavailable", error);
    }
  }

  window.MONOLITHCommerceSuite = {
    refresh: loadCommerceSuite
  };

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      loadCommerceSuite
    );
  } else {
    loadCommerceSuite();
  }

  const ownerStatus = document.getElementById(
    "ownerModeStatus"
  );

  if (ownerStatus) {
    new MutationObserver(loadCommerceSuite).observe(
      ownerStatus,
      {
        childList: true,
        characterData: true,
        subtree: true
      }
    );
  }
})();
