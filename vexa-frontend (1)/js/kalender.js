/* Kalender fürs Team: alle gebuchten Wechsel auf einen Blick (gleiche Daten wie der Kunden-Kalender) */
if(requireLogin()) (function(){
  var params=new URLSearchParams(location.search);
  var w=parseInt(params.get("w")||"0",10)||0, st=params.get("s")||"";
  var T=todayISO(), ws=addDays(mondayOf(T),w*7);
  var page=renderShell("kalender.html","Kalender","Welcher Kunde kommt wann zum Fahrzeugwechsel. Das ist derselbe Kalender, in dem die Kunden ihre Termine buchen.","");

  var all=getAll().filter(function(x){ return !x.r.closed && x.r.booking; });
  function link(nw,ns){ return 'kalender.html?w='+nw+(ns?'&s='+encodeURIComponent(ns):''); }
  var days=[0,1,2,3,4].map(function(i){ return addDays(ws,i); });
  var cnt=0;
  var cols=days.map(function(d){
    var list=all.filter(function(x){ return x.r.booking.date===d && (!st||x.r.booking.station===st); }).sort(function(a,b){ return a.r.booking.time<b.r.booking.time?-1:1; });
    cnt+=list.length;
    return '<div class="calday'+(d===T?' today':'')+'"><div class="caldh"><b>'+fmtShort(d)+'</b><small>'+(list.length?list.length+' Termin'+(list.length>1?'e':''):'frei')+'</small></div>'+
      (list.length?list.map(function(x){
        var r=x.r;
        return '<a class="calev" href="detail.html?id='+r.id+'"><b>'+esc(r.booking.time)+'</b> · '+esc(r.kunde)+'<br><span class="mute">'+esc(r.kontakt)+' · '+esc(r.fahrzeug)+'</span><br><span class="mute">'+esc(r.booking.station)+' · '+esc(r.gruppe)+'</span></a>';
      }).join(""):'<div class="mute" style="padding:8px 2px">Keine Termine</div>')+'</div>';
  }).join("");

  var offen=getAll().filter(function(x){ return !x.r.closed && !x.r.booking && x.r.mail; });
  page.innerHTML='<div class="filters"><div class="seg"><a href="'+link(w-1,st)+'">‹ Woche</a><a class="on" href="'+link(0,st)+'">Heute</a><a href="'+link(w+1,st)+'">Woche ›</a></div>'+
    '<label>Station<select id="fs"><option value="">Alle Stationen</option>'+STATIONEN.map(function(s){ return '<option'+(s===st?' selected':'')+'>'+esc(s)+'</option>'; }).join("")+'</select></label>'+
    '<div style="align-self:center"><b>'+fmtDate(ws)+' bis '+fmtDate(days[4])+'</b> · '+cnt+' Termin'+(cnt===1?'':'e')+'</div></div>'+
    '<div class="calweek">'+cols+'</div>'+
    '<h2 style="margin:26px 0 12px">E-Mail gesendet, Termin noch nicht gebucht ('+offen.length+')</h2>'+
    (offen.length?'<div class="wrap"><table class="mid"><thead><tr><th>Firma</th><th>Ansprechperson</th><th>Fahrzeug</th><th>E-Mail gesendet</th><th>Wechsel spätestens</th></tr></thead><tbody>'+
      offen.map(function(x){ var r=x.r; return '<tr class="click" data-id="'+r.id+'"><td><b>'+esc(r.kunde)+'</b></td><td>'+esc(r.kontakt)+'</td><td>'+esc(r.fahrzeug)+'</td><td>'+fmtDate(r.mail)+'</td><td class="'+(x.c.wechselUeberf?'late':'')+'">'+fmtDate(x.c.tausch)+'</td></tr>'; }).join("")+'</tbody></table></div>':
      '<div class="panel"><div class="empty">Alle informierten Kunden haben einen Termin gebucht.</div></div>');
  document.getElementById("fs").addEventListener("change",function(){ location.href=link(w,this.value); });
  page.addEventListener("click",function(e){ var tr=e.target.closest("tr[data-id]"); if(tr) location.href="detail.html?id="+tr.getAttribute("data-id"); });
})();
