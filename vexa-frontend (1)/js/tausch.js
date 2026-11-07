/* Fahrzeugtausch erfassen: altes Fahrzeug mit Rückgabe-Kilometerstand, neues Fahrzeug mit Übernahme-Kilometerstand.
   Der Kunde bleibt in der Liste, das alte Fahrzeug steht danach in der Fahrzeughistorie. */
var SW_ID=new URLSearchParams(location.search).get("id");
if(requireLogin()) (function(){
  var r=getMiete(SW_ID);
  if(!r||r.closed){ var p=renderShell("liste.html","Miete nicht gefunden","",""); p.innerHTML='<div class="card"><a href="liste.html">Zur Liste</a></div>'; return; }
  var T=todayISO(), c=calcMiete(r);
  var page=renderShell("liste.html","Fahrzeug tauschen",r.kunde+" · "+r.kontakt,'<a class="btn" href="detail.html?id='+r.id+'">Abbrechen</a>');
  function inp(id,label,val,type,ph){ return '<label>'+label+'<input id="'+id+'" type="'+(type||"text")+'" value="'+esc(val||"")+'"'+(ph?' placeholder="'+ph+'"':'')+'></label>'; }
  function sel(id,label,list,cur){ return '<label>'+label+'<select id="'+id+'">'+list.map(function(o){ return '<option'+(o===cur?' selected':'')+'>'+esc(o)+'</option>'; }).join("")+'</select></label>'; }

  page.innerHTML='<div class="card"><h3>Altes Fahrzeug (kommt zurück)</h3><dl class="info">'+
    '<div><dt>Modell</dt><dd>'+esc(r.fahrzeug)+'</dd></div><div><dt>Kennzeichen</dt><dd>'+plate(r.kennzeichen)+'</dd></div><div><dt>MVA</dt><dd>'+esc(r.mva)+'</dd></div>'+
    '<div><dt>Fahrzeuggruppe</dt><dd>'+esc(r.gruppe)+'</dd></div><div><dt>Beim Kunden seit</dt><dd>'+fmtDate(r.vstart||r.start)+'</dd></div>'+
    '<div><dt>Kilometerstand bei Übernahme</dt><dd>'+esc(r.kmStart||"–")+'</dd></div>'+
    (r.booking?'<div><dt>Gebuchter Termin</dt><dd>'+esc(bookingText(r))+'</dd></div>':'')+'</dl></div>'+
    '<div class="card formcard"><h3>Tausch erfassen</h3><div class="grid2" style="margin-top:10px">'+
    inp("s_date","Tauschdatum",(r.booking&&r.booking.date<=T)?r.booking.date:T,"date")+
    inp("s_kmalt","Kilometerstand bei Rückgabe des alten Fahrzeugs","","number")+
    '</div><label>Schäden oder Probleme am alten Fahrzeug (optional)<textarea id="s_dmg" rows="2" placeholder="Keine / Beschreibung"></textarea></label>'+
    '<h3 style="margin-top:8px">Neues Fahrzeug</h3><div class="grid2" style="margin-top:10px">'+
    sel("s_marke","Marke",["Avis","Budget"],r.marke)+
    inp("s_modell","Modell","","text","z. B. Ford Focus")+
    sel("s_gruppe","Fahrzeuggruppe",GRUPPEN,r.gruppe)+
    inp("s_mva","Fahrzeugnummer (MVA)","")+
    inp("s_kz","Kennzeichen","","text","z. B. W-123AB")+
    inp("s_kmneu","Kilometerstand bei Übernahme","","number")+
    inp("s_turn","Turnback-Datum des neuen Fahrzeugs","","date")+
    '</div><div id="s_warn"></div><div id="nm"></div>'+
    '<p class="hint">Danach bleibt der Kunde in der Liste. Für das neue Fahrzeug wird der Wechsel wieder neu berechnet (60 Tage, spätestens 90 Tage, früher bei Turnback). Das alte Fahrzeug steht in der Fahrzeughistorie.</p>'+
    '<div class="row"><button class="btn pri" id="save">Tausch speichern</button></div></div>';

  function warn(){
    var g=document.getElementById("s_gruppe").value;
    document.getElementById("s_warn").innerHTML=g!==r.gruppe?'<div class="box warn">Das neue Fahrzeug ist aus einer anderen Fahrzeuggruppe ('+esc(g)+') als bisher ('+esc(r.gruppe)+').</div>':'';
  }
  document.getElementById("s_gruppe").addEventListener("change",warn);

  document.getElementById("save").addEventListener("click",function(){
    function g(id){ return document.getElementById(id).value.trim(); }
    var m=document.getElementById("nm"); m.className="box bad";
    var date=g("s_date"), kmAlt=g("s_kmalt"), kmNeu=g("s_kmneu"), mva=g("s_mva"), kz=g("s_kz").toUpperCase(), modell=g("s_modell"), turn=g("s_turn");
    if(!date||kmAlt===""||kmNeu===""||!mva||!kz||!modell||!turn){ m.textContent="Bitte alle Felder ausfüllen (nur die Schäden sind freiwillig)."; return; }
    if(date>T){ m.textContent="Das Tauschdatum darf nicht in der Zukunft liegen. Der Tausch wird erst eingetragen, wenn er passiert ist."; return; }
    if(date<(r.vstart||r.start)){ m.textContent="Das Tauschdatum liegt vor der Anmietung des alten Fahrzeugs."; return; }
    if(isNaN(+kmAlt)||isNaN(+kmNeu)||+kmAlt<0||+kmNeu<0){ m.textContent="Die Kilometerstände müssen Zahlen sein."; return; }
    if(r.kmStart!==""&&+kmAlt<+r.kmStart){ m.textContent="Der Rückgabe-Kilometerstand ("+kmAlt+") ist kleiner als bei der Übernahme ("+r.kmStart+")."; return; }
    if(turn<=date){ m.textContent="Das Turnback-Datum des neuen Fahrzeugs muss nach dem Tauschdatum liegen."; return; }
    var others=getMieten().filter(function(x){ return x.id!=r.id && !x.closed; });
    if(mva===r.mva || others.some(function(x){ return x.mva===mva; })){ m.textContent="Die Fahrzeugnummer (MVA) "+mva+" ist schon vergeben."; return; }
    if(kz===r.kennzeichen || others.some(function(x){ return x.kennzeichen && x.kennzeichen.toUpperCase()===kz; })){ m.textContent="Das Kennzeichen "+kz+" ist schon vergeben."; return; }

    var u=currentUser(), cur=getMiete(r.id);
    var neuTxt=modell+" ("+kz+")";
    cur.history=cur.history||[];
    cur.history.push({marke:cur.marke,fahrzeug:cur.fahrzeug,gruppe:cur.gruppe,mva:cur.mva,kennzeichen:cur.kennzeichen,von:cur.vstart||cur.start,bis:date,
      kmStart:cur.kmStart,kmEnd:kmAlt,schaeden:g("s_dmg")||"Keine Angaben",by:u.name,neu:neuTxt,termin:cur.booking?bookingText(cur):""});
    var alt=cur.fahrzeug+" ("+(cur.kennzeichen||"MVA "+cur.mva)+")";
    cur.marke=g("s_marke"); cur.fahrzeug=modell; cur.gruppe=g("s_gruppe"); cur.mva=mva; cur.kennzeichen=kz; cur.kmStart=kmNeu;
    cur.vstart=date; cur.turn=turn; cur.lastWechsel=date; cur.wechselBy=u.name; cur.wechselCount=(cur.wechselCount||0)+1;
    cur.mail=null; cur.mailTs=null; cur.mailBy=null; cur.draft=null; cur.booking=null; cur.token=newToken();
    addLog(cur,"Fahrzeugtausch durchgeführt: "+alt+" (Rückgabe bei "+kmAlt+" km) gegen "+neuTxt+" (Übernahme bei "+kmNeu+" km). Neues Turnback-Datum "+fmtDate(turn));
    updateMiete(cur);
    location.href="detail.html?id="+cur.id;
  });
})();
