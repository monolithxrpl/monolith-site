/* MONOLITH BADGES v2 */
(function(){
  function abs(n){ return Math.abs(parseInt(n||"0",10)); }
  function tier(gx,gy){
    gx=abs(gx); gy=abs(gy);
    if(gx===666||gy===666) return "na";
    if(gx===589||gy===589||gx===143||gy===143||gx===69||gy===69||gx===67||gy===67||gx===420||gy===420||gx===777||gy===777||gx===888||gy===888) return "premium";
    if(gx!==0 && gx%11===0 && gx<=99) return "premium";
    if(gy!==0 && gy%11===0 && gy<=99) return "premium";
    if(gx===100||gx===200||gx===300||gx===400||gx===500) return "premium";
    if(gy===100||gy===200||gy===300||gy===400||gy===500) return "premium";
    return "";
  }
  function apply(){
    var cells=document.querySelectorAll("#world .cell");
    for(var i=0;i<cells.length;i++){
      var c=cells[i];
      c.classList.remove("badge-premium","badge-na");
      var t=tier(c.getAttribute("data-gx"), c.getAttribute("data-gy"));
      if(t==="premium") c.classList.add("badge-premium");
      if(t==="na") c.classList.add("badge-na");
    }
  }
  window.MONOLITH_APPLY_BADGES=apply;
  document.addEventListener("DOMContentLoaded", function(){ setTimeout(apply,250); setInterval(apply,1200); });
})();
