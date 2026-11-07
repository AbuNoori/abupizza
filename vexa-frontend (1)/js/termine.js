/* Termine: kommende Kunden-E-Mails, Wechsel und Rückgaben */
if(requireLogin()) (function(){
  var typ=new URLSearchParams(location.search).get("t")||"";
  var page=renderShell("termine.html","Termine","Kommende Wechsel, Rückgaben und Kunden-E-Mails auf einen Blick.",
    '<button class="btn" id="ics">Alle angezeigten Termine für Outlook (.ics)</button>');

  var all=getAll();
  var evs=eventsFor(all,true).filter(function(e){ return !typ || e.typ===typ; });
  var T=todayISO();
  var late=evs.filter(function(e){ return e.date<T; }), next=evs.filter(function(e){ return e.date>=T; });
  function seg(v,t){ return '<a href="termine.html'+(v?'?t='+v:'')+'" class="'+(typ===v?'on':'')+'">'+t+'</a>'; }

  page.innerHTML='<div class="filters"><div class="seg">'+seg("","Alle")+seg("mail","Kunden-E-Mail")+seg("wechsel","Fahrzeugwechsel")+seg("turn","Turnback")+'</div></div>'+
    (late.length?'<section class="panel" style="margin-bottom:22px"><header><h2>Überfällige Termine</h2></header>'+late.map(evHTML).join("")+'</section>':'')+
    '<section class="panel"><header><h2>Kommende Termine</h2></header>'+
    (next.length?next.map(evHTML).join(""):'<div class="empty">Keine kommenden Termine.</div>')+'</section>';

  document.getElementById("ics").addEventListener("click",function(){
    if(!evs.length){ alert("Es gibt keine Termine zum Exportieren."); return; }
    downloadFile("VEXA_Termine.ics",icsBuild(icsEventsOf(evs)),"text/calendar");
    audit("Termine als .ics für Outlook exportiert ("+evs.length+" Termine)");
  });
})();
