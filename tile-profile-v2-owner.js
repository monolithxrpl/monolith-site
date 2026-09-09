/* MONOLITH_V2_OWNER_SECTION_EDITING_V1 */
(function(){
  "use strict";

  const $=id=>document.getElementById(id);
  const qs=new URLSearchParams(location.search);
  const parts=location.pathname.split("/").filter(Boolean);

  const coord=String(
    qs.get("tile") ||
    ((parts[0]==="tile-v2" || parts[0]==="tile") ? parts[1] : "") ||
    "ORIGIN"
  ).trim().toUpperCase();

  const ownerModeKey="monolith_tile_owner_payload_uuid";
  const ownerCoordKey="monolith_tile_owner_coordinate";

  let unlocked=false;
  let state={};

  function payloadUuid(){
    const savedCoord=String(
      localStorage.getItem(ownerCoordKey)||""
    ).toUpperCase();

    if(savedCoord!==coord) return "";

    return localStorage.getItem(ownerModeKey)||"";
  }

  function metaOf(t){
    try{
      return t.metadata || JSON.parse(t.metadata_json||"{}");
    }catch(e){
      return {};
    }
  }

  function status(el,msg,good=false){
    if(!el) return;
    el.textContent=msg;
    el.style.color=good?"#6ee7b7":"#9fc7dd";
  }

  function makeButton(text){
    const b=document.createElement("button");
    b.type="button";
    b.className="v2OwnerBtn";
    b.textContent=text;
    return b;
  }

  function makeInput(value,max=500){
    const el=document.createElement("input");
    el.className="v2OwnerInput";
    el.value=value||"";
    el.maxLength=max;
    return el;
  }

  function makeTextarea(value,rows=4){
    const el=document.createElement("textarea");
    el.className="v2OwnerInput";
    el.value=value||"";
    el.rows=rows;
    return el;
  }

  async function loadState(){
    const r=await fetch(
      "/api/tile/"+encodeURIComponent(coord),
      {cache:"no-store"}
    );

    const data=await r.json().catch(()=>({}));

    if(!r.ok||!data.ok){
      throw new Error(data.error||"Tile could not be loaded.");
    }

    const t=data.tile||data;
    const m=metaOf(t);

    state={
      displayName:
        m.displayName||
        m.projectName||
        t.displayName||
        t.display_name||
        t.owner_tag||
        t.ownerTag||
        coord,

      xHandle:
        m.xHandle||
        m.x_handle||
        t.xHandle||
        t.x_handle||
        "",

      note:
        m.note||
        t.note||
        "",

      about:
        m.about||
        m.profileAbout||
        "",

      statusText:
        m.statusText||
        m.status||
        "",

      mood:
        m.mood||
        m.moodText||
        "",

      interests:
        Array.isArray(m.interests)
          ? m.interests.join(", ")
          : String(m.interests||""),

      links:
        Array.isArray(m.links)
          ? m.links
          : [],

      favoriteTiles:
        Array.isArray(m.favoriteTiles)
          ? m.favoriteTiles
          : []
    };
  }

  async function saveProfile(){
    const uuid=payloadUuid();

    if(!uuid){
      throw new Error("Owner verification required.");
    }

    const fd=new FormData();

    fd.append("coordinate",coord);
    fd.append("payloadUuid",uuid);
    fd.append("displayName",state.displayName||"");
    fd.append("xHandle",state.xHandle||"");
    fd.append("note",state.note||"");
    fd.append("about",state.about||"");
    fd.append("statusText",state.statusText||"");
    fd.append("mood",state.mood||"");
    fd.append("interests",state.interests||"");
    fd.append(
      "links",
      Array.isArray(state.links)
        ? state.links.join("\n")
        : ""
    );
    fd.append(
      "favoriteTiles",
      Array.isArray(state.favoriteTiles)
        ? state.favoriteTiles.join("\n")
        : ""
    );

    const r=await fetch("/api/tile/edit/apply",{
      method:"POST",
      body:fd
    });

    const data=await r.json().catch(()=>({}));

    if(!r.ok||!data.ok){
      throw new Error(
        data.error||
        "Profile could not be saved."
      );
    }
  }

  function editTextCard(selector,key,targetId,label,rows=4){
    const card=document.querySelector(selector);
    if(!card) return;

    const edit=makeButton("Edit");
    edit.classList.add("v2OwnerSectionEdit");
    card.appendChild(edit);

    edit.onclick=()=>{
      const existing=card.querySelector(".v2OwnerEditor");

      if(existing){
        existing.remove();
        return;
      }

      const box=document.createElement("div");
      box.className="v2OwnerEditor";

      const field=
        rows===1
          ? makeInput(state[key])
          : makeTextarea(state[key],rows);

      const save=makeButton("Save");
      const cancel=makeButton("Cancel");
      const msg=document.createElement("div");
      msg.className="v2OwnerStatus";

      box.append(field,save,cancel,msg);
      card.appendChild(box);

      cancel.onclick=()=>box.remove();

      save.onclick=async()=>{
        const old=state[key];
        state[key]=field.value.trim();

        status(msg,"Saving "+label+"...");

        try{
          await saveProfile();

          const target=$(targetId);

          if(key==="interests"){
            const list=state.interests
              .split(/[\n,|]+/)
              .map(x=>x.trim())
              .filter(Boolean);

            target.innerHTML=list.length
              ? list.map(x=>'<span class="tag">'+x+'</span>').join("")
              : '<span class="tag">No interests listed yet.</span>';
          }else{
            target.textContent=
              state[key]||
              (
                key==="about"
                  ? "No about section yet."
                  : key==="statusText"
                  ? "No status posted yet."
                  : "No mood set."
              );
          }

          status(msg,label+" saved.",true);

        }catch(e){
          state[key]=old;
          status(msg,e.message||"Save failed.");
        }
      };
    };
  }

  function wireIdentity(){
    const hero=document.querySelector(".identityHero");
    if(!hero) return;
    if(hero.querySelector(".v2IdentityEditor")) return;

    const box=document.createElement("div");
    box.className="v2IdentityEditor";

    const name=makeInput(state.displayName,80);
    name.placeholder="Display Name";

    const handle=makeInput(state.xHandle,40);
    handle.placeholder="@handle";

    const bio=makeTextarea(state.note,3);
    bio.placeholder="Bio";

    const save=makeButton("Save Identity");
    const cancel=makeButton("Cancel");

    const msg=document.createElement("div");
    msg.className="v2OwnerStatus";

    box.append(name,handle,bio,save,cancel,msg);

    const visuals=hero.querySelector(".v2VisualOwnerPanel");

    if(visuals){
      hero.insertBefore(box,visuals);
    }else{
      hero.appendChild(box);
    }

    cancel.onclick=()=>{
      name.value=state.displayName||"";
      handle.value=state.xHandle||"";
      bio.value=state.note||"";
      status(msg,"");
    };

    save.onclick=async()=>{
      const previous={
        displayName:state.displayName,
        xHandle:state.xHandle,
        note:state.note
      };

      state.displayName=name.value.trim();
      state.xHandle=handle.value.trim();
      state.note=bio.value.trim();

      status(msg,"Saving Identity...");

      try{
        await saveProfile();

        $("displayName").textContent=state.displayName||coord;

        const visible=state.xHandle
          ? (state.xHandle.startsWith("@") ? state.xHandle : "@"+state.xHandle)
          : "";

        $("handle").textContent=visible ? "𝕏 "+visible : "";

        if(visible){
          $("handle").href="https://x.com/"+visible.replace(/^@/,"");
        }

        $("bio").textContent=
          state.note||
          "No bio has been added yet.";

        status(msg,"Identity saved.",true);

      }catch(e){
        Object.assign(state,previous);
        status(msg,e.message||"Identity save failed.");
      }
    };
  }

  function validImage(file){
    if(!file) return true;

    const allowed=[
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif"
    ];

    if(!allowed.includes(file.type)){
      return false;
    }

    const gif=
      file.type==="image/gif"||
      /\.gif$/i.test(file.name||"");

    return file.size<=(
      gif
        ? 25*1024*1024
        : 5*1024*1024
    );
  }

  function wireVisuals(){
    const hero=document.querySelector(".identityHero");
    if(!hero) return;

    const panel=document.createElement("div");
    panel.className="v2VisualOwnerPanel";

    panel.innerHTML=`
      <strong>Page Images</strong>

      <label>
        Profile Image
        <input id="v2ProfileImageFile" type="file"
          accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif">
      </label>

      <button class="v2OwnerBtn" id="v2ProfileImageRemove" type="button">
        Remove Profile Image
      </button>

      <label>
        Banner
        <input id="v2BannerFile" type="file"
          accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif">
      </label>

      <button class="v2OwnerBtn" id="v2BannerRemove" type="button">
        Remove Banner
      </button>

      <label>
        Wallpaper
        <input id="v2WallpaperFile" type="file"
          accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif">
      </label>

      <button class="v2OwnerBtn" id="v2WallpaperRemove" type="button">
        Default Wallpaper
      </button>

      <button class="v2OwnerBtn" id="v2VisualSave" type="button">
        Save Visual Changes
      </button>

      <div class="v2OwnerStatus" id="v2VisualStatus"></div>
    `;

    hero.appendChild(panel);

    let removeProfile=false;
    let removeBanner=false;
    let removeWallpaper=false;

    $("v2ProfileImageFile").onchange=()=>{
      const file=$("v2ProfileImageFile").files[0];

      if(!validImage(file)){
        $("v2ProfileImageFile").value="";
        status($("v2VisualStatus"),"Invalid profile image.");
        return;
      }

      removeProfile=false;

      if(file){
        $("avatar").src=URL.createObjectURL(file);
      }
    };

    $("v2BannerFile").onchange=()=>{
      const file=$("v2BannerFile").files[0];

      if(!validImage(file)){
        $("v2BannerFile").value="";
        status($("v2VisualStatus"),"Invalid banner image.");
        return;
      }

      removeBanner=false;

      if(file){
        $("profileBanner").style.backgroundImage=
          'url("'+URL.createObjectURL(file)+'")';
      }
    };

    $("v2WallpaperFile").onchange=()=>{
      const file=$("v2WallpaperFile").files[0];

      if(!validImage(file)){
        $("v2WallpaperFile").value="";
        status($("v2VisualStatus"),"Invalid wallpaper image.");
        return;
      }

      removeWallpaper=false;

      if(file){
        document.body.style.backgroundImage=
          'url("'+URL.createObjectURL(file)+'")';
      }
    };

    $("v2ProfileImageRemove").onclick=()=>{
      removeProfile=true;
      $("v2ProfileImageFile").value="";
      $("avatar").src="/assets/RESERVED.webp";
      status(
        $("v2VisualStatus"),
        "Profile image removal previewed.",
        true
      );
    };

    $("v2BannerRemove").onclick=()=>{
      removeBanner=true;
      $("v2BannerFile").value="";
      $("profileBanner").style.backgroundImage="";
      status(
        $("v2VisualStatus"),
        "Banner removal previewed.",
        true
      );
    };

    $("v2WallpaperRemove").onclick=()=>{
      removeWallpaper=true;
      $("v2WallpaperFile").value="";
      document.body.style.backgroundImage="";
      status(
        $("v2VisualStatus"),
        "Default wallpaper previewed.",
        true
      );
    };

    $("v2VisualSave").onclick=async()=>{
      const uuid=payloadUuid();

      if(!uuid){
        status(
          $("v2VisualStatus"),
          "Owner verification required."
        );
        return;
      }

      const profile=$("v2ProfileImageFile").files[0];
      const banner=$("v2BannerFile").files[0];
      const wallpaper=$("v2WallpaperFile").files[0];

      const fd=new FormData();
      fd.append("payloadUuid",uuid);

      if(removeProfile){
        fd.append("removeProfileImage","1");
      }

      if(removeBanner){
        fd.append("removeBanner","1");
      }

      if(removeWallpaper){
        fd.append("removeWallpaper","1");
      }

      if(profile){
        fd.append("profileImage",profile);
      }

      if(banner){
        fd.append("banner",banner);
      }

      if(wallpaper){
        fd.append("wallpaper",wallpaper);
      }

      status(
        $("v2VisualStatus"),
        "Saving Page Images..."
      );

      const r=await fetch(
        "/api/tile/"+encodeURIComponent(coord)+"/visuals",
        {
          method:"POST",
          body:fd
        }
      );

      const data=await r.json().catch(()=>({}));

      if(!r.ok||!data.ok){
        status(
          $("v2VisualStatus"),
          data.error||
          "Page Images could not be saved."
        );
        return;
      }

      removeProfile=false;
      removeBanner=false;
      removeWallpaper=false;

      $("v2ProfileImageFile").value="";
      $("v2BannerFile").value="";
      $("v2WallpaperFile").value="";

      status(
        $("v2VisualStatus"),
        "Page Images saved.",
        true
      );
    };
  }



  /* MONOLITH_V2_PERSONAL_MEDIA_CONTROLS_V1 */

  function normalizeLink(v){
    const raw=String(v||"").trim();
    if(!/^https?:\/\//i.test(raw)) return "";

    try{
      return new URL(raw).toString();
    }catch(e){
      return "";
    }
  }

  function linkLabel(url){
    try{
      return new URL(url).hostname.replace(/^www\./i,"");
    }catch(e){
      return url;
    }
  }

  function wireLinks(){
    const card=document.querySelector(".linksCard");
    if(!card || card.querySelector(".v2LinksOwner")) return;

    const panel=document.createElement("div");
    panel.className="v2OwnerEditor v2LinksOwner";

    const input=makeInput("",500);
    input.placeholder="https://example.com";

    const add=makeButton("Add Link");
    const msg=document.createElement("div");
    msg.className="v2OwnerStatus";

    panel.append(input,add,msg);
    card.appendChild(panel);

    function draw(){
      const box=$("links");

      if(!state.links.length){
        box.innerHTML='<span class="v2Empty">No links added yet.</span>';
        return;
      }

      box.innerHTML=state.links.map((url,index)=>
        '<div class="v2ManageRow">'+
          '<a href="'+url+'" target="_blank" rel="noopener">'+
            linkLabel(url)+
          '</a>'+
          '<div class="v2RowActions">'+
            '<button type="button" data-link-up="'+index+'">↑</button>'+
            '<button type="button" data-link-down="'+index+'">↓</button>'+
            '<button type="button" data-link-edit="'+index+'">Edit</button>'+
            '<button type="button" data-link-delete="'+index+'">Delete</button>'+
          '</div>'+
        '</div>'
      ).join("");

      box.querySelectorAll("[data-link-up]").forEach(b=>{
        b.onclick=()=>move(Number(b.dataset.linkUp),-1);
      });

      box.querySelectorAll("[data-link-down]").forEach(b=>{
        b.onclick=()=>move(Number(b.dataset.linkDown),1);
      });

      box.querySelectorAll("[data-link-edit]").forEach(b=>{
        b.onclick=()=>edit(Number(b.dataset.linkEdit));
      });

      box.querySelectorAll("[data-link-delete]").forEach(b=>{
        b.onclick=()=>remove(Number(b.dataset.linkDelete));
      });
    }

    async function save(message){
      status(msg,"Saving Links...");

      try{
        await saveProfile();
        draw();
        status(msg,message,true);
      }catch(e){
        status(msg,e.message||"Links could not be saved.");
      }
    }

    async function move(index,delta){
      const next=index+delta;
      if(next<0||next>=state.links.length) return;

      [state.links[index],state.links[next]]=[
        state.links[next],state.links[index]
      ];

      await save("Links reordered.");
    }

    async function edit(index){
      const next=prompt("Edit link",state.links[index]||"");
      if(next===null) return;

      const url=normalizeLink(next);

      if(!url){
        status(msg,"Enter a valid https:// link.");
        return;
      }

      state.links[index]=url;
      await save("Link updated.");
    }

    async function remove(index){
      if(!confirm("Delete this link?")) return;

      state.links.splice(index,1);
      await save("Link deleted.");
    }

    add.onclick=async()=>{
      if(state.links.length>=10){
        status(msg,"Maximum 10 links.");
        return;
      }

      const url=normalizeLink(input.value);

      if(!url){
        status(msg,"Enter a valid https:// link.");
        return;
      }

      state.links.push(url);
      input.value="";
      await save("Link added.");
    };

    draw();
  }

  function wireTop8(){
    const card=document.querySelector(".top8Card");
    if(!card || card.querySelector(".v2Top8Owner")) return;

    state.favoriteTiles=Array.isArray(state.favoriteTiles)
      ? state.favoriteTiles.map(x=>
          String(
            typeof x==="string"
              ? x
              : (x.coordinate||x.tile||"")
          ).trim().toUpperCase()
        ).filter(Boolean).slice(0,8)
      : [];

    const panel=document.createElement("div");
    panel.className="v2OwnerEditor v2Top8Owner";

    const input=makeInput("",20);
    input.placeholder="Coordinate, e.g. N2W2";

    const add=makeButton("Add to My Top 8");
    const msg=document.createElement("div");
    msg.className="v2OwnerStatus";

    const manager=document.createElement("div");
    manager.className="v2Top8Manager";

    panel.append(input,add,msg,manager);
    card.appendChild(panel);

    function draw(){
      manager.innerHTML=state.favoriteTiles.map((c,index)=>
        '<div class="v2ManageRow">'+
          '<strong>'+c+'</strong>'+
          '<div class="v2RowActions">'+
            '<button type="button" data-top-up="'+index+'">↑</button>'+
            '<button type="button" data-top-down="'+index+'">↓</button>'+
            '<button type="button" data-top-remove="'+index+'">Remove</button>'+
          '</div>'+
        '</div>'
      ).join("");

      manager.querySelectorAll("[data-top-up]").forEach(b=>{
        b.onclick=()=>move(Number(b.dataset.topUp),-1);
      });

      manager.querySelectorAll("[data-top-down]").forEach(b=>{
        b.onclick=()=>move(Number(b.dataset.topDown),1);
      });

      manager.querySelectorAll("[data-top-remove]").forEach(b=>{
        b.onclick=()=>remove(Number(b.dataset.topRemove));
      });
    }

    async function save(message){
      status(msg,"Saving Top 8...");

      try{
        await saveProfile();
        status(msg,message,true);

        setTimeout(()=>{
          const u=new URL(location.href);
          u.searchParams.set("cb",Date.now());
          location.href=u.toString();
        },500);
      }catch(e){
        status(msg,e.message||"Top 8 could not be saved.");
      }
    }

    async function move(index,delta){
      const next=index+delta;
      if(next<0||next>=state.favoriteTiles.length) return;

      [state.favoriteTiles[index],state.favoriteTiles[next]]=[
        state.favoriteTiles[next],state.favoriteTiles[index]
      ];

      draw();
      await save("Top 8 reordered.");
    }

    async function remove(index){
      const c=state.favoriteTiles[index];

      if(!confirm("Remove "+c+" from your Top 8?")) return;

      state.favoriteTiles.splice(index,1);
      draw();
      await save("Removed from Top 8.");
    }

    add.onclick=async()=>{
      const c=input.value.trim().toUpperCase();

      if(!c){
        status(msg,"Enter a coordinate.");
        return;
      }

      if(state.favoriteTiles.includes(c)){
        status(msg,c+" is already in your Top 8.");
        return;
      }

      if(state.favoriteTiles.length>=8){
        status(msg,"Top 8 is full. Remove one first.");
        return;
      }

      const r=await fetch(
        "/api/tile/"+encodeURIComponent(c),
        {cache:"no-store"}
      );

      const data=await r.json().catch(()=>({}));

      if(!r.ok||!data.ok){
        status(msg,"That coordinate could not be found.");
        return;
      }

      state.favoriteTiles.push(c);
      input.value="";
      draw();

      await save(c+" added to Top 8.");
    };

    draw();
  }

  function wireSong(){
    const card=document.querySelector(".songCard");
    if(!card || card.querySelector(".v2SongOwner")) return;

    const panel=document.createElement("div");
    panel.className="v2OwnerEditor v2SongOwner";

    const title=makeInput(state.musicTitle||"",120);
    title.placeholder="Profile song title";

    const url=makeInput(state.musicUrl||"",1000);
    url.type="url";
    url.placeholder="Spotify, SoundCloud, YouTube, or direct audio URL";

    const file=document.createElement("input");
    file.className="v2OwnerInput";
    file.type="file";
    file.accept=".mp3,.wav,.ogg,.m4a,audio/mpeg,audio/wav,audio/ogg,audio/mp4";

    const autoplayLabel=document.createElement("label");
    autoplayLabel.className="v2OwnerCheck";

    const autoplay=document.createElement("input");
    autoplay.type="checkbox";
    autoplay.checked=Boolean(state.musicAutoplay);

    autoplayLabel.append(
      autoplay,
      document.createTextNode(" Autoplay when allowed")
    );

    const save=makeButton("Save Profile Song");
    const remove=makeButton("Remove Song");

    const msg=document.createElement("div");
    msg.className="v2OwnerStatus";

    panel.append(
      title,
      url,
      file,
      autoplayLabel,
      save,
      remove,
      msg
    );

    card.appendChild(panel);

    save.onclick=async()=>{
      const uuid=payloadUuid();

      if(!uuid){
        status(msg,"Owner verification required.");
        return;
      }

      const fd=new FormData();

      fd.append("payloadUuid",uuid);
      fd.append("musicTitle",title.value);
      fd.append("musicUrl",url.value);
      fd.append("musicAutoplay",autoplay.checked?"1":"0");

      if(file.files[0]){
        fd.append("song",file.files[0]);
      }

      status(msg,"Saving Profile Song...");

      const r=await fetch(
        "/api/tile/"+encodeURIComponent(coord)+"/song",
        {
          method:"POST",
          body:fd
        }
      );

      const data=await r.json().catch(()=>({}));

      if(!r.ok||!data.ok){
        status(
          msg,
          data.error||"Profile Song could not be saved."
        );
        return;
      }

      status(msg,"Profile Song saved.",true);

      setTimeout(()=>{
        const u=new URL(location.href);
        u.searchParams.set("cb",Date.now());
        location.href=u.toString();
      },500);
    };

    remove.onclick=async()=>{
      if(!confirm("Remove the current Profile Song?")) return;

      const uuid=payloadUuid();

      if(!uuid){
        status(msg,"Owner verification required.");
        return;
      }

      status(msg,"Removing Profile Song...");

      const r=await fetch(
        "/api/tile/"+encodeURIComponent(coord)+"/song/remove",
        {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({payloadUuid:uuid})
        }
      );

      const data=await r.json().catch(()=>({}));

      if(!r.ok||!data.ok){
        status(
          msg,
          data.error||"Profile Song could not be removed."
        );
        return;
      }

      status(msg,"Profile Song removed.",true);

      setTimeout(()=>{
        const u=new URL(location.href);
        u.searchParams.set("cb",Date.now());
        location.href=u.toString();
      },500);
    };
  }

  function gallerySrc(item){
    if(typeof item==="string") return item;

    return (
      item?.url||
      item?.src||
      item?.imageUrl||
      item?.image_url||
      ""
    );
  }

  function wireGallery(){
    const card=document.querySelector(".galleryCard");
    if(!card || card.querySelector(".v2GalleryOwner")) return;

    const panel=document.createElement("div");
    panel.className="v2OwnerEditor v2GalleryOwner";

    const files=document.createElement("input");
    files.className="v2OwnerInput";
    files.type="file";
    files.multiple=true;
    files.accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif";

    const upload=makeButton("Upload Images");
    const msg=document.createElement("div");
    msg.className="v2OwnerStatus";

    panel.append(files,upload,msg);
    card.appendChild(panel);

    function draw(images){
      state.gallery=Array.isArray(images)
        ? images.slice()
        : [];

      const grid=$("galleryGrid");

      if(!state.gallery.length){
        grid.innerHTML=
          '<div class="galleryTile v2EmptyGallery">No gallery images yet.</div>';
        return;
      }

      grid.innerHTML=state.gallery.map((item,index)=>{
        const src=gallerySrc(item);

        return (
          '<div class="v2GalleryManage">'+
            '<img src="'+src+'" alt="">'+
            '<div class="v2RowActions">'+
              '<button type="button" data-g-left="'+index+'">←</button>'+
              '<button type="button" data-g-right="'+index+'">→</button>'+
              '<button type="button" data-g-delete="'+index+'">Delete</button>'+
            '</div>'+
          '</div>'
        );
      }).join("");

      grid.querySelectorAll("[data-g-left]").forEach(b=>{
        b.onclick=()=>move(Number(b.dataset.gLeft),-1);
      });

      grid.querySelectorAll("[data-g-right]").forEach(b=>{
        b.onclick=()=>move(Number(b.dataset.gRight),1);
      });

      grid.querySelectorAll("[data-g-delete]").forEach(b=>{
        b.onclick=()=>remove(Number(b.dataset.gDelete));
      });
    }

    async function load(){
      const r=await fetch(
        "/api/tile/"+encodeURIComponent(coord)+"/gallery",
        {cache:"no-store"}
      );

      const data=await r.json().catch(()=>({}));

      if(!r.ok||!data.ok){
        status(
          msg,
          data.error||"Gallery controls could not be loaded."
        );
        return;
      }

      draw(data.gallery);
      status(msg,"Gallery controls ready.",true);
    }

    async function remove(index){
      if(!confirm("Delete this Gallery image?")) return;

      status(msg,"Deleting Gallery image...");

      const r=await fetch(
        "/api/tile/"+encodeURIComponent(coord)+"/gallery/delete",
        {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            payloadUuid:payloadUuid(),
            index
          })
        }
      );

      const data=await r.json().catch(()=>({}));

      if(!r.ok||!data.ok){
        status(
          msg,
          data.error||"Gallery image could not be deleted."
        );
        return;
      }

      draw(data.gallery);
      status(msg,"Gallery image deleted.",true);
    }

    async function move(index,delta){
      const next=index+delta;

      if(next<0||next>=state.gallery.length) return;

      const order=state.gallery.map((_,i)=>i);

      [order[index],order[next]]=[
        order[next],order[index]
      ];

      status(msg,"Reordering Gallery...");

      const r=await fetch(
        "/api/tile/"+encodeURIComponent(coord)+"/gallery/reorder",
        {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            payloadUuid:payloadUuid(),
            order
          })
        }
      );

      const data=await r.json().catch(()=>({}));

      if(!r.ok||!data.ok){
        status(
          msg,
          data.error||"Gallery order could not be saved."
        );
        return;
      }

      draw(data.gallery);
      status(msg,"Gallery reordered.",true);
    }

    upload.onclick=async()=>{
      const list=Array.from(files.files||[]);

      if(!list.length){
        status(msg,"Choose at least one image.");
        return;
      }

      const invalid=list.find(file=>!validImage(file));

      if(invalid){
        status(
          msg,
          "Gallery images must be PNG, JPG, WEBP, or GIF and within the upload size limit."
        );
        return;
      }

      const fd=new FormData();
      fd.append("payloadUuid",payloadUuid());

      list.forEach(file=>{
        fd.append("gallery",file);
      });

      status(msg,"Uploading Gallery images...");

      const r=await fetch(
        "/api/tile/"+encodeURIComponent(coord)+"/gallery",
        {
          method:"POST",
          body:fd
        }
      );

      const data=await r.json().catch(()=>({}));

      if(!r.ok||!data.ok){
        status(
          msg,
          data.error||"Gallery upload could not be completed."
        );
        return;
      }

      files.value="";
      draw(data.gallery);
      status(msg,"Gallery updated.",true);
    };

    load();
  }




  /* MONOLITH_V2_LIVE_MERCH_STOREFRONT_V1 */
  async function loadLiveMerch(){
    const slot=$("merchProducts");
    if(!slot) return;

    slot.innerHTML="";

    try{
      const r=await fetch(
        "/api/merch/storefront/"+
        encodeURIComponent(String(coord||"ORIGIN").toUpperCase())+
        "?cb="+Date.now(),
        {cache:"no-store"}
      );

      const data=await r.json();
      const products=
        data && Array.isArray(data.products)
          ? data.products
          : [];

      if(!r.ok || !data.ok || !products.length){
        const empty=document.createElement("div");
        empty.className="merchEmptyState";
        empty.textContent="No live merchandise listed yet.";
        slot.appendChild(empty);
        return;
      }

      products.slice(0,6).forEach(product=>{
        const link=document.createElement("a");
        link.className="merchProduct";
        link.href=
          "/merch/product/?id="+
          encodeURIComponent(product.productId||"");

        const media=
          Array.isArray(product.media)
            ? product.media[0]
            : null;

        if(media && media.url){
          const img=document.createElement("img");
          img.className="merchProductImage";
          img.src=media.url;
          img.alt=
            media.altText ||
            product.title ||
            "Merch product";
          img.loading="lazy";
          link.appendChild(img);
        }else{
          const fallback=document.createElement("div");
          fallback.className="merchProductImage merchProductFallback";
          fallback.textContent=product.title||"Merch";
          link.appendChild(fallback);
        }

        const copy=document.createElement("div");
        copy.className="merchProductCopy";

        const title=document.createElement("strong");
        title.textContent=product.title||"Product";

        copy.appendChild(title);
        link.appendChild(copy);

        link.addEventListener("click",e=>{
          e.stopPropagation();
        });

        slot.appendChild(link);
      });

    }catch(e){
      console.error("[v2-merch-storefront]",e);

      const error=document.createElement("div");
      error.className="merchEmptyState";
      error.textContent="Merch storefront temporarily unavailable.";
      slot.appendChild(error);
    }
  }

  /* MONOLITH_V2_PUBLIC_ACTIONS_V1 */
  function wirePublicActions(){
    const favoriteBtn=$("favoriteBtn");
    const findMeBtn=$("findMeBtn");
    const payMeBtn=$("payMeBtn");
    const grid=$("utilityGrid");

    function viewedCoord(){
      return String(coord||"ORIGIN").trim().toUpperCase();
    }

    async function favoriteSession(){
      const payloadUuid=
        localStorage.getItem("monolith_tile_owner_payload_uuid")||"";
      const sourceCoordinate=
        localStorage.getItem("monolith_tile_owner_coordinate")||"";

      if(!payloadUuid||!sourceCoordinate){
        alert("Sign in to your MONOLITH coordinate first, then add this tile to your Top 8.");
        return null;
      }

      return {
        payloadUuid,
        sourceCoordinate:String(sourceCoordinate).trim().toUpperCase()
      };
    }

    async function addTop8(){
      if(!favoriteBtn) return;

      favoriteBtn.disabled=true;
      favoriteBtn.textContent="Checking...";

      try{
        const session=await favoriteSession();

        if(!session){
          favoriteBtn.disabled=false;
          favoriteBtn.textContent="Add to Top 8";
          return;
        }

        const targetCoordinate=viewedCoord();

        if(session.sourceCoordinate===targetCoordinate){
          alert("You cannot favorite your own tile.");
          favoriteBtn.disabled=false;
          favoriteBtn.textContent="Add to Top 8";
          return;
        }

        const submit=async replaceIndex=>{
          const body={
            sourceCoordinate:session.sourceCoordinate,
            targetCoordinate,
            payloadUuid:session.payloadUuid
          };

          if(Number.isInteger(replaceIndex)){
            body.replaceIndex=replaceIndex;
          }

          const r=await fetch("/api/tile/favorite",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(body)
          });

          const d=await r.json().catch(()=>({ok:false,error:"bad_response"}));
          return {r,d};
        };

        favoriteBtn.textContent="Saving...";

        let result=await submit();

        if(
          result.r.status===409 &&
          result.d &&
          result.d.error==="top_eight_full"
        ){
          const list=Array.isArray(result.d.favoriteTiles)
            ? result.d.favoriteTiles
            : [];

          const choice=prompt(
            "Your Top 8 is full. Choose slot 1-8 to replace:\n"+
            list.map((x,i)=>(i+1)+". "+x).join("\n")
          );

          if(!choice){
            favoriteBtn.disabled=false;
            favoriteBtn.textContent="Add to Top 8";
            return;
          }

          const idx=Number(choice)-1;

          if(!Number.isInteger(idx)||idx<0||idx>7){
            alert("Invalid slot.");
            favoriteBtn.disabled=false;
            favoriteBtn.textContent="Add to Top 8";
            return;
          }

          result=await submit(idx);
        }

        if(!result.r.ok||!result.d.ok){
          throw new Error(result.d.error||"favorite_failed");
        }

        favoriteBtn.textContent=
          result.d.alreadyFavorited
            ? "Already in Top 8"
            : "Added to Top 8";

        setTimeout(()=>{
          favoriteBtn.disabled=false;
        },900);

      }catch(e){
        alert(e.message||"Unable to add this tile to Top 8.");
        favoriteBtn.disabled=false;
        favoriteBtn.textContent="Add to Top 8";
      }
    }

    function openFindMe(){
      const c=viewedCoord();
      const url=location.origin+"/find/"+encodeURIComponent(c);

      const overlay=document.createElement("div");
      overlay.className="v2PublicOverlay";

      overlay.innerHTML=`
        <div class="v2PublicModal">
          <button type="button" class="v2PublicClose">×</button>
          <div class="sectionEyebrow">MONOLITH</div>
          <h2>Find Me</h2>
          <p>Share this coordinate directly.</p>
          <div class="v2PublicUrl">${url}</div>
          <div class="v2PublicActions">
            <button type="button" data-find-copy>Copy Link</button>
            <button type="button" data-find-share>Share</button>
            <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent("Find me on MONOLITH at "+c)}&url=${encodeURIComponent(url)}" target="_blank" rel="noopener">Share to X</a>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const close=()=>overlay.remove();

      overlay.querySelector(".v2PublicClose").onclick=close;

      overlay.onclick=e=>{
        if(e.target===overlay) close();
      };

      overlay.querySelector("[data-find-copy]").onclick=async()=>{
        await navigator.clipboard.writeText(url);
        alert("Copied.");
      };

      overlay.querySelector("[data-find-share]").onclick=async()=>{
        if(navigator.share){
          await navigator.share({
            title:"Find Me on MONOLITH",
            text:"Find me on MONOLITH at "+c,
            url
          });
        }else{
          await navigator.clipboard.writeText(url);
          alert("Copied.");
        }
      };
    }

    function openPayMe(){
      const overlay=document.createElement("div");
      overlay.className="v2PublicOverlay";

      overlay.innerHTML=`
        <div class="v2PublicModal v2PayModal">
          <button type="button" class="v2PublicClose">×</button>
          <div class="sectionEyebrow">P2P Payments</div>
          <h2>Pay ${viewedCoord()}</h2>

          <label>
            XRP Amount
            <input type="number" min="0.000001" step="0.000001" data-pay-amount>
          </label>

          <label>
            Message
            <input type="text" maxlength="240" data-pay-message placeholder="Optional message">
          </label>

          <button type="button" class="v2PayStart">Open Xaman Payment</button>
          <div class="v2PayStatus"></div>
        </div>
      `;

      document.body.appendChild(overlay);

      const close=()=>overlay.remove();
      const amount=overlay.querySelector("[data-pay-amount]");
      const message=overlay.querySelector("[data-pay-message]");
      const start=overlay.querySelector(".v2PayStart");
      const status=overlay.querySelector(".v2PayStatus");

      overlay.querySelector(".v2PublicClose").onclick=close;

      overlay.onclick=e=>{
        if(e.target===overlay) close();
      };

      start.onclick=async()=>{
        const amountXrp=Number(String(amount.value||"").trim());

        if(!Number.isFinite(amountXrp)||amountXrp<=0){
          status.textContent="Enter an XRP amount first.";
          return;
        }

        start.disabled=true;
        status.textContent="Creating Xaman payment...";

        try{
          const r=await fetch("/api/tile/pay/start",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
              coordinate:viewedCoord(),
              amountXrp,
              kind:"payment",
              message:String(message.value||"").trim()
            })
          });

          const d=await r.json().catch(()=>({ok:false,error:"bad_response"}));

          if(!r.ok||!d.ok){
            throw new Error(d.error||"payment_payload_failed");
          }

          if(!d.signUrl){
            throw new Error("sign_url_missing");
          }

          status.textContent="Payment ready in Xaman.";
          window.open(d.signUrl,"_blank","noopener");

        }catch(e){
          status.textContent=e.message||"Unable to create payment.";
          start.disabled=false;
        }
      };
    }

    if(favoriteBtn){
      favoriteBtn.onclick=addTop8;
    }

    if(findMeBtn){
      findMeBtn.onclick=openFindMe;
    }

    if(payMeBtn){
      payMeBtn.onclick=openPayMe;
    }

    if(grid){
      grid.addEventListener("click",e=>{
        const card=e.target.closest(".utilityCard");
        if(!card) return;

        if(grid.classList.contains("editing")) return;

        const module=card.dataset.module;

        if(module==="p2p"){
          openPayMe();
          return;
        }

        if(module==="merch"){
          location.href="/merch/?tile="+encodeURIComponent(viewedCoord());
          return;
        }

        if(module==="otc"){
          location.href="/otc/";
          return;
        }

        if(module==="tile-market"){
          location.href="/market/";
          return;
        }

        if(module==="nft"){
          alert("MONOLITH NFT Market is coming soon.");
        }
      });
    }
  }

  /* MONOLITH_V2_GALLERY_LIGHTBOX_V1 */
  function wireGalleryLightbox(){
    if(document.getElementById("v2GalleryLightbox")) return;

    const overlay=document.createElement("div");
    overlay.id="v2GalleryLightbox";
    overlay.className="v2GalleryLightbox";
    overlay.setAttribute("aria-hidden","true");

    overlay.innerHTML=`
      <button type="button" class="v2GalleryLightboxClose" aria-label="Close">×</button>
      <button type="button" class="v2GalleryLightboxNav prev" aria-label="Previous">‹</button>
      <img class="v2GalleryLightboxImage" alt="">
      <button type="button" class="v2GalleryLightboxNav next" aria-label="Next">›</button>
    `;

    document.body.appendChild(overlay);

    const image=overlay.querySelector(".v2GalleryLightboxImage");
    const close=overlay.querySelector(".v2GalleryLightboxClose");
    const prev=overlay.querySelector(".prev");
    const next=overlay.querySelector(".next");

    let images=[];
    let index=0;

    function collect(){
      images=[
        ...document.querySelectorAll("#galleryGrid img")
      ].map(img=>img.src).filter(Boolean);
    }

    function show(i){
      collect();
      if(!images.length) return;

      index=(i+images.length)%images.length;
      image.src=images[index];

      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden","false");
      document.body.style.overflow="hidden";
    }

    function hide(){
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden","true");
      image.src="";
      document.body.style.overflow="";
    }

    document.addEventListener("click",e=>{
      const img=e.target.closest("#galleryGrid img");
      if(!img) return;

      collect();
      const i=images.indexOf(img.src);
      show(i>=0 ? i : 0);
    });

    close.onclick=hide;

    prev.onclick=e=>{
      e.stopPropagation();
      show(index-1);
    };

    next.onclick=e=>{
      e.stopPropagation();
      show(index+1);
    };

    overlay.onclick=e=>{
      if(e.target===overlay) hide();
    };

    document.addEventListener("keydown",e=>{
      if(!overlay.classList.contains("open")) return;

      if(e.key==="Escape") hide();
      if(e.key==="ArrowLeft") show(index-1);
      if(e.key==="ArrowRight") show(index+1);
    });
  }

  /* MONOLITH_V2_UTILITY_REORDER_CONTROLS_V2 */
  function wireUtilityReorder(){
    const grid=$("utilityGrid");
    const customize=$("customizeUtilitiesBtn");
    const save=$("saveUtilitiesBtn");

    if(!grid||!customize||!save) return;

    const hiddenKey=
      "monolith_v2_utility_hidden_"+coord;

    function getHidden(){
      try{
        const value=JSON.parse(
          localStorage.getItem(hiddenKey)||"[]"
        );

        return Array.isArray(value)
          ? value
          : [];
      }catch(e){
        return [];
      }
    }

    function setHidden(list){
      localStorage.setItem(
        hiddenKey,
        JSON.stringify(list)
      );
    }

    function removeControls(){
      grid.querySelectorAll(
        ".v2UtilityMoveControls"
      ).forEach(el=>el.remove());
    }

    function addControls(){
      removeControls();

      const cards=[
        ...grid.querySelectorAll(".utilityCard")
      ];

      const hidden=getHidden();

      cards.forEach((card,index)=>{
        const controls=document.createElement("div");
        controls.className="v2UtilityMoveControls";

        const up=makeButton("↑");
        const down=makeButton("↓");

        const isHidden=
          hidden.includes(card.dataset.module);

        const toggle=makeButton(
          isHidden ? "Show" : "Hide"
        );

        toggle.classList.add(
          "v2UtilityVisibilityToggle"
        );

        up.disabled=index===0;
        down.disabled=index===cards.length-1;

        card.classList.toggle(
          "utilityHidden",
          isHidden
        );

        card.style.display="";

        up.onclick=e=>{
          e.stopPropagation();

          const previous=card.previousElementSibling;

          if(
            previous &&
            previous.classList.contains("utilityCard")
          ){
            grid.insertBefore(card,previous);
            addControls();
          }
        };

        down.onclick=e=>{
          e.stopPropagation();

          const next=card.nextElementSibling;

          if(
            next &&
            next.classList.contains("utilityCard")
          ){
            grid.insertBefore(next,card);
            addControls();
          }
        };

        toggle.onclick=e=>{
          e.stopPropagation();

          let nextHidden=getHidden();
          const key=card.dataset.module;

          if(nextHidden.includes(key)){
            nextHidden=
              nextHidden.filter(x=>x!==key);
          }else{
            nextHidden.push(key);
          }

          setHidden(nextHidden);
          addControls();
        };

        controls.append(
          up,
          down,
          toggle
        );

        card.appendChild(controls);
      });
    }

    customize.addEventListener("click",()=>{
      setTimeout(()=>{
        if(grid.classList.contains("editing")){
          addControls();
        }else{
          removeControls();
        }
      },0);
    });

    save.addEventListener("click",()=>{
      removeControls();

      const hidden=getHidden();

      [...grid.querySelectorAll(".utilityCard")]
        .forEach(card=>{
          const isHidden=
            hidden.includes(card.dataset.module);

          card.classList.toggle(
            "utilityHidden",
            isHidden
          );

          card.style.display=
            isHidden
              ? "none"
              : "";
        });
    });
  }

  async function unlock(){
    if(unlocked) return;

    if(!payloadUuid()) return;

    try{
      await loadState();

      unlocked=true;

      const old=$("v2ProfileEditOverlay");
      if(old){
        old.style.display="none";
      }

      const hud=$("profileEditHud");
      if(hud){
        hud.style.display="none";
      }

      wireIdentity();
      wireVisuals();
      wireSong();
      wireTop8();
      wireLinks();
      wireGallery();
      wireUtilityReorder();

      editTextCard(
        ".aboutCard",
        "about",
        "about",
        "About",
        5
      );

      editTextCard(
        ".statusCard",
        "statusText",
        "status",
        "Status",
        3
      );

      editTextCard(
        ".moodCard",
        "mood",
        "mood",
        "Mood",
        1
      );

      editTextCard(
        ".interestsCard",
        "interests",
        "interests",
        "Interests",
        4
      );

      document.body.classList.add("v2OwnerUnlocked");

    }catch(e){
      console.error(
        "MONOLITH V2 owner editing failed:",
        e
      );
    }
  }

  wireGalleryLightbox();
  wirePublicActions();
  loadLiveMerch();

  setInterval(unlock,500);
  setTimeout(unlock,100);
})();
