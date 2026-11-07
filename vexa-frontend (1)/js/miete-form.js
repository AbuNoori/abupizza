/* Gemeinsame Bausteine für "Neue Miete" und "Mietdaten bearbeiten" */
function fieldsHTML(v,withKz){
  function inp(id,label,val,type,ph){ return '<label>'+label+'<input id="'+id+'" type="'+(type||"text")+'" value="'+esc(val||"")+'"'+(ph?' placeholder="'+ph+'"':'')+'></label>'; }
  function sel(id,label,list,cur){ return '<label>'+label+'<select id="'+id+'">'+list.map(function(o){ return '<option'+(o===cur?' selected':'')+'>'+esc(o)+'</option>'; }).join("")+'</select></label>'; }
  return '<h3>1. Kunde (Ansprechperson bei der Firma)</h3><div class="grid2" style="margin-top:10px">'+
    inp("f_kunde","Firmenname",v.kunde)+
    inp("f_kontakt","Name der Ansprechperson",v.kontakt)+
    inp("f_email","E-Mail-Adresse der Ansprechperson",v.email,"email","name@firma.at")+
    inp("f_tel","Telefonnummer der Ansprechperson",v.tel,"tel")+
    '</div><h3 style="margin-top:12px">2. Fahrzeug und Mietzeit</h3><div class="grid2" style="margin-top:10px">'+
    sel("f_marke","Marke",["Avis","Budget"],v.marke)+
    inp("f_fahrzeug","Fahrzeugmodell",v.fahrzeug,"text","z. B. VW Golf")+
    sel("f_gruppe","Fahrzeuggruppe",GRUPPEN,v.gruppe||"Kompaktklasse")+
    inp("f_mva","Fahrzeugnummer (MVA)",v.mva)+
    (withKz?inp("f_kz","Kennzeichen (kann auch später eingetragen werden)",v.kennzeichen,"text","z. B. W-123AB"):'')+
    inp("f_km","Kilometerstand bei Übernahme",v.kmStart,"number")+
    inp("f_start","Anmietungsdatum (Start)",v.start,"date")+
    inp("f_ende","Geplantes Mietende",v.ende,"date")+
    inp("f_turn","Turnback-Datum (Rückgabe an Händler)",v.turn,"date")+
    '</div>';
}
function readFields(){
  function g(id){ var e=document.getElementById(id); return e?e.value.trim():null; }
  var kz=g("f_kz");
  var o={marke:g("f_marke"),kunde:g("f_kunde"),kontakt:g("f_kontakt"),email:g("f_email"),tel:g("f_tel"),fahrzeug:g("f_fahrzeug"),gruppe:g("f_gruppe"),
    mva:g("f_mva"),kmStart:g("f_km"),start:g("f_start"),ende:g("f_ende"),turn:g("f_turn")};
  if(kz!==null) o.kennzeichen=kz.toUpperCase();
  return o;
}
function validateFields(v,ignoreId){
  if(!v.kunde||!v.kontakt||!v.email||!v.tel||!v.fahrzeug||!v.gruppe||!v.mva||!v.start||!v.ende||!v.turn) return "Bitte alle Felder ausfüllen: Firma, Name, E-Mail, Telefon, Modell, Fahrzeuggruppe, MVA, Start, Ende und Turnback-Datum.";
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) return "Die E-Mail-Adresse sieht nicht richtig aus (Beispiel: name@firma.at).";
  if(v.tel.replace(/\D/g,"").length<6) return "Die Telefonnummer sieht nicht richtig aus.";
  var days=diffDays(v.start,v.ende);
  if(days<=30) return "Keine Langzeitmiete: Die Miete dauert nur "+days+" Tage. Nur Mieten über 30 Tage kommen in die VEX-Liste (Regel 1).";
  if(v.turn<v.start) return "Das Turnback-Datum darf nicht vor der Anmietung liegen.";
  if(v.kmStart!==""&&v.kmStart!==null&&(isNaN(+v.kmStart)||+v.kmStart<0)) return "Der Kilometerstand muss eine Zahl sein.";
  var open=getMieten().filter(function(r){ return r.id!=ignoreId && !r.closed; });
  if(open.some(function(r){ return r.mva===v.mva; })) return "Die Fahrzeugnummer (MVA) "+v.mva+" ist schon in einer laufenden Miete eingetragen.";
  if(v.kennzeichen && open.some(function(r){ return r.kennzeichen && r.kennzeichen.toUpperCase()===v.kennzeichen; })) return "Das Kennzeichen "+v.kennzeichen+" ist schon in einer laufenden Miete eingetragen.";
  return "";
}
function previewHTML(v){
  if(!v.start||!v.ende||!v.turn) return "";
  var days=diffDays(v.start,v.ende);
  if(days<=30) return '<div class="box warn">Mietdauer '+days+' Tage – <b>keine Langzeitmiete</b> (es müssen mehr als 30 Tage sein).</div>';
  var c=calcMiete({start:v.start,ende:v.ende,turn:v.turn,vstart:v.vstart});
  return '<div class="box info"><b>Langzeitmiete erkannt</b> ('+days+' Tage). Tauschtermin: <b>'+fmtDate(c.tausch)+'</b> ('+esc(c.grund)+'), spätestens bis '+fmtDate(c.spaet)+'. Kunden-E-Mail am <b>'+fmtDate(c.mailDate)+'</b>.</div>';
}
