/* Langzeitmieten = die VEX-Liste mit allen Feldern aus dem Projektauftrag (Kapitel 4) */
var DEMO_IMPORT=[
  {kunde:"Alpha Handels GmbH",kontakt:"Herr Fuchs",tel:"0664 410 00 01",gruppe:"Kleinwagen",email:"fuchs@alpha-handel.at",marke:"Avis",fahrzeug:"Renault Clio",mva:"4730001",kz:"W-410AA",s:-3,dauer:14,t:50},
  {kunde:"Beta Service e.U.",kontakt:"Frau Roth",tel:"0664 410 00 02",gruppe:"SUV",email:"roth@beta-service.at",marke:"Budget",fahrzeug:"Dacia Duster",mva:"4730002",kz:"W-411BB",s:-5,dauer:28,t:60},
  {kunde:"Gamma Consulting KG",kontakt:"Herr Winter",tel:"0664 410 00 03",gruppe:"Kompaktklasse",email:"winter@gamma-consulting.at",marke:"Avis",fahrzeug:"Peugeot 308",mva:"4730003",kz:"W-412CC",s:-3,dauer:45,t:50},
  {kunde:"Delta Bau GmbH",kontakt:"Frau Klein",tel:"0664 410 00 04",gruppe:"Kompaktklasse",email:"klein@delta-bau.at",marke:"Budget",fahrzeug:"Ford Focus",mva:"4730004",kz:"W-413DD",s:-1,dauer:90,t:70},
  {kunde:"Epsilon Pharma AG",kontakt:"Dr. Brandt",tel:"0664 410 00 05",gruppe:"Mittelklasse",email:"brandt@epsilon-pharma.at",marke:"Avis",fahrzeug:"Toyota Corolla",mva:"4730005",kz:"W-414EE",s:0,dauer:120,t:85}
];

if(requireLogin()) (function(){
  var params=new URLSearchParams(location.search);
  var page=renderShell("liste.html","Langzeitmieten","Alle laufenden Mietverträge mit Tauschtermin, Kundeninformation und Status.",
    '<button class="btn" id="imp">Demo-Import aus Mietsystem</button><a class="btn pri" href="neue-miete.html">Neue Miete erfassen</a>');

  var COLS=[
    {k:"kunde",t:"Firma",v:function(x){return x.r.kunde;},h:function(x){return '<b>'+esc(x.r.kunde)+'</b>';}},
    {k:"kontakt",t:"Ansprechperson",v:function(x){return x.r.kontakt;},h:function(x){return esc(x.r.kontakt)+'<span class="small">'+esc(x.r.tel)+'</span>';}},
    {k:"marke",t:"Marke",v:function(x){return x.r.marke;},h:function(x){return esc(x.r.marke);}},
    {k:"fahrzeug",t:"Fahrzeug",v:function(x){return x.r.fahrzeug;},h:function(x){return esc(x.r.fahrzeug)+(x.r.wechselCount?'<span class="small">'+x.r.wechselCount+'. Fahrzeug nach Tausch</span>':'');}},
    {k:"gruppe",t:"Fahrzeuggruppe",v:function(x){return x.r.gruppe;},h:function(x){return esc(x.r.gruppe);}},
    {k:"kz",t:"Kennzeichen",v:function(x){return x.r.kennzeichen;},h:function(x){return plate(x.r.kennzeichen);}},
    {k:"mva",t:"Fahrzeugnr. (MVA)",v:function(x){return x.r.mva;},h:function(x){return esc(x.r.mva);}},
    {k:"start",t:"Anmietung",v:function(x){return x.r.start;},h:function(x){return fmtDate(x.r.start);}},
    {k:"ende",t:"Geplantes Mietende",v:function(x){return x.r.ende;},h:function(x){return fmtDate(x.r.ende);}},
    {k:"dauer",t:"Mietdauer",v:function(x){return x.c.dauer;},h:function(x){return x.c.dauer+" Tage";}},
    {k:"turn",t:"Turnback",v:function(x){return x.r.turn;},h:function(x){return '<span class="'+(x.c.turnUeberf?'late':'')+'">'+fmtDate(x.r.turn)+'</span>';}},
    {k:"tausch",t:"Tauschtermin",v:function(x){return x.c.tausch;},h:function(x){return '<b class="'+(x.c.wechselUeberf?'late':'')+'">'+fmtDate(x.c.tausch)+'</b><span class="small">'+esc(x.c.grundKurz)+'</span>';}},
    {k:"mailDate",t:"E-Mail-Datum",v:function(x){return x.c.mailDate;},h:function(x){return fmtDate(x.c.mailDate);}},
    {k:"info",t:"Kundeninformation",v:function(x){return x.r.mail||"";},h:function(x){return x.r.mail?"Versendet am "+fmtDate(x.r.mail):(x.r.draft?"Entwurf bereit":"Nicht versendet");}},
    {k:"termin",t:"Gebuchter Termin",v:function(x){return x.r.booking?x.r.booking.date+x.r.booking.time:"9";},h:function(x){return x.r.booking?fmtDate(x.r.booking.date)+' '+esc(x.r.booking.time)+'<span class="small">'+esc(x.r.booking.station)+'</span>':(x.r.mail?"Noch offen":"–");}},
    {k:"status",t:"Status",v:function(x){return x.c.status;},h:function(x){return chip(x.c.status);}},
    {k:"notiz",t:"Bemerkung",v:function(x){return x.r.notiz||"";},h:function(x){var n=x.r.notiz||"";return esc(n.length>28?n.slice(0,28)+"…":n)||"–";}}
  ];
  var sortKey="tausch", sortDir=1;

  page.innerHTML='<div id="msg"></div>'+
    '<div class="filters">'+
    '<label>Zeitraum<select id="fz"><option value="">Alle Mieten</option><option value="14">Wechsel in 14 Tagen</option><option value="30">Wechsel in 30 Tagen</option></select></label>'+
    '<label>Marke<select id="fb"><option value="">Avis und Budget</option><option>Avis</option><option>Budget</option></select></label>'+
    '<label>Fahrzeuggruppe<select id="fg"><option value="">Alle Gruppen</option>'+GRUPPEN.map(function(g){ return '<option>'+g+'</option>'; }).join("")+'</select></label>'+
    '<label>Status<select id="fs"><option value="">Alle Status</option>'+STATUS_LIST.map(function(s){ return '<option>'+s+'</option>'; }).join("")+'</select></label>'+
    '<label class="grow">Suche<input id="fq" type="search" placeholder="Firma, Person, Kennzeichen, MVA, Fahrzeug"></label>'+
    '<label class="checkrow"><input type="checkbox" id="fc"> Abgeschlossene anzeigen</label></div>'+
    '<div class="wrap"><table class="wide"><thead><tr>'+COLS.map(function(c){ return '<th data-k="'+c.k+'">'+c.t+' <span class="ar"></span></th>'; }).join("")+'</tr></thead><tbody id="rows"></tbody></table>'+
    '<div class="panel"><div class="empty" id="empty" hidden>Keine Mieten gefunden. Ändere Filter oder Suche.</div></div></div>';

  document.getElementById("fq").value=params.get("q")||"";
  if(params.get("z")) document.getElementById("fz").value=params.get("z");

  function render(){
    var z=+document.getElementById("fz").value, b=document.getElementById("fb").value, s=document.getElementById("fs").value, gr=document.getElementById("fg").value,
        q=document.getElementById("fq").value.toLowerCase(), showClosed=document.getElementById("fc").checked;
    var col=COLS.filter(function(c){ return c.k===sortKey; })[0];
    var list=getAll().filter(function(x){
      var r=x.r,c=x.c;
      if(r.closed && !showClosed && s!=="Abgeschlossen") return false;
      if(z && !(c.wechselOffen && c.tage>=0 && c.tage<=z)) return false;
      if(b && r.marke!==b) return false;
      if(gr && r.gruppe!==gr) return false;
      if(s && c.status!==s) return false;
      return (r.kunde+" "+r.kontakt+" "+r.kennzeichen+" "+r.mva+" "+r.fahrzeug).toLowerCase().indexOf(q)>-1;
    }).sort(function(a,b2){
      var av=col.v(a), bv=col.v(b2);
      if(typeof av==="string") return av.localeCompare(bv,"de")*sortDir;
      return (av<bv?-1:av>bv?1:0)*sortDir;
    });
    document.querySelectorAll("th[data-k]").forEach(function(th){
      th.querySelector(".ar").textContent=th.getAttribute("data-k")===sortKey?(sortDir>0?"▲":"▼"):"";
    });
    document.getElementById("rows").innerHTML=list.map(function(x){
      return '<tr class="click" data-id="'+x.r.id+'">'+COLS.map(function(c){ return '<td>'+c.h(x)+'</td>'; }).join("")+'</tr>';
    }).join("");
    document.getElementById("empty").hidden=list.length>0;
  }
  document.querySelectorAll("th[data-k]").forEach(function(th){
    th.addEventListener("click",function(){
      var k=th.getAttribute("data-k");
      if(k===sortKey) sortDir=-sortDir; else { sortKey=k; sortDir=1; }
      render();
    });
  });
  document.getElementById("rows").addEventListener("click",function(e){
    var tr=e.target.closest("tr[data-id]"); if(tr) location.href="detail.html?id="+tr.getAttribute("data-id");
  });
  ["fz","fb","fg","fs","fc"].forEach(function(id){ document.getElementById(id).addEventListener("change",render); });
  document.getElementById("fq").addEventListener("input",render);

  // Demo: Mieten aus dem "Mietsystem" holen – nur Langzeitmieten (über 30 Tage) werden übernommen
  document.getElementById("imp").addEventListener("click",function(){
    var T=todayISO(), mieten=getMieten(), ok=[], skip=[];
    DEMO_IMPORT.forEach(function(d){
      var start=addDays(T,d.s), ende=addDays(start,d.dauer);
      if(d.dauer<=30){ skip.push(d.kunde+" ("+d.dauer+" Tage) – keine Langzeitmiete"); return; }
      if(mieten.some(function(r){ return (r.mva===d.mva || r.kennzeichen===d.kz) && !r.closed; })){ skip.push(d.kunde+" – Fahrzeug "+d.mva+" ist schon in der Liste"); return; }
      var r=blankMiete({marke:d.marke,kunde:d.kunde,kontakt:d.kontakt,email:d.email,tel:d.tel,fahrzeug:d.fahrzeug,gruppe:d.gruppe,mva:d.mva,kennzeichen:d.kz,
        start:start,ende:ende,turn:addDays(T,d.t),created:T});
      addLog(r,"Aus Mietsystem übernommen und als Langzeitmiete erkannt ("+d.dauer+" Tage)");
      mieten.push(r); ok.push(d.kunde+" – "+d.fahrzeug+" ("+d.dauer+" Tage)");
    });
    saveMieten(mieten);
    if(ok.length) audit("Demo-Import aus Mietsystem: "+ok.length+" Langzeitmieten übernommen");
    document.getElementById("msg").innerHTML='<div class="box '+(ok.length?'ok':'warn')+'"><b>'+ok.length+' von '+DEMO_IMPORT.length+' Mieten aus dem Mietsystem übernommen.</b>'+
      (ok.length?'<br>Übernommen (Langzeitmiete erkannt): '+ok.map(esc).join("; "):'')+
      (skip.length?'<br>Übersprungen: '+skip.map(esc).join("; "):'')+'</div>';
    render();
  });
  render();
})();
