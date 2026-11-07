/* Mietdaten bearbeiten – Tauschtermin, Mietdauer und Status werden danach automatisch neu berechnet */
var EDIT_ID=new URLSearchParams(location.search).get("id");
if(requireLogin()) (function(){
  var r=getMiete(EDIT_ID);
  if(!r){ var p=renderShell("liste.html","Miete nicht gefunden","",""); p.innerHTML='<div class="card"><a href="liste.html">Zur Liste</a></div>'; return; }
  var page=renderShell("liste.html","Mietdaten bearbeiten",r.kunde+" · "+kzOrMva(r),'<a class="btn" href="detail.html?id='+r.id+'">Abbrechen</a>');
  page.innerHTML='<div class="card formcard">'+fieldsHTML(r,true)+'<div id="pv"></div><div id="nm"></div>'+
    '<p class="hint">Tauschtermin und Status werden nach dem Speichern automatisch neu berechnet. Bereits versendete E-Mails bleiben als versendet markiert.</p>'+
    '<div class="row"><button class="btn pri" id="ns">Speichern und neu berechnen</button></div></div>';

  function pv(){ var v=readFields(); v.vstart=r.vstart; document.getElementById("pv").innerHTML=previewHTML(v); }
  ["f_start","f_ende","f_turn"].forEach(function(id){ document.getElementById(id).addEventListener("input",pv); });
  pv();

  var LABEL={marke:"Marke",kunde:"Firma",kontakt:"Ansprechperson",email:"E-Mail",tel:"Telefon",fahrzeug:"Modell",gruppe:"Fahrzeuggruppe",mva:"MVA",kmStart:"Km-Stand Übernahme",kennzeichen:"Kennzeichen",start:"Anmietung",ende:"Mietende",turn:"Turnback"};
  document.getElementById("ns").addEventListener("click",function(){
    var v=readFields(), m=document.getElementById("nm"), err=validateFields(v,r.id);
    if(err){ m.className="box bad"; m.textContent=err; return; }
    var cur=getMiete(r.id), oldTausch=calcMiete(cur).tausch, changes=[];
    Object.keys(LABEL).forEach(function(k){
      if((cur[k]||"")!==v[k]){
        var isDate=(k==="start"||k==="ende"||k==="turn");
        changes.push(LABEL[k]+": "+(isDate?fmtDate(cur[k]):(cur[k]||"–"))+" → "+(isDate?fmtDate(v[k]):(v[k]||"–")));
        cur[k]=v[k];
      }
    });
    if(!changes.length){ location.href="detail.html?id="+r.id; return; }
    var newTausch=calcMiete(cur).tausch;
    var txt="Mietdaten aktualisiert ("+changes.join("; ")+") – Tauschtermin und Status automatisch neu berechnet";
    if(cur.mail && newTausch!==oldTausch) txt+=". Achtung: Der Kunde wurde schon informiert, der Tauschtermin hat sich geändert ("+fmtDate(oldTausch)+" → "+fmtDate(newTausch)+") – Kunde erneut informieren";
    addLog(cur,txt); updateMiete(cur);
    location.href="detail.html?id="+r.id;
  });
})();
