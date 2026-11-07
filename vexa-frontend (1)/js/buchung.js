/* Terminbuchung im gemeinsamen Kalender.
   Wird vom Kunden (buchen.html, per Link) und vom Team (formular.html) benutzt.
   Wer bucht, sieht nur freie und belegte Zeiten, keine Namen anderer Kunden. */
function renderBooking(box,r,by,onDone){
  var T=todayISO(), c=calcMiete(r);
  var first=addDays(T,1);
  var last=c.tausch<addDays(T,14)?addDays(T,14):c.tausch;   // ist die Frist schon vorbei, bieten wir die nächsten 14 Tage an
  var station=(r.booking&&r.booking.station)||STATIONEN[0];
  var firstWork=first; while(!isWorkday(firstWork)) firstWork=addDays(firstWork,1);
  var weekStart=mondayOf(r.booking&&r.booking.date>=first?r.booking.date:firstWork);
  var sel=r.booking&&r.booking.date>=first?{date:r.booking.date,time:r.booking.time}:null;

  box.innerHTML='<div class="card formcard"><h3>Gemeinsamer Kalender</h3>'+
    '<p class="hint" style="margin:6px 0 12px">Wähle Station, Tag und Uhrzeit. Pro Zeit und Station gibt es '+SLOT_CAP+' Plätze. Grau markierte Zeiten sind belegt oder nicht möglich.</p>'+
    '<label>Station<select id="bk_station">'+STATIONEN.map(function(s){ return '<option'+(s===station?' selected':'')+'>'+esc(s)+'</option>'; }).join("")+'</select></label>'+
    '<div id="bk_cal"></div><div id="bk_sel" class="box info"></div>'+
    '<label>Bemerkung (optional)<textarea id="bk_note" rows="2">'+esc((r.booking&&r.booking.bemerkung)||"")+'</textarea></label>'+
    '<div id="bk_msg"></div><div class="row"><button class="btn pri" id="bk_save" type="button">'+(r.booking?'Termin ändern':'Termin buchen')+'</button></div></div>';

  function weekLabel(){ return fmtDate(weekStart)+" bis "+fmtDate(addDays(weekStart,4)); }
  function paintSel(){
    document.getElementById("bk_sel").innerHTML=sel?'Gewählt: <b>'+fmtLong(sel.date)+', '+sel.time+' Uhr</b> in '+esc(station):'Noch kein Termin gewählt.';
  }
  function paintCal(){
    var days=[0,1,2,3,4].map(function(i){ return addDays(weekStart,i); });
    var prevOk=weekStart>mondayOf(firstWork), nextOk=addDays(weekStart,7)<=last;
    var h='<div class="calnav"><button class="btn sm" type="button" id="bk_prev"'+(prevOk?'':' disabled')+'>‹ Woche zurück</button><b>'+weekLabel()+'</b>'+
      '<button class="btn sm" type="button" id="bk_next"'+(nextOk?'':' disabled')+'>Woche weiter ›</button></div><div class="slotgrid">';
    days.forEach(function(d){
      h+='<div class="slotday"><div class="slotdh">'+fmtShort(d)+'</div>';
      SLOT_TIMES.forEach(function(t){
        var used=slotCount(d,t,station,r.id), free=SLOT_CAP-used;
        var ok=d>=first && d<=last && free>0;
        var on=sel&&sel.date===d&&sel.time===t;
        h+='<button type="button" class="slot'+(on?' on':'')+'" data-d="'+d+'" data-t="'+t+'"'+(ok?'':' disabled')+'>'+t+'<small>'+(d<first||d>last?'–':free>0?free+' frei':'belegt')+'</small></button>';
      });
      h+='</div>';
    });
    h+='</div>';
    document.getElementById("bk_cal").innerHTML=h;
  }
  paintCal(); paintSel();

  box.addEventListener("click",function(e){
    var b=e.target.closest("button"); if(!b) return;
    if(b.id==="bk_prev"){ weekStart=addDays(weekStart,-7); paintCal(); }
    if(b.id==="bk_next"){ weekStart=addDays(weekStart,7); paintCal(); }
    if(b.classList.contains("slot")){ sel={date:b.getAttribute("data-d"),time:b.getAttribute("data-t")}; paintCal(); paintSel(); }
  });
  document.getElementById("bk_station").addEventListener("change",function(){ station=this.value; if(sel&&slotCount(sel.date,sel.time,station,r.id)>=SLOT_CAP) sel=null; paintCal(); paintSel(); });
  document.getElementById("bk_save").addEventListener("click",function(){
    var m=document.getElementById("bk_msg"); m.className="box bad";
    if(!sel){ m.textContent="Bitte zuerst eine Zeit im Kalender wählen."; return; }
    if(slotCount(sel.date,sel.time,station,r.id)>=SLOT_CAP){ m.textContent="Diese Zeit wurde gerade belegt. Bitte eine andere wählen."; sel=null; paintCal(); paintSel(); return; }
    var cur=getMiete(r.id), had=!!cur.booking;
    cur.booking={date:sel.date,time:sel.time,station:station,at:nowTs(),by:by,bemerkung:document.getElementById("bk_note").value.trim()};
    addLog(cur,(had?"Termin geändert: ":"Termin gebucht: ")+fmtDate(sel.date)+" "+sel.time+" Uhr, "+station,by);
    updateMiete(cur);
    onDone(cur);
  });
}
