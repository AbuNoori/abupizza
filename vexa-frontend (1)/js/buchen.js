/* Öffentliche Buchungsseite für den Kunden (Link aus der E-Mail, keine Anmeldung nötig) */
(function(){
  var box=document.getElementById("book");
  var token=new URLSearchParams(location.search).get("t")||"";
  var r=getMieten().filter(function(x){ return token && x.token===token; })[0];
  var head='<div class="book-head"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="#0b3d91" stroke-width="3"/><text x="21" y="41" font-family="Barlow Semi Condensed,sans-serif" font-size="25" font-weight="700" fill="#0b3d91" text-anchor="middle">V</text><text x="43" y="41" font-family="Barlow Semi Condensed,sans-serif" font-size="25" font-weight="700" fill="#ff6b00" text-anchor="middle">X</text></svg><div><span class="logo">VEXA</span><br><span class="mute">Avis &amp; Budget · Fahrzeugwechsel</span></div></div>';
  if(!r){ box.innerHTML=head+'<div class="card"><h2>Link nicht gefunden</h2><p style="margin-top:8px">Dieser Buchungslink ist ungültig. Bitte öffnen Sie den Link aus Ihrer E-Mail noch einmal oder schreiben Sie uns an '+esc(CONTACT.mail)+'.</p></div>'; return; }
  if(r.closed){ box.innerHTML=head+'<div class="card"><h2>Vorgang abgeschlossen</h2><p style="margin-top:8px">Für diese Miete ist kein Wechseltermin mehr nötig.</p></div>'; return; }

  function show(rr,done){
    var c=calcMiete(rr);
    var h=head+'<div class="card"><h2>Hallo '+esc(rr.kontakt||rr.kunde)+'</h2><p style="margin-top:6px">Bitte buchen Sie Ihren Termin für den Fahrzeugwechsel.</p>'+
      '<dl class="info"><div><dt>Firma</dt><dd>'+esc(rr.kunde)+'</dd></div><div><dt>Aktuelles Fahrzeug</dt><dd>'+esc(rr.fahrzeug)+(rr.kennzeichen?' · '+esc(rr.kennzeichen):'')+'</dd></div>'+
      '<div><dt>Neues Fahrzeug aus Gruppe</dt><dd>'+esc(rr.gruppe)+'</dd></div><div><dt>Wechsel spätestens bis</dt><dd>'+fmtDate(c.tausch)+'</dd></div></dl></div>';
    if(done){
      h+='<div class="box ok" style="margin-top:18px"><b>Ihr Termin ist gebucht.</b><br>'+esc(fmtLong(rr.booking.date))+', '+esc(rr.booking.time)+' Uhr, Station '+esc(rr.booking.station)+'.<br>Bitte bringen Sie Fahrzeugschlüssel und Fahrzeugpapiere mit. Sie können den Termin hier jederzeit ändern.</div>';
    } else if(rr.booking){
      h+='<div class="box info" style="margin-top:18px">Ihr aktueller Termin: <b>'+esc(bookingText(rr))+'</b>. Sie können unten einen anderen Termin wählen.</div>';
    }
    h+='<div id="bk" style="margin-top:18px"></div><p class="hint" style="margin-top:14px">Fragen? '+esc(CONTACT.mail)+' · '+esc(CONTACT.tel)+'</p>';
    box.innerHTML=h;
    renderBooking(document.getElementById("bk"),rr,"Kunde (Buchungsseite)",function(cur){ show(cur,true); window.scrollTo(0,0); });
  }
  show(r,false);
})();
