/* ============================================================
   VEXA – Regeln aus dem Projektauftrag
   Regel 1: nur Mieten über 30 Tage       Regel 2: Tausch nach 60 Tagen
   Regel 3: spätestens nach 90 Tagen      Regel 4: früher, wenn Turnback davor liegt
   Regel 5: Kunde 14 Tage vorher per E-Mail informieren (mit Link zum Kalender)
   Nach einem Fahrzeugtausch beginnt für das neue Fahrzeug wieder alles von vorn
   (60 Tage ab Tauschdatum, spätestens 90 Tage, früher bei Turnback).
   ============================================================ */
var STATUS_LIST=["Neu","Wechsel geplant","E-Mail noch nicht versendet","Kunde informiert","Formular ausstehend","Termin gebucht","Fahrzeugwechsel durchgeführt","Abgeschlossen","Achtung / Klärung erforderlich"];
var STEPS=["Mietdaten erfasst","Geprüft (über 30 Tage)","In VEX-Liste","Tauschtermin berechnet","Erinnerung fällig","Kunden-E-Mail versendet","Termin gebucht","Fahrzeug getauscht","Abgeschlossen"];

/* Gemeinsamer Kalender: Zeiten pro Tag, Plätze pro Zeit und Station */
var SLOT_TIMES=["08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00"], SLOT_CAP=2;
function isWorkday(s){ var w=D(s).getDay(); return w>0&&w<6; }
function mondayOf(s){ var w=D(s).getDay(); return addDays(s,-(w===0?6:w-1)); }
function slotCount(date,time,station,ignoreId){
  return getMieten().filter(function(r){
    return !r.closed && r.booking && r.id!=ignoreId && r.booking.date===date && r.booking.time===time && r.booking.station===station;
  }).length;
}
function kzOrMva(r){ return r.kennzeichen || ("MVA "+r.mva); }

function calcMiete(r){
  var T=todayISO(), c={}, base=r.vstart||r.start;
  c.dauer=Math.max(0,diffDays(r.start,T));
  c.fzTage=Math.max(0,diffDays(base,T));
  c.t60=addDays(base,60);
  c.t90=addDays(base,90);
  c.tausch=[c.t60,c.t90,r.turn].sort()[0];
  c.spaet=[c.t90,r.turn].sort()[0];
  c.grund=r.turn<c.t60?"Turnback liegt vor Tag 60 (Regel 4)":"60-Tage-Regel (Regel 2)";
  c.grundKurz=r.turn<c.t60?"Turnback früher":"60 Tage";
  c.mailDate=addDays(c.tausch,-14);
  c.tage=diffDays(T,c.tausch);
  c.turnTage=diffDays(T,r.turn);
  c.wechselOffen=!r.closed;
  c.turnOffen=!r.closed;
  c.wechselUeberf=c.wechselOffen && c.tausch<T;
  c.turnUeberf=c.turnOffen && r.turn<T;
  c.bookingUeberf=!!r.booking && c.wechselOffen && r.booking.date<T;
  var st;
  if(r.closed) st="Abgeschlossen";
  else if(c.tausch<T) st="Achtung / Klärung erforderlich";
  else if(r.booking) st="Termin gebucht";
  else if(r.mail) st=diffDays(r.mail,T)<=2?"Kunde informiert":"Formular ausstehend";
  else if(T>=c.mailDate) st="E-Mail noch nicht versendet";
  else if(r.lastWechsel && diffDays(r.lastWechsel,T)<=14) st="Fahrzeugwechsel durchgeführt";
  else if(r.created===T) st="Neu";
  else st="Wechsel geplant";
  c.status=st;
  return c;
}
function getAll(){ return getMieten().map(function(r){ return {r:r,c:calcMiete(r)}; }); }

function statusClass(st){
  if(st==="Achtung / Klärung erforderlich") return "c-red";
  if(st==="Termin gebucht"||st==="Fahrzeugwechsel durchgeführt"||st==="Abgeschlossen") return "c-ok";
  if(st==="E-Mail noch nicht versendet"||st==="Formular ausstehend"||st==="Kunde informiert") return "c-warn";
  return "c-blue";
}
function stepIndex(r,c){
  if(r.closed) return 9;
  if(r.booking) return 7;
  if(r.mail) return 6;
  if(todayISO()>=c.mailDate) return 5;
  return 4;
}
function bookingText(r){
  return r.booking ? fmtDate(r.booking.date)+" "+r.booking.time+" Uhr, "+r.booking.station : "";
}
function wechselNote(x){
  var r=x.r,c=x.c;
  if(r.booking) return "Termin gebucht: "+bookingText(r);
  if(r.mail) return "Kunde hat noch keinen Termin gebucht";
  if(todayISO()>=c.mailDate) return "E-Mail fällig";
  return "Kunde wird am "+fmtDate(c.mailDate)+" informiert";
}

/* ---------- Termine (E-Mail, Wechsel, Turnback) ---------- */
function eventsFor(all,withLate){
  var T=todayISO(), ev=[];
  all.forEach(function(x){
    var r=x.r,c=x.c;
    if(r.closed) return;
    if(!r.mail && !r.booking) ev.push({date:c.mailDate,typ:"mail",label:"Kunden-E-Mail",note:"14 Tage vor dem Wechsel, mit Link zum Kalender",x:x});
    if(r.booking) ev.push({date:r.booking.date,typ:"wechsel",label:"Fahrzeugwechsel (gebucht "+r.booking.time+")",note:r.booking.station+" · Gruppe "+r.gruppe,x:x});
    else ev.push({date:c.tausch,typ:"wechsel",label:"Fahrzeugwechsel (Frist)",note:wechselNote(x),x:x});
    ev.push({date:r.turn,typ:"turn",label:"Turnback",note:"Rückgabe an den Händler",x:x});
  });
  if(!withLate) ev=ev.filter(function(e){ return e.date>=T; });
  var ord={mail:0,wechsel:1,turn:2};
  ev.sort(function(a,b){ return a.date<b.date?-1:a.date>b.date?1:ord[a.typ]-ord[b.typ]; });
  return ev;
}

/* ---------- Benachrichtigungen ---------- */
function notificationsFor(all){
  var T=todayISO(), n=[];
  all.forEach(function(x){
    var r=x.r,c=x.c;
    if(r.closed) return;
    if(c.wechselUeberf) n.push({lvl:"red",title:"Fahrzeugwechsel überfällig",text:"Tauschtermin war am "+fmtDate(c.tausch)+". Spätestens bis "+fmtDate(c.spaet)+" tauschen.",x:x});
    if(c.turnUeberf) n.push({lvl:"red",title:"Turnback überfällig",text:"Rückgabe an den Händler war am "+fmtDate(r.turn)+" fällig.",x:x});
    if(c.bookingUeberf && !c.wechselUeberf) n.push({lvl:"red",title:"Gebuchter Termin vorbei",text:"Der Termin am "+fmtDate(r.booking.date)+" war gebucht. Bitte den Fahrzeugtausch eintragen.",x:x});
    if(!r.mail && !r.booking && !c.wechselUeberf && T>=c.mailDate)
      n.push({lvl:"amber",title:"E-Mail an Kunden fällig",text:"Wechsel bis "+fmtDate(c.tausch)+" ("+inTage(c.tage)+"). Die E-Mail mit dem Kalender-Link ist noch nicht versendet."+(r.draft?" Ein Entwurf ist vorbereitet.":""),x:x});
    if(r.mail && !r.booking && !c.wechselUeberf && diffDays(r.mail,T)>=5)
      n.push({lvl:"amber",title:"Noch kein Termin gebucht",text:"Seit "+diffDays(r.mail,T)+" Tagen kein Termin im Kalender gebucht. Wechsel spätestens am "+fmtDate(c.tausch)+".",x:x});
  });
  n.sort(function(a,b){ return (a.lvl==="red"?0:1)-(b.lvl==="red"?0:1) || (a.x.c.tausch<b.x.c.tausch?-1:1); });
  return n;
}

/* ---------- Aktionen ---------- */
// Turnback = Fahrzeug geht endgültig an den Händler zurück, der Vorgang ist damit beendet
function markTurnDone(id){
  var r=getMiete(id), u=currentUser();
  r.turnDone=todayISO(); r.turnBy=u.name;
  addLog(r,"Turnback durchgeführt (Fahrzeug an Händler zurückgegeben)");
  r.closed=true; addLog(r,"Vorgang abgeschlossen");
  updateMiete(r);
}
// Simulierter täglicher Lauf: bereitet fällige E-Mails als Entwurf vor.
// Versendet wird erst, wenn ein Teammitglied es bestätigt (Doppelversand wird so verhindert).
function runAutoCheck(){
  var T=todayISO(), mieten=getMieten(), n=0;
  mieten.forEach(function(r){
    var c=calcMiete(r);
    if(!r.closed && !r.mail && !r.draft && !r.booking && T>=c.mailDate){
      r.draft=T;
      addLog(r,"E-Mail-Entwurf mit Kalender-Link vorbereitet – wartet auf Versand durch das Team","System (automatische Prüfung)");
      n++;
    }
  });
  saveMieten(mieten);
  localStorage.setItem(K_CHECK,T);
  return {drafts:n,notes:notificationsFor(getAll()).length};
}

/* ---------- Kunden-E-Mail mit Link zum gemeinsamen Kalender ---------- */
function bookingUrl(r){ return new URL("buchen.html?t="+encodeURIComponent(r.token||""),location.href).href; }
function mailSubject(r,c){ return "Ihr Fahrzeugwechsel – bitte Termin im Kalender buchen (bis "+fmtDate(c.tausch)+")"; }
function mailBody(r,c){
  return ["Guten Tag "+(r.kontakt||r.kunde)+",","",
    "bei Ihrer Langzeitmiete steht der Fahrzeugwechsel an.","",
    "Aktuelles Fahrzeug: "+r.fahrzeug+(r.kennzeichen?" ("+r.kennzeichen+")":""),
    "Wechsel spätestens bis: "+fmtDate(c.tausch),"",
    "So buchen Sie Ihren Termin selbst:",
    "Öffnen Sie diesen Link. Dort sehen Sie unseren gemeinsamen Kalender mit den freien Zeiten. Wählen Sie Station, Tag und Uhrzeit.","",
    bookingUrl(r),"",
    "Sie bekommen ein Fahrzeug aus derselben Fahrzeuggruppe ("+r.gruppe+"). Bringen Sie bitte Fahrzeugschlüssel und Fahrzeugpapiere mit.","",
    "Bei Fragen erreichen Sie uns unter "+CONTACT.mail+" oder "+CONTACT.tel+".","",
    "Freundliche Grüße","Ihr Avis-&-Budget-Team"].join("\n");
}
function mailtoLink(r,c){
  return "mailto:"+r.email.trim()+"?subject="+encodeURIComponent(mailSubject(r,c))+"&body="+encodeURIComponent(mailBody(r,c));
}

/* ---------- Outlook-Kalender (.ics) ---------- */
function icsEscape(s){ return String(s).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n"); }
function icsBuild(events){
  var stamp=new Date().toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
  var out=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//VEXA//Langzeitmieten//DE","CALSCALE:GREGORIAN"];
  events.forEach(function(e){
    out.push("BEGIN:VEVENT","UID:vexa-"+e.uid+"@avisbudget.example","DTSTAMP:"+stamp,
      "DTSTART;VALUE=DATE:"+e.date.replace(/-/g,""),"DTEND;VALUE=DATE:"+addDays(e.date,1).replace(/-/g,""),
      "SUMMARY:"+icsEscape(e.summary),"DESCRIPTION:"+icsEscape(e.desc||""),
      "BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+icsEscape(e.summary),"TRIGGER:-P2D","END:VALARM","END:VEVENT");
  });
  out.push("END:VCALENDAR");
  return out.join("\r\n");
}
function icsEventsOf(evs){
  return evs.map(function(e){
    var r=e.x.r;
    return {uid:r.id+"-"+e.typ+"-"+e.date,date:e.date,summary:e.label+" – "+r.kunde+" – "+r.fahrzeug+" ("+kzOrMva(r)+")",desc:e.note};
  });
}
function downloadFile(name,content,type){
  var a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([content],{type:type+";charset=utf-8"}));
  a.download=name; document.body.appendChild(a); a.click(); a.remove();
}
