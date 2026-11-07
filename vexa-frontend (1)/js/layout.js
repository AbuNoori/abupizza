/* ============================================================
   VEXA – gemeinsames Gerüst: Seitenleiste, Titelzeile, kleine Bausteine
   ============================================================ */
var NAV=[
  {h:"dashboard.html",t:"Dashboard"},
  {h:"liste.html",t:"Langzeitmieten"},
  {h:"wechsel.html",t:"Fahrzeugwechsel"},
  {h:"turnback.html",t:"Turnback"},
  {h:"kalender.html",t:"Kalender"},
  {h:"termine.html",t:"Termine"},
  {h:"rueckmeldungen.html",t:"Rückmeldungen"},
  {h:"kunden.html",t:"Kunden"},
  {h:"benachrichtigungen.html",t:"Benachrichtigungen",badge:true},
  {h:"einstellungen.html",t:"Einstellungen"},
  {h:"konten.html",t:"Konten",chef:true},
  {h:"protokoll.html",t:"Protokoll",chef:true}
];

function plate(kz){ return kz ? '<span class="plate"><i></i><b>'+esc(kz)+'</b></span>' : '<span class="plate none"><i></i><b>ohne Kennzeichen</b></span>'; }
function chip(st){ return '<span class="chip '+statusClass(st)+'">'+esc(st)+'</span>'; }
function custLink(r){ return '<a href="detail.html?id='+r.id+'">'+esc(r.kunde)+'</a>'; }
function carLink(r){ return '<a href="detail.html?id='+r.id+'">'+esc(r.fahrzeug)+'</a>'; }

var LOGO='<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="#fff" stroke-width="3"/>'+
  '<text x="21" y="41" font-family="Barlow Semi Condensed,sans-serif" font-size="25" font-weight="700" fill="#fff" text-anchor="middle">V</text>'+
  '<text x="43" y="41" font-family="Barlow Semi Condensed,sans-serif" font-size="25" font-weight="700" fill="#ff6b00" text-anchor="middle">X</text></svg>';

/* Baut die Seite auf und gibt das Feld für den Seiteninhalt zurück */
function renderShell(active,title,sub,actions){
  var u=currentUser();
  if(!u) return null;
  var must=!!u.mustChange, chef=u.rolle==="admin";
  var cnt=must?0:notificationsFor(getAll()).length;
  var nav="", sep=false;
  if(!must){
    NAV.forEach(function(i){
      if(i.chef && !chef) return;
      if(i.chef && !sep){ nav+='<div class="navsep">Nur für den Chef</div>'; sep=true; }
      nav+='<a href="'+i.h+'"'+(i.h===active?' class="active" aria-current="page"':'')+'><span>'+i.t+'</span>'+
        (i.badge&&cnt?'<span class="badge" title="'+cnt+' offene Hinweise">'+cnt+'</span>':'')+'</a>';
    });
  }
  document.getElementById("shell").innerHTML=
    '<div class="shell" id="shellbox">'+
    '<aside class="side"><div class="brand">'+LOGO+'<span class="logo">VEXA</span></div>'+
    '<div class="tag">Avis &amp; Budget Langzeitmieten</div>'+
    '<nav aria-label="Hauptmenü">'+nav+'</nav>'+
    '<div class="me">Angemeldet: <b>'+esc(u.name)+'</b> ('+(chef?"Chef":"Team")+')</div>'+
    '<button class="btn out" id="logoutBtn">Abmelden</button></aside>'+
    '<div class="scrim" id="scrim"></div>'+
    '<main class="main"><div class="top"><button class="menubtn" id="menuBtn" aria-label="Menü öffnen">☰</button>'+
    '<div class="ttl"><h1>'+esc(title)+'</h1>'+(sub?'<p>'+esc(sub)+'</p>':'')+'</div>'+
    '<div class="acts">'+(actions||"")+'</div></div><div id="page"></div></main></div>';
  document.title="VEXA – "+title;
  document.getElementById("logoutBtn").addEventListener("click",function(){ logout(); location.href="login.html"; });
  document.getElementById("menuBtn").addEventListener("click",function(){ document.getElementById("shellbox").classList.toggle("open"); });
  document.getElementById("scrim").addEventListener("click",function(){ document.getElementById("shellbox").classList.remove("open"); });
  return document.getElementById("page");
}

/* Zeile für "Jetzt zu tun" / Benachrichtigungen */
function todoHTML(n,withButton){
  var r=n.x.r;
  return '<div class="todo"><span class="dot'+(n.lvl==="red"?" red":"")+'"></span><div style="flex:1;min-width:0">'+
    '<b>'+esc(n.title)+'</b> · <a href="detail.html?id='+r.id+'"><b>'+esc(r.kunde)+' · '+esc(r.fahrzeug)+' '+esc(r.kennzeichen||'')+'</b></a><br>'+
    '<span class="mute">'+esc(n.text)+'</span></div>'+
    (withButton?'<a class="btn sm" href="detail.html?id='+r.id+'">Öffnen</a>':'')+'</div>';
}
/* Zeile für "Nächste Termine" */
function evHTML(e){
  var r=e.x.r, T=todayISO(), tage=diffDays(T,e.date);
  return '<div class="ev"><div class="evd"><b>'+fmtShort(e.date)+'</b><small>'+inTage(tage)+'</small></div><div class="evb">'+
    '<b>'+esc(e.label)+'</b> · <a href="detail.html?id='+r.id+'">'+esc(r.kunde)+'</a> '+esc(r.fahrzeug)+' '+plate(r.kennzeichen)+' '+chip(e.x.c.status)+'<br>'+
    '<span class="mute">'+esc(e.note)+'</span></div></div>';
}
