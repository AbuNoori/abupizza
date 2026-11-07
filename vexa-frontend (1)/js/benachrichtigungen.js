/* Benachrichtigungen: Warnungen, wenn ein wichtiger Termin näherkommt oder etwas fehlt */
if(requireLogin()) (function(){
  function build(msg){
    var page=renderShell("benachrichtigungen.html","Benachrichtigungen","Hinweise zu überfälligen und bald fälligen Aufgaben.",
      '<button class="btn pri" id="chk">Automatische Prüfung durchführen</button>');
    var notes=notificationsFor(getAll());
    var last=localStorage.getItem(K_CHECK);
    page.innerHTML=(msg?'<div class="box ok">'+msg+'</div>':'')+
      '<div class="box info">Die automatische Prüfung läuft einmal pro Tag beim Öffnen des Dashboards. Sie bereitet fällige Kunden-E-Mails als Entwurf vor (14 Tage vor dem Wechsel). Letzte Prüfung: <b>'+(last?fmtDate(last):"noch nie")+'</b>.</div>'+
      '<section class="panel"><header><h2>Offene Hinweise ('+notes.length+')</h2></header>'+
      (notes.length?notes.map(function(n){ return todoHTML(n,true); }).join(""):'<div class="empty">Keine offenen Hinweise. Alles im grünen Bereich.</div>')+'</section>';
    document.getElementById("chk").addEventListener("click",function(){
      var res=runAutoCheck();
      audit("Automatische Prüfung durchgeführt ("+res.drafts+" Entwürfe vorbereitet)");
      build("Prüfung abgeschlossen: "+res.drafts+" neue E-Mail-Entwürfe vorbereitet, "+res.notes+" Hinweise offen. Versendet wird erst nach Bestätigung durch ein Teammitglied.");
    });
  }
  build("");
})();
