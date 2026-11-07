/* Turnback: wann muss ein Fahrzeug an den Händler zurückgegeben werden? */
if(requireLogin()) (function(){
  var z=new URLSearchParams(location.search).get("z")||"";
  var page=renderShell("turnback.html","Turnback","Wann ein Fahrzeug an den Händler zurückgegeben werden muss.","");

  function paint(){
    var all=getAll();
    var offen=all.filter(function(x){ return x.c.turnOffen; }).filter(function(x){
      if(z==="7") return x.c.turnTage>=0 && x.c.turnTage<=7;
      if(z==="30") return x.c.turnTage>=0 && x.c.turnTage<=30;
      if(z==="late") return x.c.turnUeberf;
      return true;
    }).sort(function(a,b){ return a.r.turn<b.r.turn?-1:a.r.turn>b.r.turn?1:0; });
    var erledigt=all.filter(function(x){ return x.r.turnDone; }).sort(function(a,b){ return a.r.turnDone<b.r.turnDone?1:-1; });

    function seg(v,t){ return '<a href="turnback.html'+(v?'?z='+v:'')+'" class="'+(z===v?'on':'')+'">'+t+'</a>'; }
    page.innerHTML='<div class="filters"><div class="seg">'+seg("","Alle offenen")+seg("7","Nächste 7 Tage")+seg("30","Nächste 30 Tage")+seg("late","Überfällig")+'</div></div>'+
      '<div class="wrap"><table class="mid"><thead><tr><th>Turnback-Datum</th><th>Kunde</th><th>Fahrzeug</th><th>Fahrzeugnr. (MVA)</th><th>Stand</th><th></th></tr></thead><tbody>'+
      offen.map(function(x){
        var r=x.r,c=x.c;
        return '<tr><td><b class="'+(c.turnUeberf?'late':'')+'">'+fmtDate(r.turn)+'</b></td><td>'+custLink(r)+'</td><td>'+esc(r.fahrzeug)+' '+plate(r.kennzeichen)+'</td><td>'+esc(r.mva)+'</td>'+
          '<td class="'+(c.turnUeberf?'late':'')+'">'+(c.turnUeberf?'Überfällig – '+inTage(c.turnTage):'Fällig '+inTage(c.turnTage))+'</td>'+
          '<td><button class="btn sm" data-done="'+r.id+'">Turnback durchgeführt</button> <a class="btn sm" href="detail.html?id='+r.id+'">Öffnen</a></td></tr>';
      }).join("")+'</tbody></table>'+
      (offen.length?'':'<div class="panel"><div class="empty">Keine offenen Turnbacks in diesem Zeitraum.</div></div>')+'</div>'+
      '<h2 style="margin:28px 0 12px">Bereits zurückgegeben</h2>'+
      '<div class="wrap"><table class="mid"><thead><tr><th>Zurückgegeben am</th><th>Kunde</th><th>Fahrzeug</th><th>Eingetragen von</th></tr></thead><tbody>'+
      erledigt.map(function(x){ var r=x.r; return '<tr><td>'+fmtDate(r.turnDone)+'</td><td>'+custLink(r)+'</td><td>'+esc(r.fahrzeug)+' '+plate(r.kennzeichen)+'</td><td>'+esc(r.turnBy||"–")+'</td></tr>'; }).join("")+'</tbody></table>'+
      (erledigt.length?'':'<div class="panel"><div class="empty">Noch kein Turnback durchgeführt.</div></div>')+'</div>';
  }
  page.addEventListener("click",function(e){
    var id=e.target.getAttribute("data-done");
    if(id && confirm("Turnback wirklich als durchgeführt eintragen? Das Fahrzeug geht endgültig zurück und der Vorgang wird abgeschlossen.")){ markTurnDone(id); paint(); }
  });
  paint();
})();
