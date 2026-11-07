/* Kunden: Kundendaten und zugehörige Fahrzeuge (aus den Mieten zusammengestellt) */
if(requireLogin()) (function(){
  var page=renderShell("kunden.html","Kunden","Firmen mit Ansprechperson und den zugehörigen Fahrzeugen.","");
  page.innerHTML='<div class="filters"><label class="grow">Suche<input id="fq" type="search" placeholder="Firma, Ansprechperson, E-Mail"></label></div><div id="out"></div>';

  function groups(){
    var map={};
    getAll().forEach(function(x){
      var key=x.r.kunde.trim().toLowerCase();
      if(!map[key]) map[key]={name:x.r.kunde,kontakt:x.r.kontakt,email:x.r.email,tel:x.r.tel,items:[]};
      map[key].items.push(x);
    });
    return Object.keys(map).map(function(k){ return map[k]; }).sort(function(a,b){ return a.name.localeCompare(b.name,"de"); });
  }
  function paint(){
    var q=document.getElementById("fq").value.toLowerCase();
    var list=groups().filter(function(g){ return (g.name+" "+g.kontakt+" "+g.email).toLowerCase().indexOf(q)>-1; });
    document.getElementById("out").innerHTML='<div class="wrap"><table class="mid"><thead><tr><th>Firma</th><th>Ansprechperson</th><th>E-Mail</th><th>Telefon</th><th>Aktive Mieten</th><th>Fahrzeuge</th><th>Nächster Termin</th></tr></thead><tbody>'+
      list.map(function(g){
        var aktiv=g.items.filter(function(x){ return !x.r.closed; });
        var next=null;
        aktiv.forEach(function(x){ if(x.c.wechselOffen && (!next || x.c.tausch<next)) next=x.c.tausch; });
        return '<tr class="click" data-q="'+esc(g.name)+'"><td><b>'+esc(g.name)+'</b></td><td>'+esc(g.kontakt||"–")+'</td><td>'+esc(g.email||"–")+'</td><td>'+esc(g.tel||"–")+'</td>'+
          '<td>'+aktiv.length+' von '+g.items.length+'</td><td>'+g.items.map(function(x){ return x.r.kennzeichen?plate(x.r.kennzeichen):esc(x.r.fahrzeug); }).join(" ")+'</td><td>'+(next?fmtDate(next):"–")+'</td></tr>';
      }).join("")+'</tbody></table>'+(list.length?'':'<div class="panel"><div class="empty">Keine Kunden gefunden.</div></div>')+'</div>';
  }
  document.getElementById("out").addEventListener("click",function(e){
    var tr=e.target.closest("tr[data-q]"); if(tr) location.href="liste.html?q="+encodeURIComponent(tr.getAttribute("data-q"));
  });
  document.getElementById("fq").addEventListener("input",paint);
  paint();
})();
