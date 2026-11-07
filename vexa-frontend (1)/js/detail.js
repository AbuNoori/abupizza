/* Detailseite einer Miete: alle Daten, E-Mail, Termin, Fahrzeughistorie, Verlauf */
var DETAIL_ID=new URLSearchParams(location.search).get("id");
if(requireLogin()) paint();

function paint(){
  var r=getMiete(DETAIL_ID);
  if(!r){
    var p=renderShell("liste.html","Miete nicht gefunden","","");
    p.innerHTML='<div class="card">Diese Miete gibt es nicht (mehr). <a href="liste.html">Zur Liste der Langzeitmieten</a></div>';
    return;
  }
  var c=calcMiete(r), chef=isChef(), si=stepIndex(r,c), id=r.id;
  var page=renderShell("liste.html",r.kunde,r.kontakt+" · "+r.fahrzeug+(r.kennzeichen?" · "+r.kennzeichen:""),'<a class="btn" href="liste.html">Zur Liste</a>');
  var h='';

  // 1) Fortschritt
  h+='<div class="card"><div style="margin-bottom:12px">'+chip(c.status)+(r.wechselCount?' <span class="mute">· '+r.wechselCount+' Fahrzeugtausch'+(r.wechselCount>1?'e':'')+' bisher</span>':'')+'</div><div class="steps">'+STEPS.map(function(s,i){
    return '<span class="step '+(i<si?'done':i===si?'cur':'')+'">'+(i+1)+'. '+s+'</span>';
  }).join("")+'</div></div>';

  // 2) Daten + Aktionen
  var info=[["Firma",esc(r.kunde)],["Ansprechperson",esc(r.kontakt||"–")],["E-Mail",esc(r.email||"–")],["Telefon",esc(r.tel||"–")],
    ["Marke",esc(r.marke)],["Fahrzeugmodell",esc(r.fahrzeug)],["Fahrzeuggruppe",esc(r.gruppe)],["Fahrzeugnummer (MVA)",esc(r.mva)],["Kennzeichen",plate(r.kennzeichen)],
    ["Kilometerstand bei Übernahme",esc(r.kmStart||"–")],["Anmietungsdatum",fmtDate(r.start)],["Geplantes Mietende",fmtDate(r.ende)],["Mietdauer bisher",c.dauer+" Tage"],
    ["Aktuelles Fahrzeug seit",fmtDate(r.vstart||r.start)+' ('+c.fzTage+' Tage)'],
    ["Turnback-Datum",'<span class="'+(c.turnUeberf?'late':'')+'">'+fmtDate(r.turn)+'</span>'+(r.turnDone?' (erledigt '+fmtDate(r.turnDone)+')':'')],
    ["Geplanter Tauschtermin",'<b class="'+(c.wechselUeberf?'late':'')+'">'+fmtDate(c.tausch)+'</b> ('+inTage(c.tage)+')'],
    ["Berechnet nach",esc(c.grund)],["Spätestens bis",fmtDate(c.spaet)],["E-Mail-Datum (14 Tage vorher)",fmtDate(c.mailDate)],
    ["Kundeninformation",r.mail?'Versendet am '+(r.mailTs?fmtTs(r.mailTs):fmtDate(r.mail)):(r.draft?'Entwurf bereit seit '+fmtDate(r.draft):'Noch nicht versendet')],
    ["Gebuchter Termin",r.booking?esc(bookingText(r)):'Noch nicht gebucht']];
  h+='<div class="cols" style="margin-top:18px"><div class="card"><h3>Mietdaten</h3><dl class="info">'+
    info.map(function(p){ return '<div><dt>'+p[0]+'</dt><dd>'+p[1]+'</dd></div>'; }).join("")+'</dl></div>';

  h+='<div class="card"><h3>Aktionen</h3><div class="row">';
  if(c.wechselOffen) h+='<a class="btn pri" href="tausch.html?id='+id+'">Fahrzeug tauschen</a>';
  if(c.wechselOffen) h+='<a class="btn" href="formular.html?id='+id+'">'+(r.booking?'Termin ändern':'Termin für Kunden buchen')+'</a>';
  if(c.turnOffen) h+='<button class="btn" data-act="turn">Turnback durchgeführt</button>';
  h+='<button class="btn" data-act="ics">Termine für Outlook (.ics)</button>';
  h+='<a class="btn" href="edit.html?id='+id+'">Mietdaten bearbeiten</a>';
  if(chef) h+='<button class="btn red" data-act="del">Miete löschen</button>';
  h+='</div><p class="hint" style="margin-top:12px">„Fahrzeug tauschen“ trägt den Kilometerstand des alten Fahrzeugs und das neue Fahrzeug ein. Der Kunde bleibt danach in der Liste. „Turnback durchgeführt“ beendet den Vorgang endgültig.</p>';
  if(r.lastWechsel) h+='<p class="hint" style="margin-top:8px">Letzter Tausch am '+fmtDate(r.lastWechsel)+' durch '+esc(r.wechselBy||"–")+'.</p>';
  h+='</div></div>';

  // 3) Kunden-E-Mail mit Kalender-Link
  h+='<div class="card"><h3>Kunden-E-Mail mit Kalender-Link</h3>';
  if(r.booking){
    h+='<div class="box ok">Termin gebucht: <b>'+esc(bookingText(r))+'</b><br>Gebucht von '+esc(r.booking.by)+' am '+fmtTs(r.booking.at)+(r.booking.bemerkung?'<br>Bemerkung: '+esc(r.booking.bemerkung):'')+'</div>';
  }
  if(r.mail){
    h+='<div class="box ok">E-Mail versendet von <b>'+esc(r.mailBy||"–")+'</b> am '+(r.mailTs?fmtTs(r.mailTs):fmtDate(r.mail))+' an '+esc(r.email)+'.</div>'+
      '<div class="row"><a class="btn" href="'+esc(bookingUrl(r))+'" target="_blank" rel="noopener">Buchungsseite des Kunden ansehen</a><button class="btn" data-act="copy">Link kopieren</button></div>';
  } else if(!r.email){
    h+='<div class="box warn">Für diese Miete ist keine E-Mail-Adresse gespeichert. Trage sie unter „Mietdaten bearbeiten“ nach.</div>';
  } else if(!r.booking){
    if(r.draft) h+='<div class="box info">Dieser Entwurf wurde am '+fmtDate(r.draft)+' automatisch vorbereitet. Prüfe ihn und sende ihn ab.</div>';
    else if(todayISO()<c.mailDate) h+='<div class="box info">Laut Regel wird der Kunde erst ab '+fmtDate(c.mailDate)+' informiert. Du kannst die E-Mail aber schon jetzt senden.</div>';
    h+='<pre class="mail">An: '+esc(r.email)+'\nBetreff: '+esc(mailSubject(r,c))+'\n\n'+esc(mailBody(r,c))+'</pre>'+
      '<div class="row"><a class="btn pri" href="'+esc(mailtoLink(r,c))+'">1. In Outlook / Mail-Programm öffnen</a>'+
      '<button class="btn" data-act="copy">Link kopieren</button>'+
      '<button class="btn" data-act="sent">2. Als versendet eintragen</button></div>'+
      '<p class="hint" style="margin-top:10px">Ein Browser kann keine E-Mails selbst verschicken. Du sendest sie in Outlook ab und trägst sie danach hier als versendet ein – so ist dokumentiert, wer sie wann gesendet hat. Der Kunde bucht über den Link selbst einen Termin im gemeinsamen Kalender.</p>';
  }
  h+='</div>';

  // 4) Fahrzeughistorie
  var hist=(r.history||[]);
  h+='<div class="card"><h3>Fahrzeughistorie</h3><div class="wrap" style="margin-top:12px"><table class="mid"><thead><tr><th>Fahrzeug</th><th>Kennzeichen</th><th>MVA</th><th>Gruppe</th><th>Von</th><th>Bis</th><th>Km Übernahme</th><th>Km Rückgabe</th><th>Gefahren</th><th>Schäden</th><th>Ersetzt durch</th></tr></thead><tbody>'+
    hist.map(function(e){
      var km=(e.kmStart!==""&&e.kmStart!=null&&e.kmEnd!=="")?(+e.kmEnd-+e.kmStart)+" km":"–";
      return '<tr><td>'+esc(e.fahrzeug)+'</td><td>'+plate(e.kennzeichen)+'</td><td>'+esc(e.mva)+'</td><td>'+esc(e.gruppe)+'</td><td>'+fmtDate(e.von)+'</td><td>'+fmtDate(e.bis)+'</td><td>'+esc(e.kmStart||"–")+'</td><td>'+esc(e.kmEnd)+'</td><td>'+km+'</td><td style="white-space:normal">'+esc(e.schaeden||"–")+'</td><td>'+esc(e.neu)+'</td></tr>';
    }).join("")+
    '<tr><td><b>'+esc(r.fahrzeug)+'</b></td><td>'+plate(r.kennzeichen)+'</td><td>'+esc(r.mva)+'</td><td>'+esc(r.gruppe)+'</td><td>'+fmtDate(r.vstart||r.start)+'</td><td><span class="chip c-blue">aktuell</span></td><td>'+esc(r.kmStart||"–")+'</td><td>–</td><td>–</td><td>–</td><td>–</td></tr>'+
    '</tbody></table></div>'+(hist.length?'':'<p class="hint" style="margin-top:10px">Noch kein Fahrzeugtausch. Nach dem ersten Tausch steht hier das alte Fahrzeug.</p>')+'</div>';

  // 5) Bemerkung + Verlauf
  h+='<div class="cols" style="margin-top:18px"><div class="card"><h3>Bemerkung</h3>'+
    '<label style="margin-top:10px">Freies Feld für zusätzliche Informationen<textarea id="note" rows="5">'+esc(r.notiz||"")+'</textarea></label>'+
    '<button class="btn pri" data-act="note">Bemerkung speichern</button></div>'+
    '<div class="card"><h3>Verlauf – wer hat was gemacht</h3><ul class="hist">'+
    r.log.slice().reverse().map(function(l){ return '<li>'+esc(l.text)+'<small>'+fmtTs(l.ts)+' · '+esc(l.by)+'</small></li>'; }).join("")+'</ul></div></div>';

  page.innerHTML=h;
  page.onclick=function(e){
    var act=e.target.getAttribute("data-act"); if(!act) return;
    var m=getMiete(id), cc=calcMiete(m), u=currentUser();
    if(act==="sent"){
      if(!confirm("Hast du die E-Mail an "+m.email+" wirklich versendet?")) return;
      m.mail=todayISO(); m.mailTs=nowTs(); m.mailBy=u.name;
      addLog(m,"Kunden-E-Mail mit Kalender-Link an "+m.email+" versendet"); updateMiete(m); paint();
    }
    if(act==="copy"){ try{ navigator.clipboard.writeText(bookingUrl(m)); e.target.textContent="Link kopiert"; }catch(x){ e.target.textContent="Kopieren nicht möglich"; } }
    if(act==="turn" && confirm("Turnback wirklich als durchgeführt eintragen? Das Fahrzeug geht endgültig zurück und der Vorgang wird abgeschlossen.")){ markTurnDone(id); paint(); }
    if(act==="ics"){
      var evs=icsEventsOf(eventsFor([{r:m,c:cc}],true));
      if(!evs.length){ alert("Keine offenen Termine für den Export."); return; }
      downloadFile("Termine_"+(m.kennzeichen||m.mva)+".ics",icsBuild(evs),"text/calendar");
      addLog(m,"Termine als .ics für Outlook exportiert"); updateMiete(m); paint();
    }
    if(act==="note"){
      m.notiz=document.getElementById("note").value.trim(); addLog(m,"Bemerkung geändert"); updateMiete(m); paint();
    }
    if(act==="del" && isChef() && confirm("Diese Miete wirklich endgültig löschen?")){
      audit("Miete gelöscht: "+m.kunde+" ("+kzOrMva(m)+")"); deleteMiete(id); location.href="liste.html";
    }
  };
}
