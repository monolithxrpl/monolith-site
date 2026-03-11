(function(){
  window.coordDisplayFromG=function(gx,gy){
    gx=+gx||0; gy=+gy||0;
    if(gx===0&&gy===0) return "ORIGIN";
    var ax=Math.abs(gx), ay=Math.abs(gy);
    var x=gx>0?"E-"+ax:gx<0?"W-"+ax:"";
    var y=gy>0?"N-"+ay:gy<0?"S-"+ay:"";
    return (x&&y)?(y+" / "+x):(x||y);
  };
  window.tileLegacyFromG=function(gx,gy){
    gx=+gx||0; gy=+gy||0;
    var ax=Math.abs(gx), ay=Math.abs(gy);
    var sx=gx<0?"W":"E";
    var sy=gy<=0?"N":"S";
    return sx+ax+"-"+sy+ay;
  };
  window.keyFromG=function(gx,gy){ gx=+gx||0; gy=+gy||0; return gx+","+gy; };
})();
