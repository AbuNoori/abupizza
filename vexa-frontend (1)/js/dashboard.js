if(requireLogin()) (function(){
  var T=todayISO();
  // Einmal pro Tag läuft die (simulierte) automatische Prüfung
  var auto=localStorage.getItem(K_CHECK)!==T ? runAutoCheck() : null;

  var all=getAll();
  var page=renderShell("dashboard.html","Dashboard","Heute ist "+fmtLong(T)+". Termine und Hinweise werden bei jedem Öffnen neu berechnet.",
    '<a class="btn pri" href="neue-miete.html">Neue Miete erfassen</a>');

  var aktiv=all.filter(function(x){ return !x.r.closed; }).length;
  var w14=all.filter(function(x){ return x.c.wechselOffen && x.c.tage>=0 && x.c.tage<=14; }).length;
  var t30=all.filter(function(x){ return x.c.turnOffen && x.c.turnTage>=0 && x.c.turnTage<=30; }).length;
  var ueber=all.filter(function(x){ return x.c.wechselUeberf || x.c.turnUeberf; }).length;
  var notes=notificationsFor(all), evs=eventsFor(all,false).slice(0,6);

  var h='';
  if(auto && auto.drafts>0){
    h+='<div class="box info">Tägliche Prüfung: '+auto.drafts+(auto.drafts>1?' E-Mail-Entwürfe wurden':' E-Mail-Entwurf wurde')+' vorbereitet. Versendet wird erst, wenn ein Teammitglied es bestätigt.</div>';
  }
  h+='<div class="kpis">'+
    '<a class="kpi" href="liste.html"><b>'+aktiv+'</b><span>Aktive Langzeitmieten</span></a>'+
    '<a class="kpi" href="wechsel.html?z=14"><b>'+w14+'</b><span>Fahrzeugwechsel in 14 Tagen</span></a>'+
    '<a class="kpi" href="turnback.html?z=30"><b>'+t30+'</b><span>Turnbacks in 30 Tagen</span></a>'+
    '<a class="kpi'+(ueber?' late':'')+'" href="benachrichtigungen.html"><b>'+ueber+'</b><span>Überfällig</span></a></div>';

  h+='<div class="cols"><section class="panel"><header><h2>Jetzt zu tun</h2><a href="benachrichtigungen.html">Alle Hinweise</a></header>'+
    (notes.length?notes.slice(0,5).map(function(n){ return todoHTML(n,false); }).join(""):'<div class="empty">Alles erledigt – keine offenen Aufgaben.</div>')+
    '</section><section class="panel"><header><h2>Nächste Termine</h2><a href="termine.html">Alle Termine</a></header>'+
    (evs.length?evs.map(evHTML).join(""):'<div class="empty">Keine kommenden Termine.</div>')+'</section></div>';
  page.innerHTML=h;
})();
