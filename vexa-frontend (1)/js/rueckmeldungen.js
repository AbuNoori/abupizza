/* Rückmeldungen: E-Mail gesendet? Termin gebucht? Tausch/Turnback durchgeführt? */
if(requireLogin()) (function(){
  var page=renderShell("rueckmeldungen.html","Rückmeldungen","Wer hat welche E-Mail gesendet, welche Termine haben die Kunden gebucht und was wurde durchgeführt.","");
  var all=getAll();

  var mails=all.filter(function(x){ return x.r.mail; }).sort(function(a,b){ return (b.r.mailTs||b.r.mail)<(a.r.mailTs||a.r.mail)?-1:1; });
  var buchungen=all.filter(function(x){ return x.r.booking; }).sort(function(a,b){ return b.r.booking.at<a.r.booking.at?-1:1; });
  var done=[];
  all.forEach(function(x){
    (x.r.history||[]).forEach(function(e){ done.push({date:e.bis,art:"Fahrzeugtausch",by:e.by,x:x,e:e}); });
    if(x.r.turnDone) done.push({date:x.r.turnDone,art:"Turnback",by:x.r.turnBy,x:x});
  });
  done.sort(function(a,b){ return b.date<a.date?-1:1; });

  function tbl(head,rows,empty){
    return '<div class="wrap"><table class="mid"><thead><tr>'+head.map(function(h){ return '<th>'+h+'</th>'; }).join("")+'</tr></thead><tbody>'+rows.join("")+'</tbody></table>'+
      (rows.length?'':'<div class="panel"><div class="empty">'+empty+'</div></div>')+'</div>';
  }
  page.innerHTML=
    '<h2 style="margin-bottom:12px">Gesendete Kunden-E-Mails</h2>'+
    tbl(["Gesendet am","Gesendet von","Kunde","An","Fahrzeug","Termin"],mails.map(function(x){
      var r=x.r;
      return '<tr><td>'+(r.mailTs?fmtTs(r.mailTs):fmtDate(r.mail))+'</td><td>'+esc(r.mailBy||"–")+'</td><td>'+custLink(r)+'</td><td>'+esc(r.email)+'</td><td>'+esc(r.fahrzeug)+' '+plate(r.kennzeichen)+'</td>'+
        '<td>'+(r.booking?'<span class="chip c-ok">Gebucht</span>':'<span class="chip c-warn">Noch offen</span>')+'</td></tr>';
    }),"Noch keine E-Mail versendet.")+
    '<h2 style="margin:28px 0 12px">Gebuchte Termine der Kunden</h2>'+
    tbl(["Gebucht am","Kunde","Termin","Standort","Gebucht von","Bemerkung"],buchungen.map(function(x){
      var r=x.r, b=r.booking;
      return '<tr><td>'+fmtTs(b.at)+'</td><td>'+custLink(r)+'</td><td>'+fmtDate(b.date)+' '+esc(b.time)+'</td><td>'+esc(b.station)+'</td><td>'+esc(b.by||"–")+'</td><td>'+esc(b.bemerkung||"–")+'</td></tr>';
    }),"Noch kein Termin gebucht.")+
    '<h2 style="margin:28px 0 12px">Durchgeführt</h2>'+
    tbl(["Datum","Art","Kunde","Fahrzeug","Km Rückgabe","Schäden","Eingetragen von"],done.map(function(d){
      var r=d.x.r;
      return '<tr><td>'+fmtDate(d.date)+'</td><td>'+d.art+'</td><td>'+custLink(r)+'</td><td>'+(d.e?esc(d.e.fahrzeug)+' '+plate(d.e.kennzeichen)+'</td><td>'+esc(d.e.kmEnd||"–")+'</td><td style="white-space:normal">'+esc(d.e.schaeden||"–"):esc(r.fahrzeug)+' '+plate(r.kennzeichen)+'</td><td>–</td><td>–')+'</td><td>'+esc(d.by||"–")+'</td></tr>';
    }),"Noch nichts durchgeführt.");
})();
