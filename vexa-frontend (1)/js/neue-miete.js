/* Neue Miete erfassen – mit Prüfung "Langzeitmiete?" (Regel 1) und Vorschau der Termine */
if(requireLogin()) (function(){
  var T=todayISO();
  var page=renderShell("liste.html","Neue Miete erfassen","Nur Mieten über 30 Tage kommen in die VEX-Liste.",'<a class="btn" href="liste.html">Abbrechen</a>');
  page.innerHTML='<div class="card formcard">'+fieldsHTML({marke:"Avis",start:T},false)+
    '<label>Bemerkung (optional)<textarea id="f_notiz" rows="2"></textarea></label>'+
    '<div id="pv"></div><div id="nm"></div><div class="row"><button class="btn pri" id="ns">Prüfen und speichern</button></div></div>';

  function pv(){ document.getElementById("pv").innerHTML=previewHTML(readFields()); }
  ["f_start","f_ende","f_turn"].forEach(function(id){ document.getElementById(id).addEventListener("input",pv); });

  document.getElementById("ns").addEventListener("click",function(){
    var v=readFields(), m=document.getElementById("nm"), err=validateFields(v,null);
    if(err){ m.className="box bad"; m.textContent=err; return; }
    var days=diffDays(v.start,v.ende);
    var r=blankMiete({marke:v.marke,kunde:v.kunde,kontakt:v.kontakt,email:v.email,tel:v.tel,fahrzeug:v.fahrzeug,gruppe:v.gruppe,mva:v.mva,kennzeichen:"",kmStart:v.kmStart,
      start:v.start,ende:v.ende,turn:v.turn,created:T,notiz:document.getElementById("f_notiz").value.trim()});
    addLog(r,"Miete erfasst und als Langzeitmiete erkannt ("+days+" Tage)");
    var all=getMieten(); all.push(r); saveMieten(all);
    location.href="detail.html?id="+r.id;
  });
})();
