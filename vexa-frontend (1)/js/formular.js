/* Termin für einen Kunden eintragen (z. B. wenn er anruft). Gleicher Kalender wie auf der Buchungsseite. */
var FORM_ID=new URLSearchParams(location.search).get("id");
if(requireLogin()) (function(){
  var r=getMiete(FORM_ID);
  if(!r){ var p=renderShell("liste.html","Miete nicht gefunden","",""); p.innerHTML='<div class="card"><a href="liste.html">Zur Liste</a></div>'; return; }
  var c=calcMiete(r), u=currentUser();
  var page=renderShell("liste.html","Termin für Kunden buchen",r.kunde+" · "+r.fahrzeug+" · Wechsel spätestens "+fmtDate(c.tausch),'<a class="btn" href="detail.html?id='+r.id+'">Abbrechen</a>');
  renderBooking(page,r,u.name+" (für den Kunden)",function(cur){ location.href="detail.html?id="+cur.id; });
})();
