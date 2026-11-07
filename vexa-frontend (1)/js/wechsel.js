/* Fahrzeugwechsel / VEX: wann muss welches Fahrzeug gewechselt werden? */
if(requireLogin()) (function(){
  var z=new URLSearchParams(location.search).get("z")||"";
  var page=renderShell("wechsel.html","Fahrzeugwechsel (VEX)","Wann ein Fahrzeug gewechselt werden muss: nach 60 Tagen, spätestens nach 90 Tagen oder früher bei Turnback.","");

  function paint(){
    var all=getAll().filter(function(x){ return x.c.wechselOffen; });
    var list=all.filter(function(x){
      if(z==="14") return x.c.tage>=0 && x.c.tage<=14;
      if(z==="30") return x.c.tage>=0 && x.c.tage<=30;
      if(z==="late") return x.c.wechselUeberf;
      return true;
    }).sort(function(a,b){ return a.c.tausch<b.c.tausch?-1:a.c.tausch>b.c.tausch?1:0; });

    function seg(v,t){ return '<a href="wechsel.html'+(v?'?z='+v:'')+'" class="'+(z===v?'on':'')+'">'+t+'</a>'; }
    page.innerHTML='<div class="filters"><div class="seg">'+seg("","Alle offenen")+seg("14","Nächste 14 Tage")+seg("30","Nächste 30 Tage")+seg("late","Überfällig")+'</div></div>'+
      '<div class="wrap"><table class="mid"><thead><tr><th>Tauschtermin</th><th>Kunde</th><th>Fahrzeug</th><th>Berechnet nach</th><th>Spätestens bis</th><th>E-Mail-Datum</th><th>Termin im Kalender</th><th>Status</th><th></th></tr></thead><tbody>'+
      list.map(function(x){
        var r=x.r,c=x.c;
        return '<tr><td><b class="'+(c.wechselUeberf?'late':'')+'">'+fmtDate(c.tausch)+'</b><span class="small">'+inTage(c.tage)+'</span></td>'+
          '<td>'+custLink(r)+'</td><td>'+esc(r.fahrzeug)+' '+plate(r.kennzeichen)+'</td><td>'+esc(c.grundKurz)+'</td><td>'+fmtDate(c.spaet)+'</td>'+
          '<td>'+fmtDate(c.mailDate)+'</td><td>'+esc(wechselNote(x))+'</td><td>'+chip(c.status)+'</td>'+
          '<td><a class="btn sm" href="tausch.html?id='+r.id+'">Fahrzeug tauschen</a> <a class="btn sm" href="detail.html?id='+r.id+'">Öffnen</a></td></tr>';
      }).join("")+'</tbody></table>'+
      (list.length?'':'<div class="panel"><div class="empty">Keine Fahrzeugwechsel in diesem Zeitraum.</div></div>')+'</div>';
  }
  paint();
})();
