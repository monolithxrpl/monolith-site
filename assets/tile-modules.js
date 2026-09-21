/* MONOLITH_COMMERCE_SUITE_V1_20260716 */
(() => {
  const LABELS = {
    p2p_payments: "P2P Payments",
    merch_store: "Merch Store",
    otc_desk: "OTC Desk",
    marketplace: "Tile Market",
    nft_store: "NFTs For Sale",
    token_info: "Token Info",
    dex_widget: "DEX Tools"
  };

  const MODULE_KEYS = [
    "p2p_payments",
    "merch_store",
    "otc_desk",
    "marketplace",
    "nft_store",
    "token_info",
    "dex_widget"
  ];

  const MODULE_ORDER = new Map(
    MODULE_KEYS.map((key,index)=>[key,index])
  );

  let marketBoxRef = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

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
    "otc_desk",
    "merch_store",
    "nft_store"
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

    if (module.key === "merch_store") {
      return `
        <div data-merch-storefront></div>
        <a class="btn commerceModuleAction"
           href="/merch/?tile=${encodeURIComponent(coordinate())}">
          Open Merch Store
        </a>
      `;
    }
    if (module.key === "nft_store") {
      return `
        <div data-nft-for-sale></div>
        <a class="btn commerceModuleAction" href="/nft-market/">Open NFT Market</a>
      `;
    }
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
            ${
              module.key === "nft_store"
                ? "Live XRPL NFTs listed for sale by this coordinate."
                : (
                    module.config?.description || (
                      LIVE_MODULES.has(module.key)
                        ? ""
                        : "COMING SOON"
                    )
                  )
            }
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

    loadMerchStorefront(publicRoot);
    loadNftsForSale(publicRoot);
    loadNftShowcase(publicRoot);

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

  async function loadMerchStorefront(publicRoot) {
    const slot =
      publicRoot.querySelector(
        "[data-merch-storefront]"
      );

    if (!slot) return;

    try {
      const response = await fetch(
        `/api/merch/storefront/${
          encodeURIComponent(coordinate())
        }`
      );

      const data = await response.json();

      const products =
        Array.isArray(data.products)
          ? data.products
          : [];

      if (!data.ok || !products.length) {
        slot.innerHTML = `
          <div class="commerceModuleDescription">
            No live merchandise listed yet.
          </div>
        `;
        return;
      }

      const sellerName =
        data.seller?.displayName || "";

      slot.innerHTML = `
        ${
          sellerName
            ? `<div class="commerceModuleDescription">
                 Storefront by ${escapeHtml(sellerName)}
               </div>`
            : ""
        }

        <div class="commerceMerchGrid">
          ${products.map(product => {
            const media =
              Array.isArray(product.media)
                ? product.media[0]
                : null;

            const image =
              media?.url
                ? `<img
                     class="commerceMerchImage"
                     src="${escapeHtml(media.url)}"
                     alt="${escapeHtml(
                       media.altText ||
                       product.title ||
                       "Merch product"
                     )}"
                     loading="lazy"
                   >`
                : `<span class="commerceMerchImageFallback">
                     ${escapeHtml(
                       product.title ||
                       "Merch"
                     )}
                   </span>`;

            return `
              <a
                class="commerceMerchProduct"
                href="/merch/product/?id=${
                  encodeURIComponent(
                    product.productId
                  )
                }"
                aria-label="Open ${escapeHtml(
                  product.title ||
                  "merch product"
                )}"
              >
                ${image}
              </a>
            `;
          }).join("")}
        </div>
      `;
    } catch (error) {
      console.error(
        "[tile-merch-storefront]",
        error
      );

      slot.innerHTML = `
        <div class="commerceModuleDescription">
          Merch storefront temporarily unavailable.
        </div>
      `;
    }
  }

  async function loadNftsForSale(publicRoot) {
    const slot=publicRoot.querySelector("[data-nft-for-sale]");
    if(!slot) return;

    try {
      const response=await fetch(`/api/tile/${encodeURIComponent(coordinate())}/nfts-for-sale`);
      const data=await response.json();
      const listings=Array.isArray(data.listings)?data.listings.slice(0,6):[];

      if(!data.ok||!listings.length){
        slot.innerHTML='<div class="commerceModuleDescription">No NFTs listed for sale yet.</div>';
        return;
      }

      slot.innerHTML=`<div class="commerceMerchGrid">${listings.map(item=>{
        const title=escapeHtml(
          item.title ||
          (item.serial !== null && item.serial !== undefined
            ? "NFT #"+item.serial
            : "XRPL NFT")
        );

        const href=
          "/nft-market/?listing="+
          encodeURIComponent(item.listingId || "");

        const image=item.imageUrl
          ? `<img
               src="${escapeHtml(item.imageUrl)}"
               alt="${title}"
               loading="lazy"
               style="width:100%;height:100%;object-fit:contain;display:block;"
             >`
          : `<span class="commerceMerchImageFallback">
               ${title}
             </span>`;

        const usd=item.askUsd
          ? "$"+escapeHtml(item.askUsd)
          : "";

        const xrp=item.askXrp
          ? escapeHtml(item.askXrp)+" $XRP"
          : "";

        return `
          <a
            class="commerceMerchProduct"
            href="${href}"
            aria-label="Open ${title}"
            style="text-decoration:none;"
          >
            ${image}
            <div style="padding:8px 6px 4px;">
              <div style="font-weight:700;line-height:1.25;">
                ${title}
              </div>
              ${usd ? `
                <div style="margin-top:5px;font-weight:800;">
                  ${usd}
                </div>
              ` : ""}
              ${xrp ? `
                <div style="font-size:12px;opacity:.72;margin-top:2px;">
                  ${xrp}
                </div>
              ` : ""}
            </div>
          </a>
        `;
      }).join("")}</div>`;
    } catch(error) {
      console.error("[tile-nfts-for-sale]",error);
      slot.innerHTML='<div class="commerceModuleDescription">NFT listings temporarily unavailable.</div>';
    }
  }

  async function loadNftShowcase(publicRoot) {
    try {
      const response=await fetch(`/api/tile/${encodeURIComponent(coordinate())}/nft-showcase`);
      const data=await response.json();
      const assets=Array.isArray(data.assets)
        ? data.assets.filter(item=>item.ownershipStatus==="verified")
        : [];

      if(!data.ok||!assets.length) return;

      const section=document.createElement("section");
      section.className="box commerceModuleCard";
      section.innerHTML=`
        <div class="commerceModuleTitle">NFT Showcase</div>
        <div class="commerceModuleDescription">
          Owned NFTs displayed by this coordinate.
        </div>
        <div class="commerceMerchGrid">
          ${assets.slice(0,6).map(item=>`
            <div class="commerceMerchProduct">
              <span class="commerceMerchImageFallback">
                ${escapeHtml(item.title||`NFT ${item.nftId.slice(0,8)}…`)}
                <br>
                ${escapeHtml(item.assetType||"other")}
                ${item.ownershipStatus==="verified" ? "<br>OWNER VERIFIED" : ""}
              </span>
            </div>
          `).join("")}
        </div>
      `;

      publicRoot.appendChild(section);
    } catch(error) {
      console.error("[tile-nft-showcase]",error);
    }
  }


  async function renderNftShowcaseOwnerControls() {
    const root=document.getElementById("nftShowcaseOwnerControls");
    if(!root||!ownerModeActive()||!ownerPayload()) return;

    let assets=[];

    try{
      const response=await fetch(
        `/api/tile/${encodeURIComponent(coordinate())}/nft-showcase`
      );
      const data=await response.json();
      assets=Array.isArray(data.assets)?data.assets:[];
    }catch(error){
      console.error("[nft-showcase-owner-load]",error);
    }

    root.innerHTML=`
      <div class="commerceOwnerTitle">NFT Showcase</div>

      <div class="write">
        Display NFTs you own on this coordinate. Showcase does not list them for sale.
      </div>

      <input
        id="nftShowcaseIdInput"
        type="text"
        placeholder="XRPL NFTokenID"
        autocomplete="off"
      />

      <select id="nftShowcaseTypeInput">
        <option value="image">Image</option>
        <option value="video">Video</option>
        <option value="audio">Audio</option>
        <option value="document">Document</option>
        <option value="3d">3D</option>
        <option value="collectible">Collectible</option>
        <option value="certificate">Certificate</option>
        <option value="ticket">Ticket</option>
        <option value="access">Access</option>
        <option value="other">Other</option>
      </select>

      <button class="btn" id="nftShowcaseAddButton" type="button">
        Add to Showcase
      </button>

      <div class="write" id="nftShowcaseOwnerStatus"></div>

      <div>
        ${assets.length ? assets.map(item=>`
          <div class="commerceSwitchRow" data-showcase-row="${escapeHtml(item.showcaseId)}">
            <div style="width:100%">
              <div class="write">
                ${escapeHtml(item.nftId.slice(0,16))}…
                ${item.ownershipStatus==="verified" ? " · OWNER VERIFIED" : " · OWNERSHIP STALE"}
              </div>

              <input data-showcase-title value="${escapeHtml(item.title||"")}" placeholder="Display title" />
              <textarea data-showcase-description placeholder="Description">${escapeHtml(item.description||"")}</textarea>
              <input data-showcase-category value="${escapeHtml(item.category||"")}" placeholder="Category" />
              <input data-showcase-group value="${escapeHtml(item.groupName||"")}" placeholder="Display group" />

              <select data-showcase-type>
                ${["image","video","audio","document","3d","collectible","certificate","ticket","access","other"]
                  .map(type=>`<option value="${type}" ${item.assetType===type?"selected":""}>${type}</option>`)
                  .join("")}
              </select>

              <input data-showcase-order type="number" value="${Number(item.sortOrder)||0}" />

              <label>
                <input data-showcase-featured type="checkbox" ${item.featured?"checked":""} />
                Featured
              </label>

              <button class="btn" type="button" data-showcase-save="${escapeHtml(item.showcaseId)}">
                Save
              </button>

              <button class="btn" type="button" data-showcase-remove="${escapeHtml(item.showcaseId)}">
                Remove
              </button>
            </div>
          </div>
        `).join("") : '<div class="write">No Showcase NFTs yet.</div>'}
      </div>
    `;

    const status=document.getElementById("nftShowcaseOwnerStatus");
    const addButton=document.getElementById("nftShowcaseAddButton");

    addButton?.addEventListener("click",async()=>{
      const nftId=document.getElementById("nftShowcaseIdInput")?.value?.trim();
      const assetType=document.getElementById("nftShowcaseTypeInput")?.value||"other";

      if(!nftId){
        if(status) status.textContent="Enter an NFTokenID.";
        return;
      }

      addButton.disabled=true;
      if(status) status.textContent="Verifying ownership...";

      try{
        const response=await fetch(
          `/api/tile/${encodeURIComponent(coordinate())}/nft-showcase`,
          {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
              payloadUuid:ownerPayload(),
              nftId,
              assetType
            })
          }
        );

        const data=await response.json();

        if(!response.ok||!data.ok)
          throw new Error(data.error||"nft_showcase_add_failed");

        if(status) status.textContent="NFT added to Showcase.";
        await renderNftShowcaseOwnerControls();
      }catch(error){
        if(status) status.textContent=error.message||"Unable to add NFT.";
      }finally{
        addButton.disabled=false;
      }
    });

    root.querySelectorAll("[data-showcase-save]").forEach(button=>{
      button.addEventListener("click",async()=>{
        const row=button.closest("[data-showcase-row]");
        if(!row) return;

        button.disabled=true;
        if(status) status.textContent="Saving Showcase item...";

        try{
          const response=await fetch(
            `/api/tile/${encodeURIComponent(coordinate())}/nft-showcase/${encodeURIComponent(button.dataset.showcaseSave)}`,
            {
              method:"PATCH",
              headers:{"Content-Type":"application/json"},
              body:JSON.stringify({
                payloadUuid:ownerPayload(),
                title:row.querySelector("[data-showcase-title]")?.value||"",
                description:row.querySelector("[data-showcase-description]")?.value||"",
                category:row.querySelector("[data-showcase-category]")?.value||"",
                groupName:row.querySelector("[data-showcase-group]")?.value||"",
                assetType:row.querySelector("[data-showcase-type]")?.value||"other",
                sortOrder:row.querySelector("[data-showcase-order]")?.value||0,
                featured:!!row.querySelector("[data-showcase-featured]")?.checked
              })
            }
          );

          const data=await response.json();

          if(!response.ok||!data.ok)
            throw new Error(data.error||"nft_showcase_update_failed");

          if(status) status.textContent="Showcase item updated.";
          await renderNftShowcaseOwnerControls();
        }catch(error){
          button.disabled=false;
          if(status) status.textContent=error.message||"Unable to update Showcase item.";
        }
      });
    });

    root.querySelectorAll("[data-showcase-remove]").forEach(button=>{
      button.addEventListener("click",async()=>{
        button.disabled=true;
        if(status) status.textContent="Removing NFT...";

        try{
          const response=await fetch(
            `/api/tile/${encodeURIComponent(coordinate())}/nft-showcase/${encodeURIComponent(button.dataset.showcaseRemove)}`,
            {
              method:"DELETE",
              headers:{"Content-Type":"application/json"},
              body:JSON.stringify({payloadUuid:ownerPayload()})
            }
          );

          const data=await response.json();

          if(!response.ok||!data.ok)
            throw new Error(data.error||"nft_showcase_remove_failed");

          if(status) status.textContent="NFT removed from Showcase.";
          await renderNftShowcaseOwnerControls();
        }catch(error){
          button.disabled=false;
          if(status) status.textContent=error.message||"Unable to remove NFT.";
        }
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

      <div id="nftShowcaseOwnerControls"></div>
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

    renderNftShowcaseOwnerControls();
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
