/* Protokoll – nur der Chef: wer hat wann was geändert? */
if(requireChef()) (function(){
  var page=renderShell("protokoll.html","Protokoll","Wer hat wann was geändert oder bearbeitet.","");
  var tab=new URLSearchParams(location.search).get("t")||"mieten";

  var entries=[];
  getMieten().forEach(function(r){ r.log.forEach(function(l){ entries.push({ts:l.ts,by:l.by,r:r,text:l.text}); }); });
  entries.sort(function(a,b){ return a.ts<b.ts?1:a.ts>b.ts?-1:0; });
  var aud=getAudit().slice().reverse();

  var persons={};
  entries.forEach(function(e){ persons[e.by]=1; });
  aud.forEach(function(e){ persons[e.by]=1; });
  var names=Object.keys(persons).sort();

  page.innerHTML='<div class="filters"><div class="seg"><a href="protokoll.html?t=mieten" class="'+(tab==="mieten"?"on":"")+'">Änderungen an Mieten</a><a href="protokoll.html?t=konten" class="'+(tab==="konten"?"on":"")+'">Konten und Anmeldungen</a></div>'+
    '<label>Person<select id="fp"><option value="">Alle</option>'+names.map(function(n){ return '<option>'+esc(n)+'</option>'; }).join("")+'</select></label>'+
    '<label class="grow">Suche<input id="fq" type="search" placeholder="Text, Kunde, Kennzeichen"></label></div><div id="out"></div>';

  function paint(){
    var p=document.getElementById("fp").value, q=document.getElementById("fq").value.toLowerCase(), rows;
    if(tab==="mieten"){
      rows=entries.filter(function(e){ return (!p||e.by===p) && (e.text+" "+e.r.kunde+" "+e.r.kennzeichen).toLowerCase().indexOf(q)>-1; }).map(function(e){
        return '<tr><td>'+fmtTs(e.ts)+'</td><td><b>'+esc(e.by)+'</b></td><td><a href="detail.html?id='+e.r.id+'">'+esc(e.r.kunde)+'</a> '+plate(e.r.kennzeichen)+'</td><td style="white-space:normal">'+esc(e.text)+'</td></tr>';
      });
      document.getElementById("out").innerHTML='<div class="wrap"><table class="mid"><thead><tr><th>Zeitpunkt</th><th>Person</th><th>Miete</th><th>Aktion</th></tr></thead><tbody>'+rows.join("")+'</tbody></table>'+(rows.length?'':'<div class="panel"><div class="empty">Keine Einträge.</div></div>')+'</div>';
    } else {
      rows=aud.filter(function(e){ return (!p||e.by===p) && e.text.toLowerCase().indexOf(q)>-1; }).map(function(e){
        return '<tr><td>'+fmtTs(e.ts)+'</td><td><b>'+esc(e.by)+'</b></td><td style="white-space:normal">'+esc(e.text)+'</td></tr>';
      });
      document.getElementById("out").innerHTML='<div class="wrap"><table class="mid"><thead><tr><th>Zeitpunkt</th><th>Person</th><th>Aktion</th></tr></thead><tbody>'+rows.join("")+'</tbody></table>'+(rows.length?'':'<div class="panel"><div class="empty">Keine Einträge.</div></div>')+'</div>';
    }
  }
  document.getElementById("fp").addEventListener("change",paint);
  document.getElementById("fq").addEventListener("input",paint);
  paint();
})();
